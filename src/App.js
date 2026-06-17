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
      <div style={{ marginBottom: 20 }}>
        <input
          type="date"
          value={selectedDate}
          min={today}
          max={maxDateStr}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {courts.map((court) => (
        <div key={court} style={{ marginBottom: 30 }}>
          <h2>{court} — {selectedDate}</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10
            }}
          >
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
                      if (booking.players.includes(user)) {
                        cancelBooking(court, hour);
                      } else {
                        alert("Non puoi cancellare la prenotazione di altri");
                      }
                    } else {
                      bookSlot(court, hour);
                    }
                  }}
                  style={{
                    height: 60,
                    backgroundColor: booking ? "#ccc" : "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: 8
                  }}
                >
                  {hour}:00
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
