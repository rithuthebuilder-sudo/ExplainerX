import { db } from '../firebase'; 
import { getDocFromServer, getDoc, doc, setDoc, addDoc, collection, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';

export interface EcosystemStats {
  cleardayEnergy: 'High' | 'Normal' | 'Low';
  disciplineLevel: number;
  streakCount: number;
  xpMultiplier: number;
}

// Fetch the user's central data & ritual levels
export const fetchEcosystemStats = async (userId: string): Promise<EcosystemStats> => {
  const stats: EcosystemStats = {
    cleardayEnergy: 'Normal',
    disciplineLevel: 1,
    streakCount: 0,
    xpMultiplier: 1.0
  };

  try {
    // 1. Fetch Clearday Rituals Info
    const ritualRef = doc(db, 'rituals', userId);
    const ritualSnap = await getDocFromServer(ritualRef).catch(() => getDoc(ritualRef));
    if (ritualSnap.exists()) {
      const ritualData = ritualSnap.data();
      stats.cleardayEnergy = ritualData.energyLevel || ritualData.energy || 'Normal';
    } else {
      // Fallback: Check if energy is stored directly in user profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        stats.cleardayEnergy = uData.energyLevel || uData.cleardayEnergy || 'Normal';
      }
    }

    // Apply Clearday multiplier
    if (stats.cleardayEnergy === 'Low') {
      stats.xpMultiplier = 0.5;
    } else if (stats.cleardayEnergy === 'High') {
      stats.xpMultiplier = 1.2;
    }

    // 2. Fetch GrindOS Levels
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      stats.disciplineLevel = userData.discipline_level || userData.disciplineLevel || userData.discipline || 1;
      stats.streakCount = userData.streak_count || userData.streakCount || userData.streak || 0;
    }
  } catch (error) {
    console.error('Failed to fetch Ecosystem metrics:', error);
  }

  return stats;
};

export const syncEcosystemUser = async (user: any, appName: string) => {
  if (!user) return;
  const docRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDocFromServer(docRef).catch(() => getDoc(docRef));
    const existingData = docSnap.exists() ? docSnap.data() : null;
    const appsUsed = existingData?.appsUsed || [];
    if (!appsUsed.includes(appName)) {
      appsUsed.push(appName);
    }
    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      lastActive: serverTimestamp(), // V2 Schema Requirement
      appsUsed: appsUsed
    }, { merge: true });
  } catch (error) {
    console.error('Ecosystem Sync Failed:', error);
  }
};

export const broadcastEcosystemActivity = async (
  user: any, 
  actionDescription: string, 
  baseXp: number, 
  skillKey: string,
  topic: string,
  subject: string
) => {
  if (!user) return null;
  
  try {
    // 1. Fetch current multipliers
    const stats = await fetchEcosystemStats(user.uid);
    const xpAwarded = Math.round(baseXp * stats.xpMultiplier);

    // 2. Format activity format according to StarVortex standard
    const action = `EXPLAINERX: ${actionDescription}`;
    
    // 3. Add to User's Activities collection
    const activitiesRef = collection(db, 'users', user.uid, 'activities');
    const docRef = await addDoc(activitiesRef, {
      userId: user.uid,
      action,
      metadata: {
        xpAwarded,
        skillKey,
        appName: 'ExplainerX',
        timestamp: new Date().toISOString(),
        topic,
        subject,
        cleardayEnergySync: stats.cleardayEnergy
      }
    });

    // 4. Update core user stats with XP directly if desired
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      total_xp: increment(xpAwarded),
      lastActive: serverTimestamp()
    }, { merge: true });

    return {
      id: docRef.id,
      xpAwarded,
      skillKey,
      action,
      cleardayEnergy: stats.cleardayEnergy
    };
  } catch (error) {
    console.error('Event Bus Broadcast Failed:', error);
    return null;
  }
};

export const trackActivity = async (user: any, type: 'view' | 'save', topic: string, subject: string) => {
  if (!user) return;
  const docRef = doc(db, 'users', user.uid);
  try {
    const updateData: any = {
      last_topic: topic,
      lastActive: serverTimestamp(),
      topics_covered: arrayUnion(topic),
      subjects_explored: arrayUnion(subject),
    };

    if (type === 'view') {
      updateData.total_views = increment(1);
    } else if (type === 'save') {
      updateData.explanations_created = increment(1);
    }

    await setDoc(docRef, updateData, { merge: true });

    // Broadcast to event bus!
    let actionDesc = '';
    let baseXp = 50;
    // Determine FireInk skill Key integration
    let skillKey = 'knowledge';
    const lowerSub = subject.toLowerCase();
    
    if (lowerSub.includes('history') || lowerSub.includes('literature') || lowerSub.includes('geography')) {
      skillKey = 'lore'; // Lore research converted to Knowledge points for GrindOS/FireInk
    } else if (lowerSub.includes('physics') || lowerSub.includes('chemistry') || lowerSub.includes('biology')) {
      skillKey = 'nature';
    } else if (lowerSub.includes('computer')) {
      skillKey = 'tech';
    }

    if (type === 'view') {
      actionDesc = `Explored topic on "${topic}"`;
      baseXp = 60;
    } else if (type === 'save') {
      actionDesc = `Saved and mastered comprehensive explanation for "${topic}"`;
      baseXp = 150;
    }

    return await broadcastEcosystemActivity(user, actionDesc, baseXp, skillKey, topic, subject);
  } catch (error) {
    console.error('Activity Tracking Failed:', error);
  }
};
