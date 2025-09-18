import * as HID from 'node-hid';
import { findBuzzControllerByVidPid } from './buzzers-database';

/**
 * HID COMMUNICATION WRAPPER
 *
 * This file serves as the central wrapper for all node-hid interactions.
 * It provides a clean abstraction layer between the application and the node-hid library.
 *
 * Key responsibilities:
 * - USB device enumeration and detection
 * - Buzz controller identification and communication
 * - HID device management and I/O operations
 * - Error handling for device connectivity issues
 *
 * The node-hid library should ONLY be imported and used in this file.
 * All other modules should interact through the functions provided here.
 */

export interface UsbDevice {
  vendorId: number;
  productId: number;
  path: string | undefined;
  serialNumber: string | undefined;
  manufacturer: string | undefined;
  product: string | undefined;
  release: number;
  interface: number;
  usagePage: number | undefined;
  usage: number | undefined;
}

export interface BuzzController {
  model: string;
  type: string;
  vid: string;
  pid: string;
  deviceName: string;
  platform: string;
  connection: string;
  device?: UsbDevice;
}

/**
 * Lists all connected USB HID devices
 * @returns Array of USB device information
 */
export function listUsbDevices(): UsbDevice[] {
  try {
    const devices = HID.devices();
    return devices.map(device => ({
      vendorId: device.vendorId,
      productId: device.productId,
      path: device.path,
      serialNumber: device.serialNumber,
      manufacturer: device.manufacturer,
      product: device.product,
      release: device.release,
      interface: device.interface,
      usagePage: device.usagePage,
      usage: device.usage,
    }));
  } catch (error) {
    console.error('Error listing USB devices:', error);
    return [];
  }
}

/**
 * Detects and identifies connected Buzz controllers
 * @returns Array of detected Buzz controllers with their device information
 */
export function detectBuzzControllers(): BuzzController[] {
  try {
    const devices = listUsbDevices();
    const detectedBuzz: BuzzController[] = [];

    for (const device of devices) {
      const vidHex = device.vendorId
        .toString(16)
        .toUpperCase()
        .padStart(4, '0');
      const pidHex = device.productId
        .toString(16)
        .toUpperCase()
        .padStart(4, '0');

      const buzzController = findBuzzControllerByVidPid(vidHex, pidHex);

      if (buzzController) {
        detectedBuzz.push({
          ...buzzController,
          device,
        });
      }
    }

    return detectedBuzz;
  } catch (error) {
    console.error('Error detecting Buzz controllers:', error);
    return [];
  }
}

/**
 * Opens a connection to a specific HID device
 * @param path HID device path
 * @returns HID device instance or null if failed
 */
export function openHidDevice(path: string): HID.HID | null {
  try {
    return new HID.HID(path);
  } catch (error) {
    console.error(`Error opening HID device at path ${path}:`, error);
    return null;
  }
}

/**
 * Opens a connection to a HID device by VID/PID
 * @param vid Vendor ID
 * @param pid Product ID
 * @returns HID device instance or null if failed
 */
export function openHidDeviceByVidPid(
  vid: number,
  pid: number
): HID.HID | null {
  try {
    return new HID.HID(vid, pid);
  } catch (error) {
    console.error(
      `Error opening HID device with VID ${vid.toString(16)} PID ${pid.toString(16)}:`,
      error
    );
    return null;
  }
}

/**
 * Safely closes a HID device connection
 * @param device HID device instance to close
 */
export function closeHidDevice(device: HID.HID): void {
  try {
    device.close();
  } catch (error) {
    console.error('Error closing HID device:', error);
  }
}

/**
 * Sends data to a HID device
 * @param device HID device instance
 * @param data Data to send (array of bytes)
 * @returns Number of bytes written, or -1 if failed
 */
export function writeToHidDevice(device: HID.HID, data: number[]): number {
  try {
    return device.write(data);
  } catch (error) {
    console.error('Error writing to HID device:', error);
    return -1;
  }
}

/**
 * Reads data from a HID device (blocking)
 * @param device HID device instance
 * @returns Data received from device, or null if failed
 */
export function readFromHidDevice(device: HID.HID): number[] | null {
  try {
    return device.readSync();
  } catch (error) {
    console.error('Error reading from HID device:', error);
    return null;
  }
}

/**
 * Sets up event listeners for HID device data
 * @param device HID device instance
 * @param onData Callback function for received data
 * @param onError Callback function for errors
 */
export function setupHidDeviceListeners(
  device: HID.HID,
  onData: (data: Buffer) => void,
  onError?: (error: Error) => void
): void {
  device.on('data', onData);

  if (onError) {
    device.on('error', onError);
  } else {
    device.on('error', error => {
      console.error('HID device error:', error);
    });
  }
}

/**
 * Gets detailed information about connected Buzz controllers
 * @returns Detailed information about each detected Buzz controller
 */
export function getBuzzControllerDetails(): Array<
  BuzzController & { hidPath: string }
> {
  const buzzControllers = detectBuzzControllers();
  return buzzControllers
    .filter(controller => controller.device?.path)
    .map(controller => ({
      ...controller,
      hidPath: controller.device!.path!,
    }));
}

/**
 * Waits for a Buzz controller to be connected
 * @param timeoutMs Maximum time to wait in milliseconds (default: 30000ms / 30 seconds)
 * @param pollIntervalMs Polling interval in milliseconds (default: 1000ms / 1 second)
 * @returns Promise that resolves to the first detected Buzz controller, or rejects on timeout
 */
export function waitForBuzzController(
  timeoutMs: number = 30000,
  pollIntervalMs: number = 1000
): Promise<BuzzController> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const poll = (): void => {
      const controllers = detectBuzzControllers();

      if (controllers.length > 0) {
        const firstController = controllers[0];
        if (firstController) resolve(firstController);
        return;
      }

      if (Date.now() - startTime >= timeoutMs) {
        reject(new Error(`No Buzz controller detected within ${timeoutMs}ms`));
        return;
      }

      setTimeout(poll, pollIntervalMs);
    };

    poll();
  });
}
