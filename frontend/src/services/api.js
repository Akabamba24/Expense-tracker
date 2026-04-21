import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export const authApi = {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to sign in right now.'))
    }
  },

  async register(formData) {
    try {
      const response = await api.post('/auth/register', formData)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to create your account right now.'))
    }
  },

  async getMe() {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to restore your session.'))
    }
  },
}

export const expenseApi = {
  async list() {
    try {
      const response = await api.get('/expenses')
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to load your expenses.'))
    }
  },

  async create(payload) {
    try {
      const response = await api.post('/expenses', payload)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to save this expense.'))
    }
  },

  async update(id, payload) {
    try {
      const response = await api.put(`/expenses/${id}`, payload)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to update this expense.'))
    }
  },

  async remove(id) {
    try {
      const response = await api.delete(`/expenses/${id}`)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to delete this expense.'))
    }
  },
}

export const budgetApi = {
  async get(month) {
    try {
      const response = await api.get(`/budgets?month=${encodeURIComponent(month)}`)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to load your budget.'))
    }
  },

  async save(payload) {
    try {
      const response = await api.post('/budgets', payload)
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to save your budget.'))
    }
  },

  async history() {
    try {
      const response = await api.get('/budgets/history')
      return response.data
    } catch (error) {
      throw new Error(getErrorMessage(error, 'Unable to load budget history.'))
    }
  },
}
