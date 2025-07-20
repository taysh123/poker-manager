import React, { useEffect, useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';

function PlayerManagement() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchPlayers(currentUser.uid);
      } else {
        setPlayers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchPlayers = async (userId) => {
    try {
      const playersCollectionRef = collection(db, 'users', userId, 'players');
      const querySnapshot = await getDocs(playersCollectionRef);
      const fetchedPlayers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setPlayers(fetchedPlayers);
    } catch (error) {
      console.error('שגיאה בשליפת שחקנים:', error);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    if (!user || !newPlayerName.trim()) {
      alert('אנא התחבר והזן שם שחקן.');
      return;
    }
    
    try {
      const playersCollectionRef = collection(db, 'users', user.uid, 'players');
      await addDoc(playersCollectionRef, { name: newPlayerName.trim() });
      setNewPlayerName('');
      fetchPlayers(user.uid); // רענון הרשימה
    } catch (error) {
      console.error('שגיאה בהוספת שחקן:', error);
      alert('שגיאה בהוספת שחקן.');
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!user) {
      alert('אנא התחבר כדי למחוק שחקן.');
      return;
    }
    if (window.confirm('האם אתה בטוח שברצונך למחוק את השחקן?')) {
      try {
        const playerDocRef = doc(db, 'users', user.uid, 'players', playerId);
        await deleteDoc(playerDocRef);
        fetchPlayers(user.uid); // רענון הרשימה
      } catch (error) {
        console.error('שגיאה במחיקת שחקן:', error);
        alert('שגיאה במחיקת שחקן.');
      }
    }
  };

  if (!user) {
    return <p className="page-container">אנא התחבר כדי לנהל את השחקנים שלך.</p>;
  }

  return (
    <div className="page-container">
      <h2>ניהול שחקנים</h2>
      <form onSubmit={handleAddPlayer}>
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="שם שחקן חדש"
          required
        />
        <button type="submit">הוסף שחקן</button>
      </form>

      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {players.length === 0 ? (
          <p>לא נמצאו שחקנים.</p>
        ) : (
          players.map(player => (
            <li key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>{player.name}</span>
              <button onClick={() => handleDeletePlayer(player.id)}>מחק</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default PlayerManagement;