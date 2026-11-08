import { ArrowRight, Bike, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../lib/api'

export function LoginPage() {
  const { session, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (session) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-brand">
          <div className="brand-mark brand-mark-large"><span>L</span></div>
          <div>
            <strong>Leopardos</strong>
            <span>Moto Clube</span>
          </div>
        </div>
        <div className="login-message">
          <span className="eyebrow light">Estrada, irmandade e propósito</span>
          <h1>O clube inteiro,<br />em uma só direção.</h1>
          <p>Gestão de membros, eventos e contribuições com clareza para quem mantém o clube em movimento.</p>
        </div>
        <div className="road-lines" aria-hidden="true"><span /><span /><span /></div>
        <div className="login-quote">
          <Bike size={22} />
          <span>Organização para aproveitar mais a estrada.</span>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-form-wrap">
          <span className="eyebrow">Área restrita</span>
          <h2>Bem-vindo de volta</h2>
          <p className="login-intro">Use suas credenciais para acessar o painel do clube.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>E-mail</span>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@gestormc.local"
                  autoComplete="username"
                  required
                />
              </div>
            </label>

            <label className="field">
              <span>Senha</span>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  <span className="sr-only">{showPassword ? 'Ocultar senha' : 'Mostrar senha'}</span>
                </button>
              </div>
            </label>

            {error && <div className="login-error" role="alert">{error}</div>}

            <button className="button button-primary button-login" type="submit" disabled={loading}>
              <span>{loading ? 'Entrando...' : 'Entrar no painel'}</span>
              <ArrowRight size={19} />
            </button>
          </form>

          <p className="api-address">API configurada: <code>{API_BASE_URL}</code></p>
        </div>
      </section>
    </main>
  )
}
