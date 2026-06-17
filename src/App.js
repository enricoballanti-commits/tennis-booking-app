import React, { useState } from "react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7-23
const courts = ["Campo 1", "Campo 2"];

export default function App() {
  const [bookings, setBookings] = useState([]);
  const user = "UtenteDemo"; // semplificato

  const bookSlot = (court, hour) => {
    const alreadyBooked = bookings.find(
      (b) => b.court === court && b.hour === hour
    );
    if (alreadyBooked) return;

    setBookings([
      ...bookings,
      { court, hour, players: [user] }
    ]);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Prenotazione Campi Tennis</h1>

      {courts.map((court) => (
        <Card key={court} className="mb-4">
          <CardContent>
            <h2 className="text-xl mb-2">{court}</h2>
            <div className="grid grid-cols-4 gap-2">
              {hours.map((hour) => {
                const booking = bookings.find(
                  (b) => b.court === court && b.hour === hour
                );

                return (
                  <Button
                    key={hour}
                    className="h-16"
                    onClick={() => bookSlot(court, hour)}
                    variant={booking ? "secondary" : "default"}
                  >
                    {hour}:00
                    {booking && (
                      <div className="text-xs">
                        {booking.players.length} giocatori
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
