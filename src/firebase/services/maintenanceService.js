import { db } from '../config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

class MaintenanceService {
  static maintenanceUnsubscribe = null;

  // Get maintenance status
  static async getMaintenanceStatus() {
    try {
      const maintenanceRef = doc(db, 'system', 'maintenance');
      const maintenanceDoc = await getDoc(maintenanceRef);

      if (maintenanceDoc.exists()) {
        return {
          success: true,
          isActive: maintenanceDoc.data().isActive || false,
          message: maintenanceDoc.data().message || 'We are performing scheduled maintenance. Please check back soon.',
          estimatedTime: maintenanceDoc.data().estimatedTime || null,
          startedAt: maintenanceDoc.data().startedAt?.toDate?.() || new Date()
        };
      }

      return {
        success: true,
        isActive: false,
        message: '',
        estimatedTime: null
      };
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      return { success: false, isActive: false };
    }
  }

  // Enable maintenance mode
  static async enableMaintenanceMode(message = '', estimatedTime = null) {
    try {
      const maintenanceRef = doc(db, 'system', 'maintenance');
      await setDoc(maintenanceRef, {
        isActive: true,
        message: message || 'We are performing scheduled maintenance. Please check back soon.',
        estimatedTime: estimatedTime,
        startedAt: new Date(),
        enabledBy: 'admin'
      });
      return { success: true };
    } catch (error) {
      console.error('Error enabling maintenance mode:', error);
      return { success: false, error: error.message };
    }
  }

  // Disable maintenance mode
  static async disableMaintenanceMode() {
    try {
      const maintenanceRef = doc(db, 'system', 'maintenance');
      await setDoc(maintenanceRef, {
        isActive: false,
        disabledAt: new Date()
      });
      return { success: true };
    } catch (error) {
      console.error('Error disabling maintenance mode:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time listener for maintenance status
  static subscribeToMaintenanceStatus(callback) {
    const maintenanceRef = doc(db, 'system', 'maintenance');
    this.maintenanceUnsubscribe = onSnapshot(maintenanceRef, (doc) => {
      if (doc.exists()) {
        callback({
          isActive: doc.data().isActive || false,
          message: doc.data().message || '',
          estimatedTime: doc.data().estimatedTime,
          startedAt: doc.data().startedAt?.toDate?.() || new Date()
        });
      } else {
        callback({
          isActive: false,
          message: '',
          estimatedTime: null
        });
      }
    });

    return this.maintenanceUnsubscribe;
  }

  // Unsubscribe from maintenance status
  static unsubscribeFromMaintenanceStatus() {
    if (this.maintenanceUnsubscribe) {
      this.maintenanceUnsubscribe();
    }
  }
}

export default MaintenanceService;