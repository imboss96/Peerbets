import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc,
  updateDoc,
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';

export class BetsService {
  /**
   * Place a new bet
   */
  static async placeBet(betData) {
    try {
      const bet = {
        ...betData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'bets'), bet);
      
      return { 
        success: true, 
        betId: docRef.id 
      };
    } catch (error) {
      console.error('Error placing bet:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Get user's active bets
   */
  static async getUserBets(userId) {
    try {
      const q = query(
        collection(db, 'bets'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'live']),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bets = [];
      
      querySnapshot.forEach((doc) => {
        bets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { 
        success: true, 
        bets 
      };
    } catch (error) {
      console.error('Error fetching bets:', error);
      return { 
        success: false, 
        error: error.message,
        bets: [] 
      };
    }
  }

  /**
   * Get all user bets (including settled)
   */
  static async getAllUserBets(userId) {
    try {
      const q = query(
        collection(db, 'bets'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bets = [];
      
      querySnapshot.forEach((doc) => {
        bets.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { 
        success: true, 
        bets 
      };
    } catch (error) {
      console.error('Error fetching all bets:', error);
      return { 
        success: false, 
        error: error.message,
        bets: [] 
      };
    }
  }

  /**
   * Update bet status
   */
  static async updateBetStatus(betId, status, result = null) {
    try {
      const updateData = {
        status: status,
        updatedAt: serverTimestamp()
      };
      
      if (result) {
        updateData.result = result;
        updateData.settledAt = serverTimestamp();
      }
      
      await updateDoc(doc(db, 'bets', betId), updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating bet:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}
