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
    if (!selectedPlayers.includes(loggedUser)) {
      selectedPlayers.unshift(loggedUser);
    }

    if (selectedPlayers.length !== 2 && selectedPlayers.length !== 4) {
      alert("Seleziona 2 o 4 giocatori");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // controllo utenti validi
    for (let p of selectedPlayers) {
      const isRegistered = usersList.some(
        (u) =>
          u.username &&
          u.username.toLowerCase() === p.toLowerCase()
      );

      const isExternal = p.toLowerCase().includes("esterno");

      if (!isRegistered && !isExternal) {
        alert("Giocatore non valido: " + p);
        return;
      }
    }

    // controllo 2 ore attive
    for (let p of selectedPlayers) {
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

    await supabase.from("bookings").insert([
      {
        court,
        hour,
        date: selectedDate,
        players: selectedPlayers.join(","),
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
          placeholder="Username"
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

      {/* SEARCH */}
      <input
        placeholder="Cerca giocatori..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LISTA FILTRATA */}
      {filteredUsers.map((u) => (
        <div
          key={u.id}
          style={{ cursor: "pointer", padding: 5 }}
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
      >
        + Esterno
      </button>

      {/* MOSTRA GIOCATORI */}
      <div>
        <strong>Giocatori:</strong>{" "}
        {selectedPlayers.join(", ")}
      </div>

      {/* DATA */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

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
                      }
                    } else {
                      bookSlot(court, hour);
                    }
                  }}
                  style={{
                    height: 60,
                    backgroundColor: getColor(booking),
                    color: "white"
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
