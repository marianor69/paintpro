import { BleManager, Device, State } from "react-native-ble-plx";
import { PermissionsAndroid, Platform, NativeModules } from "react-native";

// Bosch GLM 50C Bluetooth Protocol Constants
const BOSCH_SERVICE_UUID = "00005301-0000-0041-5253-534f46540000";
const BOSCH_TX_CHARACTERISTIC_UUID = "00004301-0000-0041-5253-534f46540000";
const BOSCH_RX_CHARACTERISTIC_UUID = "00004302-0000-0041-5253-534f46540000";

// Command to request a measurement
const MEASURE_COMMAND = new Uint8Array([0xc0, 0x40, 0x00, 0xee]);
// Command to enable auto-sync (device sends measurements automatically)
const AUTO_SYNC_ENABLE = new Uint8Array([0xc0, 0x55, 0x02, 0x01, 0x00, 0x1a]);

class BluetoothMeasurementService {
  private manager: BleManager | null = null;
  private connectedDevice: Device | null = null;
  private isAutoSyncEnabled: boolean = false;
  private initializationAttempted: boolean = false;

  constructor() {
    // Don't initialize BleManager in constructor to avoid NativeEventEmitter error
  }

  private async initializeManager(): Promise<BleManager> {
    if (this.manager) {
      return this.manager;
    }

    if (!this.initializationAttempted) {
      this.initializationAttempted = true;

      try {
        // Check if BleModule is available (it won't be in Expo Go)
        const BleModule = NativeModules.BleClientManager;
        if (!BleModule) {
          this.initializationAttempted = false; // Allow retry later
          throw new Error("Bluetooth is not available in Expo Go. This app requires a development build. Please reload the app or contact support.");
        }

        // Initialize BleManager
        this.manager = new BleManager();

        // Wait for the manager to be ready by checking its state
        const state = await this.manager.state();
        console.log("BleManager initialized successfully, state:", state);

      } catch (error: any) {
        this.initializationAttempted = false; // Allow retry
        this.manager = null;

        // Don't log to console.error to avoid cluttering the logs
        if (error.message?.includes("Expo Go")) {
          // This is expected in Expo Go, throw a user-friendly error
          throw new Error("Bluetooth requires a development build. The app needs to be rebuilt to support Bluetooth features.");
        }

        throw new Error(error.message || "Could not initialize Bluetooth module. Please restart the app and try again.");
      }
    }

    if (!this.manager) {
      throw new Error("Bluetooth initialization failed. Please restart the app.");
    }

    return this.manager;
  }

  private base64Encode(data: Uint8Array): string {
    // Convert Uint8Array to base64 for BLE transmission
    const binary = String.fromCharCode(...data);
    return btoa(binary);
  }

  private base64Decode(base64: string): Uint8Array {
    // Convert base64 to Uint8Array for reading BLE data
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return (
        granted["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    try {
      const manager = await this.initializeManager();
      const state = await manager.state();
      return state === State.PoweredOn;
    } catch (error) {
      console.error("Error checking Bluetooth state:", error);
      // If we can't check state, assume it's enabled and let scan fail if not
      return true;
    }
  }

  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    durationMs: number = 10000
  ): Promise<void> {
    const hasPermissions = await this.requestPermissions();
    if (!hasPermissions) {
      throw new Error("Bluetooth permissions not granted");
    }

    // Initialize manager here, at scan time, not earlier
    const manager = await this.initializeManager();

    // Check if Bluetooth is enabled
    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      throw new Error("Bluetooth is not enabled. Please enable Bluetooth in Settings.");
    }

    return new Promise((resolve, reject) => {
      try {
        manager.startDeviceScan(null, null, (error: any, device: Device | null) => {
          if (error) {
            console.error("Scan error:", error);
            manager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && device.name) {
            // Filter for Bosch laser devices
            if (
              device.name.toLowerCase().includes("bosch") ||
              device.name.toLowerCase().includes("glm") ||
              device.name.toLowerCase().includes("plr")
            ) {
              onDeviceFound(device);
            }
          }
        });

        setTimeout(() => {
          manager.stopDeviceScan();
          resolve();
        }, durationMs);
      } catch (error) {
        reject(error);
      }
    });
  }

  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const manager = await this.initializeManager();
      const device = await manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      // Enable auto-sync so the device sends measurements when triggered
      try {
        await device.writeCharacteristicWithResponseForService(
          BOSCH_SERVICE_UUID,
          BOSCH_TX_CHARACTERISTIC_UUID,
          this.base64Encode(AUTO_SYNC_ENABLE)
        );
        this.isAutoSyncEnabled = true;
        console.log("Auto-sync enabled on Bosch GLM 50C");
      } catch (error) {
        console.warn("Could not enable auto-sync, will use manual commands:", error);
        this.isAutoSyncEnabled = false;
      }

      return true;
    } catch (error) {
      console.error("Connection error:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      const manager = await this.initializeManager();
      await manager.cancelDeviceConnection(this.connectedDevice.id);
      this.connectedDevice = null;
      this.isAutoSyncEnabled = false;
    }
  }

  async getMeasurement(): Promise<number | null> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    try {
      // Send measurement request command to the Bosch GLM 50C
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        BOSCH_SERVICE_UUID,
        BOSCH_TX_CHARACTERISTIC_UUID,
        this.base64Encode(MEASURE_COMMAND)
      );

      // Wait a bit for the device to respond
      await new Promise(resolve => setTimeout(resolve, 500));

      // Read the measurement response from RX characteristic
      const characteristic = await this.connectedDevice.readCharacteristicForService(
        BOSCH_SERVICE_UUID,
        BOSCH_RX_CHARACTERISTIC_UUID
      );

      if (!characteristic.value) {
        throw new Error("No measurement data received");
      }

      // Decode the base64 response
      const responseData = this.base64Decode(characteristic.value);

      // Parse the measurement from bytes 7-11 as a float32 (little-endian)
      // Response format: [header bytes...] [distance as float32] [...]
      if (responseData.length < 11) {
        throw new Error("Invalid response length");
      }

      // Extract bytes 7-10 (4 bytes for float32)
      const distanceBytes = responseData.slice(7, 11);

      // Create a DataView to read the float32 value in little-endian format
      const dataView = new DataView(distanceBytes.buffer);
      const distanceMeters = dataView.getFloat32(0, true); // true = little-endian

      // Convert meters to feet
      const distanceFeet = distanceMeters * 3.28084;

      console.log(`Bosch GLM 50C measurement: ${distanceMeters.toFixed(3)}m = ${distanceFeet.toFixed(2)}ft`);

      return parseFloat(distanceFeet.toFixed(2));
    } catch (error) {
      console.error("Measurement error:", error);
      throw error;
    }
  }

  getConnectedDevice(): Device | null {
    return this.connectedDevice;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  destroy(): void {
    const manager = this.manager;
    if (manager) {
      manager.destroy();
    }
  }
}

// Lazy initialization to avoid NativeEventEmitter errors
let bluetoothServiceInstance: BluetoothMeasurementService | null = null;

export const bluetoothService = {
  getInstance(): BluetoothMeasurementService {
    if (!bluetoothServiceInstance) {
      bluetoothServiceInstance = new BluetoothMeasurementService();
    }
    return bluetoothServiceInstance;
  },

  async requestPermissions(): Promise<boolean> {
    return this.getInstance().requestPermissions();
  },

  async isBluetoothEnabled(): Promise<boolean> {
    return this.getInstance().isBluetoothEnabled();
  },

  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    durationMs: number = 10000
  ): Promise<void> {
    return this.getInstance().scanForDevices(onDeviceFound, durationMs);
  },

  async connectToDevice(deviceId: string): Promise<boolean> {
    return this.getInstance().connectToDevice(deviceId);
  },

  async disconnect(): Promise<void> {
    return this.getInstance().disconnect();
  },

  async getMeasurement(): Promise<number | null> {
    return this.getInstance().getMeasurement();
  },

  getConnectedDevice(): Device | null {
    return this.getInstance().getConnectedDevice();
  },

  isConnected(): boolean {
    return this.getInstance().isConnected();
  },

  destroy(): void {
    if (bluetoothServiceInstance) {
      bluetoothServiceInstance.destroy();
      bluetoothServiceInstance = null;
    }
  }
};
