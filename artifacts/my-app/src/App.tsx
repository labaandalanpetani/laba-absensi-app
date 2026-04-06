declare const __firebase_config: string;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  query
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Store, 
  Sprout, 
  FileText, 
  Users, 
  Plus, 
  History, 
  LayoutDashboard,
  Trash2, 
  LogOut, 
  Settings, 
  ChevronLeft, 
  UserPlus, 
  ShieldCheck, 
  Lock,
  X,
  Activity,
  Camera,
  ChevronRight,
  Briefcase,
  Download,
  Cloud,
  Edit2,
  Check,
  BarChart3,
  Filter,
  UsersRound,
  Layers,
  FolderPlus,
  ArrowLeft,
  Palmtree,
  Send,
  RefreshCw,
  Search,
  ChevronDown,
  Image as ImageIcon,
  Timer,
  KeyRound,
  UserCircle,
  MessageSquare,
  Maximize2,
  ClipboardCheck,
  ListChecks,
  ShieldAlert,
  AlertCircle,
  TrendingUp,
  BarChart
} from 'lucide-react';

// --- Konfigurasi Firebase ---
const _rawConfig = (typeof __firebase_config !== 'undefined' && __firebase_config)
  ? (() => { try { return JSON.parse(__firebase_config); } catch { return null; } })()
  : null;

const hasValidFirebaseConfig = !!(_rawConfig?.apiKey);

const firebaseConfig = _rawConfig || { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' };
const app = hasValidFirebaseConfig ? initializeApp(firebaseConfig) : null as any;
const auth = hasValidFirebaseConfig ? getAuth(app) : null as any;
const db = hasValidFirebaseConfig ? getFirestore(app) : null as any;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sales-absen-agro';
// --- Global Constants ---
const ColorMap = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100'
};

const JOB_TITLES = [
  "Direktur", "NSM (National Sales Manager)", "ASM (Area Sales Manager)", 
  "ME (Marketing Executive)", "Sales Promotion", "Field Assistant", 
  "Senior Finance Officer", "Finance Officer", "Human Resource Development", 
  "Product Development & Digital Marketing", "Social Media Specialist", "Content Creator"
];

const ROLES_WITH_TEAM_ACCESS = [
  "Direktur", "NSM (National Sales Manager)", "ASM (Area Sales Manager)", 
  "ME (Marketing Executive)", "Human Resource Development"
];

const LEAVE_OPTIONS = ['Izin', 'Sakit', 'Cuti', 'Libur Nasional', 'Dinas Luar'];

const App = () => {
  // --- States ---
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('GUEST'); 
  const [activeTab, setActiveTab] = useState('login'); 
  const [adminSubTab, setAdminSubTab] = useState('stats'); 
  const [currentUserData, setCurrentUserData] = useState(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState(null); 
  const [isTeamViewMode, setIsTeamViewMode] = useState(false);
  
  const [employees, setEmployees] = useState([]); 
  const [teams, setTeams] = useState([]);
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [loginForm, setLoginForm] = useState({ username: '', password: '', adminPass: '' });
  const [loginError, setLoginError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalFilter, setGlobalFilter] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    period: new Date().getDate() <= 15 ? 1 : 2,
    team: 'ALL'
  });

  const [newEmployee, setNewEmployee] = useState({ name: '', team: '', jabatan: 'Sales Promotion', username: '', password: '', accessibleTeams: [] });
  const [editingEmployee, setEditingEmployee] = useState(null); 
  const [editEmpInput, setEditEmpInput] = useState({ name: '', team: '', jabatan: '', username: '', password: '', accessibleTeams: [] });
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamInput, setEditTeamInput] = useState('');

  const [now, setNow] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [previewDetail, setPreviewDetail] = useState(null); 
  const [isLeaveMode, setIsLeaveMode] = useState(false);
  const [pendingVisit, setPendingVisit] = useState(null); 

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'WORK', checkIn: '', photoCheckIn: null, breakTime: '01:00',
    checkOut: '', photoCheckOut: null, isWorking: false, leaveType: 'Izin',
    leaveNote: '', leaveStartDate: new Date().toISOString().split('T')[0],
    leaveEndDate: new Date().toISOString().split('T')[0],
    visits: { kios: [], petani: [], demplot: [], odp: [], fm: [] }
  });

  const inInputRef = useRef(null);
  const outInputRef = useRef(null);
  const visitInputRef = useRef(null);
  const leaveInputRef = useRef(null);
  const [activeVisitType, setActiveVisitType] = useState(null);

  const VISIT_TYPES = useMemo(() => [
    { key: 'kios', label: 'Kios', icon: Store, color: 'emerald' },
    { key: 'petani', label: 'Petani', icon: User, color: 'blue' },
    { key: 'demplot', label: 'Demplot', icon: MapPin, color: 'amber' },
    { key: 'odp', label: 'ODP', icon: FileText, color: 'purple' },
    { key: 'fm', label: 'FM', icon: Users, color: 'rose' },
  ], []);

  // --- Helpers ---
  const formatHMS = (totalHours) => {
    if (totalHours === undefined || totalHours === null || isNaN(totalHours) || totalHours <= 0) return "00:00:00";
    const totalSeconds = Math.round(totalHours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const formatTimeFull = (date) => date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\./g, ':');

  // --- Logic Functions ---
  const handleUserSelect = (name) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = records.find(r => r.employeeName === name && r.date === today);
    if (existing) {
      setFormData(existing);
      setIsLeaveMode(existing.type === 'LEAVE');
    } else {
      setFormData({
        date: today, type: 'WORK', checkIn: '', photoCheckIn: null, breakTime: '01:00',
        checkOut: '', photoCheckOut: null, isWorking: false, leaveType: 'Izin',
        leaveNote: '', leaveStartDate: today, leaveEndDate: today,
        visits: { kios: [], petani: [], demplot: [], odp: [], fm: [] }
      });
      setIsLeaveMode(false);
    }
    setActiveTab('input');
    setIsTeamViewMode(false);
    setSelectedAdminUser(null);
  };

  const saveToCloud = async (record) => {
    if (!user) return;
    const empName = currentUserData?.name || record.employeeName;
    const existing = records.find(r => r.employeeName === empName && r.date === record.date);
    const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'records');
    
    const recordToSave = {
        ...record,
        employeeName: empName,
        lastUpdated: new Date().toISOString()
    };

    try {
        if (existing) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', existing.id), recordToSave);
        } else {
            await addDoc(colRef, recordToSave);
        }
        setFormData(recordToSave);
    } catch (err) {
        console.error("Error saving record:", err);
    }
  };

  const compressAndWatermark = (file, typeLabel, callback) => {
    if (!file || !(file instanceof Blob)) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const barHeight = 85;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
        
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('PT LABA INDOAGRO NUSANTARA - VERIFIED', 15, canvas.height - 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '13px sans-serif';
        const nD = currentUserData?.name || 'User';
        const tD = currentUserData?.team || 'OFFICE';
        ctx.fillText(`NAMA: ${nD} [${tD}] | STATUS: ${typeLabel}`, 15, canvas.height - 40);
        ctx.fillText(`WAKTU: ${new Date().toLocaleString('id-ID')} (Cloud Sync)`, 15, canvas.height - 20);
        
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  };

  const onCaptureCheckIn = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      compressAndWatermark(file, "MASUK", (base64) => {
        const nowTime = formatTimeFull(new Date());
        const updated = {
            ...formData,
            checkIn: nowTime,
            photoCheckIn: base64,
            isWorking: true,
            type: 'WORK'
        };
        saveToCloud(updated);
      });
    }
  };

  const onCaptureVisit = (e) => {
    const file = e.target.files?.[0];
    if (file && activeVisitType) {
      compressAndWatermark(file, `KUNJUNGAN: ${activeVisitType.toUpperCase()}`, (b) => {
        setPendingVisit({ type: activeVisitType, photo: b, time: formatTimeFull(new Date()), description: '' });
        setActiveVisitType(null);
      });
    }
  };

  const confirmVisitLog = () => {
    if (!pendingVisit) return;
    const updatedVisits = { 
        ...formData.visits, 
        [pendingVisit.type]: [...(formData.visits[pendingVisit.type] || []), { 
            time: pendingVisit.time, 
            photo: pendingVisit.photo, 
            description: pendingVisit.description 
        }] 
    };
    const updatedRecord = { ...formData, visits: updatedVisits };
    saveToCloud(updatedRecord);
    setPendingVisit(null);
  };

  const handleFinishWork = async (base64) => {
    if (!base64) return;
    const outT = formatTimeFull(new Date());
    const [hI, mI, sI = 0] = (formData.checkIn || '00:00:00').split(':').map(Number);
    const [hO, mO, sO = 0] = outT.split(':').map(Number);
    const workSec = Math.max(0, (hO * 3600 + mO * 60 + sO) - (hI * 3600 + mI * 60 + sI));
    saveToCloud({
        ...formData, 
        employeeName: currentUserData.name, 
        checkOut: outT, 
        photoCheckOut: base64, 
        isWorking: false, 
        workHours: workSec / 3600
    });
  };

  const handleLeaveSubmit = (photoBase64 = null) => {
    saveToCloud({ 
        ...formData, 
        type: 'LEAVE', 
        employeeName: currentUserData.name, 
        photoCheckIn: photoBase64, 
        workHours: 0, 
        isWorking: false 
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (loginForm.adminPass === "admin123") {
      setAuthMode('ADMIN'); 
      setAdminSubTab('stats'); 
      setActiveTab('admin'); 
      return;
    }
    const foundEmp = employees.find(emp => emp.username === loginForm.username && emp.password === loginForm.password);
    if (foundEmp) {
      setCurrentUserData(foundEmp);
      setAuthMode('EMPLOYEE');
      handleUserSelect(foundEmp.name);
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    setAuthMode('GUEST'); 
    setIsTeamViewMode(false); 
    setSelectedAdminUser(null);
    setCurrentUserData(null); 
    setActiveTab('login');
    setLoginForm({ username: '', password: '', adminPass: '' });
  };

  // --- CRUD Teams & Employees ---
  const handleAddTeam = async () => { 
    if (newTeamName.trim()) { 
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), { name: newTeamName.trim() }); 
        setNewTeamName(''); 
    } 
  };
  const handleDeleteTeam = async (id) => { if (window.confirm("Hapus tim?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', id)); };
  const handleSaveEditTeam = async () => { if (editTeamInput.trim() && editingTeam) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'teams', editingTeam.id), { name: editTeamInput.trim() }); setEditingTeam(null); } };

  const handleAddEmployee = async () => { 
    if (newEmployee.name.trim() && newEmployee.team && newEmployee.username) { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), newEmployee); 
      setNewEmployee({ name: '', team: '', jabatan: 'Sales Promotion', username: '', password: '', accessibleTeams: [] }); 
    } 
  };
  const handleDeleteEmployee = async (id) => { if (window.confirm("Hapus pegawai ini?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', id)); };
  const handleSaveEditEmployee = async () => {
    if (editEmpInput.name.trim() && editingEmployee) {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'employees', editingEmployee.id), editEmpInput);
      setEditingEmployee(null);
    }
  };
  const toggleTeamAccess = (teamName, inputState, setInputState) => {
    const current = inputState.accessibleTeams || [];
    if (current.includes(teamName)) setInputState({ ...inputState, accessibleTeams: current.filter(t => t !== teamName) });
    else setInputState({ ...inputState, accessibleTeams: [...current, teamName] });
  };
  const handleDeleteRecord = async (id) => { if (window.confirm("Hapus log ini?")) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'records', id)); };

  // --- Auth & Data Sync ---
  useEffect(() => {
    if (!hasValidFirebaseConfig || !auth) { setIsLoading(false); return; }
    let unsubscribe: (() => void) | null = null;
    try {
      const initAuth = async () => {
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
          else await signInAnonymously(auth);
        } catch (err) { console.error('Auth error:', err); }
      };
      initAuth();
      unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    } catch (err) {
      console.error('Firebase setup error:', err);
      setIsLoading(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!hasValidFirebaseConfig || !user) return;
    const unsubTeams = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'teams'), (snap) => setTeams(snap.docs.map(d => ({ id: d.id, name: d.data().name })).sort((a,b) => a.name.localeCompare(b.name))));
    const unsubEmp = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'employees'), (snap) => setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRec = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'records'), (snap) => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    setIsLoading(false);
    return () => { unsubTeams(); unsubEmp(); unsubRec(); };
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      const current = new Date(); 
      setNow(current);
      if (formData.isWorking && formData.checkIn) {
        const [h, m, s = 0] = formData.checkIn.split(':').map(Number);
        const start = new Date(); start.setHours(h, m, s);
        setElapsedTime(formatHMS(Math.max(0, current - start) / 3600000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [formData.isWorking, formData.checkIn]);

  // --- Filtering & Stats ---
  const hasTeamAccess = useMemo(() => currentUserData && ROLES_WITH_TEAM_ACCESS.includes(currentUserData.jabatan), [currentUserData]);
  const userAllowedTeams = useMemo(() => teams.filter(t => (currentUserData?.accessibleTeams || []).includes(t.name)), [teams, currentUserData]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const d = new Date(r.date);
      const emp = employees.find(e => e.name === r.employeeName);
      const isCorrectMonth = d.getMonth() === globalFilter.month;
      const isCorrectYear = d.getFullYear() === globalFilter.year;
      const isInPeriod = globalFilter.period === 1 ? d.getDate() <= 15 : d.getDate() >= 16;
      const isCorrectTeam = globalFilter.team === 'ALL' || (emp && emp.team === globalFilter.team);
      return isCorrectMonth && isCorrectYear && isInPeriod && isCorrectTeam;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [records, globalFilter, employees]);

  const statsByEmployee = useMemo(() => {
    const relevant = employees.filter(e => globalFilter.team === 'ALL' || e.team === globalFilter.team);
    return relevant.map(emp => {
      const recs = filteredRecords.filter(r => r.employeeName === emp.name).sort((a,b) => a.date.localeCompare(b.date));
      const vTotals = { kios: 0, petani: 0, demplot: 0, odp: 0, fm: 0 };
      let lDays = 0; let wDays = 0;
      recs.forEach(r => { 
        if (r.type === 'LEAVE') lDays++; 
        else { 
            wDays++; 
            if(r.visits) Object.keys(vTotals).forEach(k => vTotals[k] += (r.visits[k]?.length || 0)); 
        }
      });
      const totalHrs = recs.reduce((a, c) => a + (c.workHours || 0), 0);
      return { 
        ...emp, 
        periodVisits: recs.reduce((a, c) => a + (c.type === 'WORK' && c.visits ? Object.values(c.visits).flat().length : 0), 0), 
        periodHours: totalHrs, 
        periodHoursDisplay: formatHMS(totalHrs),
        periodVisitTotals: vTotals, 
        periodLeaveDays: lDays, 
        periodWorkDays: wDays, 
        records: recs 
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredRecords, employees, globalFilter.team]);

  // --- Weekly Stats Logic for User Dashboard ---
  const weeklyStats = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDays.push(d.toISOString().split('T')[0]);
    }

    return weekDays.map(dateStr => {
        const rec = records.find(r => r.employeeName === currentUserData?.name && r.date === dateStr);
        const dayName = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short' });
        const hours = rec?.type === 'WORK' ? (rec.workHours || 0) : 0;
        const totalVisits = rec?.type === 'WORK' && rec.visits ? Object.values(rec.visits).flat().length : 0;
        return { day: dayName, hours, visits: totalVisits };
    });
  }, [records, currentUserData]);

  const exportToExcel = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const filename = `LabaAgro_P${globalFilter.period}_${months[globalFilter.month]}.xls`;
    let html = `<html><head><meta charset="utf-8"></head><body><table border="0"><tr><th colspan="10" style="font-size:18px; font-weight:bold; text-align:center;">LAPORAN PRESENSI & AKTIVITAS SALES</th></tr><tr><th colspan="10" style="font-size:14px; text-align:center;">PT LABA INDOAGRO NUSANTARA</th></tr><tr><th colspan="10" style="text-align:center;">Periode: ${globalFilter.period === 1 ? '01-15' : '16-Akhir'} ${months[globalFilter.month]}</th></tr></table>`;
    statsByEmployee.forEach(emp => {
      html += `<table border="1"><tr style="background-color:#1e293b; color:white;"><th colspan="10">PEGAWAI: ${emp.name.toUpperCase()} [TIM: ${emp.team}]</th></tr><tr style="background-color:#059669; color:white;"><th>Tanggal</th><th>Status</th><th>Masuk</th><th>Pulang</th><th>Jam Kerja</th><th>Kios</th><th>Petani</th><th>Demplot</th><th>ODP</th><th>FM</th></tr>`;
      emp.records.forEach(r => { 
        const isW = r.type === 'WORK'; 
        html += `<tr><td>${r.date}</td><td>${isW ? 'HADIR' : r.leaveType}</td><td>${isW ? r.checkIn : '-'}</td><td>${isW ? (r.checkOut || '-') : '-'}</td><td>${isW ? formatHMS(r.workHours) : '-'}</td><td>${isW && r.visits ? (r.visits.kios?.length || 0) : 0}</td><td>${isW && r.visits ? (r.visits.petani?.length || 0) : 0}</td><td>${isW && r.visits ? (r.visits.demplot?.length || 0) : 0}</td><td>${isW && r.visits ? (r.visits.odp?.length || 0) : 0}</td><td>${isW && r.visits ? (r.visits.fm?.length || 0) : 0}</td></tr>`; 
      });
      html += `<tr><td colspan="4">TOTAL PERIODE:</td><td>${emp.periodHoursDisplay}</td><td>${emp.periodVisitTotals.kios}</td><td>${emp.periodVisitTotals.petani}</td><td>${emp.periodVisitTotals.demplot}</td><td>${emp.periodVisitTotals.odp}</td><td>${emp.periodVisitTotals.fm}</td></tr></table><br/>`;
    });
    html += `</body></html>`;
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  };

  const Header = ({ title, showBack = true }) => (
    <header className="bg-emerald-700 text-white p-4 shadow-lg sticky top-0 z-20 rounded-b-3xl">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack && (isTeamViewMode || (authMode === 'ADMIN' && selectedAdminUser) || (authMode === 'EMPLOYEE' && selectedAdminUser)) && 
            <button onClick={() => { setIsTeamViewMode(false); setSelectedAdminUser(null); setActiveTab(authMode === 'ADMIN' ? 'admin' : 'input'); }} className="p-2 bg-emerald-600 rounded-xl"><ChevronLeft size={20} /></button>
          }
          <div className="text-left">
            <h1 className="font-black text-lg leading-tight">{title}</h1>
            <p className="text-[10px] opacity-70 uppercase tracking-widest font-bold">{authMode === 'ADMIN' ? 'Admin Portal' : authMode === 'EMPLOYEE' ? currentUserData?.name : 'Indoagro'}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-3 rounded-2xl bg-emerald-600 shadow-md active:scale-90 transition-all border border-emerald-500/50"><LogOut size={18} /></button>
      </div>
    </header>
  );

  if (!hasValidFirebaseConfig) return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center space-y-4 border border-emerald-100">
        <Sprout className="w-12 h-12 text-emerald-600 mx-auto" />
        <h1 className="text-xl font-black text-slate-800">Firebase Belum Dikonfigurasi</h1>
        <p className="text-sm text-slate-500">App ini membutuhkan konfigurasi Firebase. Hubungi administrator untuk mendapatkan file konfigurasi Firebase (<code className="bg-slate-100 px-1 rounded text-xs">__firebase_config</code>).</p>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs text-amber-800 space-y-1">
          <p className="font-black">Yang dibutuhkan:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Firebase Project API Key</li>
            <li>Auth Domain & Project ID</li>
            <li>Firestore Database aktif</li>
          </ul>
        </div>
      </div>
    </div>
  );
  if (isLoading) return <div className="min-h-screen bg-emerald-50 flex items-center justify-center text-center"><div className="space-y-4"><Sprout className="w-16 h-16 text-emerald-700 animate-bounce mx-auto" /><p className="text-emerald-800 font-black uppercase text-xs tracking-widest">Loading Database...</p></div></div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans pb-28 relative">
      {/* Hidden File Inputs */}
      <div className="hidden">
         <input type="file" accept="image/*" capture="user" ref={inInputRef} onChange={onCaptureCheckIn} />
         <input type="file" accept="image/*" capture="user" ref={outInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) compressAndWatermark(f, "PULANG", handleFinishWork); }} />
         <input type="file" accept="image/*" capture="environment" ref={visitInputRef} onChange={onCaptureVisit} />
         <input type="file" accept="image/*" capture="user" ref={leaveInputRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) compressAndWatermark(f, `CUTI: ${formData.leaveType}`, handleLeaveSubmit); }} />
      </div>

      {/* Modals */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[300] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in" onClick={() => setPreviewPhoto(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full"><X size={24} /></button>
          <img src={previewPhoto} className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/20 object-contain" />
        </div>
      )}

      {previewDetail && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl text-left animate-in zoom-in-95">
              <div className="relative aspect-square w-full bg-slate-100"><img src={previewDetail.photo} className="w-full h-full object-cover" /><button onClick={() => setPreviewDetail(null)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><X size={20} /></button></div>
              <div className="p-6 space-y-4">
                 <div className="flex justify-between items-start">
                    <div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">{previewDetail.typeName}</p><h4 className="text-xl font-black text-slate-800 leading-tight">{previewDetail.name}</h4></div>
                    <div className="bg-slate-50 px-3 py-1 rounded-xl text-center"><p className="text-[9px] font-black text-slate-400">Waktu</p><p className="text-sm font-bold">{previewDetail.time}</p></div>
                 </div>
                 <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50"><p className="text-[10px] font-black text-emerald-700 uppercase mb-1">Rincian:</p><p className="text-sm text-slate-600 italic">"{previewDetail.description || 'Tanpa rincian'}"</p></div>
                 <button onClick={() => setPreviewDetail(null)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Tutup</button>
              </div>
           </div>
        </div>
      )}

      {pendingVisit && (
        <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-4 text-left animate-in slide-in-from-bottom-8">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700"><MessageSquare size={24} /></div>
                 <div><h4 className="text-lg font-black text-slate-800 leading-none">Rincian Kegiatan</h4><p className="text-[10px] font-bold text-slate-400">Log: {pendingVisit.type} | {pendingVisit.time}</p></div>
              </div>
              <textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Tuliskan deskripsi kegiatan Anda..." rows={4} value={pendingVisit.description} onChange={(e) => setPendingVisit({...pendingVisit, description: e.target.value})} autoFocus />
              <div className="flex gap-3 pt-2">
                 <button onClick={() => setPendingVisit(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase">Batal</button>
                 <button onClick={confirmVisitLog} className="flex-[2] bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg">Simpan Log</button>
              </div>
           </div>
        </div>
      )}

      {authMode === 'GUEST' ? (
        <div className="min-h-screen bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-white rounded-[3rem] shadow-xl p-10 space-y-4 border-b-8 border-emerald-700 animate-in zoom-in">
              <Sprout size={72} className="text-emerald-700 mx-auto" />
              <h2 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight">PT LABA INDOAGRO NUSANTARA</h2>
              <p className="text-emerald-600 text-[10px] font-black tracking-[0.2em] italic -mt-2">NUTRISI PERTANIAN MODERN</p>
            </div>
            <form onSubmit={handleLogin} className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-4 text-left border border-slate-100">
               <h3 className="font-black text-slate-800 uppercase text-xs mb-2 flex items-center gap-2"><KeyRound size={16} /> Login Sistem</h3>
               <div className="space-y-3">
                  <div className="relative"><UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="text" placeholder="Username Pegawai" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} /></div>
                  <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="password" placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} /></div>
                  <div className="py-2 flex items-center gap-4"><div className="h-[1px] bg-slate-100 flex-1"></div><span className="text-[10px] text-slate-300 font-bold uppercase">Atau Admin</span><div className="h-[1px] bg-slate-100 flex-1"></div></div>
                  <div className="relative"><ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /><input type="password" placeholder="Sandi Admin Khusus" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={loginForm.adminPass} onChange={(e) => setLoginForm({...loginForm, adminPass: e.target.value})} /></div>
               </div>
               {loginError && <p className="text-xs text-rose-500 font-black text-center pt-2 animate-pulse">{loginError}</p>}
               <button type="submit" className="w-full bg-emerald-700 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase shadow-lg active:scale-95 transition-all mt-4 border-b-4 border-emerald-900">Masuk Sekarang</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <Header title={authMode === 'ADMIN' ? "Admin Portal" : isTeamViewMode ? "Dashboard Tim" : "Presensi Sales"} />
          <main className="max-w-md mx-auto p-4 text-left">
            {authMode === 'EMPLOYEE' && !selectedAdminUser && !isTeamViewMode && (
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl mb-6 animate-in slide-in-from-top-2 flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><User size={24}/></div>
                 <div className="text-left">
                    <p className="text-emerald-700 text-[9px] font-black uppercase opacity-60 tracking-wider">Laba Indoagro Nusantara</p>
                    <h2 className="text-lg font-black text-emerald-900 leading-tight">Halo, {currentUserData?.name}!</h2>
                 </div>
              </div>
            )}

            {/* TEAM MONITORING (VIEW-ONLY FOR EMPLOYEE MANAGERS) */}
            {isTeamViewMode && globalFilter.team === 'ALL' && !selectedAdminUser && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Pilih Tim Peninjauan</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {(authMode === 'EMPLOYEE' ? userAllowedTeams : teams).map(t => (
                      <button key={t.id} onClick={() => setGlobalFilter({...globalFilter, team: t.name})} className="w-full flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-emerald-400 group transition-all active:scale-[0.98] text-left shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><UsersRound size={28} /></div>
                          <div>
                            <p className="text-xl font-black text-slate-800 leading-tight">{t.name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">{employees.filter(e => e.team === t.name).length} Pegawai Terdaftar</p>
                          </div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
               </div>
            )}

            {/* EMPLOYEE INPUT TAB */}
            {activeTab === 'input' && authMode === 'EMPLOYEE' && !selectedAdminUser && !isTeamViewMode && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {!isLeaveMode ? (
                  <div className="bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Durasi Sesi</p>
                        <h3 className="text-5xl font-mono font-black text-slate-800 leading-none tracking-tight">{formData.isWorking ? elapsedTime : (formData.checkOut ? formatHMS(formData.workHours) : '00:00:00')}</h3>
                      </div>
                      {formData.photoCheckIn && <button onClick={() => setPreviewPhoto(formData.photoCheckIn)} className="w-16 h-16 rounded-2xl border-4 border-emerald-500 overflow-hidden shadow-xl bg-slate-100 active:scale-95 transition-transform"><img src={formData.photoCheckIn} className="w-full h-full object-cover" /></button>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50 relative z-10">
                      <div><p className="text-[10px] font-black text-slate-300 uppercase">Check-in</p><p className="text-xl font-black text-slate-700">{formData.checkIn || '--:--'}</p></div>
                      <div className="text-right"><p className="text-[10px] font-black text-slate-300 uppercase">Sekarang</p><p className="text-xl font-black text-emerald-700">{formatTimeFull(now)}</p></div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Status Kehadiran</p>
                        <h3 className="text-3xl font-black uppercase leading-tight">AJUAN CUTI / LIBUR</h3>
                        <div className="mt-6 pt-6 border-t border-blue-500/50">
                            <p className="text-xs font-black opacity-80 uppercase tracking-widest">{formData.leaveType}</p>
                            <p className="text-lg font-medium italic mt-2">"{formData.leaveNote || 'Tanpa keterangan'}"</p>
                        </div>
                    </div>
                    <Palmtree className="absolute -bottom-6 -right-6 opacity-10" size={180} />
                  </div>
                )}

                {!formData.isWorking && !formData.checkOut && (
                  <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-4">
                    <button onClick={() => setIsLeaveMode(!isLeaveMode)} className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all ${isLeaveMode ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-700'}`}>
                      {isLeaveMode ? <ArrowLeft size={16} /> : <Palmtree size={20} />}
                      {isLeaveMode ? 'Kembali ke Absen' : 'Ajukan Sesi Cuti / Libur'}
                    </button>
                    {isLeaveMode && (
                       <div className="space-y-4 pt-4 animate-in zoom-in-95 duration-200">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase px-1">Jenis Cuti/Libur</label>
                            <select className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold shadow-inner outline-none" value={formData.leaveType} onChange={(e) => setFormData({...formData, leaveType: e.target.value})}>{LEAVE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase px-1">Mulai</label><input type="date" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold shadow-inner" value={formData.leaveStartDate} onChange={(e) => setFormData({...formData, leaveStartDate: e.target.value})} /></div>
                             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase px-1">Selesai</label><input type="date" className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold shadow-inner" value={formData.leaveEndDate} onChange={(e) => setFormData({...formData, leaveEndDate: e.target.value})} /></div>
                          </div>
                          <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase px-1">Keterangan Tambahan</label><textarea className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm shadow-inner outline-none" placeholder="Alasan..." rows={3} value={formData.leaveNote} onChange={(e) => setFormData({...formData, leaveNote: e.target.value})} /></div>
                          <div className="grid grid-cols-2 gap-3 pt-2">
                             <button onClick={() => leaveInputRef.current?.click()} className="bg-blue-100 text-blue-700 py-5 rounded-2xl font-black text-[10px] uppercase flex flex-col items-center gap-1 border border-blue-200 active:scale-95 transition-all shadow-sm"><Camera size={24} /><span>BUKTI FOTO</span></button>
                             <button onClick={() => handleLeaveSubmit()} className="bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase flex flex-col items-center gap-1 active:scale-95 transition-all shadow-lg border-b-4 border-blue-800"><Send size={24} /><span>KIRIM SEKARANG</span></button>
                          </div>
                       </div>
                    )}
                  </div>
                )}

                {!isLeaveMode && (
                  <div className="space-y-4">
                    {!formData.isWorking && !formData.checkOut ? (
                        <button onClick={() => inInputRef.current?.click()} className="w-full bg-emerald-600 text-white py-8 rounded-[2rem] font-black shadow-2xl flex flex-col items-center gap-2 active:scale-95 transition-all border-b-8 border-emerald-800">
                            <Camera size={40} />
                            <span className="text-lg">AMBIL FOTO MASUK</span>
                            <span className="text-[10px] opacity-60 font-bold tracking-[0.2em]">VERIFIED CLOUD SYNC</span>
                        </button>
                    ) : formData.isWorking ? (
                        <button onClick={() => outInputRef.current?.click()} className="w-full bg-rose-600 text-white py-8 rounded-[2rem] font-black shadow-2xl flex flex-col items-center gap-2 active:scale-95 transition-all border-b-8 border-rose-800">
                            <Camera size={40} />
                            <span className="text-lg">AMBIL FOTO PULANG</span>
                            <span className="text-[10px] opacity-60 font-bold tracking-[0.2em]">SELESAIKAN SESI</span>
                        </button>
                    ) : (
                        <div className="bg-emerald-50 text-emerald-700 p-8 rounded-[2rem] text-center border-2 border-dashed border-emerald-200 font-black uppercase text-sm flex flex-col items-center gap-2">
                            <Check size={32} className="text-emerald-500" />
                            Sesi Hari Ini Sudah Diarsipkan
                        </div>
                    )}
                  </div>
                )}

                {!isLeaveMode && (
                  <section className={!formData.isWorking ? "opacity-30 pointer-events-none grayscale" : ""}>
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2"><MapPin size={14} /> Log Kunjungan Harian</h2>
                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-6 space-y-4">
                      {VISIT_TYPES.map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl ${ColorMap[item.color]} flex items-center justify-center shadow-sm border`}>{React.createElement(item.icon, { size: 24 })}</div>
                            <div>
                                <p className="text-base font-black text-slate-700 leading-tight">{item.label}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{formData.visits?.[item.key]?.length || 0} Dokumentasi</p>
                            </div>
                          </div>
                          <button onClick={() => { setActiveVisitType(item.key); visitInputRef.current?.click(); }} className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-md active:scale-90 transition-all border-b-4 border-emerald-800"><Camera size={16} className="inline mr-1" /> LOG</button>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ADMIN / MONITORING CONTENT */}
            {(authMode === 'ADMIN' || (authMode === 'TEAM_VIEW' && globalFilter.team !== 'ALL') || (authMode === 'EMPLOYEE' && isTeamViewMode && globalFilter.team !== 'ALL')) && !selectedAdminUser && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-xl space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-emerald-700 font-black"><Filter size={18} /><span className="text-xs uppercase tracking-widest leading-none">Filter Laporan</span></div>
                        <div className="flex gap-1">
                            <button onClick={() => setGlobalFilter({...globalFilter, period: 1})} className={`px-4 py-2 text-[10px] font-black rounded-full transition-all ${globalFilter.period === 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>01-15</button>
                            <button onClick={() => setGlobalFilter({...globalFilter, period: 2})} className={`px-4 py-2 text-[10px] font-black rounded-full transition-all ${globalFilter.period === 2 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>16-31</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <select className="bg-slate-50 border-none rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={globalFilter.month} onChange={(e) => setGlobalFilter({...globalFilter, month: parseInt(e.target.value)})}>{['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'].map((m, i) => (<option key={m} value={i}>{m}</option>))}</select>
                        <select className="bg-slate-50 border-none rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner" value={globalFilter.team} onChange={(e) => setGlobalFilter({...globalFilter, team: e.target.value})}><option value="ALL">SEMUA TIM</option>{(authMode === 'EMPLOYEE' ? userAllowedTeams : teams).map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                    </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-700 p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden border-b-4 border-emerald-900">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-2 leading-tight">Total Jam Kerja Tim</p>
                        <p className="text-2xl font-black relative z-10 leading-none">{formatHMS(statsByEmployee.reduce((a,b) => a + b.periodHours, 0))}</p>
                        <Clock className="absolute -right-4 -bottom-4 opacity-10" size={80} />
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl text-center text-emerald-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2 leading-tight">Total Visit Tim</p>
                        <p className="text-4xl font-black leading-none">{statsByEmployee.reduce((a,b) => a + b.periodVisits, 0)}</p>
                    </div>
                </div>

                <button onClick={exportToExcel} className="w-full bg-emerald-100 text-emerald-700 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border-2 border-emerald-200 active:scale-95 transition-all shadow-sm">
                    <Download size={20} /> EKSPOR LAPORAN EXCEL (.xls)
                </button>

                {authMode === 'ADMIN' && adminSubTab === 'teams' && (
                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FolderPlus size={16} /> Kelola Tim Kerja</h2>
                    <div className="flex gap-3">
                      <input className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm font-black outline-none shadow-inner focus:ring-2 focus:ring-blue-500" placeholder="Nama Tim Baru..." value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                      <button onClick={handleAddTeam} className="bg-blue-700 text-white p-4 rounded-2xl active:scale-95 transition-all shadow-lg border-b-4 border-blue-900"><Plus size={24} /></button>
                    </div>
                    <div className="space-y-3">
                      {teams.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-4 pl-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 group">
                          {editingTeam?.id === t.id ? (
                            <div className="flex items-center gap-2 flex-1 mr-2 animate-in zoom-in-95">
                                <input className="flex-1 bg-white border-2 border-blue-300 rounded-xl p-2 text-xs font-black outline-none" value={editTeamInput} onChange={(e) => setEditTeamInput(e.target.value)} />
                                <button onClick={handleSaveEditTeam} className="bg-emerald-600 text-white p-2 rounded-xl"><Check size={16} /></button>
                                <button onClick={() => setEditingTeam(null)} className="bg-slate-300 text-white p-2 rounded-xl"><X size={16} /></button>
                            </div>
                          ) : (<span className="text-sm font-black text-slate-700 uppercase">{t.name}</span>)}
                          <div className="flex gap-1">
                             <button onClick={() => { setEditingTeam(t); setEditTeamInput(t.name); }} className="text-slate-300 p-2 hover:text-blue-600 hover:bg-white rounded-xl transition-all"><Edit2 size={16} /></button>
                             <button onClick={() => handleDeleteTeam(t.id)} className="text-rose-300 p-2 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {authMode === 'ADMIN' && adminSubTab === 'accounts' && (
                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserPlus size={16} /> Registrasi Pegawai</h2>
                    <div className="bg-slate-50 p-6 rounded-[2rem] space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nama & Jabatan</label>
                        <input className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Nama Lengkap Pegawai" value={newEmployee.name} onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})} />
                        <select className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" value={newEmployee.jabatan} onChange={(e) => setNewEmployee({...newEmployee, jabatan: e.target.value})}>{JOB_TITLES.map(j => <option key={j} value={j}>{j}</option>)}</select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-1">Tim & Kredensial Login</label>
                        <select className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" value={newEmployee.team} onChange={(e) => setNewEmployee({...newEmployee, team: e.target.value})}><option value="">Pilih Tim Kerja...</option>{teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                        <div className="grid grid-cols-2 gap-3"><input className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Username" value={newEmployee.username} onChange={(e) => setNewEmployee({...newEmployee, username: e.target.value})} /><input className="bg-white border border-slate-200 rounded-2xl p-4 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm" placeholder="Password" value={newEmployee.password} onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})} /></div>
                      </div>
                      {ROLES_WITH_TEAM_ACCESS.includes(newEmployee.jabatan) && (
                        <div className="space-y-3 pt-3 border-t border-slate-200">
                           <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Hak Akses Monitoring</label>
                           <div className="grid grid-cols-2 gap-2">
                             {teams.map(t => (<button key={t.id} type="button" onClick={() => toggleTeamAccess(t.name, newEmployee, setNewEmployee)} className={`p-3 rounded-2xl border-2 text-[10px] font-black transition-all flex items-center justify-center gap-1 ${newEmployee.accessibleTeams?.includes(t.name) ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{newEmployee.accessibleTeams?.includes(t.name) ? <Check size={12} /> : <Plus size={12} />}{t.name}</button>))}
                           </div>
                        </div>
                      )}
                      <button onClick={handleAddEmployee} className="w-full bg-emerald-700 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase shadow-xl active:scale-95 transition-all border-b-4 border-emerald-900 mt-2">Daftarkan Pegawai</button>
                    </div>
                  </section>
                )}

                {(adminSubTab === 'stats' || authMode === 'TEAM_VIEW' || isTeamViewMode) && (
                  <section className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl space-y-6">
                     <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Daftar Pegawai & Aktivitas</h2>
                     <div className="space-y-4">
                       {statsByEmployee.map(emp => (
                         <div key={emp.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-emerald-200 transition-all group overflow-hidden">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex-1">
                                {authMode === 'ADMIN' && editingEmployee?.id === emp.id ? (
                                  <div className="space-y-3 pr-4 animate-in zoom-in-95">
                                     <input className="w-full bg-slate-50 border-2 border-emerald-300 rounded-2xl p-3 text-sm font-black outline-none focus:ring-2 focus:ring-emerald-500" value={editEmpInput.name} onChange={(e) => setEditEmpInput({...editEmpInput, name: e.target.value})} placeholder="Nama Lengkap" />
                                     <div className="grid grid-cols-2 gap-2">
                                        <select className="bg-slate-50 border-2 border-emerald-300 rounded-xl p-2 text-[10px] font-black outline-none" value={editEmpInput.jabatan} onChange={(e) => setEditEmpInput({...editEmpInput, jabatan: e.target.value})}>{JOB_TITLES.map(j => <option key={j} value={j}>{j}</option>)}</select>
                                        <select className="bg-slate-50 border-2 border-emerald-300 rounded-xl p-2 text-[10px] font-black outline-none" value={editEmpInput.team} onChange={(e) => setEditEmpInput({...editEmpInput, team: e.target.value})}>{teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
                                     </div>
                                     {/* Tambahan Opsi Edit Username & Password */}
                                     <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-emerald-600 uppercase ml-1">Username</p>
                                            <input className="w-full bg-slate-50 border-2 border-emerald-300 rounded-xl p-2 text-[10px] font-black outline-none" value={editEmpInput.username} onChange={(e) => setEditEmpInput({...editEmpInput, username: e.target.value})} placeholder="Username" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-emerald-600 uppercase ml-1">Password</p>
                                            <input className="w-full bg-slate-50 border-2 border-emerald-300 rounded-xl p-2 text-[10px] font-black outline-none" value={editEmpInput.password} onChange={(e) => setEditEmpInput({...editEmpInput, password: e.target.value})} placeholder="Password" />
                                        </div>
                                     </div>
                                     <div className="flex gap-2 pt-1">
                                        <button onClick={handleSaveEditEmployee} className="flex-1 bg-emerald-600 text-white p-3 rounded-2xl text-[10px] font-black shadow-lg">SIMPAN</button>
                                        <button onClick={() => setEditingEmployee(null)} className="flex-1 bg-slate-300 text-white p-3 rounded-2xl text-[10px] font-black">BATAL</button>
                                     </div>
                                  </div>
                                ) : (
                                  <div>
                                    <div className="flex items-center gap-2 mb-1"><p className="font-black text-slate-800 text-lg leading-tight">{emp.name}</p><span className="bg-emerald-50 text-emerald-700 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">{emp.team || 'OFFICE'}</span></div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">{emp.jabatan}</p>
                                    <div className="flex gap-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Hadir: <span className="text-emerald-600">{emp.periodHoursDisplay}</span></p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Cuti: <span className="text-blue-600">{emp.periodLeaveDays} HARI</span></p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {!editingEmployee && (
                                <div className="flex items-center gap-2">
                                   {/* ACTION BUTTONS (ONLY FOR ADMIN) */}
                                   {authMode === 'ADMIN' && (
                                       <>
                                        <button onClick={() => { setEditingEmployee(emp); setEditEmpInput({ ...emp }); }} className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                                       </>
                                   )}
                                   <button onClick={() => setSelectedAdminUser(emp)} className="p-4 text-emerald-600 bg-emerald-50 rounded-[1.5rem] active:scale-90 transition-all shadow-sm border border-emerald-100"><ChevronRight size={20} /></button>
                                </div>
                              )}
                           </div>
                           <div className="grid grid-cols-5 gap-2 pt-4 border-t border-slate-50">
                                {VISIT_TYPES.map(vt => (
                                    <div key={vt.key} className="text-center bg-slate-50/50 p-2 rounded-xl border border-transparent group-hover:border-slate-100 transition-colors">
                                        <p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-1">{vt.label}</p>
                                        <p className="text-sm font-black text-slate-600 leading-none">{emp.periodVisitTotals?.[vt.key] || 0}</p>
                                    </div>
                                ))}
                           </div>
                         </div>
                       ))}
                     </div>
                  </section>
                )}
              </div>
            )}

            {/* DETAIL LOG VIEWER */}
            {selectedAdminUser && (
               <div className="space-y-6 animate-in slide-in-from-right-8">
                 <div className="bg-emerald-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border-b-8 border-emerald-900">
                   <div className="relative z-10">
                     <p className="text-emerald-100 text-[10px] font-black uppercase mb-2 tracking-widest">Laporan Aktivitas: {selectedAdminUser.name}</p>
                     <h3 className="text-4xl font-black mb-6 leading-none">{selectedAdminUser.periodHoursDisplay} <span className="text-base font-normal opacity-70">Total Jam Kerja</span></h3>
                     <div className="grid grid-cols-5 gap-2 pt-6 border-t border-emerald-600/50">
                        {VISIT_TYPES.map(vt => (
                            <div key={vt.key} className="bg-white/10 backdrop-blur-sm p-2 rounded-xl text-center border border-white/10">
                                <p className="text-[7px] font-black uppercase opacity-60 mb-1 leading-none">{vt.label}</p>
                                <p className="text-sm font-black">{selectedAdminUser.periodVisitTotals?.[vt.key] || 0}</p>
                            </div>
                        ))}
                     </div>
                   </div>
                   <Sprout className="absolute -bottom-8 -right-8 opacity-10" size={160} />
                 </div>

                 <div className="space-y-4">
                   {selectedAdminUser.records.map(record => {
                     const isWork = record.type === 'WORK';
                     const allVisitsList = isWork && record.visits ? Object.entries(record.visits).flatMap(([type, items]) => items.map(v => ({...v, typeName: type.toUpperCase()}))) : [];
                     return (
                       <div key={record.id} className={`bg-white rounded-[2rem] p-6 border-2 shadow-xl space-y-6 ${isWork ? 'border-slate-100' : 'border-blue-100'} animate-in slide-in-from-bottom-4`}>
                         <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                           <div>
                             <p className="font-black text-slate-800 text-base leading-tight">{new Date(record.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                             <div className="flex gap-2 mt-2">
                                {isWork ? (
                                    <>
                                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full uppercase border border-emerald-100">Hadir: {formatHMS(record.workHours)}</span>
                                        <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase border border-blue-100">{allVisitsList.length} Visit</span>
                                    </>
                                ) : (
                                    <span className="text-[9px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase shadow-sm">JENIS CUTI: {record.leaveType}</span>
                                )}
                             </div>
                           </div>
                           {authMode === 'ADMIN' && <button onClick={() => handleDeleteRecord(record.id)} className="text-slate-200 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20}/></button>}
                         </div>

                         {!isWork && (
                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <p className="text-[10px] font-black text-blue-700 uppercase mb-1">Catatan Cuti:</p>
                                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">"{record.leaveNote || 'Tidak ada catatan tambahan.'}"</p>
                            </div>
                         )}

                         <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-slate-50 p-4 rounded-2xl shadow-inner border border-slate-100"><Clock size={16} className="text-emerald-500"/> IN: {record.checkIn || '-'}</div>
                            <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 bg-slate-50 p-4 rounded-2xl shadow-inner border border-slate-100"><LogOut size={16} className="text-rose-500"/> OUT: {record.checkOut || '-'}</div>
                         </div>

                         {isWork && allVisitsList.length > 0 && (
                            <div className="space-y-4 pt-2">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1"><ClipboardCheck size={14} className="text-emerald-600" /> Log Kunjungan Lapangan</p>
                               <div className="space-y-3">
                                  {allVisitsList.sort((a,b) => a.time.localeCompare(b.time)).map((visit, idx) => (
                                    <button key={idx} onClick={() => setPreviewDetail({ ...visit, name: selectedAdminUser.name, typeName: visit.typeName })} className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 flex items-center gap-4 hover:bg-white hover:border-emerald-400 transition-all group shadow-sm active:scale-[0.98]">
                                       <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md relative">
                                            <img src={visit.photo} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors flex items-center justify-center text-white opacity-0 group-hover:opacity-100"><Maximize2 size={16} /></div>
                                       </div>
                                       <div className="flex-1 min-w-0 text-left">
                                          <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tight">{visit.typeName}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{visit.time}</span>
                                          </div>
                                          <p className="text-sm text-slate-600 font-bold truncate leading-tight">{visit.description || 'Tanpa rincian.'}</p>
                                       </div>
                                       <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                    </button>
                                  ))}
                               </div>
                            </div>
                         )}

                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                           <div className="space-y-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest leading-none">Foto Masuk</p>
                                <button onClick={() => setPreviewPhoto(record.photoCheckIn)} className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-lg active:scale-95 transition-transform"><img src={record.photoCheckIn} className="w-full h-full object-cover" /></button>
                           </div>
                           {isWork && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest leading-none">Foto Pulang</p>
                                    {record.photoCheckOut ? (
                                        <button onClick={() => setPreviewPhoto(record.photoCheckOut)} className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-lg active:scale-95 transition-transform"><img src={record.photoCheckOut} className="w-full h-full object-cover" /></button>
                                    ) : (
                                        <div className="w-full aspect-[4/3] rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300"><Clock size={24} /></div>
                                    )}
                                </div>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
            )}

            {/* EMPLOYEE DASHBOARD / REKAP (WEEKLY CHARTS) */}
            {activeTab === 'dashboard' && authMode === 'EMPLOYEE' && !selectedAdminUser && !isTeamViewMode && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="bg-emerald-700 rounded-[2.5rem] p-8 text-white shadow-2xl border-b-8 border-emerald-900 relative overflow-hidden">
                   <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2 leading-none">Capaian Kerja Periode Ini</p>
                   <h3 className="text-5xl font-black mb-8 leading-none">{formatHMS(records.filter(r => r.employeeName === currentUserData?.name).reduce((a,c) => a + (c.workHours || 0), 0))}</h3>
                   <div className="grid grid-cols-2 gap-6 pt-8 border-t border-emerald-600/50">
                     <div className="text-left">
                        <p className="text-[10px] text-emerald-200 font-black uppercase tracking-tighter leading-none mb-2">Total Visit</p>
                        <p className="text-3xl font-black leading-none">{records.filter(r => r.employeeName === currentUserData?.name).reduce((a,c) => a + (c.type === 'WORK' && c.visits ? Object.values(c.visits).flat().length : 0), 0)} <span className="text-xs font-normal opacity-60">Foto</span></p>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] text-emerald-200 font-black uppercase tracking-tighter leading-none mb-2">Hari Absen</p>
                        <p className="text-3xl font-black leading-none">{records.filter(r => r.employeeName === currentUserData?.name).length} <span className="text-xs font-normal opacity-60">Log</span></p>
                     </div>
                   </div>
                   <TrendingUp className="absolute -bottom-6 -right-6 opacity-10" size={140} />
                 </div>
                 
                 {/* CHART 1: WEEKLY WORKING HOURS */}
                 <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={16} className="text-emerald-500" /> Grafik Jam Kerja Mingguan</h2>
                    <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-slate-100 pb-2">
                        {weeklyStats.map((stat, i) => {
                            const maxHeight = 10; // Max assume 10 hours for 100% height
                            const barHeight = Math.min(100, (stat.hours / maxHeight) * 100);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full bg-emerald-100 rounded-t-xl relative transition-all duration-500 hover:bg-emerald-300" style={{height: `${barHeight || 5}%`}}>
                                        {stat.hours > 0 && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-black whitespace-nowrap">{stat.hours.toFixed(1)}h</div>}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase">{stat.day}</span>
                                </div>
                            );
                        })}
                    </div>
                 </div>

                 {/* CHART 2: WEEKLY VISITS (DAILY ACCUMULATIVE) */}
                 <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl space-y-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={16} className="text-blue-500" /> Akumulasi Kegiatan Harian</h2>
                    <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-slate-100 pb-2">
                        {weeklyStats.map((stat, i) => {
                            const maxHeight = 15; // Max assume 15 visits for 100% height
                            const barHeight = Math.min(100, (stat.visits / maxHeight) * 100);
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div className="w-full bg-blue-100 rounded-t-xl relative transition-all duration-500 hover:bg-blue-300" style={{height: `${barHeight || 5}%`}}>
                                        {stat.visits > 0 && <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-black">{stat.visits}v</div>}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase">{stat.day}</span>
                                </div>
                            );
                        })}
                    </div>
                 </div>
               </div>
            )}
            
            {activeTab === 'history' && authMode === 'EMPLOYEE' && !selectedAdminUser && !isTeamViewMode && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Riwayat Kehadiran Pribadi</h2>
                {records.filter(r => r.employeeName === currentUserData?.name).sort((a,b) => b.date.localeCompare(a.date)).map(record => {
                  const isWork = record.type === 'WORK';
                  return (
                    <div key={record.id} className={`bg-white rounded-[2rem] p-6 border-2 shadow-sm space-y-4 ${isWork ? 'border-slate-100' : 'border-blue-100'} hover:shadow-md transition-all`}>
                      <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setPreviewPhoto(record.photoCheckIn)} className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-slate-100 flex-shrink-0"><img src={record.photoCheckIn} className="w-full h-full object-cover" /></button>
                            <div className="text-left">
                                <p className="font-black text-slate-800 text-base leading-tight">{new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest leading-none mt-1 ${isWork ? 'text-emerald-600' : 'text-blue-600'}`}>{isWork ? `DURASI: ${formatHMS(record.workHours)}` : `CUTI: ${record.leaveType}`}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteRecord(record.id)} className="text-slate-200 hover:text-rose-500 p-2 transition-colors"><Trash2 size={18} /></button>
                      </div>
                      {isWork && (
                        <div className="flex gap-4 text-[11px] font-black uppercase text-slate-400 px-1">
                            <span className="flex items-center gap-1"><Clock size={14} className="text-emerald-500" /> {record.checkIn}</span>
                            <span className="flex items-center gap-1"><LogOut size={14} className="text-rose-500" /> {record.checkOut || '--:--'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {records.filter(r => r.employeeName === currentUserData?.name).length === 0 && (
                    <div className="p-12 text-center text-slate-300 font-black uppercase text-xs tracking-widest bg-white rounded-[2.5rem] border-2 border-dashed">Belum ada riwayat</div>
                )}
              </div>
            )}
          </main>

          {/* BOTTOM NAVIGATION */}
          <nav className={`fixed bottom-0 left-0 right-0 py-5 px-8 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] flex justify-between max-w-md mx-auto rounded-t-[3rem] z-20 transition-all duration-500 border-t ${authMode === 'ADMIN' ? 'bg-slate-900 border-slate-800 shadow-emerald-500/10' : (isTeamViewMode || authMode === 'TEAM_VIEW') ? 'bg-emerald-900 border-emerald-800' : 'bg-white border-slate-100'}`}>
            {authMode === 'EMPLOYEE' ? (
              <div className="flex w-full justify-around items-center">
                 <button onClick={() => {setActiveTab('input'); setIsTeamViewMode(false); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'input' && !selectedAdminUser && !isTeamViewMode ? 'text-emerald-600 scale-125' : 'text-slate-300'}`}>
                    <Plus size={26} strokeWidth={activeTab === 'input' && !isTeamViewMode ? 3 : 2} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Absen</span>
                 </button>
                 <button onClick={() => {setActiveTab('dashboard'); setIsTeamViewMode(false); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'dashboard' && !isTeamViewMode ? 'text-emerald-600 scale-125' : 'text-slate-300'}`}>
                    <LayoutDashboard size={26} strokeWidth={activeTab === 'dashboard' && !isTeamViewMode ? 3 : 2} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Rekap</span>
                 </button>
                 {hasTeamAccess && (
                    <button onClick={() => {setIsTeamViewMode(true); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${isTeamViewMode ? 'text-blue-500 scale-125' : 'text-slate-300'}`}>
                        <UsersRound size={26} strokeWidth={isTeamViewMode ? 3 : 2} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Tim</span>
                    </button>
                 )}
                 <button onClick={() => {setActiveTab('history'); setIsTeamViewMode(false); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'history' && !isTeamViewMode ? 'text-emerald-600 scale-125' : 'text-slate-300'}`}>
                    <History size={26} strokeWidth={activeTab === 'history' && !isTeamViewMode ? 3 : 2} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Arsip</span>
                 </button>
              </div>
            ) : authMode === 'ADMIN' ? (
              <div className="flex w-full justify-around items-center">
                 <button onClick={() => {setAdminSubTab('teams'); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${adminSubTab === 'teams' && !selectedAdminUser ? 'text-emerald-400 scale-125' : 'text-slate-500'}`}>
                    <UsersRound size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Tim</span>
                 </button>
                 <button onClick={() => {setAdminSubTab('accounts'); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${adminSubTab === 'accounts' && !selectedAdminUser ? 'text-emerald-400 scale-125' : 'text-slate-500'}`}>
                    <UserPlus size={24} /><span className="text-[9px] font-black uppercase tracking-widest">User</span>
                 </button>
                 <button onClick={() => {setAdminSubTab('stats'); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${adminSubTab === 'stats' && !selectedAdminUser ? 'text-emerald-400 scale-125' : 'text-slate-500'}`}>
                    <BarChart size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Data</span>
                 </button>
              </div>
            ) : (
              <div className="flex w-full justify-around items-center">
                 <button onClick={() => {setAuthMode('TEAM_VIEW'); setIsTeamViewMode(true); setGlobalFilter({...globalFilter, team: 'ALL'}); setSelectedAdminUser(null);}} className={`flex flex-col items-center gap-1 transition-all ${authMode === 'TEAM_VIEW' && !selectedAdminUser ? 'text-white scale-125' : 'text-emerald-400'}`}>
                    <UsersRound size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Monitoring</span>
                 </button>
                 <button onClick={handleLogout} className="flex flex-col items-center gap-1 opacity-60 text-emerald-300">
                    <LogOut size={24} /><span className="text-[9px] font-black uppercase tracking-widest">Keluar</span>
                 </button>
              </div>
            )}
          </nav>
        </>
      )}
    </div>
  );
};

export default App;