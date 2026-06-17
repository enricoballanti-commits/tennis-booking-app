import React, { useState } from "react";

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState("");
  const [playersInput, setPlayersInput] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // ✅ PRENOTAZIONE
  const bookSlot = (court, hour) => {
    if (!user) {
      alert("Inserisci il tuo nome");
      return;
    }

    const players = playersInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    if (!players.includes(user)) {
      players.unshift(user);
    }

    if (players.length < 2 || players.length > 4) {
      alert("Devi inserire da 2 a 4 giocatori");
      return;
    }

    const userBookings = bookings.filter(
      (b) =>
        b.players.includes(user) &&
        b.date === selectedDate
    );

    if (userBookings.length >= 1) {
      alert("Puoi prenotare solo 1 ora al giorno");
      return;
    }

    const alreadyBooked = bookings.find(
      (b) =>
        b.court === court &&
        b.hour === hour &&
        b.date === selectedDate
    );

    if (alreadyBooked) return;

    setBookings([
      ...bookings,
      { court, hour, players, date: selectedDate }
    ]);

    setPlayersInput("");
  };

  // ✅ CANCELLAZIONE
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

  return (
    <div style={{ padding: 20 }}>
      <h1>Prenotazione Campi Tennis</h1>

      {/* INPUT NOME */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Inserisci il tuo nome"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{ padding: 10, width: "100%" }}
        />
      </div>

      {/* INPUT GIOCATORI */}
      <div style={{ marginBottom: 10 }}>
        <input
          placeholder="Giocatori (es: Mario, Luca)"
          value={playersInput}
          onChange={(e) => setPlayersInput(e.target.value)}
          style={{ padding: 10, width: "100%" }}
        />
      </div>

      {/* SELEZIONE DATA */}
