import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Permit from './pages/Permit'; 
import Area from './pages/Area';
import Instansi from './pages/Instansi';
import Users from './pages/Users';
import Proyek from './pages/Proyek';
import UjianLogin from './pages/UjianLogin';
import UjianOnline from './pages/UjianOnline';
import VerifyEmail from './pages/VerifyEmail';
import MasterSoal from './pages/MasterSoal';
import MasterTemplate from './pages/MasterTemplate';
import MasterKendaraan from './pages/MasterKendaraan';
import KartuAkses from './pages/KartuAkses';
import LogTapping from './pages/LogTapping';
import ScanTapping from './pages/ScanTapping';
import Profile from './pages/Profile';
import Visitor from './pages/Visitor';
import VisitorPublic from './pages/VisitorPublic';
import PrintVisitorCard from './pages/PrintVisitorCard';
import MonitoringDokumen from './pages/MonitoringDokumen';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
    <Toaster position="top-right" />
    <Router basename="/taptbg">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify" element={<VerifyEmail />} />
        <Route path="/ujian/login" element={<UjianLogin />} />
        <Route path="/ujian/start" element={<UjianOnline />} />
        <Route path="/v/:uid" element={<VisitorPublic />} />
        <Route path="/print-card/:uid" element={<PrintVisitorCard />} />
        
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="permit" element={<Permit />} /> 
          <Route path="area" element={<Area />} />
          <Route path="instansi" element={<Instansi />} />
          <Route path="users" element={<Users />} />
          <Route path="proyek" element={<Proyek />} />
          <Route path="bank-soal" element={<MasterSoal />} />
          <Route path="template-permit" element={<MasterTemplate />} />
          <Route path="kendaraan" element={<MasterKendaraan />} />
          <Route path="kartu" element={<KartuAkses />} />
          <Route path="visitor" element={<Visitor />} />
          <Route path="log" element={<LogTapping />} />
          <Route path="scan" element={<ScanTapping />} />
          <Route path="monitoring" element={<MonitoringDokumen />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;