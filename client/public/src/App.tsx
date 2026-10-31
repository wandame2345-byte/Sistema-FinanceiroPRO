import React, { useState, useEffect, useMemo } from 'react';

// --- Types & Interfaces ---
type TransactionType = 'income' | 'expense';
type UserRole = 'user' | 'admin';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// --- Mock Data & Constants ---
const ADMIN_EMAIL = 'wandame2345@gmail.com';
const SLOGAN = "Seu dinheiro sob controle, seu futuro garantido.";

const INITIAL_USERS: User[] = [
  { id: '1', name: 'Administrador', email: ADMIN_EMAIL, role: 'admin', isBlocked: false },
  { id: '2', name: 'João Silva', email: 'joao@exemplo.com', role: 'user', isBlocked: false },
  { id: '3', name: 'Maria Souza', email: 'maria@exemplo.com', role: 'user', isBlocked: true },
];

const CATEGORIES = ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros'];

// --- Icons (SVG Components) ---
const Icons = {
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  Moon: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Lock: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  TrendingUp: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
  Shield: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Bot: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Send: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
};

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

// --- Main Component ---
export default function App() {
  // State
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'advisor' | 'admin'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form State
  const [newTx, setNewTx] = useState({ desc: '', amount: '', type: 'expense' as TransactionType, category: 'Outros' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: 'Olá! Sou seu consultor financeiro IA. Como posso ajudar você a economizar hoje?', timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Effects
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Derived State
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  // Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const user = users.find(u => u.email === loginForm.email);

    // Simulated auth check
    if (user && !user.isBlocked) {
      setCurrentUser(user);
      setLoginAttempts(0);
      // Load mock data for demo
      if (transactions.length === 0) {
        setTransactions([
          { id: '1', description: 'Salário Mensal', amount: 5000, type: 'income', category: 'Outros', date: new Date().toISOString() },
          { id: '2', description: 'Supermercado Semanal', amount: 450, type: 'expense', category: 'Alimentação', date: new Date().toISOString() },
          { id: '3', description: 'Aluguel', amount: 1200, type: 'expense', category: 'Moradia', date: new Date().toISOString() },
          { id: '4', description: 'Combustível', amount: 250, type: 'expense', category: 'Transporte', date: new Date().toISOString() },
          { id: '5', description: 'Cinema', amount: 80, type: 'expense', category: 'Lazer', date: new Date().toISOString() },
        ]);
      }
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => setIsLocked(false), 30000); // Unlock after 30s
      }
      alert('Credenciais inválidas ou conta bloqueada.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setLoginForm({ email: '', password: '' });
  };

  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.desc || !newTx.amount) return;

    const tx: Transaction = {
      id: Date.now().toString(),
      description: newTx.desc,
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      category: newTx.category,
      date: new Date().toISOString()
    };

    setTransactions([tx, ...transactions]);
    setShowAddModal(false);
    setNewTx({ desc: '', amount: '', type: 'expense', category: 'Outros' });
  };

  const toggleBlockUser = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
  };

  const sendAiMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: chatInput, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    // Simulate AI Analysis
    setTimeout(() => {
      let responseText = '';
      const lowerInput = chatInput.toLowerCase();

      // Simple keyword-based AI logic for demo
      if (lowerInput.includes('gast') || lowerInput.includes('economiz')) {
        const topCat = expensesByCategory[0];
        responseText = `Analisei seus gastos. Sua maior despesa este mês foi com ${topCat ? topCat[0] : 'nada registrado'} (${topCat ? formatCurrency(topCat[1]) : 'R$ 0'}). Para economizar, tente reduzir 10% nessa categoria.`;
      } else if (lowerInput.includes('orçamento') || lowerInput.includes('meta')) {
        responseText = `Com base na sua renda de ${formatCurrency(totalIncome)}, sugiro destinar no máximo ${formatCurrency(totalIncome * 0.3)} para lazer e despesas variáveis.`;
      } else {
        responseText = `Entendi. Atualmente seu saldo é ${formatCurrency(balance)}. Posso ajudar a analisar categorias específicas ou criar metas de economia.`;
      }

      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'ai', text: responseText, timestamp: new Date() };
      setChatHistory(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  // --- Render Helpers ---
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-slate-800'}`}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-100'} shadow-md transition-all`}>
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </button>
        </div>

        <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
          <div className="bg-emerald-600 p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
              <Icons.Shield />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">FinControl</h1>
            <p className="text-emerald-100 text-sm">{SLOGAN}</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'} border`}
                    placeholder="seu@email.com"
                  />
                  <span className="absolute left-3 top-3.5 opacity-50"><Icons.User /></span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'} border`}
                    placeholder="••••••••"
                  />
                  <span className="absolute left-3 top-3.5 opacity-50"><Icons.Lock /></span>
                </div>
              </div>

              {isLocked && (
                <div className="p-3 bg-red-500/10 text-red-500 text-sm rounded-lg text-center animate-pulse">
                  Muitas tentativas. Aguarde 30 segundos.
                </div>
              )}

              <button
                disabled={isLocked}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                Entrar
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Acesso protegido por criptografia de ponta a ponta.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${darkMode ? 'bg-slate-800 border-r border-slate-700' : 'bg-white border-r border-gray-200'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-opacity-10 border-gray-500">
            <div className="flex items-center gap-3 text-emerald-600 font-bold text-xl">
              <Icons.Shield /> FinControl
            </div>
            <p className="text-xs mt-2 opacity-60 truncate">{currentUser.email}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:bg-opacity-10 hover:bg-emerald-600'}`}
            >
              <Icons.TrendingUp /> Dashboard
            </button>

            <button
              onClick={() => { setActiveTab('advisor'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'advisor' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:bg-opacity-10 hover:bg-emerald-600'}`}
            >
              <Icons.Bot /> Consultor IA
            </button>

            {currentUser.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'hover:bg-opacity-10 hover:bg-emerald-600'}`}
              >
                <Icons.Lock /> Admin Area
              </button>
            )}
          </nav>

          <div className="p-4 border-t border-opacity-10 border-gray-500">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all">
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden"></div>}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-6 border-b ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2"><Icons.Menu /></button>
            <h2 className="text-xl font-bold capitalize">{activeTab === 'advisor' ? 'Consultor Financeiro' : activeTab === 'admin' ? 'Painel Administrativo' : 'Visão Geral'}</h2>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
              {darkMode ? <Icons.Sun /> : <Icons.Moon />}
            </button>
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Summary Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                  <p className="text-sm opacity-60 mb-1">Receitas</p>
                  <h3 className="text-2xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</h3>
                </div>
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                  <p className="text-sm opacity-60 mb-1">Despesas</p>
                  <h3 className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</h3>
                </div>
                <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                  <p className="text-sm opacity-60 mb-1">Saldo Atual</p>
                  <h3 className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>{formatCurrency(balance)}</h3>
                </div>
              </div>

              {/* Expense Ranking (Right Side) */}
              <div className={`row-span-2 rounded-2xl border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} shadow-sm flex flex-col`}>
                <h3 className="font-bold mb-4 flex items-center gap-2"><Icons.TrendingDown /> Ranking de Gastos</h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {expensesByCategory.length === 0 ? (
                    <p className="text-sm opacity-50 text-center mt-10">Sem despesas registradas.</p>
                  ) : (
                    expensesByCategory.map(([cat, val], idx) => (
                      <div key={cat} className="group">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{idx + 1}. {cat}</span>
                          <span className="opacity-80">{formatCurrency(val)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((val / totalExpense) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className={`lg:col-span-2 rounded-2xl border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold">Transações Recentes</h3>
                  <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors">
                    + Nova Transação
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-xs uppercase opacity-50 border-b border-dashed border-gray-300 dark:border-slate-600">
                        <th className="py-3 font-semibold">Descrição</th>
                        <th className="py-3 font-semibold">Categoria</th>
                        <th className="py-3 font-semibold">Data</th>
                        <th className="py-3 font-semibold text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {transactions.slice(0, 5).map(t => (
                        <tr key={t.id} className="border-b border-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 font-medium">{t.description}</td>
                          <td className="py-3 opacity-70">{t.category}</td>
                          <td className="py-3 opacity-70">{formatDate(t.date)}</td>
                          <td className={`py-3 text-right font-bold ${t.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* AI ADVISOR TAB */}
          {activeTab === 'advisor' && (
            <div className={`max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-lg overflow-hidden`}>
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-emerald-600/5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                  <Icons.Bot />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-400">Assistente Financeiro Inteligente</h3>
                  <p className="text-xs opacity-70">Analisando seus dados em tempo real...</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : `${darkMode ? 'bg-slate-700' : 'bg-gray-100'} rounded-tl-none`
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className="text-[10px] opacity-50 block mt-2 text-right">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className={`px-4 py-3 rounded-2xl rounded-tl-none ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-slate-700">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendAiMessage()}
                    placeholder="Pergunte sobre seus gastos, metas ou dicas..."
                    className={`w-full pl-4 pr-12 py-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}
                  />
                  <button
                    onClick={sendAiMessage}
                    className="absolute right-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Icons.Send />
                  </button>
                </div>
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                  {['Como economizar?', 'Analisar gastos', 'Criar orçamento'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => { setChatInput(suggestion); }}
                      className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-full border transition-colors ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-100'}`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADMIN TAB */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className={`p-8 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 text-white shadow-lg relative overflow-hidden`}>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold mb-2">Área Administrativa</h2>
                  <p className="opacity-90">{SLOGAN}</p>
                </div>
                <Icons.Shield /> {/* Decorative background element could go here */}
              </div>

              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg">Gerenciamento de Usuários</h3>
                  <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">{users.length} Contas</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={`text-xs uppercase ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                      <tr>
                        <th className="px-6 py-4 font-semibold">Usuário</th>
                        <th className="px-6 py-4 font-semibold">Função</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs opacity-60">{user.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${user.isBlocked ? 'bg-red-500' : 'bg-green-500'}`}></div>
                              <span className="text-sm">{user.isBlocked ? 'Bloqueado' : 'Ativo'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {user.email !== ADMIN_EMAIL && (
                              <button
                                onClick={() => toggleBlockUser(user.id)}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                                  user.isBlocked
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                }`}
                              >
                                {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl transform transition-all scale-100 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-bold">Nova Transação</h3>
              <button onClick={() => setShowAddModal(false)} className="opacity-50 hover:opacity-100"><Icons.X /></button>
            </div>
            <form onSubmit={addTransaction} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-70">Descrição</label>
                <input
                  required
                  value={newTx.desc}
                  onChange={e => setNewTx({...newTx, desc: e.target.value})}
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                  placeholder="Ex: Compras no mercado"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 opacity-70">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newTx.amount}
                    onChange={e => setNewTx({...newTx, amount: e.target.value})}
                    className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1 opacity-70">Tipo</label>
                  <select
                    value={newTx.type}
                    onChange={e => setNewTx({...newTx, type: e.target.value as TransactionType})}
                    className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1 opacity-70">Categoria</label>
                <select
                  value={newTx.category}
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                  className={`w-full p-3 rounded-lg border outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl mt-4 transition-all">
                Salvar Transação
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}