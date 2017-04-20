import { client } from "electron-connect";
import { app, BrowserWindow, clipboard, ipcMain, screen, globalShortcut } from "electron";
let electronLocalshortcut = require("electron-localshortcut");

class Main {

    static mainWindow: Electron.BrowserWindow;
    static application: Electron.App;
    static BrowserWindow;
    static resourcesDir: string;
    static lastText: string;

    private static onWindowAllClosed(): void {
        if (process.platform !== "darwin") {
            Main.application.quit();
        }
    }

    private static onClose(): void {
        Main.mainWindow = null;
    }

    private static onReady(): void {
        Main.mainWindow = new Main.BrowserWindow({
            width: 300,
            height: 400,
            show: false
        });
        Main.mainWindow.loadURL(`file://${Main.resourcesDir}/app.html`);
        Main.mainWindow.on("closed", Main.onClose);

        if (process.env.ELECTRON_ENV === "development") {
            client.create(Main.mainWindow);
        }

        setInterval(() => Main.checkClipboard(), 1000);
        ipcMain.on("copy", (event, arg) => {
            clipboard.writeText(arg);
            Main.mainWindow.hide();
        });

        let cursorPos = screen.getCursorScreenPoint();
        Main.mainWindow.setPosition(cursorPos.x, cursorPos.y);

        globalShortcut.register("CommandOrControl+Alt+V", () => {
            if (Main.mainWindow.isVisible()) {
                Main.mainWindow.hide();
            } else {
                Main.mainWindow.show();
            }
        });

        electronLocalshortcut.register(Main.mainWindow, "Esc", () => {
            Main.mainWindow.hide();
        });

    }

    private static checkClipboard(): void {
        let text = clipboard.readText();
        if (Main.lastText !== text) {
            Main.lastText = text;
            Main.mainWindow.webContents.send("add-text", text);
        }
    }

    static main(app: Electron.App, browserWindow: typeof BrowserWindow): void {
        Main.resourcesDir = `${__dirname}/../resources`;
        Main.BrowserWindow = browserWindow;
        Main.application = app;
        Main.application.on("window-all-closed", Main.onWindowAllClosed);
        Main.application.on("ready", Main.onReady);
    }

}

if (process.env.ELECTRON_ENV === "development") {
    require("electron-debug")({ showDevTools: true });
}

Main.main(app, BrowserWindow);
