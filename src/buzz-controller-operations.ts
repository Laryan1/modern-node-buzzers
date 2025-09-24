import * as HID from 'node-hid';
import {
  openHidDevice,
  closeHidDevice,
  writeToHidDevice,
  readFromHidDevice,
  setupHidDeviceListeners,
  BuzzController,
} from './hid-communication';
import {
  parseButtonPress,
  ButtonEvent,
  formatButtonEvent,
} from './button-mapping';

/**
 * BUZZ CONTROLLER OPERATIONS
 *
 * This file contains the logic for controlling Buzz controllers, including:
 * - LED lighting patterns and control
 * - Button state reading
 * - Device-specific operations
 * - Communication protocols
 *
 * LED Control Protocol:
 * - Command format: [0x00, 0x00, 0, 1, 2, 3]
 * - Header: Always starts with [0x00, 0x00]
 * - LED values: 0x00 = off, 0xFF = on for each buzzer
 * - Total message length: 6 bytes
 */

export interface BuzzerLedState {
  0: boolean;
  1: boolean;
  2: boolean;
  3: boolean;
}

export interface BuzzerButtonState {
  0: {
    red: boolean;
    yellow: boolean;
    green: boolean;
    orange: boolean;
    blue: boolean;
  };
  1: {
    red: boolean;
    yellow: boolean;
    green: boolean;
    orange: boolean;
    blue: boolean;
  };
  2: {
    red: boolean;
    yellow: boolean;
    green: boolean;
    orange: boolean;
    blue: boolean;
  };
  3: {
    red: boolean;
    yellow: boolean;
    green: boolean;
    orange: boolean;
    blue: boolean;
  };
}

/**
 * Connected Buzz controller instance for operations
 */
export class BuzzControllerInstance {
  private device: HID.HID | null = null;
  private controllerInfo: BuzzController;

  constructor(controller: BuzzController) {
    this.controllerInfo = controller;
  }

  /**
   * Connect to the Buzz controller
   * @returns true if connection successful, false otherwise
   */
  connect(): boolean {
    if (!this.controllerInfo.device?.path) {
      console.error('No device path available for connection');
      return false;
    }

    this.device = openHidDevice(this.controllerInfo.device.path);
    return this.device !== null;
  }

  /**
   * Disconnect from the Buzz controller
   */
  disconnect(): void {
    if (this.device) {
      closeHidDevice(this.device);
      this.device = null;
    }
  }

  /**
   * Check if controller is connected
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean {
    return this.device !== null;
  }

  /**
   * Get controller information
   * @returns Controller information
   */
  getInfo(): BuzzController {
    return this.controllerInfo;
  }

  /**
   * Send raw LED command to the controller
   * @param command LED command bytes
   * @returns true if command sent successfully, false otherwise
   */
  private sendLedCommand(command: number[]): boolean {
    if (!this.device) {
      console.error('Controller not connected');
      return false;
    }

    const result = writeToHidDevice(this.device, command);
    return result > 0;
  }

  /**
   * Turn on all buzzer LEDs
   * @returns true if command sent successfully, false otherwise
   */
  lightAllLeds(): boolean {
    const command = [0x00, 0x00, 0xff, 0xff, 0xff, 0xff];
    return this.sendLedCommand(command);
  }

  /**
   * Turn off all buzzer LEDs
   * @returns true if command sent successfully, false otherwise
   */
  turnOffAllLeds(): boolean {
    const command = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    return this.sendLedCommand(command);
  }

  /**
   * Set specific LED states for each buzzer
   * @param ledState State for each buzzer LED
   * @returns true if command sent successfully, false otherwise
   */
  setLedStates(ledState: BuzzerLedState): boolean {
    const command = [
      0x00, // Header byte 1
      0x00, // Header byte 2
      ledState[0] ? 0xff : 0x00, // Buzzer 1 LED
      ledState[1] ? 0xff : 0x00, // Buzzer 2 LED
      ledState[2] ? 0xff : 0x00, // Buzzer 3 LED
      ledState[3] ? 0xff : 0x00, // Buzzer 4 LED
    ];
    return this.sendLedCommand(command);
  }

  /**
   * Light specific buzzers by their numbers (1-4)
   * @param buzzerNumbers Array of buzzer numbers to light (1-4)
   * @returns true if command sent successfully, false otherwise
   */
  lightSpecificBuzzers(buzzerNumbers: number[]): boolean {
    const ledState: BuzzerLedState = {
      0: buzzerNumbers.includes(1),
      1: buzzerNumbers.includes(2),
      2: buzzerNumbers.includes(3),
      3: buzzerNumbers.includes(4),
    };
    return this.setLedStates(ledState);
  }

  /**
   * Create a blinking pattern for specified buzzers
   * @param buzzerNumbers Array of buzzer numbers to blink (1-4)
   * @param duration Total duration in milliseconds
   * @param interval Blink interval in milliseconds
   * @returns Promise that resolves when blinking is complete
   */
  async blinkBuzzers(
    buzzerNumbers: number[],
    duration: number = 3000,
    interval: number = 500
  ): Promise<void> {
    const endTime = Date.now() + duration;
    let isOn = false;

    while (Date.now() < endTime) {
      if (isOn) {
        this.lightSpecificBuzzers(buzzerNumbers);
      } else {
        this.turnOffAllLeds();
      }

      isOn = !isOn;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // Ensure LEDs are off when done
    this.turnOffAllLeds();
  }

  /**
   * Read current button states from the controller
   * @returns Button state data or null if failed
   */
  readButtonStates(): number[] | null {
    if (!this.device) {
      console.error('Controller not connected');
      return null;
    }

    return readFromHidDevice(this.device);
  }

  /**
   * Set up event listeners for button presses
   * @param onButtonPress Callback function for button press events
   * @param onError Optional error callback
   */
  setupButtonListeners(
    onButtonPress: (data: Buffer) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.device) {
      console.error('Controller not connected');
      return;
    }

    setupHidDeviceListeners(this.device, onButtonPress, onError);
  }

  /**
   * Set up enhanced button listeners with automatic parsing
   * @param onButtonEvent Callback function for parsed button events (press/release)
   * @param onRawData Optional callback for raw data (for debugging)
   * @param onError Optional error callback
   */
  setupParsedButtonListeners(
    onButtonEvent: (events: ButtonEvent[]) => void,
    onRawData?: (data: Buffer, timestamp: Date) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.device) {
      console.error('Controller not connected');
      return;
    }

    const handleData = (data: Buffer): void => {
      // Call raw data callback if provided (for debugging)
      if (onRawData) {
        const date = new Date();
        onRawData(data, date);
      }

      // Parse the button events
      const buttonEvents = parseButtonPress(data);
      if (buttonEvents && buttonEvents.length > 0) {
        onButtonEvent(buttonEvents);
      }
    };

    setupHidDeviceListeners(this.device, handleData, onError);
  }

  /**
   * Start listening for button presses with console logging
   * Useful for testing and debugging
   * @param logRawData Whether to log raw data bytes
   */
  startButtonLogging(logRawData: boolean = false): void {
    this.setupParsedButtonListeners(
      (events: ButtonEvent[]) => {
        events.forEach(event => {
          const timestamp = new Date(event.timestamp);
          const timeString =
            timestamp.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }) +
            '.' +
            timestamp.getMilliseconds().toString().padStart(3, '0');

          console.log(
            `🔵 [${timeString}] Button Event: ${formatButtonEvent(event)}`
          );
        });
      },
      logRawData
        ? (data: Buffer, date: Date): void => {
            const timeString =
              date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }) +
              '.' +
              date.getMilliseconds().toString().padStart(3, '0');

            console.log(
              `📊 [${timeString}] Raw data: [${Array.from(data).join(', ')}] - ${timeString}`
            );
          }
        : undefined,
      (error: Error) => {
        console.error('❌ Button listener error:', error);
      }
    );
  }
}

/**
 * Create LED patterns for different scenarios
 */
export class BuzzLedPatterns {
  /**
   * Get LED state for "player ready" pattern
   * @param playerNumber Player number (1-4)
   * @returns LED state with only the specified player's buzzer lit
   */
  static playerReady(playerNumber: number): BuzzerLedState {
    return {
      0: playerNumber === 1,
      1: playerNumber === 2,
      2: playerNumber === 3,
      3: playerNumber === 4,
    };
  }

  /**
   * Get LED state for "countdown" pattern
   * @param count Current countdown number (1-4)
   * @returns LED state showing countdown
   */
  static countdown(count: number): BuzzerLedState {
    return {
      0: count >= 1,
      1: count >= 2,
      2: count >= 3,
      3: count >= 4,
    };
  }

  /**
   * Get LED state for "winner" pattern
   * @param winnerNumber Winner's buzzer number (1-4)
   * @returns LED state with winner's buzzer pattern
   */
  static winner(winnerNumber: number): BuzzerLedState {
    return this.playerReady(winnerNumber);
  }

  /**
   * Get LED state for "all active" pattern
   * @returns LED state with all buzzers lit
   */
  static allActive(): BuzzerLedState {
    return {
      0: true,
      1: true,
      2: true,
      3: true,
    };
  }

  /**
   * Get LED state for "none active" pattern
   * @returns LED state with all buzzers off
   */
  static allOff(): BuzzerLedState {
    return {
      0: false,
      1: false,
      2: false,
      3: false,
    };
  }

  /**
   * Get LED state for "alternating" pattern
   * @param even If true, light even-numbered buzzers; if false, light odd-numbered
   * @returns LED state with alternating pattern
   */
  static alternating(even: boolean): BuzzerLedState {
    return {
      0: !even, // Odd
      1: even, // Even
      2: !even, // Odd
      3: even, // Even
    };
  }
}

/**
 * Utility functions for Buzz controller operations
 */
export class BuzzControllerUtils {
  /**
   * Validate buzzer number
   * @param buzzerNumber Buzzer number to validate
   * @returns true if valid (1-4), false otherwise
   */
  static isValidBuzzerNumber(buzzerNumber: number): boolean {
    return (
      buzzerNumber >= 1 && buzzerNumber <= 4 && Number.isInteger(buzzerNumber)
    );
  }

  /**
   * Convert LED state to command bytes
   * @param ledState LED state object
   * @returns Command byte array
   */
  static ledStateToCommand(ledState: BuzzerLedState): number[] {
    return [
      0x00, // Header
      0x00, // Header
      ledState[0] ? 0xff : 0x00,
      ledState[1] ? 0xff : 0x00,
      ledState[2] ? 0xff : 0x00,
      ledState[3] ? 0xff : 0x00,
    ];
  }

  /**
   * Create LED state from buzzer numbers
   * @param buzzerNumbers Array of buzzer numbers (1-4)
   * @returns LED state object
   */
  static createLedState(buzzerNumbers: number[]): BuzzerLedState {
    const validNumbers = buzzerNumbers.filter(this.isValidBuzzerNumber);

    return {
      0: validNumbers.includes(1),
      1: validNumbers.includes(2),
      2: validNumbers.includes(3),
      3: validNumbers.includes(4),
    };
  }
}
