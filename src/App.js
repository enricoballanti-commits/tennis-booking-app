import React, { useState } from "react";

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState("");
  const [playersInput, setPlayersInput] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 15);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // ✅ PRENOTAZIONE
  const bookSlot = (court, hour) => {
    if (!user) {
      alert("Inserisci il tuo nome");
      return;
    }

    let players = playersInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p !== "");

    // include sempre chi prenota
    if (!players.includes(user)) {
      players.unshift(user);
    }

    // ✅ controllo numero giocatori (2 o 4)
    if (players.length !== 2 && players.length !== 4) {
      alert("Devi inserire 2 o 4 giocatori");
      return;
    }

    const today = new Date();

    // ✅ controllo 2 ore attive per TUTTI
    for (let p of players) {
      const activeBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        return (
          b.players.includes(p) &&
          bookingDate >= today
        );
      });

      if (
        p.toLowerCase() !== "maestro" &&
        activeBookings.length >= 2
      ) {
        alert(`${p} ha già 2 ore attive`);
        return;
      }
    }

    // ✅ 1 sola prenotazione al giorno per ospitante (se non maestro)
    if (user.toLowerCase() !== "maestro") {
      const userBookings = bookings.filter(
        (b) =>
          b.players.includes(user) &&
          b.date === selectedDate
      );

      if (userBookings.length >= 1) {
        alert("Hai già una prenotazione in questo giorno");
        return;
      }
    }

    // ✅ verifica slot occupato
    const alreadyBooked = bookings.find(
      (b) =>
        b.court === court &&
        b.hour === hour &&
        b.date === selectedDate
    );

    if (alreadyBooked) return;

    // ✅ salva
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
          placeholder="Giocatori (es: Mario, Luca oppure Mario, Luca, Anna, Paolo)"
          value={playersInput}
          onChange={(e) => setPlayersInput(e.target.value)}
          style={{ padding: 10, width: "100%" }}
        />
      </div>

      {/* SELETTORE DATA */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="date"
          value={selectedDate}
          min={todayStr}
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
                      if (
                        booking.players.includes(user) ||
                        user.toLowerCase() === "maestro"
                      ) {
                        cancelBooking(court, hour);
                      } else {
                        alert("Non puoi cancellare questa prenotazione");
                      }
                    } else {
                      bookSlot(court, hour);
                    }
                  }}
                  style={{
                    height: 60,
                    backgroundColor: booking
                      ? booking.players.some(p =>
                          p.toLowerCase().includes("esterno")
                        )
                        ? "#FFA500" // esterno arancione
                        : "#ccc"
                      : "#4CAF50",
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
