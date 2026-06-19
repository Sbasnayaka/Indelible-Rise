// js/streak-utils.js
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Update streak for a user based on their last played date
 * Returns the updated streak count
 */
export async function updateUserStreak(userId, db) {
    if (!userId) return 0;
    
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return 0;
        
        const userData = userSnap.data();
        const lastPlayed = userData.lastPlayedDate;
        const currentStreak = userData.streak || 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let newStreak = currentStreak;
        
        // If never played before, start streak at 1
        if (!lastPlayed) {
            newStreak = 1;
        } else {
            // Convert Firestore timestamp to Date
            const lastDate = lastPlayed.toDate ? lastPlayed.toDate() : new Date(lastPlayed);
            lastDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                // Same day – keep streak unchanged
                newStreak = currentStreak;
            } else if (diffDays === 1) {
                // Consecutive day – increment streak
                newStreak = currentStreak + 1;
            } else {
                // Gap > 1 day – reset streak to 1
                newStreak = 1;
            }
        }
        
        // Update Firestore with new streak and today's date
        await updateDoc(userRef, {
            streak: newStreak,
            lastPlayedDate: today
        });
        
        return newStreak;
        
    } catch (error) {
        console.error('Error updating streak:', error);
        return 0;
    }
}