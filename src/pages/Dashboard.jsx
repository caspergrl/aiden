import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  collection, doc, getDocs, addDoc, updateDoc,
  deleteDoc, setDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { pendo } from '../pendo';
import DashboardLayout from './dashboard/DashboardLayout';
import Home        from './dashboard/Home';
import Care, { apptMs } from './dashboard/Care';
import CalendarView from './dashboard/CalendarView';
import MyList      from './dashboard/MyList';
import Insurance   from './dashboard/Insurance';
import Resources   from './dashboard/Resources';
import Chat        from './dashboard/Chat';
import { useAuth } from '../App';

import {
  INITIAL_RECIPIENTS, INITIAL_APPOINTMENTS,
  INITIAL_DOCTORS, INITIAL_LOGISTICS,
  COMMON_MEDICATIONS, CAREGIVING_RECS,
} from '../data';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname.slice(1) || 'home';
  const [dataLoading, setDataLoading] = useState(true);

  const [recipients,   setRecipients]   = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors,      setDoctors]      = useState([]);
  const [saveError,    setSaveError]    = useState(null);
  const [logistics,    setLogistics]    = useState([]);
  const [resources,    setResources]    = useState([]);
  const [changes,      setChanges]      = useState([]);
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
      if (checkSnap.empty && INITIAL_RECIPIENTS.length > 0) await seedUserData(uid);

      const [recSnap, apptSnap, logSnap, docSnap, resSnap, chgSnap] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'recipients')),
        getDocs(collection(db, 'users', uid, 'appointments')),
        getDocs(collection(db, 'users', uid, 'logistics')),
        getDocs(collection(db, 'users', uid, 'doctors')),
        getDocs(collection(db, 'users', uid, 'resources')),
        getDocs(collection(db, 'users', uid, 'careChanges')),
      ]);
      setRecipients(recSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setAppointments(apptSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setLogistics(logSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setDoctors(docSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setResources(resSnap.docs.map(d => ({ ...d.data(), id: d.id })));
      setChanges(chgSnap.docs.map(d => ({ ...d.data(), id: d.id })));
    } catch (e) {
      console.error('Failed to load data:', e);
      pendo.track('data_sync_failed', { operation: 'loadData', error_code: e?.code || 'unknown', section: active });
    }
    setDataLoading(false);
  }

  // ── Generic Firestore error handler ──────────────────────────────────────────
  function fsError(op, e) {
    console.error(`Firestore ${op} failed:`, e?.code, e?.message);
    pendo.track('data_sync_failed', { operation: op, error_code: e?.code || 'unknown', section: active });
    setSaveError(`Save failed (${e?.code || 'unknown error'}). Changes were not saved. Please try again.`);
    setTimeout(() => setSaveError(null), 5000);
  }

  // ── Recipients ────────────────────────────────────────────────────────────────
  async function addRecipient(data) {
    // Optimistic update first so UI is instant
    const tempId = `temp_${Date.now()}`;
    setRecipients(prev => [...prev, { ...data, id: tempId }]);
    try {
      // Strip local id so Firestore auto-generates the document ID
      const { id: _localId, ...firestoreData } = data;
      const ref = await addDoc(collection(db, 'users', user.uid, 'recipients'), firestoreData);
      // Replace temp id with real Firestore id
      setRecipients(prev => prev.map(r => r.id === tempId ? { ...r, id: ref.id } : r));
      // Profile-depth counts only: never names, conditions or medication names (PHI)
      const { conditions = [], allergies = [], medications = [] } = data;
      pendo.track('care_recipient_added', {
        recipient_id: ref.id,
        section: active, // 'care' | 'home'
        is_first_recipient: recipients.length === 0,
        total_recipients: recipients.length + 1,
        relationship: data.relationship?.slice(0, 50) || null,
        age: data.age || null, // 0 = not provided
        conditions_count: conditions.length,
        guidance_conditions_count: conditions.filter(c => CAREGIVING_RECS[c]).length,
        allergies_count: allergies.length,
        medications_count: medications.length,
        custom_medications_count: medications.filter(m => !COMMON_MEDICATIONS.includes(typeof m === 'string' ? m : m?.name)).length,
        has_email: !!data.email,
        has_phone: !!data.phone,
        has_notes: !!data.notes,
      });
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
      const { id: _localId, ...firestoreData } = data;
      const ref = await addDoc(collection(db, 'users', user.uid, 'doctors'), firestoreData);
      setDoctors(prev => prev.map(d => d.id === tempId ? { ...d, id: ref.id } : d));
      // Booleans only: no provider names, phone numbers or specialties
      pendo.track('care_team_member_added', {
        doctor_id: ref.id,
        section: active, // 'care' (profile Care team) | 'todo' (Doctors tab)
        is_linked_to_recipient: !!data.recipientId,
        has_specialty: !!data.specialty,
        has_phone: !!data.phone,
        has_address: !!data.address,
        has_notes: !!data.notes,
        care_team_size: doctors.length + 1,
      });
    } catch (e) {
      fsError('addDoctor', e);
      setDoctors(prev => prev.filter(d => d.id !== tempId));
    }
  }
  async function deleteDoctor(id) {
    const removed = doctors.find(d => d.id === id);
    setDoctors(prev => prev.filter(d => d.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'doctors', id));
      pendo.track('care_team_member_removed', {
        doctor_id: id,
        section: active, // 'care' (one-click trash) | 'todo' (confirmed delete)
        was_linked_to_recipient: !!removed?.recipientId,
        care_team_size_after: doctors.filter(d => d.id !== id).length,
      });
    } catch (e) { fsError('deleteDoctor', e); }
  }
  async function updateDoctor(id, changes) {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...changes } : d));
    try {
      await updateDoc(doc(db, 'users', user.uid, 'doctors', id), changes);
    } catch (e) { fsError('updateDoctor', e); }
  }

  // ── Appointments ──────────────────────────────────────────────────────────────
  async function addAppointment(data) {
    const tempId = `temp_${Date.now()}`;
    setAppointments(prev => [...prev, { ...data, id: tempId }]);
    try {
      const { id: _localId, ...firestoreData } = data;
      const ref = await addDoc(collection(db, 'users', user.uid, 'appointments'), firestoreData);
      setAppointments(prev => prev.map(a => a.id === tempId ? { ...a, id: ref.id } : a));
      // No title, location text or notes
      pendo.track('appointment_created', {
        appointment_id: ref.id,
        section: active, // 'calendar' | 'care'
        appointment_type: data.type || null,
        is_for_self: !data.recipientId,
        location_mode: data.location?.startsWith('http') ? 'video' : data.location ? 'in_person' : 'none',
        has_time: !!data.time,
        has_doctor: !!data.doctor,
        has_notes: !!data.notes,
        reminders_enabled: data.reminders ?? null, // only set by the Calendar modal
        days_until_appointment: Math.round((new Date(data.date + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000),
        total_appointments: appointments.length + 1,
      });
    } catch (e) {
      fsError('addAppointment', e);
      setAppointments(prev => prev.filter(a => a.id !== tempId));
    }
  }
  async function updateAppointment(id, updates) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    try {
      const { id: _id, ...data } = updates;
      await updateDoc(doc(db, 'users', user.uid, 'appointments', id), data);
    } catch (e) { fsError('updateAppointment', e); }
  }
  async function deleteAppointment(id) {
    const appt = appointments.find(a => a.id === id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'appointments', id));
      pendo.track('appointment_deleted', {
        appointment_id: id,
        section: active, // 'home' | 'calendar' | 'care'
        appointment_type: appt?.type || null,
        was_upcoming: appt ? apptMs(appt) >= Date.now() : null,
        is_for_self: appt ? !appt.recipientId : null,
      });
    } catch (e) { fsError('deleteAppointment', e); }
  }

  // ── Care changes ─────────────────────────────────────────────────────────────
  async function addChange(data) {
    const tempId = `temp_${Date.now()}`;
    setChanges(prev => [{ ...data, id: tempId }, ...prev]);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'careChanges'), data);
      setChanges(prev => prev.map(c => c.id === tempId ? { ...c, id: ref.id } : c));
    } catch (e) {
      fsError('addChange', e);
      setChanges(prev => prev.filter(c => c.id !== tempId));
    }
  }
  async function deleteChange(id) {
    setChanges(prev => prev.filter(c => c.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'careChanges', id));
    } catch (e) { fsError('deleteChange', e); }
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
      const { id: _localId, ...firestoreData } = data;
      const ref = await addDoc(collection(db, 'users', user.uid, 'logistics'), firestoreData);
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

  // ── Resources ──────────────────────────────────────────────────────────────────
  async function addResource(data) {
    const tempId = `temp_${Date.now()}`;
    setResources(prev => [...prev, { ...data, id: tempId }]);
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'resources'), data);
      setResources(prev => prev.map(r => r.id === tempId ? { ...r, id: ref.id } : r));
    } catch (e) {
      fsError('addResource', e);
      setResources(prev => prev.filter(r => r.id !== tempId));
    }
  }
  async function updateResource(id, data) {
    setResources(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    try {
      await updateDoc(doc(db, 'users', user.uid, 'resources', id), data);
    } catch (e) { fsError('updateResource', e); }
  }
  async function deleteResource(id) {
    setResources(prev => prev.filter(r => r.id !== id));
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'resources', id));
    } catch (e) { fsError('deleteResource', e); }
  }

  if (dataLoading) {
    return (
      <DashboardLayout active={active}>
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
        return <Home recipients={recipients} appointments={appointments} logistics={logistics} onNavigate={(section) => navigate('/' + section)} onAddRecipient={addRecipient} onUpdateAppointment={updateAppointment} onDeleteAppointment={deleteAppointment} />;
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
            changes={changes}
            onAddChange={addChange}
            onDeleteChange={deleteChange}
          />
        );
      case 'calendar':
        return <CalendarView appointments={appointments} recipients={recipients} onAddAppointment={addAppointment} onUpdateAppointment={updateAppointment} onDeleteAppointment={deleteAppointment} />;
      case 'todo':
        return (
          <MyList
            logistics={logistics}
            setLogistics={setLogistics}
            onUpdateLogistic={updateLogistic}
            onAddLogistic={addLogistic}
            doctors={doctors}
            onAddDoctor={addDoctor}
            onUpdateDoctor={updateDoctor}
            onDeleteDoctor={deleteDoctor}
            recipients={recipients}
          />
        );
      case 'insurance':
        return <Insurance recipients={recipients} />;
      case 'resources':
        return <Resources resources={resources} onAdd={addResource} onUpdate={updateResource} onDelete={deleteResource} recipients={recipients} />;
      case 'chat':
        return <Chat messages={chatMessages} setMessages={setChatMessages} />;
      default:
        return null;
    }
  }

  return (
    <DashboardLayout active={active}>
      {renderContent()}
      {saveError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#c0392b', color: '#fff', padding: '12px 24px', borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          maxWidth: 420, textAlign: 'center',
        }}>
          ⚠️ {saveError}
        </div>
      )}
    </DashboardLayout>
  );
}
