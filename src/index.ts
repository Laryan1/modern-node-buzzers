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
import { setInterval } from 'timers';

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

let blinkLedsInterval: ReturnType<typeof setInterval> | null = null;

let blinkEveryOtherLedInterval: ReturnType<typeof setInterval> | null = null;

let binaryCountingInterval: ReturnType<typeof setInterval> | null = null;
let binaryCounter = 0;

export function helloWorld(): string {
  return 'Hello World';
}

function startBlinkAllLeds(controllerInstance: BuzzControllerInstance): void {
  stopBlinkAllLeds(controllerInstance);
  controllerInstance.lightAllLeds();
  setTimeout(() => {
    if (blinkLedsInterval) controllerInstance.turnOffAllLeds();
  }, 250);
  blinkLedsInterval = setInterval(() => {
    controllerInstance.lightAllLeds();
    setTimeout(() => controllerInstance.turnOffAllLeds(), 250);
  }, 500);
}

function stopBlinkAllLeds(controllerInstance: BuzzControllerInstance): void {
  if (blinkLedsInterval) {
    controllerInstance.turnOffAllLeds();
    blinkLedsInterval.close();
    blinkLedsInterval = null;
  }
}

function startBlinkEveryOtherLed(
  controllerInstance: BuzzControllerInstance
): void {
  stopBlinkEveryOtherLed(controllerInstance);
  controllerInstance.lightSpecificBuzzers([1, 3]);
  setTimeout(() => {
    if (blinkEveryOtherLedInterval)
      controllerInstance.lightSpecificBuzzers([2, 4]);
  }, 250);
  blinkEveryOtherLedInterval = setInterval(() => {
    controllerInstance.lightSpecificBuzzers([1, 3]);
    setTimeout(() => controllerInstance.lightSpecificBuzzers([2, 4]), 250);
  }, 500);
}

function stopBlinkEveryOtherLed(
  controllerInstance: BuzzControllerInstance
): void {
  if (blinkEveryOtherLedInterval) {
    controllerInstance.turnOffAllLeds();
    blinkEveryOtherLedInterval.close();
    blinkEveryOtherLedInterval = null;
  }
}

function startBinaryLightCounting(
  controllerInstance: BuzzControllerInstance
): void {
  stopBinaryLightCounting(controllerInstance);
  binaryCounter = 0;

  function updateBinaryLights(): void {
    controllerInstance.turnOffAllLeds();

    const buzzersToLight: number[] = [];
    for (let i = 0; i < 4; i++) {
      if (binaryCounter & (1 << i)) {
        buzzersToLight.push(i + 1);
      }
    }

    if (buzzersToLight.length > 0) {
      controllerInstance.lightSpecificBuzzers(buzzersToLight);
    }

    binaryCounter = (binaryCounter + 1) % 16;
  }

  updateBinaryLights();
  binaryCountingInterval = setInterval(updateBinaryLights, 250);
}

function stopBinaryLightCounting(
  controllerInstance: BuzzControllerInstance
): void {
  binaryCounter = 0;
  if (binaryCountingInterval) {
    controllerInstance.turnOffAllLeds();
    binaryCountingInterval.close();
    binaryCountingInterval = null;
  }
}

const eventToFunctionMapping: {
  [key: string]: {
    [key: string]: {
      pressed?: (controllerInstance: BuzzControllerInstance) => void;
      released?: (controllerInstance: BuzzControllerInstance) => void;
    };
  };
} = {
  1: {
    0: {
      [ButtonAction.PRESSED]: startBlinkAllLeds,
      [ButtonAction.RELEASED]: stopBlinkAllLeds,
    },
    1: {
      [ButtonAction.PRESSED]: startBlinkEveryOtherLed,
      [ButtonAction.RELEASED]: stopBlinkEveryOtherLed,
    },
  },
  2: {
    0: {
      [ButtonAction.PRESSED]: startBinaryLightCounting,
      [ButtonAction.RELEASED]: stopBinaryLightCounting,
    },
  },
  3: {
    0: {
      [ButtonAction.PRESSED]: startBlinkAllLeds,
    },
  },
  4: {
    0: {
      [ButtonAction.PRESSED]: stopBlinkAllLeds,
    },
  },
};

function onButtonEvent(
  events: ButtonEvent[],
  controllerInstance: BuzzControllerInstance
): void {
  console.warn(events);
  events.forEach(event => {
    const mappedFunction =
      eventToFunctionMapping[event.controller]?.[event.button]?.[event.action];
    console.warn('mappedFunction: ', mappedFunction);

    if (mappedFunction) mappedFunction(controllerInstance);
  });
}

console.log('Detecting Buzz Controllers...');
waitForBuzzController().then(buzzController => {
  const controllerInstance = new BuzzControllerInstance(buzzController);
  controllerInstance.connect();
  if (controllerInstance.isConnected()) {
    console.log('✓ Connected to Buzz controller');
    console.log('💡 Press any button on the Buzz controller to test!');
    console.log('   (Press Ctrl+C to exit)\n');

    // Start button listening with raw data logging
    controllerInstance.setupParsedButtonListeners(events =>
      onButtonEvent(events, controllerInstance)
    );
  } else {
    console.log('✗ Failed to connect to Buzz controller');
  }
});
