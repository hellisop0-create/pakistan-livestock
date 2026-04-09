import { 
  collection, addDoc, query, where, getDocs, 
  serverTimestamp, updateDoc, doc 
} from 'firebase/firestore';
import { db } from '../firebase';

export const getOrCreateChat = async (
  buyerUid: string, 
  sellerUid: string, 
  adId: string, 
  adTitle: string, 
  sellerName: string 
) => {
  const chatsRef = collection(db, 'chats');
  
  const q = query(
    chatsRef, 
    where('adId', '==', adId), 
    where('participants', 'array-contains', buyerUid)
  );

  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }

  // Creating the chat with sellerName metadata
  const newChat = await addDoc(chatsRef, {
    participants: [buyerUid, sellerUid],
    adId,
    adTitle,
    sellerName, 
    lastMessage: '',
    updatedAt: serverTimestamp(),
  });

  return newChat.id;
};

export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    text,
    senderId,
    timestamp: serverTimestamp(),
    status: 'sent' // Initial status for single tick
  });

  const chatRef = doc(db, 'chats', chatId);
  await updateDoc(chatRef, {
    lastMessage: text,
    updatedAt: serverTimestamp()
  });
};