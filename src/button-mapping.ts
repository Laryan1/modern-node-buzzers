/**
 * BUZZ CONTROLLER BUTTON MAPPING
 *
 * This file contains the mapping between raw button data and button presses
 * for Buzz controllers. Each button press generates a specific byte pattern
 * that needs to be decoded to identify which controller and button was pressed.
 *
 * Data Format:
 * - Incoming data: 5-byte buffer: [0, 0, byte3, byte4, controllerByte]
 * - Bytes 0-1: Always [0, 0]
 * - Byte 3: Button bits for buzzers 1-2 (bit flags)
 * - Byte 4: Button bits for buzzers 3-4 (bit flags)
 * - Byte 5: Controller identifier (240=base, 241=controller1, 242=controller2, 244=controller3, 248=controller4)
 *
 * Button Layout per Controller:
 * - Button 0: Big red buzzer button
 * - Button 1: Blue button
 * - Button 2: Orange button
 * - Button 3: Green button
 * - Button 4: Yellow button
 *
 * Bit mapping analysis from raw data:
 * - [0, 0, 0, 1, 240] = Buzzer 1 Red
 * - [0, 0, 128, 0, 240] = Buzzer 1 Blue
 * - [0, 0, 64, 0, 240] = Buzzer 1 Orange
 * - [0, 0, 0, 4, 240] = Buzzer 1 Green
 * - [0, 0, 0, 64, 240] = Buzzer 1 Yellow
 * - [0, 0, 0, 32, 240] = Buzzer 2 Red
 * - [0, 0, 0, 16, 240] = Buzzer 2 Blue
 * - [0, 0, 0, 8, 240] = Buzzer 2 Orange
 * - [0, 0, 0, 128, 240] = Buzzer 2 Green
 * - [0, 0, 0, 0, 248] = Buzzer 3 Red
 * - [0, 0, 0, 0, 244] = Buzzer 3 Blue
 * - [0, 0, 0, 0, 242] = Buzzer 3 Orange
 * - [0, 0, 0, 0, 241] = Buzzer 3 Green
 * - And buzzer 4 would use different controller byte values
 */

export interface ButtonPressEvent {
  controller: number;
  button: number;
  buttonName: string;
  timestamp: number;
}

export const ButtonAction = {
  PRESSED: 'pressed',
  RELEASED: 'released',
} as const;
export type ButtonActionEnum = (typeof ButtonAction)[keyof typeof ButtonAction];

export interface ButtonEvent {
  controller: number;
  button: number;
  buttonName: string;
  action: ButtonActionEnum;
  timestamp: number;
}

/**
 * Button names for user-friendly display
 */
export const BUTTON_NAMES: Record<number, string> = {
  0: 'Red Buzzer',
  1: 'Blue',
  2: 'Orange',
  3: 'Green',
  4: 'Yellow',
};

/**
 * Parse incoming buffer data to identify button press
 * @param data 5-byte buffer from HID device
 * @returns ButtonPressEvent if valid button press, null otherwise
 */
/**
 * Bit flag definitions for button detection in 5-byte buffer format
 * Based on actual testing with physical Buzz controllers
 */

/**
 * Bit mapping for button detection based on actual test data
 *
 * Controller 1: Uses byte3 bits 0-4 (bits 0b00000001 to 0b00010000)
 * Controller 2: Uses byte3 bits 5-7 + byte4 bits 0-1 (0b00100000 to 0b10000000 + 0b00000001 to 0b00000010)
 * Controller 3: Uses byte4 bits 2-6 (0b00000100 to 0b01000000)
 * Controller 4: Uses byte4 bit 7 + byte5 special values (0b10000000 + 248,244,242,241)
 */

// Bit positions for each controller/button combination
const CONTROLLER_BIT_MAPPING = {
  // Controller 1 - byte3 bits
  0: {
    0: { byte: 2, bit: 0 }, // Red: 0b00000001 = 1
    1: { byte: 2, bit: 4 }, // Blue: 0b00010000 = 16
    2: { byte: 2, bit: 3 }, // Orange: 0b00001000 = 8
    3: { byte: 2, bit: 2 }, // Green: 0b00000100 = 4
    4: { byte: 2, bit: 1 }, // Yellow: 0b00000010 = 2
  },
  // Controller 2 - byte3 bits 5-7 + byte4 bits 0-1
  1: {
    0: { byte: 2, bit: 5 }, // Red: 0b00100000 = 32
    1: { byte: 3, bit: 1 }, // Blue: 0b00000010 = 2
    2: { byte: 3, bit: 0 }, // Orange: 0b00000001 = 1
    3: { byte: 2, bit: 7 }, // Green: 0b10000000 = 128
    4: { byte: 2, bit: 6 }, // Yellow: 0b01000000 = 64
  },
  // Controller 3 - byte4 bits 2-6
  2: {
    0: { byte: 3, bit: 2 }, // Red: 0b00000100 = 4
    1: { byte: 3, bit: 6 }, // Blue: 0b01000000 = 64
    2: { byte: 3, bit: 5 }, // Orange: 0b00100000 = 32
    3: { byte: 3, bit: 4 }, // Green: 0b00010000 = 16
    4: { byte: 3, bit: 3 }, // Yellow: 0b00001000 = 8
  },
  // Controller 4 - byte4 bit 7 + byte5 special values
  3: {
    0: { byte: 3, bit: 7 }, // Red: 0b10000000 = 128
    1: { byte: 4, bit: 3 }, // Blue: special byte5 value
    2: { byte: 4, bit: 2 }, // Orange: special byte5 value
    3: { byte: 4, bit: 1 }, // Green: special byte5 value
    4: { byte: 4, bit: 0 }, // Yellow: special byte5 value
  },
};

// Store previous state for press/release detection
let previousButtonStates: Record<string, boolean> = {};

/**
 * Parse button states from 5-byte buffer and detect press/release events
 */
export function parseButtonPress(data: Buffer): ButtonEvent[] | null {
  if (data.length < 5) {
    return null;
  }

  const bytes = data.subarray(0, 5);

  const events: ButtonEvent[] = [];
  const currentButtonStates: Record<string, boolean> = {};

  // Check all controllers and buttons
  for (const [controllerStr, buttonMappings] of Object.entries(
    CONTROLLER_BIT_MAPPING
  )) {
    const controller = parseInt(controllerStr);

    for (const [buttonStr, mapping] of Object.entries(buttonMappings)) {
      const button = parseInt(buttonStr);
      const stateKey = `${controller}-${button}`;

      let isPressed = false;

      // Standard bit checking
      const byteValue = bytes[mapping.byte];
      if (byteValue !== undefined) {
        isPressed = (byteValue & (1 << mapping.bit)) !== 0;
      }

      currentButtonStates[stateKey] = isPressed;

      // Check for state changes
      const wasPressed = previousButtonStates[stateKey] || false;

      if (isPressed && !wasPressed) {
        // Button pressed
        events.push({
          controller,
          button,
          buttonName: BUTTON_NAMES[button] || `Button ${button}`,
          action: 'pressed',
          timestamp: Date.now(),
        });
      } else if (!isPressed && wasPressed) {
        // Button released
        events.push({
          controller,
          button,
          buttonName: BUTTON_NAMES[button] || `Button ${button}`,
          action: 'released',
          timestamp: Date.now(),
        });
      }
    }
  }

  // Update previous state
  previousButtonStates = currentButtonStates;

  return events.length > 0 ? events : null;
}

/**
 * Check if byte pattern represents a valid button press
 * @param data 5-byte buffer from HID device
 * @returns true if valid button press pattern, false otherwise
 */
export function isValidButtonPress(data: Buffer): boolean {
  const events = parseButtonPress(data);
  return events !== null && events.length > 0;
}

/**
 * Get button name by button number
 * @param buttonNumber Button number (0-4)
 * @returns Button name string
 */
export function getButtonName(buttonNumber: number): string {
  return BUTTON_NAMES[buttonNumber] || `Button ${buttonNumber}`;
}

/**
 * Format button press event for logging/display
 * @param event Button press event
 * @returns Formatted string
 */
export function formatButtonPressEvent(event: ButtonPressEvent): string {
  return `Controller ${event.controller} - ${event.buttonName} (Button ${event.button})`;
}

export function formatButtonEvent(event: ButtonEvent): string {
  return `Controller ${event.controller} - ${event.buttonName} ${event.action} (Button ${event.button})`;
}
