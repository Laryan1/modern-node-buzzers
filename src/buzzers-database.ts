import { BuzzController } from './index';

/**
 * BUZZ CONTROLLERS DATABASE
 *
 * This file contains the comprehensive database of known Buzz controller variants.
 *
 * To add support for new Buzz controllers:
 * 1. Add a new entry to the KNOWN_BUZZ_CONTROLLERS array
 * 2. Include all required fields: model, type, vid, pid, deviceName, platform, connection
 * 3. Use uppercase hexadecimal format for VID/PID (e.g., "054C", "1000")
 *
 * VID/PID Reference:
 * - VID 054C = Sony Computer Entertainment
 * - Common Buzz PIDs: 0002 (Wired), 1000 (Wireless Receiver), 0374 (Wireless Variant)
 */

export const KNOWN_BUZZ_CONTROLLERS: Omit<BuzzController, 'device'>[] = [
  {
    model: 'Wired Buzz',
    type: 'Wired',
    vid: '054C',
    pid: '0002',
    deviceName: 'Logitech Buzz(tm) Controller V1',
    platform: 'PS2/PS3',
    connection: 'USB Hub',
  },
  {
    model: 'Wireless Buzz',
    type: 'Wireless',
    vid: '054C',
    pid: '1000',
    deviceName: 'Buzz Controller',
    platform: 'PS2/PS3',
    connection: 'USB',
  },
  {
    model: 'Wireless Variant',
    type: 'Wireless',
    vid: '054C',
    pid: '0374',
    deviceName: 'Buzz Controller (Wireless)',
    platform: 'PS2/PS3',
    connection: 'USB Dongle',
  },
];

/**
 * Get all known Buzz controller definitions
 * @returns Array of known Buzz controller configurations
 */
export function getKnownBuzzControllers(): Omit<BuzzController, 'device'>[] {
  return KNOWN_BUZZ_CONTROLLERS;
}

/**
 * Find a Buzz controller by VID/PID
 * @param vid Vendor ID in uppercase hex format (e.g., "054C")
 * @param pid Product ID in uppercase hex format (e.g., "1000")
 * @returns Buzz controller definition if found, undefined otherwise
 */
export function findBuzzControllerByVidPid(
  vid: string,
  pid: string
): Omit<BuzzController, 'device'> | undefined {
  return KNOWN_BUZZ_CONTROLLERS.find(
    controller => controller.vid === vid && controller.pid === pid
  );
}
