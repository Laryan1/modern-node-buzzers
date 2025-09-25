import {
  parseButtonPress,
  formatButtonPressEvent,
  formatButtonEvent,
  getButtonName,
  isValidButtonPress,
  ButtonAction,
  BUTTON_NAMES,
} from '../src/button-mapping';
import {
  BuzzLedPatterns,
  BuzzControllerUtils,
} from '../src/buzz-controller-operations';

describe('Button Mapping', () => {
  describe('parseButtonPress', () => {
    it('should return null for invalid buffer length', () => {
      const result = parseButtonPress(Buffer.from([0, 0, 1]));
      expect(result).toBeNull();
    });

    it('should parse controller 1 red button press', () => {
      // Reset button state first by calling with empty buffer
      parseButtonPress(Buffer.from([0, 0, 0, 0, 240]));

      const data = Buffer.from([0, 0, 1, 0, 240]); // Controller 1, red button
      const result = parseButtonPress(data);
      expect(result).toBeTruthy();
      if (result) {
        expect(result[0]).toMatchObject({
          controller: 0,
          button: 0,
          buttonName: 'Red Buzzer',
          action: 'pressed'
        });
      }
    });

    it('should parse controller 1 blue button press', () => {
      // Reset button state first by calling with empty buffer
      parseButtonPress(Buffer.from([0, 0, 0, 0, 240]));

      const data = Buffer.from([0, 0, 16, 0, 240]); // Controller 1, blue button
      const result = parseButtonPress(data);
      expect(result).toBeTruthy();
      if (result) {
        expect(result[0]).toMatchObject({
          controller: 0,
          button: 1,
          buttonName: 'Blue',
          action: 'pressed'
        });
      }
    });

    it('should handle button release events', () => {
      // Reset state first
      parseButtonPress(Buffer.from([0, 0, 0, 0, 240]));
      // First press
      parseButtonPress(Buffer.from([0, 0, 1, 0, 240]));
      // Then release (no buttons pressed)
      const result = parseButtonPress(Buffer.from([0, 0, 0, 0, 240]));
      expect(result).toBeTruthy();
      if (result) {
        expect(result[0]).toMatchObject({
          controller: 0,
          button: 0,
          buttonName: 'Red Buzzer',
          action: 'released'
        });
      }
    });
  });

  describe('isValidButtonPress', () => {
    it('should return false for empty buffer', () => {
      expect(isValidButtonPress(Buffer.from([]))).toBe(false);
    });

    it('should return false for no button press', () => {
      expect(isValidButtonPress(Buffer.from([0, 0, 0, 0, 240]))).toBe(false);
    });

    it('should return true for valid button press', () => {
      expect(isValidButtonPress(Buffer.from([0, 0, 1, 0, 240]))).toBe(true);
    });
  });

  describe('getButtonName', () => {
    it('should return correct button names', () => {
      expect(getButtonName(0)).toBe('Red Buzzer');
      expect(getButtonName(1)).toBe('Blue');
      expect(getButtonName(2)).toBe('Orange');
      expect(getButtonName(3)).toBe('Green');
      expect(getButtonName(4)).toBe('Yellow');
    });

    it('should return fallback name for unknown button', () => {
      expect(getButtonName(99)).toBe('Button 99');
    });
  });

  describe('formatButtonPressEvent', () => {
    it('should format button press event correctly', () => {
      const event = {
        controller: 0,
        button: 0,
        buttonName: 'Red Buzzer',
        timestamp: Date.now()
      };
      const formatted = formatButtonPressEvent(event);
      expect(formatted).toBe('Controller 0 - Red Buzzer (Button 0)');
    });
  });

  describe('formatButtonEvent', () => {
    it('should format button event correctly', () => {
      const event = {
        controller: 0,
        button: 0,
        buttonName: 'Red Buzzer',
        action: 'pressed' as const,
        timestamp: Date.now()
      };
      const formatted = formatButtonEvent(event);
      expect(formatted).toBe('Controller 0 - Red Buzzer pressed (Button 0)');
    });
  });

  describe('ButtonAction constants', () => {
    it('should have correct action constants', () => {
      expect(ButtonAction.PRESSED).toBe('pressed');
      expect(ButtonAction.RELEASED).toBe('released');
    });
  });

  describe('BUTTON_NAMES constants', () => {
    it('should have all button names defined', () => {
      expect(BUTTON_NAMES[0]).toBe('Red Buzzer');
      expect(BUTTON_NAMES[1]).toBe('Blue');
      expect(BUTTON_NAMES[2]).toBe('Orange');
      expect(BUTTON_NAMES[3]).toBe('Green');
      expect(BUTTON_NAMES[4]).toBe('Yellow');
    });
  });
});

describe('Buzz Controller Operations', () => {
  describe('BuzzLedPatterns', () => {
    it('should have static pattern methods', () => {
      expect(typeof BuzzLedPatterns.playerReady).toBe('function');
      expect(typeof BuzzLedPatterns.countdown).toBe('function');
      expect(typeof BuzzLedPatterns.winner).toBe('function');
      expect(typeof BuzzLedPatterns.allActive).toBe('function');
      expect(typeof BuzzLedPatterns.allOff).toBe('function');
      expect(typeof BuzzLedPatterns.alternating).toBe('function');
    });

    it('should generate player ready pattern correctly', () => {
      const pattern1 = BuzzLedPatterns.playerReady(1);
      const pattern2 = BuzzLedPatterns.playerReady(2);
      expect(pattern1).toEqual({ 0: true, 1: false, 2: false, 3: false });
      expect(pattern2).toEqual({ 0: false, 1: true, 2: false, 3: false });
    });

    it('should generate countdown pattern correctly', () => {
      const pattern1 = BuzzLedPatterns.countdown(1);
      const pattern3 = BuzzLedPatterns.countdown(3);
      expect(pattern1).toEqual({ 0: true, 1: false, 2: false, 3: false });
      expect(pattern3).toEqual({ 0: true, 1: true, 2: true, 3: false });
    });

    it('should generate all active pattern', () => {
      const pattern = BuzzLedPatterns.allActive();
      expect(pattern).toEqual({ 0: true, 1: true, 2: true, 3: true });
    });

    it('should generate all off pattern', () => {
      const pattern = BuzzLedPatterns.allOff();
      expect(pattern).toEqual({ 0: false, 1: false, 2: false, 3: false });
    });

    it('should generate alternating patterns', () => {
      const evenPattern = BuzzLedPatterns.alternating(true);
      const oddPattern = BuzzLedPatterns.alternating(false);
      expect(evenPattern).toEqual({ 0: false, 1: true, 2: false, 3: true });
      expect(oddPattern).toEqual({ 0: true, 1: false, 2: true, 3: false });
    });

    it('should make winner pattern same as player ready', () => {
      const winnerPattern = BuzzLedPatterns.winner(2);
      const playerPattern = BuzzLedPatterns.playerReady(2);
      expect(winnerPattern).toEqual(playerPattern);
    });
  });

  describe('BuzzControllerUtils', () => {
    it('should have utility functions', () => {
      expect(typeof BuzzControllerUtils.isValidBuzzerNumber).toBe('function');
      expect(typeof BuzzControllerUtils.ledStateToCommand).toBe('function');
      expect(typeof BuzzControllerUtils.createLedState).toBe('function');
    });

    it('should validate buzzer numbers correctly', () => {
      expect(BuzzControllerUtils.isValidBuzzerNumber(1)).toBe(true);
      expect(BuzzControllerUtils.isValidBuzzerNumber(4)).toBe(true);
      expect(BuzzControllerUtils.isValidBuzzerNumber(0)).toBe(false);
      expect(BuzzControllerUtils.isValidBuzzerNumber(5)).toBe(false);
      expect(BuzzControllerUtils.isValidBuzzerNumber(1.5)).toBe(false);
    });

    it('should convert LED state to command bytes', () => {
      const ledState = { 0: true, 1: false, 2: true, 3: false };
      const command = BuzzControllerUtils.ledStateToCommand(ledState);
      expect(command).toEqual([0x00, 0x00, 0xff, 0x00, 0xff, 0x00]);
    });

    it('should create LED state from buzzer numbers', () => {
      const ledState = BuzzControllerUtils.createLedState([1, 3]);
      expect(ledState).toEqual({ 0: true, 1: false, 2: true, 3: false });
    });

    it('should filter invalid buzzer numbers when creating LED state', () => {
      const ledState = BuzzControllerUtils.createLedState([1, 0, 3, 5]);
      expect(ledState).toEqual({ 0: true, 1: false, 2: true, 3: false });
    });
  });
});

describe('Module Exports', () => {
  it('should export all required functions', () => {
    expect(parseButtonPress).toBeDefined();
    expect(formatButtonPressEvent).toBeDefined();
    expect(formatButtonEvent).toBeDefined();
    expect(getButtonName).toBeDefined();
    expect(isValidButtonPress).toBeDefined();
    expect(ButtonAction).toBeDefined();
  });

  it('should export buzz controller operations', () => {
    expect(BuzzLedPatterns).toBeDefined();
    expect(BuzzControllerUtils).toBeDefined();
  });
});