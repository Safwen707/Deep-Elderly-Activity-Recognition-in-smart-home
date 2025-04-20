import { auth, db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export const getSettings = async () => {
    if (!auth.currentUser) return null;

    const docRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data().settings || null;
    }
    return null;
};

export const saveSettings = async (settings) => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, { settings }, { merge: true });
};

export const onSettingsUpdate = (callback) => {
    if (!auth.currentUser) return () => {};

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().settings || {});
        }
    });

    return unsubscribe;
};