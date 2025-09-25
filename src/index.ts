import {
  listUsbDevices,
  detectBuzzControllers,
  waitForBuzzController,
  UsbDevice,
  BuzzController,
} from './hid-communication';
import {
  BuzzControllerInstance,
  BuzzerLedState,
  BuzzLedPatterns,
  BuzzControllerUtils,
} from './buzz-controller-operations';
import {
  ButtonPressEvent,
  ButtonEvent,
  parseButtonPress,
  formatButtonPressEvent,
  formatButtonEvent,
  getButtonName,
  isValidButtonPress,
  ButtonAction,
} from './button-mapping';

// Re-export types and functions for public API
export type {
  UsbDevice,
  BuzzController,
  BuzzerLedState,
  ButtonPressEvent,
  ButtonEvent,
  ButtonAction,
};
export {
  listUsbDevices,
  detectBuzzControllers,
  BuzzControllerInstance,
  BuzzLedPatterns,
  BuzzControllerUtils,
  parseButtonPress,
  formatButtonPressEvent,
  formatButtonEvent,
  getButtonName,
  isValidButtonPress,
  waitForBuzzController,
};
