import { db } from '../firebase'; 
import { getDocFromServer, getDoc, doc, setDoc, addDoc, collection, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';

export interface EcosystemStats {
  disciplineLevel: number;
  streakCount: number;
  xpMultiplier: number;
  knowledgeScore: number;
  knowledgeAssets: number;
  displayName?: string;
  photoURL?: string;
  title?: string;
  rank?: string;
}

// Fetch the user's central data & active metrics
export const fetchEcosystemStats = async (userId: string): Promise<EcosystemStats> => {
  const stats: EcosystemStats = {
    disciplineLevel: 1,
    streakCount: 0,
    xpMultiplier: 1.0,
    knowledgeScore: 0,
    knowledgeAssets: 0
  };

  try {
    // Fetch user profile stats (the "Source of Truth" in GrindOS)
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      stats.disciplineLevel = userData.discipline_level || userData.disciplineLevel || userData.discipline || 1;
      stats.streakCount = userData.streak_count || userData.streakCount || userData.streak || 0;
      stats.knowledgeScore = userData.knowledge || userData.knowledge_score || 0;
      stats.knowledgeAssets = userData.knowledge_assets || userData.knowledgeAssets || userData.explanations_created || 0;
      
      // Passport Sync (Version 2.2): Retrieve from the user's central passport write-source
      stats.displayName = userData.displayName || userData.passport_displayName || userData.username || '';
      stats.photoURL = userData.photoURL || userData.passport_photoURL || userData.avatar || userData.avatarURL || '';
      stats.title = userData.title || userData.passport_title || userData.passportTitle || 'Ecosystem Novice';
      stats.rank = userData.rank || userData.passport_rank || userData.passportRank || '';
    }

    // Recalibrate/Re-balance Progression: Derive XP multiplier from active engagement elements (discipline, streak)
    // Up to 1.5x active multiplier
    stats.xpMultiplier = parseFloat((1.0 + Math.min(0.5, (stats.streakCount * 0.05) + ((stats.disciplineLevel - 1) * 0.02))).toFixed(2));
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
    
    // Protect custom displayName and photoURL set by StarVortex Passport (v2.2)
    const finalDisplayName = existingData?.displayName || existingData?.passport_displayName || user.displayName;
    const finalPhotoURL = existingData?.photoURL || existingData?.passport_photoURL || user.photoURL;

    await setDoc(docRef, {
      uid: user.uid,
      email: user.email,
      displayName: finalDisplayName,
      photoURL: finalPhotoURL,
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
        subject
      }
    });

    // 4. Update core user stats with XP directly and drive KNOWLEDGE attribute
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      total_xp: increment(xpAwarded),
      knowledge: increment(xpAwarded), // Direct feed into GrindOS KNOWLEDGE attribute!
      knowledge_assets: increment(1),  // Tracking ExplainerX learning assets
      lastActive: serverTimestamp()
    }, { merge: true });

    return {
      id: docRef.id,
      xpAwarded,
      skillKey,
      action,
      disciplineLevel: stats.disciplineLevel,
      streakCount: stats.streakCount
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
    // Determine Passport skill category mapped to action
    let skillKey = 'knowledge';
    const lowerSub = subject.toLowerCase();
    
    if (lowerSub.includes('history') || lowerSub.includes('literature') || lowerSub.includes('geography')) {
      skillKey = 'lore'; // Lore research mapped to cross-platform Knowledge and Lore attributes
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

// Check if user has an active record in physical passport collections
export const checkUserPassport = async (userId: string): Promise<boolean> => {
  try {
    const passportV1 = doc(db, 'passport', userId);
    const snapV1 = await getDocFromServer(passportV1).catch(() => getDoc(passportV1));
    if (snapV1.exists()) return true;

    const passportV2 = doc(db, 'passports', userId);
    const snapV2 = await getDocFromServer(passportV2).catch(() => getDoc(passportV2));
    if (snapV2.exists()) return true;

    // Check central user document profile attributes of passport
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDocFromServer(userDocRef).catch(() => getDoc(userDocRef));
    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      if (data.hasPassport || data.passportId || data.passport_displayName || data.passportRank || data.passportTitle) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Failed to verify central Passport status:', error);
    return false;
  }
};

// Create a developer-friendly Passport record to allow testing and previewing
export const createMockPassport = async (user: any): Promise<boolean> => {
  if (!user) return false;
  try {
    const passportV2 = doc(db, 'passports', user.uid);
    await setDoc(passportV2, {
      uid: user.uid,
      displayName: user.displayName || 'Vortex Nomad',
      photoURL: user.photoURL || '',
      email: user.email,
      title: 'Initiate Nomad',
      rank: 'Tier 1 Alpha',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, {
      hasPassport: true,
      passportId: `SV-${user.uid.substring(0,6).toUpperCase()}`,
      passport_displayName: user.displayName || 'Vortex Nomad',
      passport_photoURL: user.photoURL || '',
      title: 'Initiate Nomad',
      rank: 'Tier 1 Alpha',
      discipline: 3,
      streak: 1,
      knowledge: 150,
      knowledge_assets: 1,
      total_xp: 150
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Failed to issue developer passport:', error);
    return false;
  }
};
