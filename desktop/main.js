// Noiverso per Windows e Mac: una finestra che apre il gioco (sempre l'ultima versione dal sito).
// Il gioco ricorda l'accesso: dopo la prima volta non serve rimettere la password.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const { url: INDIRIZZO } = require("./indirizzo.json");

function apri() {
  const fin = new BrowserWindow({
    width: 1366, height: 820, minWidth: 900, minHeight: 560,
    backgroundColor: "#0d0a0c", title: "Noiverso", autoHideMenuBar: true,
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  fin.loadURL(INDIRIZZO);
  // senza connessione: pagina di avviso con "Riprova"
  fin.webContents.on("did-fail-load", (_e, codice, _d, url, principale) => { if (principale && codice !== -3) fin.loadFile(path.join(__dirname, "offline.html"), { query: { url: INDIRIZZO } }); });
  // i link esterni (es. download, GitHub) si aprono nel browser normale
  fin.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith(INDIRIZZO)) { shell.openExternal(url); return { action: "deny" }; } return { action: "allow" }; });
  // F11 = schermo intero
  fin.webContents.on("before-input-event", (_e, inp) => { if (inp.type === "keyDown" && inp.key === "F11") fin.setFullScreen(!fin.isFullScreen()); });
}

Menu.setApplicationMenu(process.platform === "darwin" ? Menu.buildFromTemplate([{ role: "appMenu" }, { role: "editMenu" }, { role: "viewMenu" }, { role: "windowMenu" }]) : null);
app.whenReady().then(() => { apri(); app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) apri(); }); });
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
