[![NPM](https://nodei.co/npm/react-bluetooth.png)](https://nodei.co/npm/react-bluetooth/)

---

> WIP: This library is not ready for use in any projects

# react-bluetooth

Tools to integrate the current [web Bluetooth API spec](https://webbluetoothcg.github.io/web-bluetooth/) in your React web applications.

The goal of this project is to create a unified API for working with Bluetooth across browser, iOS, Android, and PWAs.

**References**

- [Interact with Bluetooth](https://developers.google.com/web/updates/2015/07/interact-with-ble-devices-on-the-web)
- [Bluetooth GATT spec](https://www.bluetooth.com/specifications/gatt/generic-attributes-overview)
- [Bluetooth](https://www.bluetooth.com)

### Installation

```sh
yarn add react-bluetooth
```

### Usage

Import the library into your JavaScript file:

```js
import * as Bluetooth from 'react-bluetooth';
```

# Methods

## `requestDeviceAsync`

```ts
requestDeviceAsync(
  options: RequestDeviceOptions = { acceptAllDevices: true }
): Promise<{ type: 'cancel' } | { type: 'success'; device: BluetoothDevice }>
```

### Example

```ts
try {
  const result = await Bluetooth.requestDeviceAsync();

  if (result.type === 'cancel') {
    return;
  }

  const device: BluetoothDevice = result.device;
} catch ({ message, code }) {
  console.log('Error:', message, code);
}
```

## `getAvailabilityAsync`

```ts
getAvailabilityAsync(): Promise<boolean>
```

Returns a boolean that denotes bluetooth availability on the current device. This will also polyfill instances where `navigator.bluetooth.getAvailability()` is not supported.

### Example

```ts
if (await Bluetooth.getAvailabilityAsync()) {
  // Is Available
}
```

## `getReferringDevice`

```ts
getReferringDevice(): BluetoothDevice | undefined
```

## `addPlatformHandler`

```ts
addPlatformHandler(eventName: BluetoothEvent, handler: PlatformHandler): Subscription
```

### Example

```ts
const subscription = addPlatformHandler(BluetoothEvent.onServiceAdded, event => {
  console.log('addPlatformHandler');
});
```

## `addEventListener`

```ts
addEventListener(
  listener: EventListenerOrEventListenerObject,
  useCapture?: boolean
): void
```

## `dispatchEvent`

```ts
dispatchEvent(event: Event): boolean
```

## `removeEventListener`

```ts
removeEventListener(
  callback: EventListenerOrEventListenerObject | null,
  options?: EventListenerOptions | boolean
): void
```

# Types

## `BluetoothEvent`

Used with `Bluetooth.setPlatformHandler`.

```ts
enum BluetoothEvent {
  onAvailabilityChanged = 'onavailabilitychanged',
  onGATTServerDisconnected = 'ongattserverdisconnected',
  onCharacteristicValueChanged = 'oncharacteristicvaluechanged',
  onServiceAdded = 'onserviceadded',
  onServiceChanged = 'onservicechanged',
  onServiceRemoved = 'onserviceremoved',
}
```

# Examples

```ts
async function example_GetAnyDeviceAsync() {
  const isAvailable = await Bluetooth.getAvailabilityAsync();
  if (!isAvailable) {
    return;
  }
  try {
    const device = await Bluetooth.requestDeviceAsync();
    console.log('Success: Got any device: ', device);
  } catch (error) {
    console.log(`Error: Couldn't get any device`, error);
    console.error(`Error: Couldn't get any device`, error);
  }
}

async function example_GetBatteryLevelAsync() {
  const isAvailable = await Bluetooth.getAvailabilityAsync();
  if (!isAvailable) {
    return;
  }

  const options = {
    filters: [{ services: ['battery_service'] }],
  };

  try {
    const result = await Bluetooth.requestDeviceAsync(options);
    if (result.type === 'cancel') {
      return;
    }
    const { device } = result;

    console.log(`Bluetooth: Got device:`, device);
    if (device.gatt) {
      const server = await device.gatt.connect();
      console.log(`Bluetooth: Got server:`, server);
      const service = await server.getPrimaryService('battery_service');
      console.log(`Bluetooth: Got service:`, service);
      const characteristic = await service.getCharacteristic('battery_level');
      console.log(`Bluetooth: Got characteristic:`, characteristic);
      const value = await characteristic.readValue();
      console.log(`Bluetooth: Got value:`, value);
      const battery = value.getUint8(0);
      console.log(`Success: Got battery:`, battery);
    } else {
      // TODO: Bacon: Can we connect to the GATT or is that a no-op?
      console.error(`Error: connected device did not have a GATT`);
    }
  } catch ({ message }) {
    console.error(`Error: Couldn't get battery level: ${message}`);
  }
}
```
