import React, { useState } from "react";

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

const initialUsers = [
  { name: "Mario", pin: null, role: "player" },
  { name: "Luca", pin: null, role: "player" },
  { name: "Anna", pin: null, role: "player" },
  { name: "Maestro", pin: "9999", role: "maestro" }
];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [loggedUser, setLoggedUser] = useState(null);

  const [playersInput, setPlayersInput] = useState("");
  const [view, setView] = useState("booking");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [weekOffset, setWeekOffset] = useState(0);

  const handleLogin = () => {
    const found = users.find(
      (u) => u.name.toLowerCase() === user.toLowerCase()
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

      const updated = users.map((u) =>
        u.name === found.name ? { ...u, pin } : u
      );

      setUsers(updated);
      setLoggedUser(found.name);
      return;
    }

    if (found.pin !== pin) {
      alert("PIN errato");
      return;
    }

    setLoggedUser(found.name);
  };

  const getWeekDates = () => {
    const start = new Date();
    start.setDate(start.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates();

  const bookSlot = (court, hour) => {
    if (!loggedUser) return;

    let players = playersInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    if (!players.includes(loggedUser)) {
      players.unshift(loggedUser);
    }

    if (players.length !== 2 && players.length !== 4) {
      alert("Inserisci 2 o 4 giocatori");
      return;
    }

    for (let p of players) {
      const active = bookings.filter(
        (b) =>
          b.players.includes(p) &&
          b.date >= todayStr
      );

      if (
        p.toLowerCase() !== "maestro" &&
        active.length >= 2
      ) {
        alert(p + " ha già 2 ore attive");
        return;
      }
    }

    const already = bookings.find(
      (b) =>
        b.court === court &&
        b.hour === hour &&
        b.date === selectedDate
    );

    if (already) return;

    setBookings([
      ...bookings,
      { court, hour, players, date: selectedDate }
    ]);

    setPlayersInput("");
  };

  const cancelBooking = (court, hour) => {
    setBookings(
      bookings.filter(
        (b) =>
          !(
            b.court === court &&
            b.hour === hour &&
            b.date === selectedDate
          )
      )
    );
  };

  const getColor = (booking) => {
    if (!booking) return "#4CAF50";

    if (booking.players.some(p => p.toLowerCase() === "maestro")) {
      return "#ff4d4d";
    }

    if (booking.players.some(p => p.toLowerCase().includes("esterno"))) {
      return "#FFA500";
    }

    return "#007BFF";
  };

  if (!loggedUser) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Accesso</h1>

        <input
          placeholder="Nome"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />

        <br />

        <input
          placeholder="PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />

        <br /><br />

        <button onClick={handleLogin}>
          Entra
        </button>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div style={{ padding: 20 }}>
        <h1>Dashboard</h1>

        <button onClick={() => setView("booking")}>Torna</button>

        <div>
          <button onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)}>→</button>
        </div>

        {courts.map((court) => (
          <div key={court}>
            <h2>{court}</h2>

            {weekDates.map((date) => (
              <div key={date}>
                <strong>{date}</strong>

                <div style={{ display: "flex", gap: 5 }}>
                  {hours.map((hour) => {
                    const booking = bookings.find(
                      (b) =>
                        b.court === court &&
                        b.hour === hour &&
                        b.date === date
                    );

                    return (
                      <div
                        key={hour}
                        style={{
                          padding: 5,
                          backgroundColor: getColor(booking),
                          color: "white",
                          fontSize: 10
                        }}
                      >
                        {hour}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Utente: {loggedUser}</h2>

      <button onClick={() => setView("dashboard")}>
        Dashboard
      </button>

      <div>
        <input
          placeholder="Giocatori"
          value={playersInput}
          onChange={(e) => setPlayersInput(e.target.value)}
        />
      </div>

      <div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {courts.map((court) => (
        <div key={court}>
          <h3>{court}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
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
