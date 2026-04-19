import { useState } from 'react';
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
  const { profile } = useAuth();
  const [active, setActive] = useState('home');

  // App state (mirrors mobile)
  const [recipients,   setRecipients]   = useState(INITIAL_RECIPIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [doctors,      setDoctors]      = useState(INITIAL_DOCTORS);
  const [logistics, setLogistics] = useState(INITIAL_LOGISTICS);
  const [chatMessages, setChatMessages] = useState([{
    role: 'assistant',
    text: `Hi${profile?.name ? ` ${profile.name.split(' ')[0]}` : ''}! I'm Aiden, your personal caregiving assistant. I'm here to help you navigate caring for your loved ones — from medical questions to legal documents, insurance, and emotional support. What can I help you with? 🤍`,
  }]);

  function renderContent() {
    switch (active) {
      case 'home':      return <Home recipients={recipients} appointments={appointments} logistics={logistics} onNavigate={setActive} />;
      case 'care':      return <Care recipients={recipients} setRecipients={setRecipients} doctors={doctors} setDoctors={setDoctors} appointments={appointments} setAppointments={setAppointments} />;
      case 'calendar':  return <CalendarView appointments={appointments} recipients={recipients} />;
      case 'list':      return <MyList logistics={logistics} setLogistics={setLogistics} doctors={doctors} recipients={recipients} />;
      case 'insurance': return <Insurance recipients={recipients} />;
      case 'chat':      return <Chat messages={chatMessages} setMessages={setChatMessages} />;
      default:          return null;
    }
  }

  return (
    <DashboardLayout active={active} setActive={setActive}>
      {renderContent()}
    </DashboardLayout>
  );
}
