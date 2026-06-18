import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔴 METTI I TUOI DATI
const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo Bar", "Campo Strada"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [view, setView] = useState("booking");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ LOAD DATA
  const loadBookings = async () => {
    const { data } = await supabase.from("bookings").select("*");

    if (data) {
      setBookings(
        data.map(b => ({
          ...b,
          players: b.players.split(",")
        }))
      );
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsersList(data || []);
  };

  useEffect(() => {
    loadBookings();
    loadUsers();
  }, []);

  // ✅ FILTER
  useEffect(() => {
    if (!search) {
      setFilteredUsers([]);
      return;
    }

    setFilteredUsers(
      usersList.filter(u =>
        `${u.name} ${u.surname} ${u.username}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, usersList]);

  // ✅ LOGIN
  const handleLogin = async () => {
    const { data } = await supabase.from("users").select("*");

    const found = data?.find(
      u =>
        u.username?.toLowerCase() === user.trim().toLowerCase()
    );

    if (!found) return alert("Utente non valido");

    if (!found.pin) {
      if (!pin) return alert("Inserisci PIN");

      await supabase
        .from("users")
        .update({ pin })
        .eq("id", found.id);

      setLoggedUser(found.username);
      return;
    }

    if (found.pin !== pin) return alert("PIN errato");

    setLoggedUser(found.username);
  };

  // ✅ PRENOTAZIONE
  const bookSlot = async (court, hour) => {
    let players = [...selectedPlayers];

    if (!players.includes(loggedUser)) {
      players.unshift(loggedUser);
    }

    if (players.length !== 2 && players.length !== 4) {
      return alert("Seleziona 2 o 4 giocatori");
    }

    await supabase.from("bookings").insert([
      {
        court,
        hour,
        date: selectedDate,
        players: players.join(","),
        created_by: loggedUser
      }
    ]);

    setSelectedPlayers([]);
    loadBookings();
  };

  // ✅ CANCELLA
  const cancelBooking = async (court, hour) => {
    await supabase
      .from("bookings")
      .delete()
      .eq("court", court)
      .eq("hour", hour)
      .eq("date", selectedDate);

    loadBookings();
  };

  // ✅ COLORI
  const getColor = booking => {
    if (!booking) return "#4CAF50";
    if (booking.players.some(p => p.includes("esterno")))
      return "#FFA500";
    if (booking.players.some(p => p === "maestro"))
      return "#ff4d4d";
    return "#007BFF";
  };

  // ✅ LOGIN VIEW
  if (!loggedUser) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
        <h2 style={{ textAlign: "center" }}>Login</h2>

        <input
          placeholder="Username"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: 10,
            width: "100%",
            padding: 12,
            background: "#007BFF",
            color: "#fff",
            border: "none",
            borderRadius: 8
          }}
        >
          Entra
        </button>
      </div>
    );
  }

  // ✅ DASHBOARD
  if (view === "dashboard") {
    return (
      <div style={{ padding: 15 }}>
        <button onClick={() => setView("booking")}>
          ← Torna
        </button>

        <h2>Dashboard</h2>

        {courts.map(court => (
          <div key={court}>
            <h3>{court}</h3>

            {hours.map(hour => {
              const b = bookings.find(
                x =>
                  x.court === court &&
                  x.hour === hour &&
                  x.date === selectedDate
              );

              return (
                <div key={hour}>
                  <strong>{hour}:00</strong> -{" "}
                  {b ? b.players.join(", ") : "Libero"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // ✅ APP
  return (
    <div style={{ padding: 15, maxWidth: 500, margin: "auto" }}>
      <h2 style={{ textAlign: "center" }}>🎾 Prenotazioni</h2>

      <p style={{ textAlign: "center" }}>
        Utente: <strong>{loggedUser}</strong>
      </p>

      <button
        onClick={() => setView("dashboard")}
        style={{ width: "100%", marginBottom: 10 }}
      >
        Vai a Dashboard
      </button>

      {/* SEARCH */}
      <input
        placeholder="Cerca giocatori"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />

      {filteredUsers.map(u => (
        <div
          key={u.id}
          onClick={() => {
            if (!selectedPlayers.includes(u.username)) {
              setSelectedPlayers([
                ...selectedPlayers,
                u.username
              ]);
            }
            setSearch("");
          }}
          style={{
            padding: 10,
            borderBottom: "1px solid #ddd",
            cursor: "pointer"
          }}
        >
          {u.name} {u.surname}
        </div>
      ))}

      {/* BADGE */}
      <div style={{ marginTop: 10 }}>
        {selectedPlayers.map(p => {
          const u = usersList.find(x => x.username === p);

          return (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#007BFF",
                color: "#fff",
                borderRadius: 20,
                padding: "6px 12px",
                margin: 4
              }}
            >
              {u ? `${u.name} ${u.surname}` : p}
              <span
                onClick={() =>
                  setSelectedPlayers(
                    selectedPlayers.filter(x => x !== p)
                  )
                }
                style={{ marginLeft: 6, cursor: "pointer" }}
              >
                ✕
              </span>
            </span>
          );
        })}
      </div>

      <button
        onClick={() =>
          setSelectedPlayers([...selectedPlayers, "esterno"])
        }
        style={{
          marginTop: 10,
          width: "100%",
          padding: 10,
          background: "#FFA500",
          color: "#fff",
          border: "none",
          borderRadius: 8
        }}
      >
        + Esterno
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        style={{ width: "100%", marginTop: 10 }}
      />

      {courts.map(court => (
        <div key={court} style={{ marginTop: 20 }}>
          <h3>{court}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)",
              gap: 10
            }}
          >
            {hours.map(hour => {
              const booking = bookings.find(
                b =>
                  b.court === court &&
                  b.hour === hour &&
                  b.date === selectedDate
              );

              return (
                <button
                  key={hour}
                  onClick={() =>
                    booking
                      ? cancelBooking(court, hour)
                      : bookSlot(court, hour)
                  }
                  style={{
                    height: 120,
                    borderRadius: 14,
                    backgroundColor: getColor(booking),
                    color: "white",
                    border: "none",
                    padding: 10
                  }}
                >
                  <div style={{ fontSize: 18 }}>
                    {hour}:00
                  </div>

                  {booking && (
                    <div style={{ fontSize: 12 }}>
                      {booking.players.join(", ")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
