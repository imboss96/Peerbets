import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class FlyGameAdminService {
  constructor() {
    this.db = null;
  }

  async initDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  // Get current crash series config
  async getCrashSeriesConfig() {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'flyGameConfig');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        return { success: true, data: configSnap.data() };
      } else {
        // Create default config
        const defaultConfig = {
          crashSeries: this.generateRandomSeries(20),
          currentGameIndex: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(configRef, defaultConfig);
        return { success: true, data: defaultConfig };
      }
    } catch (err) {
      console.error('getCrashSeriesConfig error:', err);
      return { success: false, error: err.message };
    }
  }

  // Update entire crash series
  async updateCrashSeries(crashSeries, updatedBy) {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'flyGameConfig');

      await setDoc(configRef, {
        crashSeries: crashSeries,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      }, { merge: true });

      return { success: true, message: 'Crash series updated' };
    } catch (err) {
      console.error('updateCrashSeries error:', err);
      return { success: false, error: err.message };
    }
  }

  // Set next single crash value (quick test)
  async setNextCrash(crashValue, updatedBy) {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'flyGameConfig');
      const configSnap = await getDoc(configRef);

      if (!configSnap.exists()) {
        return { success: false, error: 'Config not found' };
      }

      const currentData = configSnap.data();
      const series = currentData.crashSeries || [];
      const nextIndex = currentData.currentGameIndex % series.length;

      // Update the next crash in the series
      series[nextIndex] = parseFloat(crashValue);

      await setDoc(configRef, {
        crashSeries: series,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy,
        lastManualCrash: crashValue,
        lastManualCrashTime: new Date().toISOString()
      }, { merge: true });

      // Log admin action
      await this.logAdminAction('SET_NEXT_CRASH', {
        crashValue,
        gameIndex: nextIndex,
        updatedBy
      });

      return { success: true, message: `Next crash set to ${crashValue}x`, gameIndex: nextIndex };
    } catch (err) {
      console.error('setNextCrash error:', err);
      return { success: false, error: err.message };
    }
  }

  // Generate random crash series
  generateRandomSeries(count = 20, minCrash = 1.01, maxCrash = 100) {
    return Array(count).fill(0).map(() =>
      Number((minCrash + Math.random() * (maxCrash - minCrash)).toFixed(2))
    );
  }

  // Reset to game index 0
  async resetGameIndex(updatedBy) {
    try {
      await this.initDb();
      const configRef = doc(this.db, 'admin', 'flyGameConfig');

      await setDoc(configRef, {
        currentGameIndex: 0,
        updatedAt: new Date().toISOString(),
        updatedBy: updatedBy
      }, { merge: true });

      await this.logAdminAction('RESET_GAME_INDEX', { updatedBy });

      return { success: true, message: 'Game index reset to 0' };
    } catch (err) {
      console.error('resetGameIndex error:', err);
      return { success: false, error: err.message };
    }
  }

  // Generate and set new crash series
  async generateNewSeries(count = 20, updatedBy) {
    try {
      const newSeries = this.generateRandomSeries(count);
      const result = await this.updateCrashSeries(newSeries, updatedBy);

      if (result.success) {
        await this.logAdminAction('GENERATE_NEW_SERIES', {
          seriesLength: count,
          updatedBy
        });
      }

      return result;
    } catch (err) {
      console.error('generateNewSeries error:', err);
      return { success: false, error: err.message };
    }
  }

  // Log admin action for audit trail
  async logAdminAction(action, details) {
    try {
      await this.initDb();
      const logsRef = collection(this.db, 'admin/flyGameConfig/actionLogs');

      await addDoc(logsRef, {
        action,
        details,
        timestamp: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('logAdminAction error:', err);
    }
  }

  // Get admin action logs
  async getAdminLogs(limit = 50) {
    try {
      await this.initDb();
      const logsRef = collection(this.db, 'admin/flyGameConfig/actionLogs');
      const q = query(logsRef);
      const snapshot = await getDocs(q);

      const logs = [];
      snapshot.forEach(doc => {
        logs.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, data: logs.slice(-limit) };
    } catch (err) {
      console.error('getAdminLogs error:', err);
      return { success: false, error: err.message };
    }
  }
}

export default new FlyGameAdminService();