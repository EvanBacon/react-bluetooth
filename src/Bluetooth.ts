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

export type Subscription = { remove: () => void };

let platformListeners: { [eventName: string]: PlatformHandler[] } = {};

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

export function addPlatformHandler(
  eventName: BluetoothEvent,
  handler: PlatformHandler
): Subscription {
  if (!(eventName in platformListeners)) {
    platformListeners[eventName] = [];
  }
  platformListeners[eventName].push(handler);

  return {
    remove() {
      const index = platformListeners[eventName].indexOf(handler);
      if (index !== -1) {
        platformListeners[eventName].splice(index, 1);
      }
    },
  };
}

/* In theory these event listeners shouldn't matter */

// type: 'availabilitychanged'
export function addEventListener(
  listener: EventListenerOrEventListenerObject,
  useCapture?: boolean
): void {
  platformModule().addEventListener('availabilitychanged', listener, useCapture);
}

export function dispatchEvent(event: Event): boolean {
  return platformModule().dispatchEvent(event);
}

export function removeEventListener(
  callback: EventListenerOrEventListenerObject | null,
  options?: EventListenerOptions | boolean
): void {
  platformModule().removeEventListener('availabilitychanged', callback, options);
}

function platformModule(): Bluetooth {
  const _navigator = navigator as any;
  invariant(_navigator.bluetooth, 'This device is not capable of using Bluetooth');
  return _navigator.bluetooth;
}

function _setupHandlers() {
  const events = [
    BluetoothEvent.onAvailabilityChanged,
    BluetoothEvent.onGATTServerDisconnected,
    BluetoothEvent.onCharacteristicValueChanged,
    BluetoothEvent.onServiceAdded,
    BluetoothEvent.onServiceChanged,
    BluetoothEvent.onServiceRemoved,
  ];
  for (const eventName of events) {
    /* This could be messy if the developer redefines these values */
    platformModule()[eventName] = (...event) => {
      const subscriptions = platformListeners[eventName];
      for (const subscription of subscriptions) {
        subscription(...event);
      }
    };
  }
}

_setupHandlers();
