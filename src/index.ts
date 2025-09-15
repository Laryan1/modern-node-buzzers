import {
  listUsbDevices,
  detectBuzzControllers,
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
} from './button-mapping';

// Re-export types and functions for public API
export type {
  UsbDevice,
  BuzzController,
  BuzzerLedState,
  ButtonPressEvent,
  ButtonEvent,
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
};

export function helloWorld(): string {
  return 'Hello World';
}

console.log('Detecting Buzz Controllers...');
const buzzControllers = detectBuzzControllers();

if (buzzControllers.length > 0) {
  console.log(`✓ Found ${buzzControllers.length} Buzz controller(s)`);

  const firstController = buzzControllers[0];
  if (firstController) {
    const controller = new BuzzControllerInstance(firstController);

    if (controller.connect()) {
      console.log('✓ Connected to Buzz controller');
      console.log('💡 Press any button on the Buzz controller to test!');
      console.log('   (Press Ctrl+C to exit)\n');

      // Start button listening with raw data logging
      controller.startButtonLogging(true);
    } else {
      console.log('✗ Failed to connect to Buzz controller');
    }
  }
} else {
  console.log('No Buzz controllers detected');
}
