import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
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
  ShoppingBag,
  Sparkles,
  UserRound,
  X
} from 'lucide-react'
import { citiesData, demoOrders, products, sellerDemoData, upcomingProducts } from './data.js'
import './styles.css'

const BASE = import.meta.env.BASE_URL

const categories = ['Todos', 'Pão de queijo', 'Assados', 'Açaí', 'Croissant', 'Salgados', 'Muito mais']
const BRL_PHONE = '(49) 98421-0396'
const PAYMENT_METHODS = ['PIX', 'À vista', 'Cartão de débito', 'Cartão de crédito', 'Boleto 30d', 'Boleto 60d']

function App() {
  const [tab, setTab] = useState('catalog')
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [authProduct, setAuthProduct] = useState(null)
  const [account, setAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saborsan-account-demo')) || null
    } catch {
      return null
    }
  })
  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saborsan-orders-demo')) || []
    } catch {
      return []
    }
  })
  const [toast, setToast] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedSellerClient, setSelectedSellerClient] = useState(null)
  const [showRegisterSale, setShowRegisterSale] = useState(false)

  useEffect(() => {
    localStorage.setItem('saborsan-account-demo', JSON.stringify(account))
  }, [account])

  useEffect(() => {
    localStorage.setItem('saborsan-orders-demo', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return products.filter((product) => {
      const byCategory = category === 'Todos' || product.category === category
      const byQuery = !normalized || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(normalized)
      return byCategory && byQuery
    })
  }, [category, query])

  function startOrder(product) {
    if (!account) {
      setAuthProduct(product)
      setSelectedProduct(null)
      return
    }
    confirmOrder(product)
  }

  function confirmOrder(product) {
    const order = {
      id: `SAB-${Math.floor(1000 + Math.random() * 8999)}`,
      product: product.name,
      date: 'Agora',
      orderDate: new Date().toLocaleDateString('pt-BR'),
      deliveryDate: 'A confirmar',
      quantity: '1 unidade',
      status: 'Solicitado',
      step: 1,
      observations: '',
      image: product.image
    }
    setOrders((current) => [order, ...current])
    setToast(`Pedido de ${product.name} solicitado com sucesso.`)
    setSelectedProduct(null)
    setAuthProduct(null)
    setTab('account')
  }

  function handleAccountCreated(newAccount) {
    setAccount(newAccount)
    setToast('Conta criada com sucesso. O pedido foi continuado automaticamente.')
    if (authProduct) {
      confirmOrder(authProduct)
    }
  }

  function handleLogin(credentials) {
    setAccount(credentials)
    setShowLogin(false)
    setToast('Bem-vindo de volta!')
  }

  function handleSignup(newAccount) {
    setAccount(newAccount)
    setShowSignup(false)
    setToast('Conta criada com sucesso!')
  }

  function handleSaleComplete(sale) {
    setShowRegisterSale(false)
    setToast(`Venda para ${sale.client} registrada! Pedido ${sale.id}.`)
  }

  function cancelOrder(orderId) {
    setOrders((current) => current.filter((o) => o.id !== orderId))
    setSelectedOrder(null)
    setToast('Pedido cancelado.')
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <Header account={account} onAccountClick={() => setTab('account')} />

        <main className="screen-content">
          {tab === 'catalog' && (
            <CatalogScreen
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              products={filteredProducts}
              onSelect={setSelectedProduct}
            />
          )}
          {tab === 'news' && <NewsScreen onSelect={setSelectedProduct} />}
          {tab === 'account' && <AccountScreen account={account} orders={orders} setAccount={setAccount} onExplore={() => setTab('catalog')} onShowLogin={() => setShowLogin(true)} onShowSignup={() => setShowSignup(true)} onSelectOrder={setSelectedOrder} onSelectClient={setSelectedSellerClient} onShowRegisterSale={() => setShowRegisterSale(true)} />}
          {tab === 'chat' && <ChatScreen />}
        </main>

        <BottomNav tab={tab} setTab={setTab} />

        {selectedProduct && (
          <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onOrder={startOrder} />
        )}

        {authProduct && (
          <CreateAccountModal product={authProduct} onClose={() => setAuthProduct(null)} onCreated={handleAccountCreated} />
        )}

        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={handleLogin} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true) }} />
        )}

        {showSignup && (
          <StandaloneSignupModal onClose={() => setShowSignup(false)} onCreated={handleSignup} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true) }} />
        )}

        {selectedOrder && (
          <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} onCancel={cancelOrder} />
        )}

        {selectedSellerClient && (
          <ClientDetailSheet client={selectedSellerClient} onClose={() => setSelectedSellerClient(null)} />
        )}

        {showRegisterSale && (
          <RegisterSaleSheet onClose={() => setShowRegisterSale(false)} onComplete={handleSaleComplete} />
        )}

        {toast && <div className="toast"><Check size={18} /> {toast}</div>}
      </div>
    </div>
  )
}

function Header({ account, onAccountClick }) {
  return (
    <header className="app-header">
      <div className="logo-pill">
        <img src={BASE + 'images/logo-saborsan.png'} alt="Saborsan" />
      </div>
      <button className="icon-btn" type="button" aria-label="Ver conta" onClick={onAccountClick}>
        {account ? <span className="avatar-mini">{account.email.charAt(0).toUpperCase()}</span> : <UserRound size={21} />}
      </button>
    </header>
  )
}

function CatalogScreen({ query, setQuery, category, setCategory, products, onSelect }) {
  return (
    <section className="catalog-screen">
      <div className="hero-card-mobile">
        <div>
          <span className="small-badge navy-badge">Distribuidora de alimentos</span>
          <h1>Alimentos que chegam com qualidade.</h1>
          <p>A Saborsan entrega praticidade, variedade e confiança para o seu estabelecimento.</p>
        </div>
        <div className="hero-product">
          <img src={BASE + 'images/mini-pizza-1.jpg'} alt="Mini pizza" />
        </div>
      </div>

      <div className="search-box">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar alimentos..." />
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
          <span>Catálogo</span>
          <h2>Produtos em destaque</h2>
        </div>
        <small>{products.length} itens</small>
      </div>

      <div className="product-list">
        {products.map((product) => (
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

function LoginModal({ onClose, onLoggedIn, onSwitchToSignup }) {
  const [form, setForm] = useState({ email: '', password: '', isSeller: false })
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  function submit(event) {
    event.preventDefault()
    if (!form.email || !form.password) return
    onLoggedIn({ ...form, role: form.isSeller ? 'seller' : 'client' })
  }

  return (
    <div className="modal-backdrop">
      <form className="account-modal" onSubmit={submit}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
        <span className="small-badge">Bem-vindo de volta</span>
        <h2>Entre na sua conta</h2>
        <p className="modal-copy">Acesse com seu e-mail e senha para continuar.</p>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="cliente@empresa.com" required />
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="Sua senha" required />
        </label>
        <button className="primary-full" type="submit">Entrar</button>
        <label className="toggle-company seller-toggle">
          <input type="checkbox" checked={form.isSeller} onChange={(event) => update('isSeller', event.target.checked)} />
          <span><PackageCheck size={16} /> Sou vendedor externo</span>
        </label>
        <p className="modal-switch">Não tem conta? <button type="button" className="link-btn" onClick={onSwitchToSignup}>Criar uma conta</button></p>
      </form>
    </div>
  )
}

function StandaloneSignupModal({ onClose, onCreated, onSwitchToLogin }) {
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
            <span className="small-badge">Cadastro rápido</span>
            <h2>Crie sua conta</h2>
            <p className="modal-copy">Preencha as informações abaixo para começar a usar a Saborsan.</p>
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

function NewsScreen({ onSelect }) {
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

function AccountScreen({ account, orders, setAccount, onExplore, onShowLogin, onShowSignup, onSelectOrder, onSelectClient, onShowRegisterSale }) {
  const allOrders = account ? [...orders, ...demoOrders] : []

  if (account?.role === 'seller') {
    return <SellerDashboard account={account} setAccount={setAccount} onSelectClient={onSelectClient} onShowRegisterSale={onShowRegisterSale} />
  }

  return (
    <section className="account-screen">
      <div className="page-heading">
        <span className="small-badge"><UserRound size={15} /> Minha conta</span>
        <h1>Pedidos, solicitações e entregas.</h1>
        <p>Acompanhe tudo o que foi comprado, solicitado e o status da entrega dos alimentos.</p>
      </div>

      {!account ? (
        <div className="empty-account">
          <UserRound size={36} />
          <h2>Entre ou crie uma conta.</h2>
          <p>Acesse sua conta para acompanhar pedidos, solicitações e entregas.</p>
          <button className="primary-full" type="button" onClick={onShowLogin}>Entrar</button>
          <button className="ghost-full" type="button" onClick={onShowSignup}>Criar uma conta</button>
        </div>
      ) : (
        <>
          <div className="account-card">
            <div className="avatar-large">{account.email.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{account.isCompany ? 'Conta empresarial' : 'Conta cliente'}</h2>
              <p>{account.email}</p>
              <span>WhatsApp: {account.whatsapp}</span>
              {account.isCompany && <span>CNPJ: {account.cnpj}</span>}
            </div>
          </div>

          <div className="section-title-row compact">
            <div>
              <span>Histórico</span>
              <h2>Compras e solicitações</h2>
            </div>
            <small>{allOrders.length} registros</small>
          </div>

          <div className="orders-list">
            {allOrders.map((order) => (
              <OrderCard key={order.id} order={order} onSelect={onSelectOrder} />
            ))}
          </div>

          <button className="ghost-full" type="button" onClick={() => setAccount(null)}>Sair da conta demo</button>
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

function ChatScreen() {
  const initialMessages = [
    { id: 1, from: 'seller', type: 'text', text: 'Olá! Seja bem-vindo à Saborsan 👋 Como posso te ajudar hoje?', time: '09:10' },
    { id: 2, from: 'user', type: 'text', text: 'Oi! Quero saber mais sobre os prazos de entrega.', time: '09:11' },
    { id: 3, from: 'seller', type: 'text', text: 'Claro! Nossos prazos variam de 2 a 5 dias úteis dependendo da sua região. Qual cidade você está?', time: '09:11' },
    { id: 4, from: 'seller', type: 'audio', duration: '0:08', time: '09:13' },
  ]

  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [isCalling, setIsCalling] = useState(false)
  const [playingAudio, setPlayingAudio] = useState(null)
  const messagesEndRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
      setRecordSeconds(0)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording])

  function sendText() {
    if (!input.trim()) return
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMessages((m) => [...m, { id: Date.now(), from: 'user', type: 'text', text: input.trim(), time: now }])
    setInput('')
    setTimeout(() => {
      const then = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'seller', type: 'text', text: 'Obrigado pela mensagem! Em breve um de nossos vendedores entrará em contato. 😊', time: then }])
    }, 1200)
  }

  function stopRecording() {
    if (recordSeconds < 1) { setIsRecording(false); return }
    const duration = `0:${String(recordSeconds).padStart(2, '0')}`
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMessages((m) => [...m, { id: Date.now(), from: 'user', type: 'audio', duration, time: now }])
    setIsRecording(false)
  }

  function toggleAudio(id) {
    if (playingAudio === id) { setPlayingAudio(null); return }
    setPlayingAudio(id)
    setTimeout(() => setPlayingAudio((p) => (p === id ? null : p)), 3000)
  }

  return (
    <section className="chat-screen">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-avatar-small">S</div>
          <div>
            <h3>Equipe Saborsan</h3>
            <span>online agora</span>
          </div>
        </div>
        <button className="chat-call-btn" type="button" onClick={() => setIsCalling(true)} aria-label="Ligar para o vendedor">
          <Phone size={20} />
        </button>
      </div>

      <div className="chat-messages">
        <div className="chat-date-label">Hoje</div>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble-wrap ${msg.from === 'user' ? 'outgoing' : 'incoming'}`}>
            {msg.type === 'text' ? (
              <div className="chat-bubble">
                <p>{msg.text}</p>
                <span className="chat-time">{msg.time}</span>
              </div>
            ) : (
              <div className="chat-bubble audio-bubble">
                <button type="button" className="audio-play-btn" onClick={() => toggleAudio(msg.id)} aria-label="Reproduzir áudio">
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
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        {isRecording ? (
          <div className="recording-bar">
            <span className="rec-dot" />
            <span className="rec-timer">0:{String(recordSeconds).padStart(2, '0')}</span>
            <span className="rec-label">Gravando áudio…</span>
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
              placeholder="Mensagem"
            />
            {input.trim() ? (
              <button type="button" className="chat-action-btn send" onClick={sendText} aria-label="Enviar mensagem">
                <Send size={19} />
              </button>
            ) : (
              <button
                type="button"
                className="chat-action-btn mic"
                onMouseDown={() => setIsRecording(true)}
                onTouchStart={(e) => { e.preventDefault(); setIsRecording(true) }}
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
            <p className="calling-status">Chamando…</p>
            <p className="calling-number">{BRL_PHONE}</p>
            <button type="button" className="end-call-btn" onClick={() => setIsCalling(false)} aria-label="Encerrar chamada">
              <Phone size={26} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function SellerDashboard({ account, setAccount, onSelectClient, onShowRegisterSale }) {
  const soldPercent = Math.round((sellerDemoData.sold / sellerDemoData.goal) * 100)
  const remaining = sellerDemoData.goal - sellerDemoData.sold

  return (
    <section className="seller-dashboard">
      <div className="page-heading seller-welcome">
        <span className="small-badge seller-badge"><PackageCheck size={13} /> Vendedor externo</span>
        <h1>Olá, {sellerDemoData.name.split(' ')[0]}!</h1>
        <p>Rota de hoje: <strong>{sellerDemoData.city}</strong></p>
        <small className="seller-date">Segunda, 17 de junho de 2026</small>
      </div>

      <div className="goal-card">
        <div className="goal-top">
          <div>
            <span className="goal-label">Meta do dia</span>
            <div className="goal-value-row">
              <h2>R$ {sellerDemoData.sold.toLocaleString('pt-BR')}</h2>
              <span>de R$ {sellerDemoData.goal.toLocaleString('pt-BR')}</span>
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
          <span>Alcançado: <b>R$ {sellerDemoData.sold.toLocaleString('pt-BR')}</b></span>
          <span>Faltam: <b>R$ {remaining.toLocaleString('pt-BR')}</b></span>
        </div>
      </div>

      <button className="new-sale-btn" type="button" onClick={onShowRegisterSale}>
        <Plus size={20} />
        <span>Registrar nova venda</span>
      </button>

      <div className="seller-alerts-list">
        {sellerDemoData.alerts.map((alert) => (
          <div key={alert.id} className={`seller-alert-item ${alert.type}`}>
            <Bell size={13} />
            <p>{alert.text}</p>
          </div>
        ))}
      </div>

      <div className="section-title-row compact">
        <div>
          <span>Clientes recomendados</span>
          <h2>Rota de hoje</h2>
        </div>
        <small>{sellerDemoData.totalClients} clientes</small>
      </div>

      {sellerDemoData.clients.map((client, i) => (
        <button key={client.id} type="button" className={`client-rec-card`} onClick={() => onSelectClient(client)}>
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

function RegisterSaleSheet({ onClose, onComplete }) {
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

  function submitSale() {
    const items = selectedProductIds.map((id) => {
      const p = products.find((pr) => pr.id === id)
      return { name: p.name, quantity: form.products[id] }
    })
    onComplete({
      id: `SAB-${Math.floor(1000 + Math.random() * 8999)}`,
      city: selectedCity,
      client: selectedClient.name,
      items,
      payment: form.payment,
      observations: form.observations,
      date: new Date().toLocaleDateString('pt-BR')
    })
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

function BottomNav({ tab, setTab }) {
  const items = [
    { id: 'catalog', label: 'Catálogo', icon: LayoutGrid },
    { id: 'news', label: 'Novidades', icon: Sparkles },
    { id: 'chat', label: 'Vendedor', icon: MessageCircle },
    { id: 'account', label: 'Conta', icon: UserRound }
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
