import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../context/useAuth.js'

const initialFormState = {
  name: '',
  email: '',
  password: '',
}

function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const [formData, setFormData] = useState(initialFormState)
  const [submitting, setSubmitting] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.email || !formData.password || (isRegister && !formData.name)) {
      toast.error('Please fill in every required field.')
      return
    }

    try {
      setSubmitting(true)

      if (isRegister) {
        await register(formData)
        toast.success('Account created. Welcome in.')
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        })
        toast.success('Welcome back.')
      }

      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">Money visibility</p>
        <h2>Know where every dollar went before the month gets away from you.</h2>
        <p className="hero-text">
          This starter build gives you account access, a protected dashboard, categorized
          expenses, and a clean editing loop we can style further once you see it running.
        </p>
        <div className="feature-list">
          <span>Secure login</span>
          <span>Expense categories</span>
          <span>Totals at a glance</span>
          <span>Quick edit + delete</span>
        </div>
      </div>

      <div className="panel auth-panel">
        <div className="panel-header">
          <h3>{isRegister ? 'Create your account' : 'Sign in to continue'}</h3>
          <p>
            {isRegister
              ? 'Start tracking your spending in a few seconds.'
              : 'Pick up right where you left off.'}
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <label>
              Full name
              <input
                type="text"
                name="name"
                placeholder="Pascal Rivers"
                value={formData.name}
                onChange={handleChange}
              />
            </label>
          ) : null}

          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </label>

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? 'Working...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Log in' : 'Register'}
          </Link>
        </p>
      </div>
    </section>
  )
}

export default AuthPage
