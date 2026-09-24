import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registrarServiceWorker } from "./lib/pwa";

createRoot(document.getElementById("root")!).render(<App />);

// Fora do React de propósito: é coisa do navegador, vale para qualquer rota.
// Ver src/lib/pwa.ts.
registrarServiceWorker();
