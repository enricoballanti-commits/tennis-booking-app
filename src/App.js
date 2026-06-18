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

  // ✅ WEEK helper
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  };

  const weekDates = getWeekDates();

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
      u => u.username?.toLowerCase() === user.trim().toLowerCase()
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

  // PRENOTA ✅ (con blocco 2 ore mantenuto)
  const bookSlot = async (court, hour) => {
    let players = [...selectedPlayers];

    if (!players.includes(loggedUser)) {
      players.unshift(loggedUser);
    }

    if (players.length !== 2 && players.length !== 4) {
      return alert("Seleziona 2 o 4 giocatori");
    }

    const today = new Date().toISOString().split("T")[0];

    for (let p of players) {
      const activeBookings = bookings.filter(
        (b) =>
          b.players.includes(p) &&
          b.date >= today
      );

      if (
        p.toLowerCase() !== "maestro" &&
        activeBookings.length >= 2
      ) {
        alert(`${p} ha già 2 ore prenotate`);
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
        players: players.join(","),
        created_by: loggedUser
      }
    ]);

    setSelectedPlayers([]);
    loadBookings();
  };

  // CANCELLA
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
    if (booking.players.some(p => p.includes("esterno"))) return "#FFA500";
    if (booking.players.some(p => p === "maestro")) return "#ff4d4d";
    return "#007BFF";
  };

  // LOGIN UI
  if (!loggedUser) {
    return (
      <div style={{ padding: 30, maxWidth: 400, margin: "auto" }}>
        <h1 style={{ textAlign: "center", fontSize: 28 }}>
          🎾 Login
        </h1>

        <input
          placeholder="Username"
          value={user}
          onChange={e => setUser(e.target.value)}
          style={{ width: "100%", padding: 15, marginBottom: 15 }}
        />

        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          style={{ width: "100%", padding: 15 }}
        />

        <button
          onClick={handleLogin}
          style={{
            marginTop: 20,
            width: "100%",
            padding: 15,
            fontSize: 18,
            background: "#007BFF",
            color: "white",
            borderRadius: 10,
            border: "none"
          }}
        >
          Entra
        </button>
      </div>
    );
  }

  // ✅ DASHBOARD SETTIMANALE
  if (view === "dashboard") {
    return (
      <div style={{ padding: 10 }}>
        <button onClick={() => setView("booking")}>
          ← Torna
        </button>

        <h2 style={{ textAlign: "center" }}>📅 Tabellone</h2>

        {courts.map(court => (
          <div key={court} style={{ marginBottom: 20 }}>
            <h3 style={{ textAlign: "center" }}>{court}</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px repeat(7,1fr)",
                gap: 4
              }}
            >
              <div></div>

              {weekDates.map(date => (
                <div key={date} style={{ fontSize: 10 }}>
                  {date.slice(5)}
                </div>
              ))}

              {hours.map(hour => (
                <>
                  <div key={hour}>{hour}:00</div>

                  {weekDates.map(date => {
                    const b = bookings.find(
                      x =>
                        x.court === court &&
                        x.hour === hour &&
                        x.date === date
                    );

                    return (
                      <div
                        key={date + hour}
                        style={{
                          height: 30,
                          background: getColor(b),
                          fontSize: 9,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {b ? "✔" : ""}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // APP
  return (
    <div style={{ padding: 15, maxWidth: 500, margin: "auto" }}>
      <h1 style={{ textAlign: "center", fontSize: 28 }}>
        🎾 Prenotazioni
      </h1>

      <div
        style={{
          textAlign: "center",
          marginBottom: 10,
          padding: 10,
          background: "#f5f5f5",
          borderRadius: 10
        }}
      >
        👤 {loggedUser}
      </div>

      <button
        onClick={() => setView("dashboard")}
        style={{
          width: "100%",
          padding: 15,
          background: "#007BFF",
          color: "white",
          borderRadius: 10
        }}
      >
        Vai al Tabellone
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        style={{
          width: "100%",
          padding: 14,
          marginTop: 10
        }}
      />

      {/* GIOCATORI */}
      <input
        placeholder="Cerca giocatori..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: 12 }}
      />

      {filteredUsers.map(u => (
        <div
          key={u.id}
          onClick={() => {
            setSelectedPlayers([...selectedPlayers, u.username]);
            setSearch("");
          }}
        >
          {u.name} {u.surname}
        </div>
      ))}

      {/* SLOT con nomi ✅ */}
      {courts.map(court => (
        <div key={court}>
          <h3 style={{ textAlign: "center" }}>{court}</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 8
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
                    height: 80,
                    backgroundColor: getColor(booking),
                    color: "white",
                    fontSize: 10
                  }}
                >
                  <div>{hour}:00</div>

                  {booking &&
                    booking.players.map((p, i) => {
                      const u = usersList.find(
                        x => x.username === p
                      );

                      return (
                        <div key={i}>
                          {u ? u.name : p}
                        </div>
                      );
                    })}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
