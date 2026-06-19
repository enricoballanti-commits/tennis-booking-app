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
  const [weekOffset, setWeekOffset] = useState(0);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ WEEK
  const getWeekDates = () => {
    const today = new Date();
    const day = today.getDay();

    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7) + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric"
        })
      };
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

  // ✅ BOOK SLOT
  const bookSlot = async (court, hour) => {
    let players = [...selectedPlayers];
    const isMaestro = loggedUser.toLowerCase() === "maestro";

    if (!isMaestro) {
      if (!players.includes(loggedUser)) {
        players = [loggedUser, ...players];
      }

      if (players.length !== 2 && players.length !== 4) {
        alert("Seleziona 2 o 4 giocatori");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      for (let p of players) {
        const active = bookings.filter(
          b => b.players.includes(p) && b.date >= today
        );

        if (active.length >= 2) {
          alert(`${p} ha già 2 ore prenotate`);
          return;
        }
      }
    }

    const exists = bookings.find(
      b =>
        b.court === court &&
        b.hour === hour &&
        b.date === selectedDate
    );

    if (exists) return;

    // ✅ MAESTRO
    if (isMaestro) {
      players = ["maestro"];
    }

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

  // ✅ CANCEL
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
 const getColor = booking => {
  if (!booking) return "#4CAF50";

  // ✅ MAESTRO → arancione
  if (booking.players.includes("maestro")) {
    return "#FFA500";
  }

  // ✅ ESTERNO → giallo diverso
  if (booking.players.includes("esterno")) {
    return "#FFD700";
  }

  return "#007BFF";
};

  // LOGIN
  if (!loggedUser) {
    return (
      <div style={{ padding: 30, maxWidth: 400, margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>🎾 Login</h1>

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
            width: "100%",
            padding: 15,
            background: "#007BFF",
            color: "white"
          }}
        >
          Entra
        </button>
      </div>
    );
  }

  // DASHBOARD
  if (view === "dashboard") {
    return (
      <div style={{ padding: 10 }}>
        <button onClick={() => setView("booking")}>
          ← Torna
        </button>

        <h2 style={{ textAlign: "center" }}>📅 Tabellone</h2>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => setWeekOffset(weekOffset - 1)}>
            ← prec
          </button>
          <button onClick={() => setWeekOffset(weekOffset + 1)}>
            succ →
          </button>
        </div>

        {courts.map(court => (
          <div key={court}>
            <h3 style={{ textAlign: "center" }}>{court}</h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "60px repeat(7,1fr)"
            }}>
              <div></div>

              {weekDates.map(d => (
                <div key={d.date}>{d.label}</div>
              ))}

              {hours.map(hour => (
                <React.Fragment key={hour}>
                  <div>{hour}:00</div>

                  {weekDates.map(d => {
                    const booking = bookings.find(
                      x =>
                        x.court === court &&
                        x.hour === hour &&
                        x.date === d.date
                    );

                    return (
                      <div
                        key={d.date + hour}
                        style={{
                          height: 30,
                          background: getColor(booking)
                        }}
                      >
                        {booking ? "✔" : ""}
                      </div>
                    );
                  })}
                </React.Fragment>
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
      <h1 style={{ textAlign: "center" }}>🎾 Prenotazioni</h1>

      <div style={{ textAlign: "center", marginBottom: 10 }}>
        👤 {loggedUser}
      </div>

      <button
        onClick={() => setView("dashboard")}
        style={{
          width: "100%",
          padding: 15,
          background: "#007BFF",
          color: "white"
        }}
      >
        Vai al Tabellone
      </button>

      <input
        type="date"
        value={selectedDate}
        onChange={e => setSelectedDate(e.target.value)}
        style={{ width: "100%", padding: 10 }}
      />

      {/* GIOCATORI solo se NON maestro */}
      {loggedUser.toLowerCase() !== "maestro" && (
        <>
          <input
            placeholder="Cerca giocatori..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />

          {filteredUsers.map(u => (
            <div
              key={u.id}
              onClick={() => {
                if (!selectedPlayers.includes(u.username)) {
                  setSelectedPlayers([...selectedPlayers, u.username]);
                }
                setSearch("");
              }}
            >
              {u.name} {u.surname}
            </div>
          ))}

         <div style={{ marginTop: 10 }}>
  {selectedPlayers.map(p => {
    const u = usersList.find(x => x.username === p);

    return (
      <span
        key={p}
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "#007BFF",
          color: "white",
          padding: "6px 12px",
          borderRadius: 20,
          margin: 4,
          fontSize: 12
        }}
      >
        {p === "esterno"
          ? "Esterno"
          : u
            ? `${u.name} ${u.surname}`
            : p}

        <span
          onClick={() =>
            setSelectedPlayers(
              selectedPlayers.filter(x => x !== p)
            )
          }
          style={{
            marginLeft: 8,
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          ✕
        </span>
      </span>
    );
  })}
</div>
        </>
      )}
<button
  onClick={() => {
    if (!selectedPlayers.includes("esterno")) {
      setSelectedPlayers([...selectedPlayers, "esterno"]);
    }
  }}
  style={{
    marginTop: 10,
    padding: 10,
    width: "100%",
    background: "#FFA500",
    color: "white",
    borderRadius: 8,
    border: "none"
  }}
>
  + Esterno
</button>

      {/* SLOT */}
      {courts.map(court => (
        <div key={court}>
          <h3 style={{ textAlign: "center" }}>{court}</h3>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)"
          }}>
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
                  onClick={() => {
                    if (!booking) {
                      bookSlot(court, hour);
                      return;
                    }

                    const canCancel =
                      booking.created_by === loggedUser ||
                      loggedUser.toLowerCase() === "maestro";

                    if (canCancel) {
                      cancelBooking(court, hour);
                    } else {
                      alert("Non puoi cancellare questa prenotazione");
                    }
                  }}
                  style={{
                    height: 100,
                    backgroundColor: getColor(booking),
                    color: "white"
                  }}
                >
                  <div>{hour}:00</div>

                  {booking && (
                    <div>
                      {booking.players.includes("maestro")
                        ? "Maestro"
                        : booking.players.map((p, i) => {
                            const u = usersList.find(x => x.username === p);
                            return (
                              <div key={i}>
                                {p === "maestro"
                                  ? "Maestro"
                                  : p === "esterno"
                                  ? "Esterno"
                                  : u
                                  ? `${u.name} ${u.surname}`
                                : p}
                                  ``
                              </div>
                            );
                          })}
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
