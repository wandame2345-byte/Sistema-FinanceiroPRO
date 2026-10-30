import { useState, useEffect } from 'react';
import { transactionsAPI, categoriesAPI, goalsAPI, authAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, LogOut, Target, DollarSign, Calendar, Edit2, Sun, Moon, Download, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Dashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ income: 0, expense: 0, balance: 0, salary: 0, available: 0 });
  const [darkMode, setDarkMode] = useState(false);
  
  // Filtros
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Modais
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  
  // Forms
  const [txForm, setTxForm] = useState({ amount: '', description: '', type: 'expense', categoryId: '', date: new Date().toISOString().split('T')[0] });
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', savedAmount: '0', deadline: '' });
  const [salaryInput, setSalaryInput] = useState('');

  const loadData = async () => {
    try {
      const [txData, catData, goalData, summaryData] = await Promise.all([
        transactionsAPI.list(), categoriesAPI.list(), goalsAPI.list(), transactionsAPI.getSummary()
      ]);
      setTransactions(txData.transactions);
      setCategories(catData.categories);
      setGoals(goalData.goals);
      setSummary(summaryData);
    } catch (error) { console.error('Erro:', error); }
  };

  useEffect(() => { loadData(); }, []);

  // Filtrar transações pelo mês/ano selecionado
  const filteredTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear;
  });

  // Recalcular resumo baseado no filtro
  const filteredSummary = {
    income: filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    expense: filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    salary: summary.salary, // Salário é fixo mensal
    available: summary.salary + filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) - filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  };

  const handleAddTx = async (e: any) => {
    e.preventDefault();
    await transactionsAPI.create({ ...txForm, amount: parseFloat(txForm.amount), categoryId: txForm.categoryId || undefined });
    setShowTxModal(false);
    setTxForm({ amount: '', description: '', type: 'expense', categoryId: '', date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleAddGoal = async (e: any) => {
    e.preventDefault();
    await goalsAPI.create({ ...goalForm, targetAmount: parseFloat(goalForm.targetAmount), savedAmount: parseFloat(goalForm.savedAmount) });
    setShowGoalModal(false);
    setGoalForm({ name: '', targetAmount: '', savedAmount: '0', deadline: '' });
    loadData();
  };

  const handleUpdateSalary = async (e: any) => {
    e.preventDefault();
    await authAPI.updateSalary(parseFloat(salaryInput));
    setShowSalaryModal(false);
    loadData();
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const pieData = categories.map((c: any) => ({
    name: c.name,
    value: filteredTransactions.filter((t: any) => t.type === 'expense' && t.category?.id === c.id).reduce((s: number, t: any) => s + Number(t.amount), 0),
    color: c.color
  })).filter((d: any) => d.value > 0);

  const budgetData = [
    { name: 'Salário', value: filteredSummary.salary, fill: darkMode ? '#34d399' : '#059669' },
    { name: 'Gastos', value: filteredSummary.expense, fill: darkMode ? '#f87171' : '#dc2626' },
    { name: 'Disponível', value: filteredSummary.available, fill: darkMode ? '#60a5fa' : '#2563eb' }
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(filterYear, filterMonth - 1).toLocaleString('pt-BR', { month: 'long' });
    
    // Cabeçalho
    doc.setFillColor(5, 150, 105); // Verde Emerald
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("SISTEMA FINANCEIRO PRO", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Relatório de ${monthName} ${filterYear}`, 105, 30, { align: 'center' });

    // Resumo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Resumo Financeiro", 14, 55);
    
    doc.setFontSize(11);
    doc.text(`Salário Mensal: ${fmt(filteredSummary.salary)}`, 14, 65);
    doc.text(`Receitas Extras: ${fmt(filteredSummary.income)}`, 14, 72);
    doc.text(`Total de Gastos: ${fmt(filteredSummary.expense)}`, 14, 79);
    doc.setFont(undefined, 'bold');
    doc.text(`Saldo Disponível: ${fmt(filteredSummary.available)}`, 14, 86);
    doc.setFont(undefined, 'normal');

    // Tabela de Transações
    const tableData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.description,
      t.category?.name || '-',
      t.type === 'income' ? 'Receita' : 'Despesa',
      fmt(Number(t.amount))
    ]);

    (doc as any).autoTable({
      startY: 95,
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105] }
    });

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('© 2026 Sistema FinanceiroPRO. Made With ❤ and ☕ by Wandame Aguiar', 105, 290, { align: 'center' });
    }

    doc.save(`Relatorio_Financeiro_${monthName}_${filterYear}.pdf`);
  };

  // Classes condicionais para Tema Escuro
  const bgMain = darkMode ? 'bg-slate-900' : 'bg-gray-50';
  const bgCard = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textMuted = darkMode ? 'text-slate-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-slate-700' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      <nav className={`${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Wallet className={`w-8 h-8 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className={`text-xl font-bold ${textMain}`}>SISTEMA FINANCEIRO <span className="text-emerald-500">PRO</span></span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2 rounded-full ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-gray-100 text-gray-600'} hover:opacity-80 transition`}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <span className={`text-sm ${textMuted} hidden sm:block`}>Olá, {user.name}</span>
              <button onClick={onLogout} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-600'}`}><LogOut className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filtros e Ações */}
        <div className={`flex flex-col md:flex-row justify-between items-center mb-8 p-4 rounded-xl ${bgCard} border shadow-sm gap-4`}>
          <div className="flex items-center gap-2">
            <Filter className={`w-5 h-5 ${textMuted}`} />
            <span className={`font-medium ${textMain}`}>Filtrar por:</span>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(Number(e.target.value))}
              className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-700'} outline-none`}
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{new Date(2026, m-1).toLocaleString('pt-BR', {month:'long'})}</option>)}
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className={`p-2 rounded-lg border ${darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-700'} outline-none`}
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
          <button onClick={generatePDF} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md">
            <Download className="w-4 h-4" /> Baixar PDF do Mês
          </button>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${textMuted} text-sm font-medium`}>Salário Mensal</h3>
              <button onClick={() => { setSalaryInput(String(user.monthlySalary || 0)); setShowSalaryModal(true); }} className={`p-1 ${darkMode ? 'hover:bg-slate-700 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'} rounded`}><Edit2 className="w-4 h-4" /></button>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmt(filteredSummary.salary)}</p>
          </div>
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${textMuted} text-sm font-medium`}>Receitas Extras</h3>
              <div className={`p-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} rounded-lg`}><TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} /></div>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{fmt(filteredSummary.income)}</p>
          </div>
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${textMuted} text-sm font-medium`}>Total de Gastos</h3>
              <div className={`p-2 ${darkMode ? 'bg-red-900/30' : 'bg-red-100'} rounded-lg`}><TrendingDown className={`w-5 h-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} /></div>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{fmt(filteredSummary.expense)}</p>
          </div>
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${textMuted} text-sm font-medium`}>Disponível</h3>
              <div className={`p-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} rounded-lg`}><DollarSign className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} /></div>
            </div>
            <p className={`text-2xl font-bold ${filteredSummary.available >= 0 ? (darkMode ? 'text-blue-400' : 'text-blue-600') : 'text-red-500'}`}>{fmt(filteredSummary.available)}</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${textMain} mb-4`}>Orçamento do Mês</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <YAxis stroke={darkMode ? '#94a3b8' : '#6b7280'} />
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#fff' : '#000' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
            <h3 className={`text-lg font-semibold ${textMain} mb-4`}>Gastos por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e5e7eb', color: darkMode ? '#fff' : '#000' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Metas */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-xl font-bold ${textMain} flex items-center gap-2`}><Target className={`w-6 h-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} /> Metas de Compra</h2>
            <button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"><Plus className="w-4 h-4" /> Nova Meta</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.length === 0 ? (
              <div className={`col-span-full ${bgCard} p-8 rounded-xl border text-center ${textMuted}`}>Nenhuma meta cadastrada.</div>
            ) : (
              goals.map((goal: any) => {
                const progress = Math.min((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100, 100);
                return (
                  <div key={goal.id} className={`${bgCard} p-6 rounded-xl shadow-sm border`}>
                    <div className="flex justify-between items-start mb-4">
                      <h4 className={`font-semibold ${textMain}`}>{goal.name}</h4>
                      <button onClick={() => { if(confirm('Excluir?')) goalsAPI.delete(goal.id).then(loadData); }} className={`${textMuted} hover:text-red-500`}><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className={textMuted}>{fmt(Number(goal.savedAmount))} de {fmt(Number(goal.targetAmount))}</span>
                      <span className={`font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{progress.toFixed(0)}%</span>
                    </div>
                    <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-gray-200'} rounded-full h-2.5`}>
                      <div className="bg-emerald-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Transações */}
        <div className={`${bgCard} rounded-xl shadow-sm border overflow-hidden`}>
          <div className={`p-6 border-b ${borderColor} flex justify-between items-center`}>
            <h3 className={`text-lg font-semibold ${textMain}`}>Transações do Período</h3>
            <button onClick={() => setShowTxModal(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-md"><Plus className="w-4 h-4" /> Nova Transação</button>
          </div>
          <div className={`divide-y ${borderColor}`}>
            {filteredTransactions.length === 0 ? (
              <div className={`p-8 text-center ${textMuted}`}>Nenhuma transação neste período.</div>
            ) : (
              filteredTransactions.slice(0, 10).map((t: any) => (
                <div key={t.id} className={`p-4 ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'} transition flex items-center justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'income' ? (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600') : (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600')}`}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={`font-medium ${textMain}`}>{t.description}</p>
                      <div className={`flex items-center gap-2 text-xs ${textMuted} mt-1`}>
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        {t.category && <span className={`px-2 py-0.5 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>{t.category.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${t.type === 'income' ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>{t.type === 'income' ? '+' : '-'} {fmt(Number(t.amount))}</span>
                    <button onClick={() => { if(confirm('Excluir?')) transactionsAPI.delete(t.id).then(loadData); }} className={`${textMuted} hover:text-red-500`}><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rodapé Personalizado */}
        <footer className={`mt-12 py-6 text-center border-t ${borderColor}`}>
          <p className={`${textMuted} text-sm`}>
            © 2026 Sistema FinanceiroPRO . All rights reserved. <br/>
            Made With ❤ and ☕ by <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Wandame Aguiar</span>
          </p>
        </footer>
      </main>

      {/* Modais (mantidos iguais, mas com ajuste de cor se necessário - simplificado para o exemplo) */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} rounded-xl w-full max-w-md p-6 shadow-xl`}>
            <h3 className="text-xl font-bold mb-6">Nova Transação</h3>
            <form onSubmit={handleAddTx} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setTxForm({...txForm, type: 'expense'})} className={`py-3 rounded-lg font-medium ${txForm.type === 'expense' ? 'bg-red-600 text-white' : (darkMode ? 'bg-slate-700' : 'bg-gray-100')}`}>Despesa</button>
                <button type="button" onClick={() => setTxForm({...txForm, type: 'income'})} className={`py-3 rounded-lg font-medium ${txForm.type === 'income' ? 'bg-green-600 text-white' : (darkMode ? 'bg-slate-700' : 'bg-gray-100')}`}>Receita</button>
              </div>
              <input type="number" step="0.01" placeholder="Valor" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <input type="text" placeholder="Descrição" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <select value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`}>
                <option value="">Sem categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTxModal(false)} className={`flex-1 py-3 border rounded-lg ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} rounded-xl w-full max-w-md p-6 shadow-xl`}>
            <h3 className="text-xl font-bold mb-6">Nova Meta</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <input type="text" placeholder="Nome (ex: iPhone)" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <input type="number" step="0.01" placeholder="Valor alvo" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <input type="number" step="0.01" placeholder="Já economizado" value={goalForm.savedAmount} onChange={e => setGoalForm({...goalForm, savedAmount: e.target.value})} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGoalModal(false)} className={`flex-1 py-3 border rounded-lg ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Criar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'} rounded-xl w-full max-w-md p-6 shadow-xl`}>
            <h3 className="text-xl font-bold mb-6">Definir Salário</h3>
            <form onSubmit={handleUpdateSalary} className="space-y-4">
              <input type="number" step="0.01" placeholder="Salário mensal" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} className={`w-full p-3 border rounded-lg outline-none ${darkMode ? 'bg-slate-700 border-slate-600' : 'border-gray-300'}`} required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSalaryModal(false)} className={`flex-1 py-3 border rounded-lg ${darkMode ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-300 hover:bg-gray-50'}`}>Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}