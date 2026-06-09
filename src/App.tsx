import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Orders from './pages/Orders';
import Chats from './pages/Chats';
import Leads from './pages/Leads';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="chats" element={<Chats />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="orders" element={<Orders />} />
          <Route path="leads" element={<Leads />} />
          <Route path="notes" element={<Notes />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}
