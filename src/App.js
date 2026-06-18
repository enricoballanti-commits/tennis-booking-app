import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔴 INSERISCI I TUOI DATI
const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
);

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);

  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);

  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ LOAD BOOKINGS
  const loadBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*");

    if (!error && data) {
      const parsed = data.map((b) => ({
        ...b,
        players: b.players.split(",")
      }));
      setBookings(parsed);
    }
  };

  // ✅ LOAD USERS
  const loadUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*");

    setUsersList(data || []);
  };

  useEffect(() => {
    loadBookings();
    loadUsers();
  }, []);

  // ✅ FILTER USERS
  useEffect(() => {
    if (!search) {
      setFilteredUsers([]);
      return;
    }

    const result = usersList.filter((u) =>
      (u.name + " " + u.surname + " " + u.username)
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    setFilteredUsers(result);
  }, [search, usersList]);

  // ✅ LOGIN
  const handleLogin = async () => {
    const { data } = await supabase.from("users").select("*");

    const found = data?.find(
      (u) =>
        u.username &&
        u.username.toLowerCase() === user.trim().toLowerCase()
    );

    if (!found) {
      alert("Utente non valido");
      return;
    }

    if (!found.pin) {
      if (!pin) {
        alert("Inserisci PIN");
        return;
      }

      await supabase
        .from("users")
        .update({ pin })
        .eq("id", found.id);

      setLoggedUser(found.username);
      return;
    }

    if (found.pin !== pin) {
      alert("PIN errato");
      return;
    }

    setLoggedUser(found.username);
  };

  // ✅ PRENOTAZIONE
  const bookSlot = async (court, hour) => {
    let players = [...selectedPlayers];

    if (!players.includes(loggedUser)) {
      players.unshift(loggedUser);
    }

    if (players.length !== 2 && players.length !== 4) {
      alert("Seleziona 2 o 4 giocatori");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    for (let p of players) {
      const active = bookings.filter(
        (b) => b.players.includes(p) && b.date >= today
      );

      if (p.toLowerCase() !== "maestro" && active.length >= 2) {
        alert(p + " ha già 2 ore attive");
        return;
      }
    }

    const exists = bookings.find(
      (b) =>
        b.court === court &&
        b.hour === hour &&
        b.date === selectedDate
    );

    if (exists) return;

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
  const getColor = (booking) => {
    if (!booking) return "#4CAF50";
    if (booking.players.some(p => p.toLowerCase().includes("esterno"))) return "#FFA500";
    if (booking.players.some(p => p.toLowerCase() === "maestro")) return "#ff4d4d";
    return "#007BFF";
  };

  // ✅ LOGIN VIEW
  if (!loggedUser) {
    return (
      <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
        <h2 style={{ textAlign: "center" }}>Accesso</h2>

        <input
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <input
          placeholder="PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          style={{ width: "100%", padding: 10 }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: 10,
            width: "100%",
            padding: 12,
            background: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: 8
          }}
        >
          Entra
        </button>
      </div>
    );
  }

  // ✅ APP UI
  return (
    <div style={{ maxWidth: 500, margin: "auto", padding: 15 }}>
      <h2 style={{ textAlign: "center" }}>🎾 Prenotazioni</h2>

      <p style={{ textAlign: "center" }}>
        Utente: <strong>{loggedUser}</strong>
      </p>

      {/* SEARCH */}
      <input
        placeholder="Cerca giocatori..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: 12, borderRadius: 8 }}
      />

      {filteredUsers.map((u) => (
        <div
          key={u.id}
          style={{ padding: 10, borderBottom: "1px solid #eee", cursor: "pointer" }}
          onClick={() => {
            if (!selectedPlayers.includes(u.username)) {
              setSelectedPlayers([...selectedPlayers, u.username]);
            }
            setSearch("");
          }}
        >
          {u.name} {u.surname} ({u.username})
        </div>
      ))}

      {/* ESTERNO */}
      <button
        onClick={() =>
          setSelectedPlayers([...selectedPlayers, "esterno"])
        }
        style={{
          width: "100%",
          padding: 10,
          marginTop: 10,
          background: "#FFA500",
          color: "white",
          border: "none",
          borderRadius: 8
        }}
      >
        + Esterno
      </button>

      {/* BADGE */}
      <div style={{ marginTop: 10 }}>
        {selectedPlayers.map((p, i) => (
          <span
            key={i}
            style={{
              background: "#007BFF",
              color: "white",
              padding: "5px 10px",
              borderRadius: 20,
              margin: 3,
              display: "inline-block",
              fontSize: 12
            }}
          >
            {p}
          </span>
        ))}
      </div>

      {/* DATA */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        style={{ width: "100%", marginTop: 10, padding: 10 }}
      />

      {/* CAMPI */}
      {courts.map((court) => (
        <div key={court} style={{ marginTop: 20 }}>
          <h3>{court}</h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8
          }}>
            {hours.map((hour) => {
              const booking = bookings.find(
                (b) =>
                  b.court === court &&
                  b.hour === hour &&
                  b.date === selectedDate
              );

              return (
                <button
                  key={hour}
                  onClick={() => {
                    if (booking) {
                      if (
                        booking.players.includes(loggedUser) ||
                        loggedUser.toLowerCase() === "maestro"
                      ) {
                        cancelBooking(court, hour);
                      }
                    } else {
                      bookSlot(court, hour);
                    }
                  }}
                  style={{
                    height: 70,
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: getColor(booking),
                    color: "white"
                  }}
                >
                  <div>{hour}:00</div>
                  {booking && (
                    <div style={{ fontSize: 10 }}>
                      {booking.players.join(", ")
                    }</div>
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
