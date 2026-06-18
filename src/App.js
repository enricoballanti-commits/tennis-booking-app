import React, { useState } from "react";

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState("");
  const [playersInput, setPlayersInput] = useState("");
  const [view, setView] = useState("booking"); // booking | dashboard

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [weekOffset, setWeekOffset] = useState(0);

  // ✅ calcolo settimana
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

    if (!players.includes(user)) {
      players.unshift(user);
    }

    if (players.length !== 2 && players.length !== 4) {
      alert("Devi inserire 2 o 4 giocatori");
      return;
    }

    const today = new Date();

    for (let p of players) {
      const activeBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.date);
        return b.players.includes(p) && bookingDate >= today;
      });

      if (p.toLowerCase() !== "maestro" && activeBookings.length >= 2) {
        alert(`${p} ha già 2 ore attive`);
        return;
      }
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

  // ✅ COLORI
  const getColor = (booking) => {
    if (!booking) return "#4CAF50";

    if (booking.players.some(p => p.toLowerCase() === "maestro")) {
      return "#ff4d4d"; // rosso maestro
    }

    if (booking.players.some(p => p.toLowerCase().includes("esterno"))) {
      return "#FFA500"; // arancione
    }

    return "#007BFF"; // blu normale
  };

  // ✅ ---------- DASHBOARD ----------
  if (view === "dashboard") {
    return (
      <div style={{ padding: 20 }}>
        <h1>Dashboard Settimanale</h1>

        <button onClick={() => setView("booking")}>
          TORNA ALLA PRENOTAZIONE
        </button>

        <div style={{ marginTop: 10 }}>
          <button onClick={() => setWeekOffset(weekOffset - 1)}>←</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)}>→</button>
        </div>

        {courts.map((court) => (
          <div key={court} style={{ marginTop: 20 }}>
            <h2>{court}</h2>

            {weekDates.map((date) => (
              <div key={date}>
                <strong>{date}</strong>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
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
                          fontSize: 10,
                          borderRadius: 5
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

  // ✅ ---------- VIEW PRENOTAZIONE ----------
  return (
    <div style={{ padding: 20 }}>
      <h1>Prenotazione Campi Tennis</h1>

      <button onClick={() => setView("dashboard")}>
        VAI ALLA DASHBOARD
      </button>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="Inserisci il tuo nome"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="Giocatori (es: Mario, Luca)"
          value={playersInput}
          onChange={(e) => setPlayersInput(e.target.value)}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {courts.map((court) => (
        <div key={court} style={{ marginTop: 20 }}>
          <h2>{court}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
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
                        alert("Non puoi cancellare");
                      }
                    } else {
                      bookSlot(court, hour);
                    }
                  }}
                  style={{
                    height: 60,
                    backgroundColor: getColor(booking),
                    color: "white",
                    borderRadius: 8
                  }}
                >
                  {hour}:00
                  {booking && (
                    <div style={{ fontSize: 10 }}>
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
``
