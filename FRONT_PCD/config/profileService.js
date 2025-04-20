import { db, auth } from './firebase';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

export const saveProfile = async (profileData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await setDoc(doc(db, "users", user.uid, "profile", "data"), profileData);
};

export const getProfile = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = doc(db, "users", user.uid, "profile", "data");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    }
    return null;
};

export const onProfileUpdate = (callback) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    return onSnapshot(doc(db, "users", user.uid, "profile", "data"), (doc) => {
        if (doc.exists()) {
            callback(doc.data());
        }
    });
};