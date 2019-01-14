import { UnavailabilityError } from 'expo-errors';
import invariant from 'invariant';

import {
  BluetoothServiceUUID,
  BluetoothCharacteristicUUID,
  BluetoothDescriptorUUID,
  RequestDeviceOptions,
  BluetoothRequestDeviceFilter,
  BluetoothRemoteGATTDescriptor,
  BluetoothCharacteristicProperties,
  CharacteristicEventHandlers,
  BluetoothRemoteGATTCharacteristic,
  ServiceEventHandlers,
  BluetoothRemoteGATTService,
  BluetoothRemoteGATTServer,
  BluetoothDeviceEventHandlers,
  BluetoothDevice,
  Bluetooth,
} from './Bluetooth.def.types';

export type PlatformHandler = (ev: Event) => any;

export enum BluetoothEvent {
  onAvailabilityChanged = 'onavailabilitychanged',
  onGATTServerDisconnected = 'ongattserverdisconnected',
  onCharacteristicValueChanged = 'oncharacteristicvaluechanged',
  onServiceAdded = 'onserviceadded',
  onServiceChanged = 'onservicechanged',
  onServiceRemoved = 'onserviceremoved',
}

export const isCapable = 'bluetooth' in navigator;

/* TODO: Bacon: Web: This will show a modal and allow you to select one. We may need to build a custom component to do this on native. */
export async function requestDeviceAsync(
  options: RequestDeviceOptions = { acceptAllDevices: true }
): Promise<{ type: 'cancel' } | { type: 'success'; device: BluetoothDevice }> {
  try {
    const device = await platformModule().requestDevice(options);
    return { type: 'success', device };
  } catch (error) {
    if (error.code === 8) {
      // User Cancelled
      return { type: 'cancel' };
    }
    throw error;
  }
}

export async function getAvailabilityAsync(): Promise<boolean> {
  const bluetooth = platformModule();
  if (bluetooth.getAvailability) {
    return await platformModule().getAvailability();
  } else {
    return !!bluetooth;
  }
}

export function getReferringDevice(): BluetoothDevice | undefined {
  return platformModule().referringDevice;
}

// type: 'availabilitychanged'
export function addEventListener(
  type: string,
  listener: EventListenerOrEventListenerObject,
  useCapture?: boolean
): void {
  platformModule().addEventListener(type, listener, useCapture);
}

export function dispatchEvent(event: Event): boolean {
  return platformModule().dispatchEvent(event);
}

export function removeEventListener(
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: EventListenerOptions | boolean
): void {
  platformModule().removeEventListener(type, callback, options);
}

export function setPlatformHandler(eventName: BluetoothEvent, handler: PlatformHandler): void {
  platformModule()[eventName] = handler;
}

export function getPlatformHandler(eventName: BluetoothEvent): PlatformHandler {
  return platformModule()[eventName];
}

function platformModule(): Bluetooth {
  const _navigator = navigator as any;
  invariant(_navigator.bluetooth, 'This device is not capable of using Bluetooth');
  return _navigator.bluetooth;
}

async function example_GetAnyDeviceAsync() {
  try {
    const device = await requestDeviceAsync();
    console.log('Success: Got any device: ', device);
  } catch (error) {
    console.log(`Error: Couldn't get any device`, error);
    console.error(`Error: Couldn't get any device`, error);
  }
}

async function example_GetBatteryLevelAsync() {
  const options = {
    filters: [{ services: ['battery_service'] }],
  };

  try {
    const result = await requestDeviceAsync(options);
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
