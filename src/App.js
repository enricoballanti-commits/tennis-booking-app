import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔴 INSERISCI I TUOI DATI
const supabase = createClient(
  "https://dfxcscxkwabshseoxjte.supabase.co",
  "sb_publishable_V89vpZmV3Ao4H_uEcrYMcQ_Q-zyG8zA"
);

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);

  const [playersInput, setPlayersInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ Carica prenotazioni da Supabase
  const loadBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    const parsed = data.map((b) => ({
      ...b,
      players: b.players.split(",")
    }));

    setBookings(parsed);
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // ✅ LOGIN
  const handleLogin = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*");

    if (error || !data) {
      alert("Errore database");
      return;
    }

    const found = data.find(
      (u) =>
        u.username &&
        u.username.toLowerCase() === user.trim().toLowerCase()
    );

    if (!found) {
      alert("Utente non valido");
      return;
    }

    // primo accesso
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

    const today = new Date().toISOString().split("T")[0];

    for (let p of players) {
      const active = bookings.filter(
        (b) =>
          b.players.includes(p) &&
          b.date >= today
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

    // ✅ SALVA SU DB
    await supabase.from("bookings").insert([
      {
        court,
        hour,
        date: selectedDate,
        players: players.join(","),
        created_by: loggedUser
      }
    ]);

    setPlayersInput("");
    loadBookings();
  };

  // ✅ CANCELLAZIONE
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

    if (booking.players.some(p => p.toLowerCase() === "maestro")) {
      return "#ff4d4d";
    }

    if (booking.players.some(p => p.toLowerCase().includes("esterno"))) {
      return "#FFA500";
    }

    return "#007BFF";
  };

  // ✅ LOGIN VIEW
  if (!loggedUser) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Accesso</h1>

        <input
          placeholder="Username (es: MARROS)"
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

        <button onClick={handleLogin}>Entra</button>
      </div>
    );
  }

  // ✅ APP
  return (
    <div style={{ padding: 20 }}>
      <h2>Utente: {loggedUser}</h2>

      <div>
        <input
          placeholder="Giocatori (es: LUCBIA, ANNVER)"
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
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
                        booking.players.includes(loggedUser) ||
                        loggedUser.toLowerCase() === "maestro"
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
                  {hour}
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
