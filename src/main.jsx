import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Conversation } from '@elevenlabs/client'
import {
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Home,
  LayoutGrid,
  MessageCircle,
  Mic,
  MapPin,
  PackageCheck,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  UserRound,
  X
} from 'lucide-react'
import { citiesData as citiesDataStatic, demoOrders, upcomingProducts } from './data.js'
import { makeT } from './translations.js'
import './styles.css'

const BASE = import.meta.env.BASE_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://saborsan-api-c7bvfthfggfgergz.brazilsouth-01.azurewebsites.net'

function getDeviceId() {
  let id = localStorage.getItem('saborsan-device-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('saborsan-device-id', id)
  }
  return id
}

const categories = ['Todos', 'Pão de queijo', 'Assados', 'Açaí', 'Croissant', 'Salgados', 'Muito mais']
const BRL_PHONE = '(49) 98421-0396'
const PAYMENT_METHODS = ['PIX', 'À vista', 'Cartão de débito', 'Cartão de crédito', 'Boleto 30d', 'Boleto 60d']

function App() {
  const [language, setLanguage] = useState(() => localStorage.getItem('saborsan-lang') || 'pt')
  const t = useMemo(() => makeT(language), [language])

  function handleLanguageChange(lang) {
    localStorage.setItem('saborsan-lang', lang)
    setLanguage(lang)
  }
  const [tab, setTab] = useState('catalog')
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [authProduct, setAuthProduct] = useState(null)
  const [dbProducts, setDbProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [sellerData, setSellerData] = useState(null)
  const [citiesData, setCitiesData] = useState([])
  const [account, setAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saborsan-account')) || null
    } catch {
      return null
    }
  })
  const [orders, setOrders] = useState([])
  const [toast, setToast] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const [pendingProduct, setPendingProduct] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedSellerClient, setSelectedSellerClient] = useState(null)
  const [showRegisterSale, setShowRegisterSale] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then((r) => r.json())
      .then((data) => {
        if (data.products) {
          setDbProducts(data.products.map((p) => ({
            ...p,
            image: BASE + p.imageUrl,
            weight: p.packaging,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setProductsLoading(false))
  }, [])

  useEffect(() => {
    localStorage.setItem('saborsan-account', JSON.stringify(account))
    if (account?.role === 'seller' && account?.id) {
      fetch(`${API_URL}/api/seller-data?userId=${account.id}`)
        .then(r => r.json())
        .then(data => {
          if (data.seller) setSellerData(data.seller)
          if (data.cities) setCitiesData(data.cities)
        })
        .catch(() => {})
    } else {
      setSellerData(null)
    }
    if (account?.id && account?.role !== 'seller') {
      fetch(`${API_URL}/api/orders?userId=${account.id}`)
        .then(r => r.json())
        .then(data => { if (data.orders) setOrders(data.orders) })
        .catch(() => {})
    } else if (!account) {
      setOrders([])
    }
  }, [account])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return dbProducts.filter((product) => {
      const byCategory = category === 'Todos' || product.category === category
      const byQuery = !normalized || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalized)
      return byCategory && byQuery
    })
  }, [category, query, dbProducts])

  function startOrder(product) {
    if (!account) {
      setAuthProduct(product)
      setSelectedProduct(null)
      return
    }
    if (!account.name || !account.establishmentName || !account.address) {
      setPendingProduct(product)
      setSelectedProduct(null)
      setShowCompleteProfile(true)
      return
    }
    confirmOrder(product)
  }

  async function confirmOrder(product) {
    setSelectedProduct(null)
    setAuthProduct(null)
    setTab('account')

    if (account?.id) {
      try {
        const res = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: account.id,
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl || null,
          }),
        })
        const data = await res.json()
        if (data.order) setOrders(current => [data.order, ...current])
      } catch {
        setToast('Pedido enviado, mas houve um erro ao salvar.')
        return
      }
    }
    setToast(`Pedido de ${product.name} solicitado com sucesso.`)
  }

  async function handleAccountCreated(formData) {
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          whatsapp: formData.whatsapp,
          isCompany: formData.isCompany,
          cnpj: formData.cnpj,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccount(data.user)
      setShowCompleteProfile(true)
      setToast('Conta criada com sucesso. O pedido foi continuado automaticamente.')
      if (authProduct) confirmOrder(authProduct)
    } catch (err) {
      setToast(err.message || 'Erro ao criar conta. Tente novamente.')
    }
  }

  async function handleLogin(credentials) {
    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccount(data.user)
      setShowLogin(false)
      if (data.user.role !== 'seller' && (!data.user.name || !data.user.establishmentName || !data.user.address)) {
        setShowCompleteProfile(true)
      }
      setToast('Bem-vindo de volta!')
    } catch (err) {
      setToast(err.message || 'Erro ao entrar. Verifique suas credenciais.')
    }
  }

  async function handleSignup(formData) {
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          whatsapp: formData.whatsapp,
          isCompany: formData.isCompany,
          cnpj: formData.cnpj,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccount(data.user)
      setShowSignup(false)
      setShowCompleteProfile(true)
      setToast('Conta criada com sucesso!')
    } catch (err) {
      setToast(err.message || 'Erro ao criar conta. Tente novamente.')
    }
  }

  async function handleSaleComplete(sale) {
    setShowRegisterSale(false)
    setToast(`Venda para ${sale.client} registrada! Pedido ${sale.id}.`)
  }

  async function cancelOrder(orderId) {
    setOrders((current) => current.filter((o) => o.id !== orderId))
    setSelectedOrder(null)
    setToast('Pedido cancelado.')
    if (account?.id) {
      fetch(`${API_URL}/api/orders`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'Cancelado', step: 0 })
      }).catch(() => {})
    }
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <Header account={account} onAccountClick={() => setTab('account')} onSettingsClick={() => setShowSettings(true)} sellerAlerts={sellerData?.alerts || []} t={t} />

        <main className="screen-content">
          {tab === 'catalog' && (
            <CatalogScreen
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              products={filteredProducts}
              loading={productsLoading}
              onSelect={setSelectedProduct}
              t={t}
            />
          )}
          {tab === 'news' && <NewsScreen onSelect={setSelectedProduct} t={t} />}
          {tab === 'account' && <AccountScreen account={account} orders={orders} setAccount={setAccount} onExplore={() => setTab('catalog')} onShowLogin={() => setShowLogin(true)} onShowSignup={() => setShowSignup(true)} onSelectOrder={setSelectedOrder} onSelectClient={setSelectedSellerClient} onShowRegisterSale={() => setShowRegisterSale(true)} sellerData={sellerData} t={t} />}
          {tab === 'chat' && <ChatScreen account={account} t={t} />}
        </main>

        <BottomNav tab={tab} setTab={setTab} t={t} />

        {selectedProduct && (
          <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onOrder={startOrder} />
        )}

        {authProduct && (
          <CreateAccountModal product={authProduct} onClose={() => setAuthProduct(null)} onCreated={handleAccountCreated} />
        )}

        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={handleLogin} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true) }} t={t} />
        )}

        {showSignup && (
          <StandaloneSignupModal onClose={() => setShowSignup(false)} onCreated={handleSignup} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true) }} t={t} />
        )}

        {selectedOrder && (
          <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} onCancel={cancelOrder} />
        )}

        {selectedSellerClient && (
          <ClientDetailSheet client={selectedSellerClient} onClose={() => setSelectedSellerClient(null)} />
        )}

        {showRegisterSale && (
          <RegisterSaleSheet onClose={() => setShowRegisterSale(false)} onComplete={handleSaleComplete} products={dbProducts} citiesData={citiesData} account={account} />
        )}

        {showCompleteProfile && account && account.role !== 'seller' && (
          <CompleteProfileModal
            account={account}
            onClose={() => { setShowCompleteProfile(false); setPendingProduct(null) }}
            onSaved={(updated) => {
              setAccount(updated)
              setShowCompleteProfile(false)
              if (pendingProduct) { confirmOrder(pendingProduct); setPendingProduct(null) }
            }}
          />
        )}

        {showSettings && (
          <SettingsScreen
            account={account}
            language={language}
            onLanguageChange={handleLanguageChange}
            onClose={() => setShowSettings(false)}
            onDeleteAccount={async () => {
              try {
                await fetch(`${API_URL}/api/delete-account?userId=${account.id}`, { method: 'DELETE' })
              } catch {}
              setAccount(null)
              setShowSettings(false)
              setToast('Conta excluída com sucesso.')
            }}
            t={t}
          />
        )}

        {toast && <div className="toast"><Check size={18} /> {toast}</div>}
      </div>
    </div>
  )
}

function Header({ account, onAccountClick, onSettingsClick, sellerAlerts, t }) {
  const [showAlerts, setShowAlerts] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const count = sellerAlerts.length

  return (
    <header className="app-header">
      <div className="logo-pill">
        <img src={BASE + 'images/logo-saborsan.png'} alt="Saborsan" />
      </div>
      <div className="header-actions">
        {count > 0 && (
          <button className="icon-btn notif-btn" type="button" aria-label={t('settings_title')} onClick={() => { setShowAlerts(v => !v); setShowMenu(false) }}>
            <Bell size={21} />
            <span className="notif-badge">{count}</span>
          </button>
        )}
        {account ? (
          <button className="icon-btn" type="button" aria-label="Menu da conta" onClick={() => { setShowMenu(v => !v); setShowAlerts(false) }}>
            <span className="avatar-mini">{account.email.charAt(0).toUpperCase()}</span>
          </button>
        ) : (
          <button className="icon-btn" type="button" aria-label="Menu" onClick={() => { setShowMenu(v => !v); setShowAlerts(false) }}>
            <UserRound size={21} />
          </button>
        )}
      </div>
      {showAlerts && (
        <div className="notif-panel">
          {sellerAlerts.map((alert) => (
            <div key={alert.id} className={`seller-alert-item ${alert.type}`}>
              <Bell size={13} />
              <p>{alert.text}</p>
            </div>
          ))}
        </div>
      )}
      {showMenu && (
        <div className="account-menu-panel">
          <button type="button" onClick={() => { setShowMenu(false); onAccountClick() }}>
            <UserRound size={16} /> {t('menu_account')}
          </button>
          <button type="button" onClick={() => { setShowMenu(false); onSettingsClick() }}>
            <Settings size={16} /> {t('menu_settings')}
          </button>
        </div>
      )}
    </header>
  )
}

function CatalogScreen({ query, setQuery, category, setCategory, products, loading, onSelect, t }) {
  return (
    <section className="catalog-screen">
      <div className="hero-card-mobile">
        <div>
          <span className="small-badge navy-badge">{t('catalog_badge')}</span>
          <h1>{t('catalog_hero_title')}</h1>
          <p>{t('catalog_hero_sub')}</p>
        </div>
        <div className="hero-product">
          <img src={BASE + 'images/mini-pizza-1.jpg'} alt="Mini pizza" />
        </div>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('catalog_search')} />
      </div>

      <div className="category-row">
        {categories.map((item) => (
          <button key={item} className={item === category ? 'chip active' : 'chip'} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="section-title-row">
        <div>
          <span>{t('catalog_section')}</span>
          <h2>{t('catalog_featured')}</h2>
        </div>
        <small>{loading ? '…' : `${products.length} ${t('catalog_items')}`}</small>
      </div>

      <div className="product-list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="product-card skeleton" />
          ))
        ) : products.map((product) => (
          <button className="product-card" key={product.id} onClick={() => onSelect(product)}>
            <img src={product.image} alt={product.name} />
            <div>
              <span className="product-badge">{product.badge}</span>
              <h3>{product.name}</h3>
              <p>{product.description}</p>
              <strong>{product.price}</strong>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function ProductSheet({ product, onClose, onOrder }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="product-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar detalhes"><X size={20} /></button>
        <div className="sheet-scroll">
          <div className="sheet-image">
            <img src={product.image} alt={product.name} />
            <span>{product.category}</span>
          </div>
          <div className="sheet-body">
            <div className="sheet-headline">
              <div>
                <small>{product.badge}</small>
                <h2>{product.name}</h2>
              </div>
              <strong>{product.price}</strong>
            </div>
            <p>{product.details}</p>

            <div className="detail-grid">
              <Detail label="Embalagem" value={product.weight} />
              <Detail label="Conservação" value={product.conservation} />
              <Detail label="Preparo" value={product.preparation} />
              <Detail label="Ideal para" value={product.idealFor} />
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button className="primary-full" type="button" onClick={() => onOrder(product)}>
            Fazer pedido
          </button>
        </div>
      </article>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="detail-card">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function CreateAccountModal({ product, onClose, onCreated }) {
  const [form, setForm] = useState({ email: '', password: '', whatsapp: '', isCompany: false, cnpj: '' })
  const [success, setSuccess] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function submit(event) {
    event.preventDefault()
    if (!form.email || !form.password || !form.whatsapp || (form.isCompany && !form.cnpj)) return
    setSuccess(true)
    setTimeout(() => onCreated(form), 900)
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar cadastro"><X size={20} /></button>
        {success ? (
          <div className="success-state">
            <span><Check size={34} /></span>
            <h2>Conta criada com sucesso!</h2>
            <p>Seu cadastro foi salvo e o pedido de <b>{product.name}</b> será continuado automaticamente.</p>
          </div>
        ) : (
          <>
            <span className="small-badge">Cadastro rápido</span>
            <h2>Crie sua conta para fazer o pedido</h2>
            <p className="modal-copy">Para solicitar <b>{product.name}</b>, preencha as informações abaixo. Esta é uma lógica demonstrativa e hardcoded.</p>

            <label>
              E-mail
              <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="cliente@empresa.com" required />
            </label>
            <label>
              Senha
              <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Crie uma senha" required />
            </label>
            <label>
              WhatsApp
              <input value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} placeholder={BRL_PHONE} required />
            </label>
            <label className="toggle-company">
              <input type="checkbox" checked={form.isCompany} onChange={(event) => update('isCompany', event.target.checked)} />
              <span><Building2 size={18} /> Empresa / Pessoa Jurídica</span>
            </label>
            {form.isCompany && (
              <label>
                CNPJ
                <input value={form.cnpj} onChange={(event) => update('cnpj', event.target.value)} placeholder="00.000.000/0000-00" required />
              </label>
            )}
            <button className="primary-full" type="submit">Criar conta e continuar pedido</button>
          </>
        )}
      </form>
    </div>
  )
}

function LoginModal({ onClose, onLoggedIn, onSwitchToSignup, t }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function submit(event) {
    event.preventDefault()
    if (!form.email || !form.password) return
    onLoggedIn(form)
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        <span className="small-badge">{t('login_welcome')}</span>
        <h2>{t('login_title')}</h2>
        <p className="modal-copy">{t('login_sub')}</p>
        <label>
          {t('login_email')}
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="cliente@empresa.com" required />
        </label>
        <label>
          {t('login_password')}
          <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder={t('login_password')} required />
        </label>
        <button className="primary-full" type="submit">{t('login_btn')}</button>
        <p className="modal-switch">{t('login_no_account')} <button type="button" className="link-btn" onClick={onSwitchToSignup}>{t('login_create')}</button></p>
      </form>
    </div>
  )
}

function StandaloneSignupModal({ onClose, onCreated, onSwitchToLogin, t }) {
  const [form, setForm] = useState({ email: '', password: '', whatsapp: '', isCompany: false, cnpj: '' })
  const [success, setSuccess] = useState(false)
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function submit(event) {
    event.preventDefault()
    if (!form.email || !form.password || !form.whatsapp || (form.isCompany && !form.cnpj)) return
    setSuccess(true)
    setTimeout(() => onCreated(form), 900)
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar cadastro"><X size={20} /></button>
        {success ? (
          <div className="success-state">
            <span><Check size={34} /></span>
            <h2>Conta criada com sucesso!</h2>
            <p>Você já pode acompanhar seus pedidos e solicitar produtos.</p>
          </div>
        ) : (
          <>
            <span className="small-badge">{t('signup_badge')}</span>
            <h2>{t('signup_title')}</h2>
            <p className="modal-copy">{t('signup_sub')}</p>
            <label>
              E-mail
              <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="cliente@empresa.com" required />
            </label>
            <label>
              Senha
              <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Crie uma senha" required />
            </label>
            <label>
              WhatsApp
              <input value={form.whatsapp} onChange={(event) => update('whatsapp', event.target.value)} placeholder={BRL_PHONE} required />
            </label>
            <label className="toggle-company">
              <input type="checkbox" checked={form.isCompany} onChange={(event) => update('isCompany', event.target.checked)} />
              <span><Building2 size={18} /> Empresa / Pessoa Jurídica</span>
            </label>
            {form.isCompany && (
              <label>
                CNPJ
                <input value={form.cnpj} onChange={(event) => update('cnpj', event.target.value)} placeholder="00.000.000/0000-00" required />
              </label>
            )}
            <button className="primary-full" type="submit">Criar conta</button>
            <p className="modal-switch">Já tem conta? <button type="button" className="link-btn" onClick={onSwitchToLogin}>Entrar</button></p>
          </>
        )}
      </form>
    </div>
  )
}

function CompleteProfileModal({ account, onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', establishmentName: '', address: '', city: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const allFilled = form.name.trim() && form.establishmentName.trim() && form.address.trim() && form.city.trim()

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.establishmentName.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Preencha todas as informações para salvar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/update-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: account.id, ...form }),
      })
      const data = await res.json()
      if (res.ok) onSaved({ ...account, ...data.user })
      else { setError(data.error || 'Erro ao salvar. Tente novamente.'); setLoading(false) }
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        <span className="small-badge">Quase lá!</span>
        <h2>Informações do estabelecimento</h2>
        <p className="modal-copy">Preencha para facilitar seus pedidos e entregas.</p>

        <label>
          Seu nome
          <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Seu nome completo" />
        </label>
        <label>
          Nome do estabelecimento
          <input value={form.establishmentName} onChange={(e) => update('establishmentName', e.target.value)} placeholder="Ex: Padaria Bom Pão" />
        </label>
        <label>
          Endereço para entrega
          <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Rua, número, bairro" />
        </label>
        <label>
          Cidade
          <input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex: Lages" />
        </label>

        {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
        <button className="primary-full" type="submit" disabled={loading || !allFilled}>
          {loading ? 'Salvando…' : 'Salvar e continuar'}
        </button>
      </form>
    </div>
  )
}

function SettingsScreen({ account, language, onLanguageChange, onClose, onDeleteAccount, t }) {
  const [settings, setSettings] = useState({ language, notificationSound: true, deliveryNotifications: true })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [view, setView] = useState('main')
  const [feedback, setFeedback] = useState({ email: account?.email || '', content: '' })
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSent, setFeedbackSent] = useState(false)
  const feedbackReady = feedback.email.trim() && feedback.content.trim()

  useEffect(() => {
    if (!account?.id) return
    fetch(`${API_URL}/api/settings?userId=${account.id}`)
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings({ ...d.settings, notificationSound: !!d.settings.notificationSound, deliveryNotifications: !!d.settings.deliveryNotifications }) })
      .catch(() => {})
  }, [account?.id])

  async function updateSetting(field, value) {
    const updated = { ...settings, [field]: value }
    setSettings(updated)
    if (field === 'language') onLanguageChange(value)
    if (!account?.id) return
    fetch(`${API_URL}/api/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: account.id, [field]: typeof value === 'boolean' ? (value ? 1 : 0) : value }),
    }).catch(() => {})
  }

  const langs = [{ value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose}>
        <div className="product-sheet settings-sheet" onClick={e => e.stopPropagation()}>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
          <div className="sheet-scroll">
            <div className="sheet-body">

              {view === 'feedback' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <button type="button" className="sale-back-btn" onClick={() => { setView('main'); setFeedbackSent(false) }}>
                      <ChevronLeft size={16} /> {t('settings_title')}
                    </button>
                  </div>
                  <h2 style={{ marginBottom: '16px' }}>{t('settings_feedback')}</h2>
                  {feedbackSent ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <Check size={40} style={{ color: 'var(--orange)', margin: '0 auto 12px', display: 'block' }} />
                      <p style={{ fontWeight: 700, color: 'var(--navy)' }}>Feedback enviado! Obrigado.</p>
                    </div>
                  ) : (
                    <>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>
                        E-mail
                        <input
                          type="email"
                          value={feedback.email}
                          onChange={e => setFeedback(f => ({ ...f, email: e.target.value }))}
                          placeholder="seu@email.com"
                          className="feedback-field"
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px', fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>
                        Feedback
                        <textarea
                          value={feedback.content}
                          onChange={e => setFeedback(f => ({ ...f, content: e.target.value }))}
                          placeholder="Conte sua experiência ou sugestão..."
                          rows={5}
                          className="feedback-field"
                        />
                      </label>
                      <button
                        className="primary-full"
                        type="button"
                        disabled={!feedbackReady || feedbackSending}
                        onClick={async () => {
                          setFeedbackSending(true)
                          try {
                            await fetch(`${API_URL}/api/feedback`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: feedback.email, content: feedback.content, userId: account?.id || null }),
                            })
                            setFeedbackSent(true)
                          } catch {}
                          setFeedbackSending(false)
                        }}>
                        {feedbackSending ? 'Enviando…' : 'Enviar feedback'}
                      </button>
                    </>
                  )}
                </>
              ) : (
              <>
              <div className="settings-section">
                <span className="settings-label">{t('settings_language')}</span>
                <div className="payment-grid">
                  {langs.map(l => (
                    <button key={l.value} type="button"
                      className={`payment-btn ${(settings.language || language) === l.value ? 'selected' : ''}`}
                      onClick={() => updateSetting('language', l.value)}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-row">
                <div>
                  <span className="settings-label">{t('settings_sound')}</span>
                  <small>{t('settings_sound_sub')}</small>
                </div>
                <button type="button" className={`toggle-btn ${settings.notificationSound ? 'on' : ''}`}
                  onClick={() => updateSetting('notificationSound', !settings.notificationSound)}>
                  <span />
                </button>
              </div>

              <div className="settings-row">
                <div>
                  <span className="settings-label">{t('settings_delivery')}</span>
                  <small>{t('settings_delivery_sub')}</small>
                </div>
                <button type="button" className={`toggle-btn ${settings.deliveryNotifications ? 'on' : ''}`}
                  onClick={() => updateSetting('deliveryNotifications', !settings.deliveryNotifications)}>
                  <span />
                </button>
              </div>

              <div className="settings-section">
                <button type="button" className="settings-link-btn" onClick={() => window.open('https://saborsan.com.br/privacidade', '_blank')}>
                  {t('settings_privacy')}
                </button>
                <button type="button" className="settings-link-btn" onClick={() => setView('feedback')}>
                  {t('settings_feedback')}
                </button>
                {account && (
                  <button type="button" className="settings-link-btn" style={{ color: '#e53e3e' }} onClick={() => setShowDeleteModal(true)}>
                    {t('settings_delete')}
                  </button>
                )}
              </div>
              </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop" style={{ zIndex: 60 }}>
          <div className="account-modal" style={{ maxWidth: '360px', textAlign: 'center' }}>
            <h2 style={{ color: '#e53e3e', marginBottom: '12px' }}>{t('delete_title')}</h2>
            <p className="modal-copy" style={{ marginBottom: '20px' }}>{t('delete_msg')}</p>
            <button className="settings-delete-btn" disabled={deleting}
              onClick={async () => { setDeleting(true); await onDeleteAccount() }}>
              {deleting ? t('delete_deleting') : t('delete_confirm')}
            </button>
            <button className="ghost-full" type="button" onClick={() => setShowDeleteModal(false)} style={{ marginTop: '8px' }}>
              {t('delete_cancel')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function EditProfileModal({ account, onClose, onSaved }) {
  const initial = useMemo(() => ({
    name: account.name || '',
    whatsapp: account.whatsapp || '',
    address: account.address || '',
    city: account.city || '',
    cnpj: account.cnpj || '',
    establishmentName: account.establishmentName || '',
    invoicePreference: account.invoicePreference || 'whatsapp',
  }), [])
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const changedFields = useMemo(() =>
    Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== initial[k]))
  , [form, initial])
  const hasChanges = Object.keys(changedFields).length > 0

  async function submit(e) {
    e.preventDefault()
    if (!hasChanges) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/update-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: account.id, ...changedFields }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onSaved({ ...account, ...data.user })
    } catch (err) {
      setError(err.message || 'Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal edit-profile-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        <div className="edit-profile-scroll">
          <span className="small-badge">Minha conta</span>
          <h2>Editar informações de contato</h2>
          <p className="modal-copy">Atualize seus dados de contato e entrega.</p>

          <label>
            Nome
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Seu nome completo" />
          </label>
          <label>
            Nome do estabelecimento
            <input value={form.establishmentName} onChange={(e) => update('establishmentName', e.target.value)} placeholder="Ex: Padaria Bom Pão" />
          </label>
          <label>
            E-mail
            <input type="email" value={account.email} disabled style={{ opacity: 0.5 }} />
          </label>
          <label>
            WhatsApp
            <input value={form.whatsapp} onChange={(e) => update('whatsapp', e.target.value)} placeholder="(49) 99999-0000" />
          </label>
          <label>
            Endereço
            <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Rua, número, bairro" />
          </label>
          <label>
            Cidade
            <input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Ex: Lages" />
          </label>
          {account.isCompany && (
            <label>
              CNPJ
              <input value={form.cnpj} onChange={(e) => update('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </label>
          )}
          <label>Receber nota fiscal eletrônica por</label>
          <div className="payment-grid" style={{ marginTop: '4px', marginBottom: '8px' }}>
            {[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'E-mail' }, { value: 'ambos', label: 'Ambos' }].map(opt => (
              <button key={opt.value} type="button"
                className={`payment-btn ${form.invoicePreference === opt.value ? 'selected' : ''}`}
                onClick={() => update('invoicePreference', opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: '4px 0' }}>{error}</p>}
        </div>
        <div className="edit-profile-footer">
          <button className="primary-full" type="submit" disabled={loading || !hasChanges}>
            {loading ? 'Salvando…' : 'Salvar informações'}
          </button>
        </div>
      </form>
    </div>
  )
}

function NewsScreen({ onSelect, t }) {
  return (
    <section className="news-screen">
      <div className="page-heading">
        <span className="small-badge"><Sparkles size={15} /> Novidades</span>
        <h1>Alimentos que estarão chegando em breve.</h1>
        <p>Veja prévias de linhas e produtos que podem entrar no catálogo da Saborsan.</p>
      </div>

      <div className="news-list">
        {upcomingProducts.map((item) => (
          <article className="news-card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <span>{item.month}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button type="button" onClick={() => onSelect(products[0])}>Tenho interesse</button>
            </div>
          </article>
        ))}
      </div>

      <div className="orange-panel">
        <Bell size={22} />
        <div>
          <h3>Receba novidades no WhatsApp</h3>
          <p>Quando o cliente demonstrar interesse, a equipe pode avisar sobre lançamentos, promoções e itens sazonais.</p>
        </div>
      </div>
    </section>
  )
}

function AccountScreen({ account, orders, setAccount, onExplore, onShowLogin, onShowSignup, onSelectOrder, onSelectClient, onShowRegisterSale, sellerData, t }) {
  const [showEditProfile, setShowEditProfile] = useState(false)

  if (account?.role === 'seller') {
    return <SellerDashboard account={account} setAccount={setAccount} onSelectClient={onSelectClient} onShowRegisterSale={onShowRegisterSale} sellerData={sellerData} t={t} />
  }

  return (
    <section className="account-screen">
      <div className="page-heading">
        <span className="small-badge"><UserRound size={15} /> {t('account_badge')}</span>
        <h1>{t('account_title')}</h1>
        <p>{t('account_sub')}</p>
      </div>

      {!account ? (
        <div className="empty-account">
          <UserRound size={36} />
          <h2>{t('account_empty_title')}</h2>
          <p>{t('account_empty_sub')}</p>
          <button className="primary-full" type="button" onClick={onShowLogin}>{t('account_login')}</button>
          <button className="ghost-full" type="button" onClick={onShowSignup}>{t('account_signup')}</button>
        </div>
      ) : (
        <>
          <div className="account-card">
            <div className="avatar-large">{account.email.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{account.isCompany ? 'Conta empresarial' : 'Conta cliente'}</h2>
              <p>{account.email}</p>
              {account.name && <span>{account.name}</span>}
              <span>WhatsApp: {account.whatsapp}</span>
              {account.address && <span>{account.address}</span>}
              {account.isCompany && <span>CNPJ: {account.cnpj}</span>}
            </div>
          </div>

          <button className="ghost-full" type="button" onClick={() => setShowEditProfile(true)} style={{ marginBottom: '8px' }}>
            {t('account_edit')}
          </button>

          <div className="section-title-row compact">
            <div>
              <span>{t('account_history')}</span>
              <h2>{t('account_orders')}</h2>
            </div>
            <small>{orders.length} {t('account_records')}</small>
          </div>

          <div className="orders-list">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} onSelect={onSelectOrder} />
            ))}
          </div>

          <button className="ghost-full" type="button" onClick={() => setAccount(null)}>{t('account_logout')}</button>

          {showEditProfile && (
            <EditProfileModal
              account={account}
              onClose={() => setShowEditProfile(false)}
              onSaved={(updated) => { setAccount(updated); setShowEditProfile(false) }}
            />
          )}
        </>
      )}
    </section>
  )
}

function OrderDetailSheet({ order, onClose, onCancel }) {
  const steps = ['Solicitado', 'Em separação', 'Saiu para entrega', 'Entregue']
  const canCancel = order.step <= 2

  return (
    <div className="sheet-backdrop centered" onClick={onClose}>
      <article className="product-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar detalhes"><X size={20} /></button>
        <div className="order-detail-header">
          <span className="small-badge"><PackageCheck size={14} /> {order.id}</span>
          <h2>{order.product}</h2>
        </div>
        <div className="sheet-body">
          <div className="order-detail-grid">
            <div className="order-detail-item">
              <span>Quantidade</span>
              <b>{order.quantity || '—'}</b>
            </div>
            <div className="order-detail-item">
              <span>Data do pedido</span>
              <b>{order.orderDate || order.date}</b>
            </div>
            <div className="order-detail-item">
              <span>Previsão de entrega</span>
              <b>{order.deliveryDate || '—'}</b>
            </div>
            <div className="order-detail-item">
              <span>Status</span>
              <b className="status-text">{order.status}</b>
            </div>
          </div>

          {order.observations ? (
            <div className="order-observations">
              <span>Observações</span>
              <p>{order.observations}</p>
            </div>
          ) : null}

          <div className="order-steps-section">
            <span>Acompanhamento</span>
            <div className="status-steps">
              {steps.map((step, index) => (
                <div key={step} className={`status-step ${index + 1 <= order.step ? 'done' : ''}`}>
                  <div className="step-dot" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {canCancel && (
            <button className="cancel-order-btn" type="button" onClick={() => onCancel(order.id)}>
              Cancelar pedido
            </button>
          )}
        </div>
      </article>
    </div>
  )
}

function OrderCard({ order, onSelect }) {
  const steps = ['Solicitado', 'Em separação', 'Saiu para entrega', 'Entregue']
  return (
    <article className="order-card" role="button" tabIndex={0} onClick={() => onSelect && onSelect(order)} onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(order)}>
      <div className="order-topline">
        <span><PackageCheck size={17} /> {order.id}</span>
        <small>{order.date}</small>
      </div>
      <h3>{order.product}</h3>
      <p>Status: <b>{order.status}</b></p>
      <div className="status-line">
        {steps.map((step, index) => (
          <span key={step} className={index + 1 <= order.step ? 'done' : ''}></span>
        ))}
      </div>
    </article>
  )
}

function ChatScreen({ account, t }) {
  const deviceId = useMemo(() => getDeviceId(), [])
  const welcomeMessage = useMemo(() => ({
    id: 'welcome',
    from: 'seller',
    type: 'text',
    text: t('chat_online') === 'online agora' ? 'Olá! Seja bem-vindo à Saborsan 👋 Como posso te ajudar hoje?' : t('chat_team') + ' - Hello! Welcome to Saborsan 👋 How can I help you?',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }), [])

  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState('idle')
  const conversationRef = useRef(null)
  const callConversationIdRef = useRef(null)
  const cleaningUpRef = useRef(false)

  function cleanupCall(saveTranscript = true) {
    if (cleaningUpRef.current) return
    cleaningUpRef.current = true
    const conv = conversationRef.current
    conversationRef.current = null
    setCallStatus('idle')
    setIsCalling(false)
    if (conv) conv.endSession().catch(() => {})
    if (saveTranscript) {
      const convId = callConversationIdRef.current
      if (convId) {
        fetch(`${API_URL}/api/save-transcript`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, conversationId: convId })
        }).catch(() => {})
      }
    }
    setTimeout(() => { cleaningUpRef.current = false }, 1000)
  }

  function startCallSession() {
    setIsCalling(true)
    setCallStatus('connecting')
    async function startCall() {
      try {
        const res = await fetch(`${API_URL}/api/elevenlabs-token?deviceId=${deviceId}`)
        const { signedUrl, historyText } = await res.json()
        callConversationIdRef.current = null

        const conversation = await Conversation.startSession({
          signedUrl,
          dynamicVariables: { historico_texto: historyText || 'Sem histórico anterior.' },
          onConnect: ({ conversationId }) => {
            callConversationIdRef.current = conversationId
            setCallStatus('connected')
          },
          onDisconnect: () => cleanupCall(true),
          onError: () => cleanupCall(false),
          onModeChange: ({ mode }) => setCallStatus(mode === 'speaking' ? 'speaking' : 'connected'),
        })
        conversationRef.current = conversation
      } catch {
        cleanupCall(false)
      }
    }
    startCall()
  }

  function endCall() {
    cleanupCall(true)
  }

  const callStatusLabel = {
    connecting: 'Conectando…',
    connected: 'Em chamada',
    speaking: 'Falando…',
  }[callStatus] ?? 'Chamando…'
  const [playingAudio, setPlayingAudio] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const streamRef = useRef(null)
  const audioPlayerRef = useRef(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_URL}/api/history?deviceId=${deviceId}`)
        const data = await res.json()
        if (data.messages && data.messages.length > 0) {
          const loaded = data.messages.map((m, i) => ({
            id: i + 1,
            from: m.role === 'user' ? 'user' : 'seller',
            type: m.audioUrl ? 'audio' : 'text',
            text: m.content,
            blobUrl: m.audioUrl || null,
            duration: m.audioUrl ? `0:${String(Math.max(1, Math.floor(m.content.length / 15))).padStart(2, '0')}` : null,
            time: new Date(m.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }))
          setMessages([welcomeMessage, ...loaded])
        }
      } catch {
        // mantém a mensagem de boas-vindas padrão
      }
    }
    loadHistory()
  }, [deviceId])

  useEffect(() => {
    if (!account?.email) return
    fetch(`${API_URL}/api/link-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, userId: account.email })
    }).catch(() => {})
  }, [account, deviceId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    if (!isRecording) setRecordSeconds(0)
    return () => clearInterval(timerRef.current)
  }, [isRecording, isPaused])

  async function sendText() {
    if (!input.trim() || isLoading) return
    const text = input.trim()
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMessages((m) => [...m, { id: Date.now(), from: 'user', type: 'text', text, time: now }])
    setInput('')
    setIsLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, message: text })
      })
      const data = await res.json()
      const then = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

      if (data.audio) {
        const bytes = Uint8Array.from(atob(data.audio), (c) => c.charCodeAt(0))
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(blob)
        const duration = `0:${String(Math.max(1, Math.floor(data.message.length / 15))).padStart(2, '0')}`
        setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'audio', duration, time: then, blobUrl }])
      } else {
        setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'text', text: data.message, time: then }])
      }
    } catch {
      const then = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'text', text: 'Desculpe, ocorreu um erro. Tente novamente em instantes.', time: then }])
    } finally {
      setIsLoading(false)
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.start()
    } catch {
      // sem permissão de microfone — continua como visual
    }
    setIsRecording(true)
  }

  async function stopRecording() {
    if (recordSeconds < 1) { cancelRecording(); return }
    const duration = `0:${String(recordSeconds).padStart(2, '0')}`
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMessages((m) => [...m, { id: Date.now(), from: 'user', type: 'audio', duration, time: now }])
    setIsRecording(false)
    setIsPaused(false)

    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return

    setIsLoading(true)
    try {
      const audioBlob = await new Promise((resolve) => {
        recorder.onstop = () => resolve(new Blob(audioChunksRef.current, { type: 'audio/webm' }))
        recorder.stop()
      })
      streamRef.current?.getTracks().forEach((t) => t.stop())

      const blobUrl = URL.createObjectURL(audioBlob)
      setMessages((m) => m.map((msg) => msg.type === 'audio' && !msg.blobUrl ? { ...msg, blobUrl } : msg))

      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      const transcribeRes = await fetch(`${API_URL}/api/transcribe`, { method: 'POST', body: formData })
      const { text, audioUrl: clientAudioUrl } = await transcribeRes.json()

      if (clientAudioUrl) {
        setMessages((m) => m.map((msg) => msg.type === 'audio' && !msg.blobUrl ? { ...msg, blobUrl: clientAudioUrl } : msg))
      }

      if (text) {
        const chatRes = await fetch(`${API_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId, message: text, audioUrl: clientAudioUrl || null })
        })
        const chatData = await chatRes.json()
        const then = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'text', text: chatData.message, time: then }])
      }
    } catch {
      const then = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'text', text: 'Não consegui processar o áudio. Tente novamente.', time: then }])
    } finally {
      setIsLoading(false)
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    setIsRecording(false)
    setIsPaused(false)
  }

  function toggleAudio(id, blobUrl) {
    if (playingAudio === id) {
      audioPlayerRef.current?.pause()
      audioPlayerRef.current = null
      setPlayingAudio(null)
      return
    }
    audioPlayerRef.current?.pause()
    if (blobUrl) {
      const audio = new Audio(blobUrl)
      audioPlayerRef.current = audio
      audio.play()
      audio.onended = () => setPlayingAudio(null)
    }
    setPlayingAudio(id)
  }

  return (
    <section className="chat-screen">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar-small">S</div>
          <div>
            <h3>{t('chat_team')}</h3>
            <span>{t('chat_online')}</span>
          </div>
        </div>
        <button className="chat-call-btn" type="button" onClick={startCallSession} aria-label="Ligar para o vendedor">
          <Phone size={20} />
        </button>
      </div>

      <div className="chat-messages">
        <div className="chat-date-label">{t('chat_today')}</div>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.from === 'user' ? 'outgoing' : 'incoming'}`}>
            {msg.type === 'text' ? (
              <div className="chat-bubble">
                <p>{msg.text}</p>
                <span className="chat-time">{msg.time}</span>
              </div>
            ) : (
              <div className="chat-bubble audio-bubble">
                <button type="button" className="audio-play-btn" onClick={() => toggleAudio(msg.id, msg.blobUrl)} aria-label="Reproduzir áudio">
                  {playingAudio === msg.id ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="audio-waveform">
                  {Array.from({ length: 22 }).map((_, i) => (
                    <span key={i} className={playingAudio === msg.id ? 'playing' : ''} style={{ height: `${6 + Math.abs(Math.sin(i * 0.9)) * 12 + (i % 2) * 4}px` }} />
                  ))}
                </div>
                <div className="audio-meta">
                  <span className="audio-duration">{msg.duration}</span>
                  <span className="chat-time">{msg.time}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-bubble-wrap incoming">
            <div className="chat-bubble typing-bubble">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        {isRecording ? (
          <div className="recording-bar">
            <span className="rec-dot" style={{ background: isPaused ? '#aaa' : undefined }} />
            <span className="rec-timer">0:{String(recordSeconds).padStart(2, '0')}</span>
            <span className="rec-label">{isPaused ? 'Pausado' : 'Gravando áudio…'}</span>
            <button type="button" className="rec-action-btn" onClick={() => {
              if (isPaused) { mediaRecorderRef.current?.resume(); setIsPaused(false) }
              else { mediaRecorderRef.current?.pause(); setIsPaused(true) }
            }} aria-label={isPaused ? 'Retomar gravação' : 'Pausar gravação'}>
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button type="button" className="rec-action-btn cancel" onClick={cancelRecording} aria-label="Cancelar gravação">
              <X size={16} />
            </button>
            <button type="button" className="rec-stop-btn" onClick={stopRecording} aria-label="Enviar áudio">
              <Check size={18} />
            </button>
          </div>
        ) : (
          <>
            <input
              className="chat-text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendText()}
              placeholder={t('chat_placeholder')}
              disabled={isLoading}
            />
            {input.trim() ? (
              <button type="button" className="chat-action-btn send" onClick={sendText} disabled={isLoading} aria-label="Enviar mensagem">
                <Send size={19} />
              </button>
            ) : (
              <button
                type="button"
                className="chat-action-btn mic"
                onClick={startRecording}
                aria-label="Gravar áudio"
              >
                <Mic size={19} />
              </button>
            )}
          </>
        )}
      </div>

      {isCalling && (
        <div className="calling-overlay">
          <div className="calling-card">
            <div className="calling-avatar">S</div>
            <h2>Equipe Saborsan</h2>
            <p className="calling-status">{callStatusLabel}</p>
            <p className="calling-number">{BRL_PHONE}</p>
            <button type="button" className="end-call-btn" onClick={endCall} aria-label="Encerrar chamada">
              <Phone size={26} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SellerDashboard({ account, setAccount, onSelectClient, onShowRegisterSale, sellerData }) {
  const data = sellerData || { name: '...', city: '...', goal: 0, sold: 0, totalClients: 0, alerts: [], clients: [] }
  const soldPercent = data.goal > 0 ? Math.round((data.sold / data.goal) * 100) : 0
  const remaining = data.goal - data.sold

  return (
    <section className="seller-dashboard">
      <div className="page-heading seller-welcome">
        <span className="small-badge seller-badge"><PackageCheck size={13} /> Vendedor externo</span>
        <h1>Olá, {data.name ? data.name.split(' ')[0] : account.email.split('@')[0]}!</h1>
        <p>Rota de hoje: <strong>{data.city}</strong></p>
        <small className="seller-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
      </div>

      <div className="goal-card">
        <div className="goal-top">
          <div>
            <span className="goal-label">Meta do dia</span>
            <div className="goal-value-row">
              <h2>R$ {Number(data.sold).toLocaleString('pt-BR')}</h2>
              <span>de R$ {Number(data.goal).toLocaleString('pt-BR')}</span>
            </div>
          </div>
          <div className="goal-ring" style={{ background: `conic-gradient(var(--orange) 0% ${soldPercent}%, rgba(8,47,99,.1) ${soldPercent}% 100%)` }}>
            <span>{soldPercent}%</span>
          </div>
        </div>
        <div className="goal-bar-track">
          <div className="goal-bar-fill" style={{ width: `${soldPercent}%` }} />
        </div>
        <div className="goal-bottom">
          <span>Alcançado: <b>R$ {Number(data.sold).toLocaleString('pt-BR')}</b></span>
          <span>Faltam: <b>R$ {Number(remaining).toLocaleString('pt-BR')}</b></span>
        </div>
      </div>

      <button className="new-sale-btn" type="button" onClick={onShowRegisterSale}>
        <Plus size={20} />
        <span>Registrar nova venda</span>
      </button>

      <div className="section-title-row compact">
        <div>
          <span>Clientes recomendados</span>
          <h2>Rota de hoje</h2>
        </div>
        <small>{data.totalClients} clientes</small>
      </div>

      {data.clients.map((client, i) => (
        <button key={client.id} type="button" className="client-rec-card" onClick={() => onSelectClient(client)}>
          <div className="client-rec-rank">{i + 1}</div>
          <div className="client-rec-body">
            <div className="client-rec-top">
              <div>
                <h3>{client.name}</h3>
                <small>{client.segment}</small>
              </div>
              <span className={`prio-badge prio-${client.priority}`}>{client.tag}</span>
            </div>
            <p>{client.priorityReason}</p>
            <div className="client-rec-meta">
              <span>Último: {client.lastPurchase}</span>
              <span>Ticket: {client.avgTicket}</span>
            </div>
          </div>
          <ChevronRight size={16} className="rec-arrow" />
        </button>
      ))}

      <button className="ghost-full" type="button" style={{ marginTop: '8px' }} onClick={() => setAccount(null)}>
        Sair da conta
      </button>
    </section>
  )
}

function ClientDetailSheet({ client, onClose }) {
  const [visitResult, setVisitResult] = useState(null)
  const [showNoSale, setShowNoSale] = useState(false)

  const noSaleReasons = [
    'Já tem estoque', 'Achou caro', 'Sem movimento',
    'Prefere concorrente', 'Voltar outro dia',
    'Cliente fechado', 'Responsável ausente'
  ]

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="product-sheet client-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>

        {visitResult ? (
          <div className="visit-registered">
            <div className={`visit-reg-icon ${visitResult === 'sold' ? 'success' : 'neutral'}`}>
              {visitResult === 'sold' ? <Check size={30} /> : <Clock3 size={30} />}
            </div>
            <h2>{visitResult === 'sold' ? 'Venda registrada!' : 'Visita registrada!'}</h2>
            <p>{visitResult === 'sold' ? `Venda confirmada para ${client.name}.` : `Motivo: ${visitResult}`}</p>
            <button className="primary-full" type="button" onClick={onClose}>Voltar à rota</button>
          </div>
        ) : (
          <>
            <div className="client-sheet-header">
              <div className="client-sheet-avatar">{client.name.charAt(0)}</div>
              <div>
                <h2>{client.name}</h2>
                <p>{client.segment} · <span className={`prio-label prio-${client.priority}`}>
                  {client.priority === 'alta' ? '● Prioridade alta' : client.priority === 'média' ? '● Prioridade média' : '● Prioridade baixa'}
                </span></p>
              </div>
            </div>

            <div className="sheet-scroll">
              <div className="client-sheet-body">
                <div className="client-metrics-grid">
                  <div className="order-detail-item">
                    <span>Último pedido</span>
                    <b>{client.lastPurchase}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>Último valor</span>
                    <b>{client.lastValue}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>Ticket médio</span>
                    <b>{client.avgTicket}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>Pendência</span>
                    <b className={client.pendency !== 'Nenhuma' ? 'warn-text' : ''}>{client.pendency}</b>
                  </div>
                </div>

                <div className="suggestion-box">
                  <span>Sugestão de abordagem</span>
                  <p>{client.suggestion}</p>
                </div>

                <div className="client-sheet-section">
                  <h4>Produtos recomendados</h4>
                  <div className="tag-row">
                    {client.recommended.map((p) => <span key={p} className="ptag recommended">{p}</span>)}
                  </div>
                </div>

                <div className="client-sheet-section">
                  <h4>Mais comprados</h4>
                  <div className="tag-row">
                    {client.topProducts.map((p) => <span key={p} className="ptag purchased">{p}</span>)}
                  </div>
                </div>

                <div className="client-sheet-section">
                  <h4>Histórico de pedidos</h4>
                  {client.orders.map((order) => (
                    <div key={order.id} className="client-order-row">
                      <div>
                        <span className="order-id-label">{order.id}</span>
                        <small>{order.items}</small>
                      </div>
                      <div className="order-row-right">
                        <b>{order.value}</b>
                        <small>{order.date}</small>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="client-sheet-section">
                  <h4>Melhor dia para visitar</h4>
                  <span className="best-day-tag">{client.bestDay}</span>
                </div>
              </div>
            </div>

            <div className="client-sheet-footer">
              <h4>Resultado desta visita</h4>
              <button className="visit-sold-btn" type="button" onClick={() => setVisitResult('sold')}>
                Comprou
              </button>
              {!showNoSale ? (
                <button className="visit-nosale-btn" type="button" onClick={() => setShowNoSale(true)}>
                  Não comprou — registrar motivo
                </button>
              ) : (
                <div className="nosale-reasons">
                  {noSaleReasons.map((r) => (
                    <button key={r} type="button" className="nosale-reason-btn" onClick={() => setVisitResult(r)}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </article>
    </div>
  )
}

function RegisterSaleSheet({ onClose, onComplete, products, citiesData, account }) {
  const [step, setStep] = useState('city')
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientSearch, setClientSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [form, setForm] = useState({ products: {}, payment: null, observations: '' })

  const cityClients = selectedCity
    ? (citiesData.find((c) => c.name === selectedCity)?.clients || []).filter((cl) =>
        cl.name.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : []

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const selectedProductIds = Object.keys(form.products).filter((id) => form.products[id] > 0)
  const hasProducts = selectedProductIds.length > 0

  function setProductQty(productId, qty) {
    setForm((f) => {
      const updated = { ...f.products }
      if (qty <= 0) delete updated[productId]
      else updated[productId] = qty
      return { ...f, products: updated }
    })
  }

  async function submitSale() {
    const items = selectedProductIds.map((id) => {
      const p = products.find((pr) => pr.id === id)
      return { name: p.name, quantity: form.products[id] }
    })
    const saleData = {
      userId: account?.id,
      clientId: selectedClient?.id || null,
      clientName: selectedClient?.name,
      payment: form.payment,
      observations: form.observations,
      saleDate: new Date().toLocaleDateString('pt-BR'),
      items,
    }
    try {
      const res = await fetch(`${API_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      })
      const data = await res.json()
      onComplete(data.sale || { id: `SAB-${Math.floor(1000 + Math.random() * 8999)}`, client: selectedClient?.name })
    } catch {
      onComplete({ id: `SAB-${Math.floor(1000 + Math.random() * 8999)}`, client: selectedClient?.name })
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="product-sheet register-sale-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>

        {step === 'city' && (
          <>
            <div className="sale-step-header">
              <div className="sale-step-title">
                <MapPin size={20} />
                <h2>Onde você está?</h2>
                <p>Selecione a cidade para esta venda</p>
              </div>
            </div>
            <div className="city-list">
              {citiesData.map((city) => (
                <button key={city.name} type="button" className="city-card" onClick={() => { setSelectedCity(city.name); setStep('client') }}>
                  <div>
                    <h3>{city.name}</h3>
                    <span>{city.clients.length} clientes</span>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'client' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('city')}><ChevronLeft size={16} /> {selectedCity}</button>
              <div className="sale-step-title">
                <UserRound size={20} />
                <h2>Escolha o cliente</h2>
                <p>Clientes em {selectedCity}</p>
              </div>
              <div className="sale-search">
                <Search size={15} />
                <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Buscar cliente..." />
              </div>
            </div>
            <div className="client-list-sale">
              {cityClients.map((cl) => (
                <button key={cl.id} type="button" className="client-sale-card" onClick={() => { setSelectedClient(cl); setStep('sale') }}>
                  <div className="client-sale-avatar">{cl.name.charAt(0)}</div>
                  <div className="client-sale-info">
                    <h3>{cl.name}</h3>
                    <span>{cl.segment}</span>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'sale' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('client')}><ChevronLeft size={16} /> {selectedClient.name}</button>
              <div className="sale-step-title">
                <ShoppingBag size={20} />
                <h2>Detalhes da venda</h2>
                <p>Para {selectedClient.name}</p>
              </div>
            </div>
            <div className="sale-form">
              <div className="sale-field">
                <label>Produtos{hasProducts ? <span> · {selectedProductIds.length} selecionado{selectedProductIds.length > 1 ? 's' : ''}</span> : null}</label>
                <div className="sale-search" style={{ marginBottom: '10px' }}>
                  <Search size={15} />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Buscar produto..." />
                </div>
                <div className="product-select-list">
                  {filteredProducts.map((p) => {
                    const qty = form.products[p.id] || 0
                    const selected = qty > 0
                    return (
                      <div key={p.id} className={`product-select-row ${selected ? 'selected' : ''}`}>
                        <span className="product-select-name">{p.name}</span>
                        <div className="product-inline-qty">
                          {selected ? (
                            <>
                              <button type="button" onClick={() => setProductQty(p.id, qty - 1)}>−</button>
                              <span>{qty}</span>
                              <button type="button" onClick={() => setProductQty(p.id, qty + 1)}>+</button>
                            </>
                          ) : (
                            <button type="button" className="qty-add-btn" onClick={() => setProductQty(p.id, 1)}>+</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="sale-field">
                <label>Forma de pagamento</label>
                <div className="payment-grid">
                  {PAYMENT_METHODS.map((pm) => (
                    <button key={pm} type="button" className={`payment-btn ${form.payment === pm ? 'selected' : ''}`} onClick={() => setForm((f) => ({ ...f, payment: pm }))}>
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sale-field">
                <label>Observações <span>(opcional)</span></label>
                <textarea value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} placeholder="Ex: entregar no período da manhã..." rows={2} />
              </div>
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" disabled={!hasProducts || !form.payment} onClick={() => setStep('confirm')}>
                Ver resumo
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('sale')}><ChevronLeft size={16} /> Editar</button>
              <div className="sale-step-title">
                <Check size={20} />
                <h2>Confirmar venda</h2>
                <p>Revise os dados antes de finalizar</p>
              </div>
            </div>
            <div className="confirm-summary">
              <div className="confirm-row"><span>Cidade</span><b>{selectedCity}</b></div>
              <div className="confirm-row"><span>Cliente</span><b>{selectedClient.name}</b></div>
              <div className="confirm-row">
                <span>Produtos</span>
                <div className="confirm-products">
                  {selectedProductIds.map((id) => {
                    const p = products.find((pr) => pr.id === id)
                    return <b key={id}>{p.name} <span>× {form.products[id]}</span></b>
                  })}
                </div>
              </div>
              <div className="confirm-row"><span>Pagamento</span><b>{form.payment}</b></div>
              {form.observations ? <div className="confirm-row"><span>Observações</span><b>{form.observations}</b></div> : null}
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" onClick={submitSale}>
                Confirmar venda
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  )
}

function BottomNav({ tab, setTab, t }) {
  const items = [
    { id: 'catalog', label: t('nav_catalog'), icon: LayoutGrid },
    { id: 'news', label: t('nav_news'), icon: Sparkles },
    { id: 'chat', label: t('nav_seller'), icon: MessageCircle },
    { id: 'account', label: t('nav_account'), icon: UserRound }
  ]
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <button key={item.id} type="button" className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}>
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

createRoot(document.getElementById('root')).render(<App />)
