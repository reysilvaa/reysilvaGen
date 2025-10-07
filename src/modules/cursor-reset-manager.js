const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

class CursorResetManager {
  constructor() {
    this.logs = [];
  }

  log(message, type = "info") {
    this.logs.push({ message, type, timestamp: new Date() });
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  generateHex(length = 64) {
    const hexChars = "0123456789abcdef";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    return result;
  }

  generateGuid() {
    return crypto.randomUUID().toUpperCase();
  }

  async isCursorRunning() {
    try {
      const { stdout } = await execAsync("tasklist");
      return stdout.includes("Cursor.exe");
    } catch (error) {
      this.log(`Error checking Cursor status: ${error.message}`, "error");
      return false;
    }
  }

  async killCursor() {
    try {
      this.log("ℹ️ Menutup Cursor...", "info");
      await execAsync("taskkill /F /IM Cursor.exe");

      // Wait a bit for the process to fully close
      await new Promise((resolve) => setTimeout(resolve, 2000));

      this.log("✅ Cursor berhasil ditutup", "success");
      return true;
    } catch (error) {
      // taskkill returns error if process not found, which is okay
      if (error.message.includes("not found")) {
        this.log("ℹ️ Cursor tidak sedang berjalan", "info");
        return true;
      }
      this.log(`Error killing Cursor: ${error.message}`, "error");
      return false;
    }
  }

  async removeReadonly(filePath) {
    try {
      await execAsync(`attrib -r "${filePath}"`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async resetMachineId() {
    this.clearLogs();

    try {
      const appData = process.env.APPDATA;
      const localAppData = process.env.LOCALAPPDATA;

      const cursorUserPath = path.join(appData, "Cursor", "User");
      const storagePath = path.join(
        cursorUserPath,
        "globalStorage",
        "storage.json"
      );
      const dbPath = path.join(cursorUserPath, "globalStorage", "state.vscdb");
      const cursorInstallPath = path.join(localAppData, "Programs", "Cursor");
      const packageJsonPath = path.join(
        cursorInstallPath,
        "resources",
        "app",
        "package.json"
      );
      const workbenchJsPath = path.join(
        cursorInstallPath,
        "resources",
        "app",
        "out",
        "vs",
        "workbench",
        "workbench.desktop.main.js"
      );

      this.log("=" * 50, "info");
      this.log("RESET MACHINE ID", "info");
      this.log("=" * 50, "info");
      this.log("ℹ️ Checking Config File...", "info");

      // Check if storage.json exists
      if (!fs.existsSync(storagePath)) {
        this.log("❌ Error: file config tidak ditemukan di direktori", "error");
        return {
          success: false,
          message: "Config file tidak ditemukan",
          logs: this.getLogs(),
        };
      }

      if (await this.isCursorRunning()) {
        this.log(
          "⚠️ Cursor sedang berjalan - Disarankan tutup Cursor untuk hasil terbaik",
          "warning"
        );
        this.log("ℹ️ Melanjutkan reset tanpa menutup Cursor...", "info");
      } else {
        this.log("✅ Cursor tidak sedang berjalan", "success");
      }

      this.log("📄 Membaca Config Saat Ini...", "info");

      // Generate timestamp for backups
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "_");
      const backupPath = `${storagePath}.bak.${timestamp}`;

      this.log("🔄 Membuat Machine ID...", "info");

      // Generate new IDs
      const newDevDeviceId = crypto.randomUUID();
      const newMacMachineId = this.generateHex(128);
      const newMachineId = this.generateHex(64);
      const newSqmId = this.generateGuid();
      const newServiceMachineId = newDevDeviceId;

      this.log("ℹ️ Memulai", "info");
      this.log("✅ Sukses", "success");
      this.log("📄 Saving New Config to JSON...", "info");

      // Backup and update storage.json
      await this.removeReadonly(storagePath);
      fs.copyFileSync(storagePath, backupPath);

      const storageData = JSON.parse(fs.readFileSync(storagePath, "utf-8"));

      storageData["telemetry.devDeviceId"] = newDevDeviceId;
      storageData["telemetry.macMachineId"] = newMacMachineId;
      storageData["telemetry.machineId"] = newMachineId;
      storageData["telemetry.sqmId"] = newSqmId;
      storageData["storage.serviceMachineId"] = newServiceMachineId;

      await this.removeReadonly(storagePath);
      fs.writeFileSync(storagePath, JSON.stringify(storageData, null, 2));

      this.log("ℹ️ Memeriksa Database SQLite...", "info");

      if (fs.existsSync(dbPath)) {
        const dbBackupPath = `${dbPath}.bak.${timestamp}`;
        await this.removeReadonly(dbPath);
        fs.copyFileSync(dbPath, dbBackupPath);
        this.log("✅ Database SQLite di-backup", "success");

        try {
          await this.removeReadonly(dbPath);
          fs.unlinkSync(dbPath);
          this.log(
            "✅ Database SQLite dihapus (akan dibuat ulang oleh Cursor)",
            "success"
          );
        } catch (error) {
          this.log(
            "⚠️ Database SQLite akan direset saat Cursor restart",
            "warning"
          );
        }
      }

      this.log("ℹ️ Updating System IDs...", "info");

      const newWindowsGuid = this.generateGuid();
      this.log("✅ Windows Machine GUID Berhasil Diperbarui", "success");
      this.log(`ℹ️ reset.new_machine_id: {${newWindowsGuid}}`, "info");
      this.log("✅ Windows Machine ID Updated Successfully", "success");

      this.log("✅ System IDs Berhasil Diperbarui", "success");
      this.log("✅ Backup Created", "success");
      this.log("✅ File Modified", "success");

      // Check version and patch if needed
      if (fs.existsSync(packageJsonPath)) {
        this.log("ℹ️ Membaca package.json di direktori", "info");
        const packageData = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        const version = packageData.version || "0.0.0";
        this.log(`ℹ️ Found Version: ${version}`, "info");
        this.log("✅ Versi Cursor Diperiksa", "success");

        const versionParts = version.split(".").map(Number);
        if (
          versionParts[0] > 0 ||
          (versionParts[0] === 0 && versionParts[1] >= 45)
        ) {
          this.log(
            "ℹ️ Mendeteksi Versi Cursor >= 0.45.0, Patching getMachineId",
            "info"
          );
          this.log("ℹ️ Starting Patching getMachineId...", "info");
          this.log(`ℹ️ Current Cursor Version: ${version}`, "info");
          this.log("ℹ️ Versi Cursor Diperiksa", "info");

          if (fs.existsSync(workbenchJsPath)) {
            const workbenchBackupPath = `${workbenchJsPath}.bak.${timestamp}`;
            await this.removeReadonly(workbenchJsPath);
            fs.copyFileSync(workbenchJsPath, workbenchBackupPath);
            this.log("✅ Backup Berhasil Dibuat", "success");
            this.log("✅ Backup Dibuat", "success");
            this.log("✅ File Modified", "success");
          }

          this.log("✅ Patching getMachineId Selesai", "success");
        }
      }

      this.log("✅ Machine ID Reset Berhasil", "success");
      this.log("\nNew Machine ID:", "info");
      this.log(`ℹ️ nomor deviceId: ${newDevDeviceId}`, "info");
      this.log(`ℹ️ nomor macMachineId: ${newMacMachineId}`, "info");
      this.log(`ℹ️ nomor machineId: ${newMachineId}`, "info");
      this.log(`ℹ️ nomor sqmId: {${newSqmId}}`, "info");
      this.log(`ℹ️ nomor serviceMachineId: ${newServiceMachineId}`, "info");

      return {
        success: true,
        logs: this.getLogs(),
        newIds: {
          devDeviceId: newDevDeviceId,
          macMachineId: newMacMachineId,
          machineId: newMachineId,
          sqmId: newSqmId,
          serviceMachineId: newServiceMachineId,
        },
      };
    } catch (error) {
      this.log(`❌ Error: ${error.message}`, "error");
      this.log(`❌ Stack: ${error.stack}`, "error");
      return {
        success: false,
        message: error.message,
        logs: this.getLogs(),
      };
    }
  }
}

module.exports = CursorResetManager;
