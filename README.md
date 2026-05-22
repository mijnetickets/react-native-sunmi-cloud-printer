# react-native-sunmi-cloud-printer

An Expo native module that wraps Sunmi's **external printer** SDKs and exposes them to React Native.
It drives Sunmi *Cloud / external* printers connected over **LAN (Wi‑Fi/Ethernet)**, **Bluetooth**,
or **USB** — i.e. standalone printers reached by IP, MAC or USB.

> This is **not** for the built‑in printer of a Sunmi handheld/desktop device. For that, use a
> built‑in‑printer library (e.g. `@heasy/react-native-sunmi-printer`). This module talks to
> *separate* printers over the network / Bluetooth / USB.

Wrapped native SDKs:

- iOS — [SMPrinterSDK V1.6.6](https://developer.sunmi.com/docs/en-US/xeghjk491/fdfeghjk535)
- Android — [externalprinterlibrary2 1.0.13](https://developer.sunmi.com/docs/en-US/xeghjk491/rxceghjk502)

## Platform support

| Feature           | iOS | Android |
|-------------------|:---:|:-------:|
| LAN               | ✅  | ✅      |
| Bluetooth         | ✅  | ✅      |
| USB               | ❌  | ✅      |
| Cash drawer       | ✅  | ✅      |
| Double‑size text  | ✅  | ✅ *(see [Fork changes](#fork-changes))* |

## Installation

This is an Expo module, installed as a config‑plugin–enabled package.

```bash
npx expo install react-native-sunmi-cloud-printer
# or, when using this fork:
#   yarn add "react-native-sunmi-cloud-printer@github:mijnetickets/react-native-sunmi-cloud-printer#main"
```

Add the config plugin to your app config so the Android AAR gets linked automatically:

```json
{
  "expo": {
    "plugins": ["react-native-sunmi-cloud-printer"]
  }
}
```

The plugin (`app.plugin.js`) injects the bundled `externalprinterlibrary2-*.aar` into your app's
`android/app/build.gradle`. Without the plugin the app **crashes on Android** because the native
Sunmi library isn't on the classpath.

Then build the native projects:

```bash
npx expo prebuild        # regenerate native projects
npx pod-install          # iOS only
```

This module needs a custom dev client / EAS build — it does **not** run in Expo Go.

### Bluetooth permissions (Android)

Bluetooth discovery and connection need runtime permissions. Request them before discovering:

```ts
import { checkBluetoothPermissions, requestBluetoothPermissions } from "react-native-sunmi-cloud-printer";

if (!(await checkBluetoothPermissions())) {
  await requestBluetoothPermissions(); // throws SunmiError if denied
}
```

`requestBluetoothPermissions` asks for `ACCESS_FINE_LOCATION` plus, on Android 12+ (API 31),
`BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`. On iOS these resolve immediately.

## How it works

Printing is **buffer based**, mirroring ESC/POS:

1. **Connect** to a printer (LAN / Bluetooth / USB).
2. **`clearBuffer()`** to start a fresh document.
3. Append commands: `setTextAlign`, `setPrintModesBold`, `addText`, `addImage`, `lineFeed`,
   `addCut`, …
4. **`sendData()`** to flush the buffer to the printer (this is what actually prints).
5. Optionally **`disconnectPrinter()`**.

Discovery is asynchronous: `discoverPrinters()` starts a scan and results arrive through the
`printersListener` event, not as a return value.

## Quick start

```ts
import {
  discoverPrinters,
  printersListener,
  connectLanPrinter,
  clearBuffer,
  setTextAlign,
  setPrintModesBold,
  addText,
  lineFeed,
  addCut,
  sendData,
  disconnectPrinter,
} from "react-native-sunmi-cloud-printer";

// 1. Discover printers on the LAN
const sub = printersListener(({ printers }) => {
  console.log("found:", printers);
});
await discoverPrinters("LAN");

// 2. Connect (e.g. once you picked one from the list)
await connectLanPrinter({ ipAddress: "192.168.1.50", force: true });

// 3. Build and send a receipt
await clearBuffer();
await setTextAlign("center");
await setPrintModesBold({ bold: true, doubleHeight: true, doubleWidth: true });
await addText("MY SHOP\n");
await setPrintModesBold({ bold: false, doubleHeight: false, doubleWidth: false });
await setTextAlign("left");
await addText("1x Coffee            2.50\n");
await lineFeed(1);
await addCut(false);
await sendData();

await disconnectPrinter();
sub.remove();
```

## API

### Setup & discovery

| Function | Description |
|---|---|
| `setup()` | iOS‑only native setup. No‑op on Android. |
| `setTimeout(ms: number)` | Set the connection timeout used by the connect calls. |
| `discoverPrinters(iface: 'LAN' \| 'BLUETOOTH' \| 'USB'): Promise<void>` | Start a scan. Results arrive via `printersListener`. |
| `printersListener(cb: ({ printers }) => void)` | Subscribe to discovery results. Returns a subscription with `.remove()`. |
| `printerConnectionListener(cb: ({ connected }) => void)` | Subscribe to connection‑state changes. |
| `checkBluetoothPermissions(): Promise<boolean>` | Android: are BT permissions granted? iOS: always `true`. |
| `requestBluetoothPermissions(): Promise<void>` | Android: request BT permissions (throws `SunmiError` if denied). |

### Connection

| Function | Description |
|---|---|
| `connectLanPrinter({ ipAddress: string, force: boolean }): Promise<void>` | Connect over LAN. `force: true` connects even if the printer wasn't in the discovered list. |
| `connectBluetoothPrinter({ uuid: string }): Promise<void>` | Connect over Bluetooth. |
| `connectUSBPrinter({ name: string }): Promise<void>` | Android only. iOS rejects with `ERROR_UNSUPPORTED_PLATFORM`. |
| `isPrinterConnected(printer: SunmiCloudPrinter): Promise<boolean>` | Whether the given printer is currently connected. |
| `disconnectPrinter(): Promise<void>` | Disconnect the current printer. |

### Building the print buffer

| Function | Description |
|---|---|
| `clearBuffer(): Promise<void>` | Reset the command buffer (start a new document). |
| `setTextAlign('left' \| 'center' \| 'right'): Promise<void>` | Alignment for following text. |
| `setPrintModesBold({ bold, doubleHeight, doubleWidth }): Promise<void>` | Toggle bold and double width/height for following text (see [Fork changes](#fork-changes)). |
| `restoreDefaultSettings(): Promise<void>` | Reset density / speed / cutter / font to defaults. **Does not reset character size** — use `setPrintModesBold({ bold:false, doubleHeight:false, doubleWidth:false })` to return to normal size. |
| `restoreDefaultLineSpacing(): Promise<void>` | Reset line spacing to default. |
| `addText(text: string): Promise<void>` | Append text (UTF‑8). Include `\n` for line breaks. |
| `addImage({ base64: string, width: number, height: number }): Promise<void>` | Append a monochrome raster image. |
| `lineFeed(lines: number): Promise<void>` | Feed N blank lines. |
| `addCut(fullCut: boolean): Promise<void>` | Cut the paper (`true` = full, `false` = partial). |
| `openCashDrawer(): Promise<void>` | Open the connected cash drawer. |
| `sendData(): Promise<void>` | Flush the buffer to the printer — performs the actual print. |

### Status

| Function | Description |
|---|---|
| `getDeviceState(): Promise<CloudPrinterStatus>` | Current printer status. |

`CloudPrinterStatus`: `'OFFLINE' \| 'UNKNOWN' \| 'RUNNING' \| 'NEAR_OUT_PAPER' \| 'OUT_PAPER' \| 'JAM_PAPER' \| 'PICK_PAPER' \| 'COVER' \| 'OVER_HOT' \| 'MOTOR_HOT'`.

### Types

```ts
type PrinterInterface = 'LAN' | 'BLUETOOTH' | 'USB';

type SunmiCloudPrinter =
  | { interface: 'LAN';       name: string; ip: string }
  | { interface: 'BLUETOOTH'; name: string; uuid: string }
  | { interface: 'USB';       name: string };

class SunmiError extends Error {
  code?:
    | 'ERROR_INVALID_INTERFACE'
    | 'ERROR_IMAGE_NOT_VALID'
    | 'ERROR_IMAGE_SIZE_NOT_VALID'
    | 'ERROR_PRINTER_NOT_CONNECTED'
    | 'ERROR_INVALID_PERMISSIONS'
    | 'ERROR_UNSUPPORTED_PLATFORM';
  message: string;
}
```

Most functions reject with a `SunmiError` (e.g. `ERROR_PRINTER_NOT_CONNECTED` when no printer is
connected). Wrap calls in `try/catch` and inspect `error.code`.

## Fork changes

This fork differs from upstream
[`MultiSafepay/react-native-sunmi-cloud-printer`](https://github.com/MultiSafepay/react-native-sunmi-cloud-printer):

- **`setPrintModesBold` now honours `doubleHeight` / `doubleWidth` on Android.** Upstream only
  applied `bold` on Android (the size flags were ignored), because the Android SDK splits bold and
  size into separate calls. This fork additionally calls `CloudPrinter.setCharacterSize(width, height)`
  (each 1–8, where 1 = normal and 2 = double), so enlarged text now works on both platforms —
  matching the iOS behaviour. Since `restoreDefaultSettings()` does **not** reset the character size,
  call `setPrintModesBold({ bold: false, doubleHeight: false, doubleWidth: false })` to return to
  normal size after printing enlarged text.

## License

MIT
