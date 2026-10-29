import { useState, useEffect } from 'react';
import { transactionsAPI, categoriesAPI, goalsAPI, authAPI, User, Transaction, Category, Summary, Goal } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Plus, Trash2, LogOut, Target, DollarSign, Calendar, Edit2 } from 'lucide-react';

export default function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<Summary>({ income: 0, expense: 0, balance: 0, salary: 0, available: 0 });
  const [showTxModal, setShowTxModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [txForm, setTxForm] = useState({ amount: '', description: '', type: 'expense', categoryId: '', date: new Date().toISOString().split('T')[0] });
  const [goalForm, setGoalForm] = useState({ name: '', targetAmount: '', savedAmount: '0', deadline: '' });
  const [salaryInput, setSalaryInput] = useState('');

  const loadData = async () => {
    try {
      const [txData, catData, goalData, summaryData] = await Promise.all([
        transactionsAPI.list(),
        categoriesAPI.list(),
        goalsAPI.list(),
        transactionsAPI.getSummary()
      ]);
      setTransactions(txData.transactions);
      setCategories(catData.categories);
      setGoals(goalData.goals);
      setSummary(summaryData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddTransaction = async (e: any) => {
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
    setSalaryInput('');
    loadData();
  };

  const handleDeleteTx = async (id: string) => {
    if (confirm('Excluir transação?')) {
      await transactionsAPI.delete(id);
      loadData();
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('Excluir meta?')) {
      await goalsAPI.delete(id);
      loadData();
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const pieData = categories.map(c => ({
    name: c.name,
    value: transactions.filter(t => t.type === 'expense' && t.category?.id === c.id).reduce((s, t) => s + t.amount, 0),
    color: c.color
  })).filter(d => d.value > 0);

  const budgetData = [{ name: 'Salário', value: summary.salary, fill: '#3b82f6' }, { name: 'Gastos', value: summary.expense, fill: '#ef4444' }, { name: 'Disponível', value: summary.available, fill: '#22c55e' }];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Wallet className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">FinancePRO</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">Olá, {user.name}</span>
              <button onClick={onLogout} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Salário Mensal</h3>
              <button onClick={() => { setSalaryInput(String(user.monthlySalary || 0)); setShowSalaryModal(true); }} className="p-1 hover:bg-blue-50 rounded text-blue-600">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-2xl font-bold text-blue-600">{fmt(summary.salary)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Receitas Extras</h3>
              <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            </div>
            <p className="text-2xl font-bold text-green-600">{fmt(summary.income)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total de Gastos</h3>
              <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            </div>
            <p className="text-2xl font-bold text-red-600">{fmt(summary.expense)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Disponível</h3>
              <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
            </div>
            <p className={`text-2xl font-bold ${summary.available >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(summary.available)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento do Mês</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Target className="w-6 h-6 text-blue-600" /> Metas de Compra</h2>
            <button onClick={() => setShowGoalModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Nova Meta
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">Nenhuma meta cadastrada ainda.</div>
            ) : (
              goals.map(goal => {
                const progress = Math.min((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100, 100);
                return (
                  <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-semibold text-gray-900">{goal.name}</h4>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-500">{fmt(Number(goal.savedAmount))} de {fmt(Number(goal.targetAmount))}</span>
                      <span className="font-medium text-blue-600">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Transações Recentes</h3>
            <button onClick={() => setShowTxModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus className="w-4 h-4" /> Nova Transação
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhuma transação encontrada.</div>
            ) : (
              transactions.slice(0, 10).map(t => (
                <div key={t.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                        {t.category && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t.category.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} {fmt(t.amount)}
                    </span>
                    <button onClick={() => handleDeleteTx(t.id)} className="text-gray-400 hover:text-red-500 transition">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {showTxModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Nova Transação</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setTxForm({...txForm, type: 'expense'})} className={`py-3 rounded-lg font-medium transition ${txForm.type === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Despesa</button>
                <button type="button" onClick={() => setTxForm({...txForm, type: 'income'})} className={`py-3 rounded-lg font-medium transition ${txForm.type === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Receita</button>
              </div>
              <input type="number" step="0.01" placeholder="Valor" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <input type="text" placeholder="Descrição" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <select value={txForm.categoryId} onChange={e => setTxForm({...txForm, categoryId: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTxModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Nova Meta de Compra</h3>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <input type="text" placeholder="Nome da meta (ex: iPhone 15)" value={goalForm.name} onChange={e => setGoalForm({...goalForm, name: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <input type="number" step="0.01" placeholder="Valor alvo" value={goalForm.targetAmount} onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <input type="number" step="0.01" placeholder="Já economizado" value={goalForm.savedAmount} onChange={e => setGoalForm({...goalForm, savedAmount: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="date" value={goalForm.deadline} onChange={e => setGoalForm({...goalForm, deadline: e.target.value})} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Criar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Definir Salário Mensal</h3>
            <form onSubmit={handleUpdateSalary} className="space-y-4">
              <input type="number" step="0.01" placeholder="Seu salário mensal" value={salaryInput} onChange={e => setSalaryInput(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSalaryModal(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
