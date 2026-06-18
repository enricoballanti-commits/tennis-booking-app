import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://dfxcscxkwabshseoxjte.supabase.co",
  "sb_publishable_V89vpZmV3Ao4H_uEcrYMcQ_Q-zyG8zA"
);

export default function App() {
  const [user, setUser] = useState("");
  const [pin, setPin] = useState("");
  const [loggedUser, setLoggedUser] = useState(null);

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

    } catch (err) {
      console.error(err);
      alert("Errore DB");
    }
  };

  if (!loggedUser) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Login</h1>

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

        <button onClick={handleLogin}>
          Entra
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Benvenuto {loggedUser}</h1>
    </div>
  );
}
