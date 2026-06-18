import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

// 🔴 INSERISCI QUI I TUOI DATI SUPABASE
const supabase = createClient(
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY"
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

  // ✅ LOGIN (CORRETTO)
  const handleLogin = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      console.log("DATA:", data);
      console.log("ERROR:", error);

      if (error) {
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

      // ✅ Primo accesso
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

      // ✅ Login normale
      if (found.pin !== pin) {
        alert("PIN errato");
        return;
      }

      setLoggedUser(found.username);
    } catch (err) {
      console.error("ERROR:", err);
      alert("Errore database");
    }
  };

  // ✅ PRENOTAZIONE
  const bookSlot = (court, hour) => {
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

    setBookings([
      ...bookings,
      { court, hour, players, date: selectedDate }
    ]);

    setPlayersInput("");
  };

  // ✅ CANCELLA
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
