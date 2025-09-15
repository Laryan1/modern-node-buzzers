# Modern Node Buzzers

A modern Node.js TypeScript library for interfacing with Buzz! controllers via HID communication.

## Features

- 🎮 Detect and connect to Buzz controllers
- 🔘 Handle button press events with detailed mapping
- 💡 Control LED patterns and states
- 🔌 USB device enumeration and management
- 📦 Full TypeScript support with type definitions
- 🧪 Comprehensive test coverage

## Installation

```bash
npm install modern-node-buzzers
```

## Quick Start

```typescript
import {
  detectBuzzControllers,
  BuzzControllerInstance,
} from 'modern-node-buzzers';

// Detect available Buzz controllers
const controllers = detectBuzzControllers();

if (controllers.length > 0) {
  const controller = new BuzzControllerInstance(controllers[0]);

  if (controller.connect()) {
    console.log('Connected to Buzz controller');

    // Start listening for button presses
    controller.startButtonLogging();
  }
}
```

## API Reference

### Core Functions

- `detectBuzzControllers()` - Detect connected Buzz controllers
- `listUsbDevices()` - List all USB HID devices
- `BuzzControllerInstance` - Main controller class for device interaction

### Button Handling

- `parseButtonPress()` - Parse raw button data
- `formatButtonPressEvent()` - Format button events
- `getButtonName()` - Get human-readable button names

### LED Control

- `BuzzLedPatterns` - Predefined LED patterns
- `BuzzControllerUtils` - Utility functions for controller operations

## Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Run tests
npm test

# Build the project
npm run build

# Lint and format
npm run lint
npm run format
```

## Requirements

- Node.js >= 18.0.0
- USB HID support (node-hid)

## License

MIT

## Repository

[GitHub Repository](https://github.com/Laryan1/modern-node-buzzers)
