# Il mondo di Laura

Mappa interattiva dei viaggi di Laura. Si tocca un paese per segnarlo come visitato e aggiungere quando, luoghi e ricordi.

- Sito statico (HTML + d3) più una funzione `api/trips.js` su Vercel.
- I dati sono salvati in un Vercel Blob **privato** (`laura/trips.json`); ogni salvataggio conserva la versione precedente in `laura/history/`.
- L'accesso è protetto da un codice (variabile d'ambiente `ACCESS_CODE`). Link di accesso rapido: `https://<sito>/#k=<codice>`.


Variabili d'ambiente richieste: `ACCESS_CODE`, `BLOB_READ_WRITE_TOKEN` (impostata collegando lo store Blob al progetto).
