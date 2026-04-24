import { useState, useEffect } from 'react';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, setDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import DashboardLayout from './dashboard/DashboardLayout';
import Home        from './dashboard/Home';
import Care        from './dashboard/Care';
import CalendarView from './dashboard/CalendarView';
import MyList      from './dashboard/MyList';
import Insurance   from './dashboard/Insurance';
import Chat        from './dashboard/Chat';
import { useAuth } from '../App';

import {
  INITIAL_RECIPIENTS, INITIAL_APPOINTMENTS,
  INITIAL_DOCTORS, INITIAL_LOGISTICS,
} from '../data';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [active, setActive] = useState('home');
  const [dataLoading, setDataLoading] = useState(true);

  const [recipients,   setRecipients]   = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [logistics,    setLogistics]    = useState([]);
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    text: `Hi${profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for your loved ones — from medical questions to legal documents, insurance, and emotional support. What can I help you with? 🤍`,
  }]);

  // ── Load from Firestore on login ──────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    loadData(user.uid);
  }, [user]);

  async function seedUserData(uid) {
    const batch = writeBatch(db);
    INITIAL_RECIPIENTS.forEach(r => {
      const ref = doc(collection(db, 'users', uid, 'recipients'));
      const { id: _id, ...data } = r;
      batch.set(ref, { ...data, _localId: r.id });
    });
    INITIAL_APPOINTMENTS.forEach(a => {
      const ref = doc(collection(db, 'users', uid, 'appointments'));
      const { id: _id, ...data } = a;
      batch.set(ref, data);
    });
    INITIAL_LOGISTICS.forEach(l => {
      const ref = doc(collection(db, 'users', uid, 'logistics'));
      const { id: _id, ...data } = l;
      batch.set(ref, data);
    });
    INITIAL_DOCTORS.forEach(d => {
      const ref = doc(collection(db, 'users', uid, 'doctors'));
      const { id: _id, ...data } = d;
      batch.set(ref, data);
    });
    await setDoc(doc(db, 'users', uid), { seeded: true, createdAt: new Date().toISOString() }, { merge: true });
    await batch.commit();
  }

  async function loadData(uid) {
    setDataLoading(true);
    try {
      const checkSnap = await getDocs(collection(db, 'users', uid, 'recipients'));
      if (checkSnap.empty) await seedUserData(uid);

      const [recSnap, apptSnap, logSnap, docSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'recipients')),
        getDocs(collection(db, 'users', uid, 'appointments')),
        getDocs(collection(db, 'users', uid, 'logistics')),
        getDocs(collection(db, 'users', uid, 'doctors')),
      ]);
      setRecipients(recSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setAppointments(apptSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLogistics(logSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setDoctors(docSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setDataLoading(false);
  }

  // ── Generic Firestore error handler ──────────────────────────────────────────
  function fsError(op, e) {
    console.error(`Firestore ${op} failed:`, e?.code, e?.message);
  }

  // ── Recipients ────────────────────────────────────────────────────────────────
  async function addRecipient(data) {
    // Optimistic update first so UI is instant
    const tempId = `temp_${Date.now()}`;
    setRecipients(prev => [...prev, { ...data, id: tempId }]);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'recipients'), data);
      // Replace temp id with real Firestore id
      setRecipients(prev => prev.map(r => r.id === tempId ? { ...r, id: ref.id } : r));
    } catch (e) {
      fsError('addRecipient', e);
      setRecipients(prev => prev.filter(r => r.id !== tempId)); // rollback
    }
  }
  async function updateRecipient(id, data) {
    setRecipients(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try {
      await updateDoc(doc(db, 'users', user.uid, 'recipients', id), data);
    } catch (e) { fsError('updateRecipient', e); }
  }
  async function deleteRecipient(id) {
    setRecipients(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'recipients', id));
    } catch (e) { fsError('deleteRecipient', e); }
  }

  // ── Doctors ───────────────────────────────────────────────────────────────────
  async function addDoctor(data) {
    const tempId = `temp_${Date.now()}`;
    setDoctors(prev => [...prev, { ...data, id: tempId }]);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'doctors'), data);
      setDoctors(prev => prev.map(d => d.id === tempId ? { ...d, id: ref.id } : d));
    } catch (e) {
      fsError('addDoctor', e);
      setDoctors(prev => prev.filter(d => d.id !== tempId));
    }
  }
  async function deleteDoctor(id) {
    setDoctors(prev => prev.filter(d => d.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'doctors', id));
    } catch (e) { fsError('deleteDoctor', e); }
  }

  // ── Appointments ──────────────────────────────────────────────────────────────
  async function addAppointment(data) {
    const tempId = `temp_${Date.now()}`;
    setAppointments(prev => [...prev, { ...data, id: tempId }]);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'appointments'), data);
      setAppointments(prev => prev.map(a => a.id === tempId ? { ...a, id: ref.id } : a));
    } catch (e) {
      fsError('addAppointment', e);
      setAppointments(prev => prev.filter(a => a.id !== tempId));
    }
  }
  async function deleteAppointment(id) {
    setAppointments(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'appointments', id));
    } catch (e) { fsError('deleteAppointment', e); }
  }

  // ── Logistics ─────────────────────────────────────────────────────────────────
  async function addLogistic(data) {
    const tempId = `temp_${Date.now()}`;
    setLogistics(prev => {
      const incomplete = prev.filter(l => !l.completed);
      const complete   = prev.filter(l => l.completed);
      return [...incomplete, { ...data, id: tempId }, ...complete];
    });
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'logistics'), data);
      setLogistics(prev => prev.map(l => l.id === tempId ? { ...l, id: ref.id } : l));
    } catch (e) {
      fsError('addLogistic', e);
      setLogistics(prev => prev.filter(l => l.id !== tempId));
    }
  }
  async function updateLogistic(id, changes) {
    setLogistics(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
    try {
      await updateDoc(doc(db, 'users', user.uid, 'logistics', id), changes);
    } catch (e) { fsError('updateLogistic', e); }
  }

  if (dataLoading) {
    return (
      <DashboardLayout active={active} setActive={setActive}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #ebe2d8', borderTopColor: '#c85c55', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </DashboardLayout>
    );
  }

  function renderContent() {
    switch (active) {
      case 'home':
        return <Home recipients={recipients} appointments={appointments} logistics={logistics} onNavigate={setActive} />;
      case 'care':
        return (
          <Care
            recipients={recipients}
            onAddRecipient={addRecipient}
            onUpdateRecipient={updateRecipient}
            onDeleteRecipient={deleteRecipient}
            doctors={doctors}
            onAddDoctor={addDoctor}
            onDeleteDoctor={deleteDoctor}
            appointments={appointments}
            onAddAppointment={addAppointment}
            onDeleteAppointment={deleteAppointment}
          />
        );
      case 'calendar':
        return <CalendarView appointments={appointments} recipients={recipients} onAddAppointment={addAppointment} />;
      case 'list':
        return (
          <MyList
            logistics={logistics}
            setLogistics={setLogistics}
            onUpdateLogistic={updateLogistic}
            onAddLogistic={addLogistic}
            doctors={doctors}
            recipients={recipients}
          />
        );
      case 'insurance':
        return <Insurance recipients={recipients} />;
      case 'chat':
        return <Chat messages={chatMessages} setMessages={setChatMessages} />;
      default:
        return null;
    }
  }

  return (
    <DashboardLayout active={active} setActive={setActive}>
      {renderContent()}
    </DashboardLayout>
  );
}
