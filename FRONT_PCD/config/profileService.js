import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth, storage } from './firebase';

export const saveProfile = async (profileData) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    await setDoc(doc(db, "users", user.uid, "profile", "data"), profileData);
};

export const getProfile = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        const docRef = doc(db, "users", user.uid, "profile", "data");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            // Return default profile structure if no profile exists yet
            return {
                name: '',
                age: '',
                gender: 'Male',
                weight: '',
                height: '',
                emergencyContacts: [{ name: '', phone: '', priority: 'Primary' }],
                photoURL: null
            };
        }
    } catch (error) {
        console.error("Error getting profile:", error);
        throw error;
    }
};

export const uploadProfilePhoto = async (uri) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // Generate unique filename
        const filename = `profile_${user.uid}_${Date.now()}`;
        const storageRef = ref(storage, `profilePhotos/${user.uid}/${filename}`);

        // Convert URI to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        await uploadBytes(storageRef, blob);

        // Get download URL
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
};

export const getProfilePhoto = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // Check if profile has photoURL
        const profile = await getProfile();
        if (profile?.photoURL) {
            return profile.photoURL;
        }
        return null;
    } catch (error) {
        console.error("Error getting photo:", error);
        return null;
    }
};

export const deleteOldProfilePhoto = async (photoURL) => {
    if (!photoURL) return;

    try {
        const photoRef = ref(storage, photoURL);
        await deleteObject(photoRef);
    } catch (error) {
        console.error("Error deleting old photo:", error);
    }
};

export const updateProfilePhoto = async (newPhotoUri) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    try {
        // Get current profile to check for existing photo
        const currentProfile = await getProfile();

        // Upload new photo
        const newPhotoURL = await uploadProfilePhoto(newPhotoUri);

        // Update profile with new photo URL
        await updateDoc(doc(db, "users", user.uid, "profile", "data"), {
            photoURL: newPhotoURL
        });

        // Delete old photo if exists
        if (currentProfile?.photoURL) {
            await deleteOldProfilePhoto(currentProfile.photoURL);
        }

        return newPhotoURL;
    } catch (error) {
        console.error("Update error:", error);
        throw error;
    }
};