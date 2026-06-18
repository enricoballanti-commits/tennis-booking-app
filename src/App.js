import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dfxcscxkwabshseoxjte.supabase.co",
  "sb_publishable_V89vpZmV3Ao4H_uEcrYMcQ_Q-zyG8zA"
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

  // LOAD
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

  // FILTER
  useEffect(() => {
    if (!search) return setFilteredUsers([]);

    setFilteredUsers(
      usersList.filter(u =>
        `${u.name} ${u.surname} ${u.username}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }, [search, usersList]);

  // LOGIN
  const handleLogin = async () => {
    const { data } = await supabase.from("users").select("*");

    const found = data?.find(
      u =>
        u.username?.toLowerCase() === user.trim().toLowerCase()
    );

    if (!found) return alert("Utente non valido");

    if (!found.pin) {
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

  // PRENOTA
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

  // CANCEL
  const cancelBooking = async (court, hour) => {
    await supabase
      .from("bookings")
      .delete()
      .eq("court", court)
      .eq("hour", hour)
      .eq("date", selectedDate);

    loadBookings();
  };

  const getColor = booking => {
    if (!booking) return "#4CAF50";
    if (booking.players.some(p => p.includes("esterno")))
      return "#FFA500";
    if (booking.players.some(p => p === "maestro"))
      return "#ff4d4d";
    return "#007BFF";
  };

  // LOGIN
  if (!loggedUser) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <input value={user} onChange={e => setUser(e.target.value)} />
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
        />
        <button onClick={handleLogin}>Entra</button>
      </div>
    );
  }

  // DASHBOARD
  if (view === "dashboard") {
    return (
      <div style={{ padding: 10 }}>
        <button onClick={() => setView("booking")}>← Torna</button>
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
                  {hour}:00 - {b ? b.players.join(", ") : "Libero"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // APP
  return (
    <div style={{ padding: 10, maxWidth: 450, margin: "auto" }}>
      <h2>🎾 Prenotazioni</h2>

      <button onClick={() => setView("dashboard")}>
        Dashboard
      </button>

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
            setSelectedPlayers([...selectedPlayers, u.username]);
            setSearch("");
          }}
          style={{ padding: 10, borderBottom: "1px solid #ccc" }}
        >
          {u.name} {u.surname}
        </div>
      ))}

      {/* BADGE giocatori */}
      <div>
        {selectedPlayers.map(p => {
          const u = usersList.find(x => x.username === p);

          return (
            <span
              key={p}
              onClick={() =>
                setSelectedPlayers(selectedPlayers.filter(x => x !== p))
              }
              style={{
                display: "inline-block",
                background: "#007BFF",
                color: "white",
                padding: "6px 12px",
                borderRadius: 20,
                margin: 4,
                cursor: "pointer"
              }}
            >
              {u ? `${u.name} ${u.surname}` : p} ✕
            </span>
          );
        })}
      </div>

      <button onClick={() => setSelectedPlayers([...selectedPlayers, "esterno"])}>
        + Esterno
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
      />

      {courts.map(court => (
        <div key={court}>
          <h3>{court}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,1fr)", // ✅ grande
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
                    height: 100, // ✅ più grande
                    fontSize: 16,
                    borderRadius: 12,
                    backgroundColor: getColor(booking),
                    color: "white"
                  }}
                >
                  <div>{hour}:00</div>
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
