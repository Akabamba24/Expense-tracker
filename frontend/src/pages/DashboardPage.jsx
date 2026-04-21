import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { budgetApi, expenseApi } from '../services/api.js'

const categoryOptions = ['Food', 'Rent', 'Transport', 'Entertainment', 'Utilities', 'Business Expense', 'Other']

const emptyExpense = {
  text: '',
  amount: '',
  category: 'Food',
}

function monthKeyFromDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function DashboardPage() {
  const [expenses, setExpenses] = useState([])
  const [formData, setFormData] = useState(emptyExpense)
  const [editingId, setEditingId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [budgetValue, setBudgetValue] = useState('')
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [budgetRecord, setBudgetRecord] = useState({ monthKey: monthKeyFromDate(new Date()), amount: 0, hasBudget: false })
  const [budgetHistory, setBudgetHistory] = useState([])
  const [isBudgetEditorOpen, setIsBudgetEditorOpen] = useState(true)

  const currentMonthKey = useMemo(() => monthKeyFromDate(new Date()), [])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [expenseData, budgetData, historyData] = await Promise.all([
          expenseApi.list(),
          budgetApi.get(currentMonthKey),
          budgetApi.history(),
        ])

        setExpenses(expenseData)
        setBudgetRecord(budgetData)
        setBudgetValue(budgetData.amount ? String(budgetData.amount) : '')
        setBudgetHistory(historyData)
        setIsBudgetEditorOpen(!budgetData.hasBudget)
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [currentMonthKey])

  const spendingByMonth = useMemo(() => {
    return expenses.reduce((accumulator, expense) => {
      const key = monthKeyFromDate(new Date(expense.createdAt))
      accumulator[key] = (accumulator[key] || 0) + Number(expense.amount)
      return accumulator
    }, {})
  }, [expenses])

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
    const monthTotal = spendingByMonth[currentMonthKey] || 0
    const budgetAmount = Number(budgetRecord.amount) || 0
    const remaining = budgetAmount - monthTotal
    const usage = budgetAmount > 0 ? (monthTotal / budgetAmount) * 100 : 0

    return {
      total,
      monthTotal,
      budgetAmount,
      remaining,
      usage,
      overBudget: budgetAmount > 0 && monthTotal >= budgetAmount,
    }
  }, [budgetRecord.amount, currentMonthKey, expenses, spendingByMonth])

  const comparisonRows = useMemo(() => {
    const monthKeys = [...new Set([...Object.keys(spendingByMonth), ...budgetHistory.map((entry) => entry.monthKey)])]
      .sort((left, right) => right.localeCompare(left))
      .slice(0, 6)

    return monthKeys.map((key) => {
      const budget = budgetHistory.find((entry) => entry.monthKey === key)
      const spent = spendingByMonth[key] || 0
      const amount = budget?.amount || 0

      return {
        monthKey: key,
        monthLabel: monthLabel(key),
        spent,
        budget: amount,
        status: amount > 0 && spent > amount ? 'Over' : amount > 0 ? 'Within' : 'No budget',
      }
    })
  }, [budgetHistory, spendingByMonth])

  const sortedExpenses = useMemo(
    () =>
      [...expenses].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt)),
    [expenses],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleBudgetSubmit = async (event) => {
    event.preventDefault()

    if (budgetValue === '') {
      toast.error('Enter a monthly budget amount first.')
      return
    }

    const amount = Number(budgetValue)

    if (Number.isNaN(amount) || amount < 0) {
      toast.error('Use a valid monthly budget amount.')
      return
    }

    try {
      setBudgetSaving(true)
      const savedBudget = await budgetApi.save({ monthKey: currentMonthKey, amount })
      setBudgetRecord({ monthKey: savedBudget.monthKey, amount: savedBudget.amount, hasBudget: true })
      setBudgetValue('')
      setIsBudgetEditorOpen(false)
      setBudgetHistory((current) => {
        const remaining = current.filter((entry) => entry.monthKey !== savedBudget.monthKey)
        return [savedBudget, ...remaining].sort((left, right) => right.monthKey.localeCompare(left.monthKey)).slice(0, 12)
      })
      toast.success('Monthly budget saved.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBudgetSaving(false)
    }
  }

  const resetForm = () => {
    setFormData(emptyExpense)
    setEditingId('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.text || !formData.amount || !formData.category) {
      toast.error('Please complete the description, amount, and category.')
      return
    }

    const payload = {
      text: formData.text.trim(),
      amount: Number(formData.amount),
      category: formData.category,
    }

    if (!payload.text || Number.isNaN(payload.amount) || payload.amount <= 0) {
      toast.error('Use a description and a valid amount greater than zero.')
      return
    }

    try {
      setSaving(true)

      if (editingId) {
        const updatedExpense = await expenseApi.update(editingId, payload)
        setExpenses((current) =>
          current.map((expense) => (expense._id === editingId ? updatedExpense : expense)),
        )
        toast.success('Expense updated.')
      } else {
        const createdExpense = await expenseApi.create(payload)
        setExpenses((current) => [createdExpense, ...current])
        toast.success('Expense added.')
      }

      resetForm()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (expense) => {
    setEditingId(expense._id)
    setFormData({
      text: expense.text,
      amount: expense.amount,
      category: expense.category,
    })
  }

  const handleDelete = async (id) => {
    try {
      setDeletingId(id)
      await expenseApi.remove(id)
      setExpenses((current) => current.filter((expense) => expense._id !== id))

      if (editingId === id) {
        resetForm()
      }

      toast.success('Expense deleted.')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section className="dashboard-grid">
      <div className="dashboard-column">
        <div className="panel hero-panel">
          <p className="eyebrow">Your spending snapshot</p>
          <h2>Keep the small purchases from turning into invisible habits.</h2>
          <p className="hero-text">
            Add expenses as they happen, update mistakes quickly, and keep a running total without
            digging through bank screens.
          </p>
        </div>

        <div className="stats-grid">
          <article className="panel stat-card">
            <span>Total tracked</span>
            <strong>{currency(stats.total)}</strong>
          </article>
          <article className="panel stat-card">
            <span>This month</span>
            <strong>{currency(stats.monthTotal)}</strong>
          </article>
          <article className={`panel stat-card ${stats.overBudget ? 'stat-card warning' : ''}`}>
            <span>{monthLabel(currentMonthKey)} budget</span>
            <strong>{stats.budgetAmount > 0 ? currency(stats.budgetAmount) : 'Not set'}</strong>
          </article>
        </div>

        <div className={`panel budget-panel ${stats.overBudget ? 'budget-panel warning' : ''}`}>
          <div className="panel-header row">
            <div>
              <p className="eyebrow">Budget</p>
              <h3>Set your monthly limit</h3>
              <p>
                Save a budget for {monthLabel(currentMonthKey)} and we&apos;ll compare it against this
                month&apos;s spending automatically.
              </p>
            </div>
            <div className="budget-badge">
              {stats.overBudget ? 'Budget warning' : stats.budgetAmount > 0 ? 'On watch' : 'No budget yet'}
            </div>
          </div>

          {budgetRecord.hasBudget && !isBudgetEditorOpen ? (
            <div className="budget-inline-summary">
              <div>
                <span>Saved monthly budget</span>
                <strong>{currency(stats.budgetAmount)}</strong>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setBudgetValue(String(stats.budgetAmount))
                  setIsBudgetEditorOpen(true)
                }}
              >
                Edit monthly budget
              </button>
            </div>
          ) : (
            <form className="budget-form" onSubmit={handleBudgetSubmit}>
              <label>
                Monthly budget
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="budget"
                  placeholder="0.00"
                  value={budgetValue}
                  onChange={(event) => setBudgetValue(event.target.value)}
                />
              </label>

              <div className="budget-form-actions">
                <button type="submit" className="primary-button" disabled={budgetSaving}>
                  {budgetSaving ? 'Saving...' : budgetRecord.hasBudget ? 'Update budget' : 'Save budget'}
                </button>
                {budgetRecord.hasBudget ? (
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => {
                      setBudgetValue('')
                      setIsBudgetEditorOpen(false)
                    }}
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          )}

          <div className="budget-summary">
            <div>
              <span>Spent this month</span>
              <strong>{currency(stats.monthTotal)}</strong>
            </div>
            <div>
              <span>Remaining</span>
              <strong className={stats.remaining < 0 ? 'warning-text' : ''}>
                {stats.budgetAmount > 0 ? currency(stats.remaining) : 'Set a budget'}
              </strong>
            </div>
            <div>
              <span>Usage</span>
              <strong className={stats.overBudget ? 'warning-text' : ''}>
                {stats.budgetAmount > 0 ? `${Math.round(stats.usage)}%` : '--'}
              </strong>
            </div>
          </div>

          {stats.overBudget ? (
            <p className="budget-warning-text">
              Warning: you&apos;ve hit or passed your budget for {monthLabel(currentMonthKey)}.
            </p>
          ) : null}
        </div>

        <div className="panel">
          <div className="panel-header row">
            <div>
              <h3>{editingId ? 'Edit expense' : 'Add a new expense'}</h3>
              <p>{editingId ? 'Update the selected transaction.' : 'Capture a purchase quickly.'}</p>
            </div>
            {editingId ? (
              <button type="button" className="ghost-button" onClick={resetForm}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <form className="expense-form" onSubmit={handleSubmit}>
            <label>
              Description
              <input
                type="text"
                name="text"
                placeholder="Groceries, rent, train pass..."
                value={formData.text}
                onChange={handleChange}
                autoComplete="off"
                inputMode="text"
                spellCheck="false"
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
              />
            </label>

            <label>
              Category
              <select name="category" value={formData.category} onChange={handleChange}>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add expense'}
            </button>
          </form>
        </div>
      </div>

      <div className="dashboard-column">
        <div className="panel ledger-panel">
          <div className="panel-header">
            <h3>Budget month to month</h3>
            <p>Compare what you planned against what you actually spent.</p>
          </div>

          {comparisonRows.length === 0 ? (
            <p className="empty-state">Set a budget and log expenses to build your monthly comparison.</p>
          ) : (
            <div className="comparison-list">
              {comparisonRows.map((row) => (
                <article key={row.monthKey} className="comparison-item">
                  <div>
                    <h4>{row.monthLabel}</h4>
                    <p>
                      Budget {row.budget > 0 ? currency(row.budget) : 'not set'} · Spent {currency(row.spent)}
                    </p>
                  </div>
                  <strong className={row.status === 'Over' ? 'warning-text' : ''}>{row.status}</strong>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="panel ledger-panel">
          <div className="panel-header">
            <h3>Recent expenses</h3>
            <p>Your latest spending activity lives here.</p>
          </div>

          {loading ? <p className="empty-state">Loading your expenses...</p> : null}

          {!loading && sortedExpenses.length === 0 ? (
            <p className="empty-state">
              No expenses yet. Add your first one and the dashboard will wake up.
            </p>
          ) : null}

          {!loading && sortedExpenses.length > 0 ? (
            <div className="expense-list">
              {sortedExpenses.map((expense) => (
                <article key={expense._id} className="expense-item">
                  <div>
                    <div className="expense-main-row">
                      <h4>{expense.text}</h4>
                      <strong>{currency(expense.amount)}</strong>
                    </div>
                    <div className="expense-meta">
                      <span>{expense.category}</span>
                      <span>{formatDate(expense.createdAt)}</span>
                    </div>
                  </div>

                  <div className="expense-actions">
                    <button type="button" className="ghost-button" onClick={() => handleEdit(expense)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => handleDelete(expense._id)}
                      disabled={deletingId === expense._id}
                    >
                      {deletingId === expense._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default DashboardPage
