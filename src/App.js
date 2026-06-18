import React, { useState } from "react";

const hours = Array.from({ length: 17 }, (_, i) => i + 7);
const courts = ["Campo 1", "Campo 2"];

// ✅ UTENTI (simulati)
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

  // ✅ LOGIN
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
      alert("PIN creato!");
      return;
    }

    if (found.pin !== pin) {
      alert("PIN errato");
      return;
    }

    setLoggedUser(found.name);
  };

  // ✅ SETTIMANA
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

