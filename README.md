# Modern Node Buzzers

A modern Node.js TypeScript library for interfacing with Buzz! controllers via HID communication.
Library inspired by [buzz-buzzers](https://github.com/functino/buzz-buzzers) and [node-buzzers](https://github.com/francoismassart/node-buzzers).

## Features

- 🎮 Detect and connect to Buzz! controllers automatically
- 🔘 Handle button press/release events with detailed mapping
- 💡 Control individual buzzer LED patterns and states
- 🔌 USB HID device enumeration and management
- 📦 Full TypeScript support with comprehensive type definitions
- 🧪 Extensive test coverage with Jest
- ⚡ Modern ES modules and CommonJS dual export support
- 🛡️ Zero-indexed buzzer addressing (buzzers 0-3)

## Installation

```bash
npm install modern-node-buzzers
```

## Quick Start

```typescript
import {
  detectBuzzControllers,
  BuzzControllerInstance,
  BuzzLedPatterns,
  waitForBuzzController,
} from 'modern-node-buzzers';

// Detect available Buzz controllers
const controllers = detectBuzzControllers();

if (controllers.length > 0) {
  const controller = new BuzzControllerInstance(controllers[0]);

  if (controller.connect()) {
    console.log('Connected to Buzz controller');

    // Set up button event listeners
    controller.on('buttonPress', (event) => {
      console.log(`Buzzer ${event.buzzerIndex} pressed ${event.buttonName}`);

      // Light up the buzzer that was pressed
      controller.setBuzzerLed(event.buzzerIndex, true);
    });

    controller.on('buttonRelease', (event) => {
      console.log(`Buzzer ${event.buzzerIndex} released ${event.buttonName}`);

      // Turn off the LED when button is released
      controller.setBuzzerLed(event.buzzerIndex, false);
    });

    // Start listening for button events
    controller.startButtonLogging();

    // Set a custom LED pattern
    controller.setLedPattern(BuzzLedPatterns.ALTERNATING);
  }
}

// Alternative: Wait for a controller to be connected
async function waitForController() {
  try {
    const controller = await waitForBuzzController();
    console.log('Buzz controller connected!');
    // ... use controller
  } catch (error) {
    console.error('No controller found or connection failed');
  }
}
```

## API Reference

### Core Functions

#### `detectBuzzControllers(): BuzzController[]`
Detects all connected Buzz! controllers and returns an array of controller objects.

#### `listUsbDevices(): UsbDevice[]`
Lists all USB HID devices connected to the system.

#### `waitForBuzzController(timeout?: number): Promise<BuzzControllerInstance>`
Waits for a Buzz! controller to be connected and returns a ready-to-use instance.

### BuzzControllerInstance Class

The main class for interacting with Buzz! controllers.

#### Constructor
```typescript
new BuzzControllerInstance(controller: BuzzController)
```

#### Methods

- `connect(): boolean` - Establish connection to the controller
- `disconnect(): void` - Close the connection
- `startButtonLogging(): void` - Begin monitoring button events
- `stopButtonLogging(): void` - Stop monitoring button events
- `setBuzzerLed(buzzerIndex: number, state: boolean): void` - Control individual buzzer LEDs (0-3)
- `setLedPattern(pattern: BuzzLedPatterns): void` - Set predefined LED patterns
- `setAllBuzzersLed(state: boolean): void` - Control all buzzer LEDs simultaneously

#### Events

- `'buttonPress'` - Emitted when any button is pressed
- `'buttonRelease'` - Emitted when any button is released
- `'connect'` - Emitted when controller connects
- `'disconnect'` - Emitted when controller disconnects

### Button Handling

#### `parseButtonPress(data: Buffer): ButtonPressEvent | null`
Parse raw HID data into button press events.

#### `formatButtonPressEvent(event: ButtonPressEvent): string`
Format button press events into human-readable strings.

#### `getButtonName(buzzerIndex: number, buttonMask: number): string`
Get human-readable button names from buzzer index and button mask.

#### `isValidButtonPress(data: Buffer): boolean`
Validate if HID data represents a valid button press.

### LED Control

#### `BuzzLedPatterns`
Predefined LED patterns:
- `ALL_OFF` - All LEDs off
- `ALL_ON` - All LEDs on
- `ALTERNATING` - Alternating pattern
- `SEQUENTIAL` - Sequential lighting pattern

#### `BuzzControllerUtils`
Utility functions for advanced controller operations.

### Types

#### `ButtonPressEvent`
```typescript
interface ButtonPressEvent {
  buzzerIndex: number;      // 0-3
  buttonName: string;       // e.g., "red", "yellow", "green", "blue", "buzz"
  buttonMask: number;       // Raw button bitmask
  action: ButtonAction;     // "press" | "release"
  timestamp: number;        // Event timestamp
}
```

#### `BuzzController`
```typescript
interface BuzzController {
  vendorId: number;
  productId: number;
  path: string;
  manufacturer?: string;
  product?: string;
  serialNumber?: string;
}
```

## Development

```bash
# Install dependencies
npm install

# Start development mode with watch
npm run dev

# Build the project
npm run build

# Clean build artifacts
npm run clean

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Lint and fix issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run typecheck

# Prepare for publishing
npm run prepublishOnly

# Create release
npm run release
```

### Project Structure

```
src/
├── index.ts                     # Main entry point and exports
├── hid-communication.ts         # USB HID device detection and communication
├── buzz-controller-operations.ts # Controller class and LED operations
├── button-mapping.ts            # Button event parsing and formatting
└── buzzers-database.ts          # Buzzer device definitions
```

## Examples

### Basic Quiz Game

```typescript
import { detectBuzzControllers, BuzzControllerInstance } from 'modern-node-buzzers';

class QuizGame {
  private controller: BuzzControllerInstance | null = null;
  private currentQuestion = 0;
  private scores = [0, 0, 0, 0]; // Scores for buzzers 0-3

  async initialize() {
    const controllers = detectBuzzControllers();
    if (controllers.length === 0) {
      throw new Error('No Buzz controller found');
    }

    this.controller = new BuzzControllerInstance(controllers[0]);
    if (!this.controller.connect()) {
      throw new Error('Failed to connect to controller');
    }

    // Set up event listeners
    this.controller.on('buttonPress', (event) => {
      if (event.buttonName === 'buzz') {
        this.handleBuzzerPress(event.buzzerIndex);
      }
    });

    this.controller.startButtonLogging();
    console.log('Quiz game initialized!');
  }

  private handleBuzzerPress(buzzerIndex: number) {
    console.log(`Player ${buzzerIndex + 1} buzzed in!`);

    // Light up the buzzer that pressed first
    this.controller?.setBuzzerLed(buzzerIndex, true);

    // Award point
    this.scores[buzzerIndex]++;

    // Reset after 3 seconds
    setTimeout(() => {
      this.controller?.setBuzzerLed(buzzerIndex, false);
    }, 3000);
  }

  getScores() {
    return this.scores.map((score, index) => ({
      player: index + 1,
      score
    }));
  }
}
```

### LED Light Show

```typescript
import {
  detectBuzzControllers,
  BuzzControllerInstance,
  BuzzLedPatterns
} from 'modern-node-buzzers';

async function runLightShow() {
  const controllers = detectBuzzControllers();
  if (controllers.length === 0) return;

  const controller = new BuzzControllerInstance(controllers[0]);
  if (!controller.connect()) return;

  // Cycle through different patterns
  const patterns = [
    BuzzLedPatterns.ALL_ON,
    BuzzLedPatterns.ALTERNATING,
    BuzzLedPatterns.SEQUENTIAL,
    BuzzLedPatterns.ALL_OFF,
  ];

  for (const pattern of patterns) {
    controller.setLedPattern(pattern);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Individual buzzer control
  for (let i = 0; i < 4; i++) {
    controller.setBuzzerLed(i, true);
    await new Promise(resolve => setTimeout(resolve, 250));
    controller.setBuzzerLed(i, false);
  }
}
```

## Requirements

- Node.js >= 18.0.0
- USB HID support (node-hid)

## License

MIT

## Repository

[GitHub Repository](https://github.com/Laryan1/modern-node-buzzers)
