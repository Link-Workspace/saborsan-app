import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Conversation } from '@elevenlabs/client'
import {
  Bell,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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
  Route,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X
} from 'lucide-react'
import { citiesData as citiesDataStatic, demoOrders, upcomingProducts } from './data.js'
import { makeT } from './translations.js'
import { requestPushPermission, onForegroundMessage } from './firebase.js'
import './styles.css'

const BASE = import.meta.env.BASE_URL
const API_URL = import.meta.env.VITE_API_URL || 'https://saborsan-api-c7bvfthfggfgergz.brazilsouth-01.azurewebsites.net'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

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

const SC_CITIES = [
  'Abelardo Luz','Agrolândia','Agronômica','Água Doce','Águas de Chapecó','Águas Frias','Águas Mornas','Alfredo Wagner','Alto Bela Vista',
  'Anchieta','Angelina','Anita Garibaldi','Anitápolis','Antônio Carlos','Apiúna','Arabutã','Araquari','Armazém','Arroio Trinta','Arvoredo',
  'Ascurra','Atalanta','Aurora','Balneário Arroio do Silva','Balneário Barra do Sul','Balneário Camboriú','Balneário Gaivota',
  'Balneário Piçarras','Balneário Rincão','Bandeirante','Barra Bonita','Barra Velha','Bela Vista do Toldo','Belmonte','Benedito Novo',
  'Biguaçu','Blumenau','Bocaina do Sul','Bom Jardim da Serra','Bom Jesus','Bom Jesus do Oeste','Bom Retiro','Bombinhas','Botuverá',
  'Braço do Norte','Braço do Trombudo','Brunópolis','Brusque','Caçador','Caibi','Calmon','Camboriú','Campo Alegre','Campo Belo do Sul',
  'Campo Erê','Campos Novos','Canelinha','Canoinhas','Capão Alto','Capinzal','Capivari de Baixo','Catanduvas','Caxambu do Sul',
  'Celso Ramos','Cerro Negro','Chapadão do Lageado','Chapecó','Cocal do Sul','Concórdia','Cordilheira Alta','Coronel Freitas',
  'Coronel Martins','Correia Pinto','Corupá','Criciúma','Cunha Porã','Cunhataí','Curitibanos','Descanso','Dionísio Cerqueira',
  'Dona Emma','Doutor Pedrinho','Entre Rios','Ermo','Erval Velho','Faxinal dos Guedes','Flor do Sertão','Florianópolis',
  'Formosa do Sul','Forquilhinha','Fraiburgo','Frei Rogério','Galvão','Garopaba','Garuva','Gaspar','Governador Celso Ramos',
  'Grão Pará','Gravatal','Guabiruba','Guaraciaba','Guaramirim','Guarujá do Sul','Guatambú','Herval d\'Oeste','Ibiam','Ibicaré',
  'Ibirama','Içara','Ilhota','Imaruí','Imbituba','Imbuia','Indaial','Iomerê','Ipira','Iporã do Oeste','Ipuaçu','Ipumirim',
  'Iraceminha','Irani','Irati','Irineópolis','Itá','Itaiópolis','Itajaí','Itapema','Itapiranga','Itapoá','Ituporanga','Jaborá',
  'Jacinto Machado','Jaguaruna','Jaraguá do Sul','Jardinópolis','Joaçaba','Joinville','José Boiteux','Jupiá','Lacerdópolis',
  'Lages','Laguna','Lajeado Grande','Laurentino','Lauro Müller','Lebon Régis','Leoberto Leal','Lindóia do Sul','Lontras',
  'Luiz Alves','Luzerna','Macieira','Mafra','Major Gercino','Major Vieira','Maracajá','Maravilha','Marema','Massaranduba',
  'Matos Costa','Meleiro','Mirim Doce','Modelo','Mondaí','Monte Carlo','Monte Castelo','Morro da Fumaça','Morro Grande',
  'Navegantes','Nova Erechim','Nova Itaberaba','Nova Trento','Nova Veneza','Novo Horizonte','Orleans','Otacílio Costa','Ouro',
  'Ouro Verde','Paial','Painel','Palhoça','Palma Sola','Palmeira','Palmitos','Papanduva','Paraíso','Passo de Torres',
  'Passos Maia','Paulo Lopes','Pedras Grandes','Penha','Peritiba','Pescaria Brava','Petrolândia','Pinhalzinho','Pinheiro Preto',
  'Piratuba','Planalto Alegre','Pomerode','Ponte Alta','Ponte Alta do Norte','Ponte Serrada','Porto Belo','Porto União',
  'Pouso Redondo','Praia Grande','Presidente Castelo Branco','Presidente Getúlio','Presidente Nereu','Princesa','Quilombo',
  'Rancho Queimado','Rio das Antas','Rio do Campo','Rio do Oeste','Rio do Sul','Rio dos Cedros','Rio Fortuna','Rio Negrinho',
  'Rio Rufino','Riqueza','Rodeio','Romelândia','Salete','Saltinho','Salto Veloso','Sangão','Santa Cecília','Santa Helena',
  'Santa Rosa de Lima','Santa Rosa do Sul','Santa Terezinha','Santa Terezinha do Progresso','Santiago do Sul',
  'Santo Amaro da Imperatriz','São Bento do Sul','São Bernardino','São Carlos','São Cristóvão do Sul','São Domingos',
  'São Francisco do Sul','São João Batista','São João do Itaperiú','São João do Oeste','São João do Sul','São Joaquim',
  'São José','São José do Cedro','São José do Cerrito','São Lourenço do Oeste','São Ludgero','São Marcos',
  'São Miguel da Boa Vista','São Miguel do Oeste','São Pedro de Alcântara','Saudades','Schroeder','Seara','Serra Alta',
  'Siderópolis','Sombrio','Sul Brasil','Taió','Tangará','Tigrinhos','Tijucas','Timbé do Sul','Timbó','Timbó Grande',
  'Três Barras','Treviso','Treze de Maio','Treze Tílias','Trombudo Central','Tubarão','Tunápolis','Turvo','União do Oeste',
  'Urubici','Urupema','Urussanga','Vargeão','Vargem','Vargem Bonita','Vidal Ramos','Videira','Vitor Meireles','Witmarsum',
  'Xanxerê','Xavantina','Xaxim','Zortéa',
]

function deliveryStatusColor(status) {
  if (!status) return ''
  const s = status.toLowerCase()
  if (s.includes('entregue') || s.includes('concluí')) return 'done'
  if (s.includes('rota') || s.includes('andamento')) return 'ongoing'
  if (s.includes('separaç') || s.includes('pronto') || s.includes('carregando') || s.includes('planejada')) return 'ready'
  return ''
}

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
  const [pushNotif, setPushNotif] = useState(null) // { title, body }
  const notifSettings = useRef({ sound: true, delivery: true })
  const [account, setAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('saborsan-account')) || null
    } catch {
      return null
    }
  })
  const [orders, setOrders] = useState([])
  const [deliveries, setDeliveries] = useState([])
  const [deliveriesLoading, setDeliveriesLoading] = useState(false)
  const [newDeliveryOpen, setNewDeliveryOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState(null)
  const [vehiclesData, setVehiclesData] = useState([])
  const [toast, setToast] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showCompleteProfile, setShowCompleteProfile] = useState(false)
  const [pendingProduct, setPendingProduct] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedSellerClient, setSelectedSellerClient] = useState(null)
  const [showRegisterSale, setShowRegisterSale] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [orderConfirmations, setOrderConfirmations] = useState([]) // pedidos aguardando confirmação do entregador
  const confirmFetchRef = useRef(null)

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

  // Registro de push notification e listener de mensagens em foreground
  useEffect(() => {
    const deviceId = getDeviceId()
    requestPushPermission(deviceId, account?.id || null, API_URL).catch(() => {})

    const unsub = onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'Saborsan'
      const body = payload.notification?.body || ''
      if (notifSettings.current.sound) playNotificationSound()
      // Se for confirmação de pedido, atualizar lista imediatamente
      if (payload.data?.type === 'order_ready_check' && confirmFetchRef.current) {
        confirmFetchRef.current()
        return
      }
      if (notifSettings.current.delivery) {
        setPushNotif({ title, body })
        setTimeout(() => setPushNotif(null), 6000)
      }
    })
    return () => unsub && unsub()
  }, [account?.id])

  // Polling de confirmações pendentes para entregadores
  useEffect(() => {
    if (!account?.id || account?.role !== 'seller') {
      setOrderConfirmations([])
      return
    }
    const fetchConfirmations = () => {
      fetch(`${API_URL}/api/delivery-confirmations?userId=${account.id}`)
        .then((r) => r.json())
        .then((data) => { if (data.confirmations) setOrderConfirmations(data.confirmations) })
        .catch(() => {})
    }
    confirmFetchRef.current = fetchConfirmations
    fetchConfirmations()
    const interval = setInterval(fetchConfirmations, 30000)
    return () => { clearInterval(interval); confirmFetchRef.current = null }
  }, [account?.id, account?.role])

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
      // Carregar entregas do vendedor
      setDeliveriesLoading(true)
      fetch(`${API_URL}/api/deliveries?userId=${account.id}`)
        .then(r => r.json())
        .then(data => { if (data.deliveries) setDeliveries(data.deliveries) })
        .catch(() => {})
        .finally(() => setDeliveriesLoading(false))
      // Carregar veículos disponíveis para novas entregas
      fetch(`${API_URL}/api/vehicles`)
        .then(r => r.json())
        .then(data => { if (data.vehicles) setVehiclesData(data.vehicles) })
        .catch(() => {})
    } else {
      setSellerData(null)
      setDeliveries([])
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

  async function handleConfirmOrder(orderId) {
    try {
      const res = await fetch(`${API_URL}/api/delivery-confirmations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userId: account?.id }),
      })
      if (!res.ok) throw new Error()
      setOrderConfirmations((prev) => prev.filter((c) => c.orderId !== orderId))
      setToast(`Pedido ${orderId} confirmado como pronto para entrar em rota!`)
    } catch {
      setToast('Erro ao confirmar. Tente novamente.')
    }
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
          {tab === 'deliveries' && <DeliveriesScreen deliveries={deliveries} loading={deliveriesLoading} onNew={() => setNewDeliveryOpen(true)} onSelect={setSelectedDelivery} t={t} />}
        </main>

        <BottomNav tab={tab} setTab={setTab} account={account} t={t} />

        {selectedProduct && (
          <ProductSheet product={selectedProduct} onClose={() => setSelectedProduct(null)} onOrder={startOrder} t={t} />
        )}

        {authProduct && (
          <CreateAccountModal product={authProduct} onClose={() => setAuthProduct(null)} onCreated={handleAccountCreated} t={t} />
        )}

        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} onLoggedIn={handleLogin} onSwitchToSignup={() => { setShowLogin(false); setShowSignup(true) }} t={t} />
        )}

        {showSignup && (
          <StandaloneSignupModal onClose={() => setShowSignup(false)} onCreated={handleSignup} onSwitchToLogin={() => { setShowSignup(false); setShowLogin(true) }} t={t} />
        )}

        {selectedOrder && (
          <OrderDetailSheet order={selectedOrder} onClose={() => setSelectedOrder(null)} onCancel={cancelOrder} t={t} />
        )}

        {selectedSellerClient && (
          <ClientDetailSheet client={selectedSellerClient} onClose={() => setSelectedSellerClient(null)} t={t} />
        )}

        {newDeliveryOpen && (
          <NewDeliverySheet
            onClose={() => setNewDeliveryOpen(false)}
            vehicles={vehiclesData}
            account={account}
            onCreated={(d) => {
              setDeliveries((prev) => [d, ...prev])
              setNewDeliveryOpen(false)
              setToast(`Entrega ${d.code} criada com sucesso!`)
            }}
          />
        )}

        {selectedDelivery && (
          <DeliveryDetailSheet delivery={selectedDelivery} onClose={() => setSelectedDelivery(null)} />
        )}

        {showRegisterSale && (
          <RegisterSaleSheet onClose={() => setShowRegisterSale(false)} onComplete={handleSaleComplete} products={dbProducts} citiesData={citiesData} account={account} t={t} />
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
            onNotifSettingChange={(field, value) => { notifSettings.current = { ...notifSettings.current, [field]: value } }}
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

        {pushNotif && (
          <div className="push-notif-banner" onClick={() => setPushNotif(null)}>
            <img src={BASE + 'images/logo-saborsan.png'} alt="Saborsan" className="push-notif-logo" />
            <div>
              <strong>{pushNotif.title}</strong>
              <p>{pushNotif.body}</p>
            </div>
            <button type="button" onClick={() => setPushNotif(null)}><X size={16} /></button>
          </div>
        )}

        {/* Modal de confirmação de pedido pronto — aparece no centro para o entregador */}
        {orderConfirmations.length > 0 && account?.role === 'seller' && (() => {
          const c = orderConfirmations[0]
          return (
            <div className="order-confirm-overlay">
              <div className="order-confirm-modal">
                <div className="order-confirm-icon"><PackageCheck size={36} /></div>
                <h3>Pedido pronto para rota?</h3>
                <p>O pedido <b>{c.orderId}</b> de <b>{c.customer}</b> está em separação para a entrega <b>{c.deliveryCode}</b>.</p>
                <p className="order-confirm-sub">Confirme quando o pedido estiver separado e embalado para entrar em rota.</p>
                <div className="order-confirm-actions">
                  <button className="order-confirm-yes" onClick={() => handleConfirmOrder(c.orderId)}>
                    <Check size={16} /> Sim, está pronto
                  </button>
                  <button className="order-confirm-no" onClick={() => setOrderConfirmations((prev) => prev.slice(1))}>
                    Ainda não
                  </button>
                </div>
                {orderConfirmations.length > 1 && (
                  <p className="order-confirm-more">+{orderConfirmations.length - 1} pedido(s) aguardando confirmação</p>
                )}
              </div>
            </div>
          )
        })()}
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

function ProductSheet({ product, onClose, onOrder, t }) {
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
              <Detail label={t('product_packaging')} value={product.weight || product.packaging} />
              <Detail label={t('product_conservation')} value={product.conservation} />
              <Detail label={t('product_preparation')} value={product.preparation} />
              <Detail label={t('product_ideal')} value={product.idealFor} />
            </div>
          </div>
        </div>
        <div className="sheet-footer">
          <button className="primary-full" type="button" onClick={() => onOrder(product)}>
            {t('product_order')}
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

function CreateAccountModal({ product, onClose, onCreated, t }) {
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
        <span className="small-badge">{t('signup_order_badge')}</span>
            <h2>{t('signup_order_title')}</h2>
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

function SettingsScreen({ account, language, onLanguageChange, onClose, onDeleteAccount, onNotifSettingChange, t }) {
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
      .then(d => {
        if (d.settings) {
          const s = { ...d.settings, notificationSound: !!d.settings.notificationSound, deliveryNotifications: !!d.settings.deliveryNotifications }
          setSettings(s)
          notifSettings.current = { sound: s.notificationSound, delivery: s.deliveryNotifications }
        }
      })
      .catch(() => {})
  }, [account?.id])

  async function updateSetting(field, value) {
    const updated = { ...settings, [field]: value }
    setSettings(updated)
    if (field === 'language') onLanguageChange(value)
    if (field === 'notificationSound') onNotifSettingChange?.('sound', value)
    if (field === 'deliveryNotifications') onNotifSettingChange?.('delivery', value)
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
        <span className="small-badge"><Sparkles size={15} /> {t('news_badge')}</span>
        <h1>{t('news_title')}</h1>
        <p>{t('news_sub')}</p>
      </div>

      <div className="news-list">
        {upcomingProducts.map((item) => (
          <article className="news-card" key={item.title}>
            <img src={item.image} alt={item.title} />
            <div>
              <span>{item.month}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button type="button" onClick={() => onSelect(products[0])}>{t('news_interest')}</button>
            </div>
          </article>
        ))}
      </div>

      <div className="orange-panel">
        <Bell size={22} />
        <div>
          <h3>{t('news_whatsapp_title')}</h3>
          <p>{t('news_whatsapp_sub')}</p>
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
              <h2>{account.isCompany ? t('account_company') : t('account_client')}</h2>
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

function OrderDetailSheet({ order, onClose, onCancel, t }) {
  const steps = [t('order_step1'), t('order_step2'), t('order_step3'), t('order_step4')]
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
              <span>{t('order_quantity')}</span>
              <b>{order.quantity || '—'}</b>
            </div>
            <div className="order-detail-item">
              <span>{t('order_date')}</span>
              <b>{order.orderDate || order.date}</b>
            </div>
            <div className="order-detail-item">
              <span>{t('order_delivery')}</span>
              <b>{order.deliveryDate || '—'}</b>
            </div>
            <div className="order-detail-item">
              <span>{t('order_status')}</span>
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
              {t('order_cancel')}
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

function SellerDashboard({ account, setAccount, onSelectClient, onShowRegisterSale, sellerData, t }) {
  const data = sellerData || { name: '...', city: '...', goal: 0, sold: 0, totalClients: 0, alerts: [], clients: [] }
  const soldPercent = data.goal > 0 ? Math.round((data.sold / data.goal) * 100) : 0
  const remaining = data.goal - data.sold

  return (
    <section className="seller-dashboard">
      <div className="page-heading seller-welcome">
        <span className="small-badge seller-badge"><PackageCheck size={13} /> {t('seller_badge')}</span>
        <h1>{t('seller_hello')} {data.name ? data.name.split(' ')[0] : account.email.split('@')[0]}!</h1>
        <p>{t('seller_route_label')} <strong>{data.city}</strong></p>
        <small className="seller-date">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</small>
      </div>

      <div className="goal-card">
        <div className="goal-top">
          <div>
            <span className="goal-label">{t('seller_goal')}</span>
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
          <span>{t('seller_reached')} <b>R$ {Number(data.sold).toLocaleString('pt-BR')}</b></span>
          <span>{t('seller_remaining')} <b>R$ {Number(remaining).toLocaleString('pt-BR')}</b></span>
        </div>
      </div>

      <button className="new-sale-btn" type="button" onClick={onShowRegisterSale}>
        <Plus size={20} />
        <span>{t('seller_new_sale')}</span>
      </button>

      <div className="section-title-row compact">
        <div>
          <span>{t('seller_clients')}</span>
          <h2>{t('seller_route')}</h2>
        </div>
        <small>{data.totalClients} {t('seller_clients_total')}</small>
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
              <span>{t('seller_last')} {client.lastPurchase}</span>
              <span>{t('seller_ticket')} {client.avgTicket}</span>
            </div>
          </div>
          <ChevronRight size={16} className="rec-arrow" />
        </button>
      ))}

      <button className="ghost-full" type="button" style={{ marginTop: '8px' }} onClick={() => setAccount(null)}>
        {t('seller_logout')}
      </button>
    </section>
  )
}

function ClientDetailSheet({ client, onClose, t }) {
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
            <h2>{visitResult === 'sold' ? t('visit_sale_registered') : t('visit_registered')}</h2>
            <p>{visitResult === 'sold' ? `${t('visit_sale_registered')} ${client.name}.` : `${visitResult}`}</p>
            <button className="primary-full" type="button" onClick={onClose}>{t('visit_back')}</button>
          </div>
        ) : (
          <>
            <div className="client-sheet-header">
              <div className="client-sheet-avatar">{client.name.charAt(0)}</div>
              <div>
                <h2>{client.name}</h2>
                <p>{client.segment} · <span className={`prio-label prio-${client.priority}`}>
                  {client.priority === 'alta' ? t('client_priority_high') : client.priority === 'média' ? t('client_priority_mid') : t('client_priority_low')}
                </span></p>
              </div>
            </div>

            <div className="sheet-scroll">
              <div className="client-sheet-body">
                <div className="client-metrics-grid">
                  <div className="order-detail-item">
                    <span>{t('client_last_purchase')}</span>
                    <b>{client.lastPurchase}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>{t('client_last_value')}</span>
                    <b>{client.lastValue}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>{t('client_avg_ticket')}</span>
                    <b>{client.avgTicket}</b>
                  </div>
                  <div className="order-detail-item">
                    <span>Pendência</span>
                    <b className={client.pendency !== 'Nenhuma' ? 'warn-text' : ''}>{client.pendency}</b>
                  </div>
                </div>

                <div className="suggestion-box">
                  <span>{t('client_suggestion')}</span>
                  <p>{client.suggestion}</p>
                </div>

                <div className="client-sheet-section">
                  <h4>{t('client_recommended')}</h4>
                  <div className="tag-row">
                    {client.recommended.map((p) => <span key={p} className="ptag recommended">{p}</span>)}
                  </div>
                </div>

                <div className="client-sheet-section">
                  <h4>{t('client_top')}</h4>
                  <div className="tag-row">
                    {client.topProducts.map((p) => <span key={p} className="ptag purchased">{p}</span>)}
                  </div>
                </div>

                <div className="client-sheet-section">
                  <h4>{t('client_orders_history')}</h4>
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
                  <h4>{t('client_best_day')}</h4>
                  <span className="best-day-tag">{client.bestDay}</span>
                </div>
              </div>
            </div>

            <div className="client-sheet-footer">
              <h4>Resultado desta visita</h4>
              <button className="visit-sold-btn" type="button" onClick={() => setVisitResult('sold')}>
                {t('visit_sold')}
              </button>
              {!showNoSale ? (
                <button className="visit-nosale-btn" type="button" onClick={() => setShowNoSale(true)}>
                  {t('visit_no_sale')}
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

function RegisterSaleSheet({ onClose, onComplete, products, citiesData, account, t }) {
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
                <h2>{t('sale_where')}</h2>
                <p>{t('sale_where_sub')}</p>
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
                <h2>{t('sale_client')}</h2>
                <p>{t('sale_client_sub')} {selectedCity}</p>
              </div>
              <div className="sale-search">
                <Search size={15} />
                <input value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder={t('sale_search_client')} />
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
                <h2>{t('sale_details')}</h2>
                <p>{t('sale_for')} {selectedClient?.name}</p>
              </div>
            </div>
            <div className="sale-form">
              <div className="sale-field">
                <label>{t('sale_products')}{hasProducts ? <span> · {selectedProductIds.length} {selectedProductIds.length > 1 ? t('common_plural_selected') : t('common_selected')}</span> : null}</label>
                <div className="sale-search" style={{ marginBottom: '10px' }}>
                  <Search size={15} />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder={t('sale_search_product')} />
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
                <label>{t('sale_payment')}</label>
                <div className="payment-grid">
                  {PAYMENT_METHODS.map((pm) => (
                    <button key={pm} type="button" className={`payment-btn ${form.payment === pm ? 'selected' : ''}`} onClick={() => setForm((f) => ({ ...f, payment: pm }))}>
                      {pm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sale-field">
                <label>{t('sale_obs')} <span>(opcional)</span></label>
                <textarea value={form.observations} onChange={(e) => setForm((f) => ({ ...f, observations: e.target.value }))} placeholder={t('sale_obs_placeholder')} rows={2} />
              </div>
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" disabled={!hasProducts || !form.payment} onClick={() => setStep('confirm')}>
                {t('sale_summary')}
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
                <h2>{t('sale_confirm_title')}</h2>
                <p>{t('sale_confirm_sub')}</p>
              </div>
            </div>
            <div className="confirm-summary">
              <div className="confirm-row"><span>{t('sale_city')}</span><b>{selectedCity}</b></div>
              <div className="confirm-row"><span>{t('sale_client_label')}</span><b>{selectedClient?.name}</b></div>
              <div className="confirm-row">
                <span>Produtos</span>
                <div className="confirm-products">
                  {selectedProductIds.map((id) => {
                    const p = products.find((pr) => pr.id === id)
                    return <b key={id}>{p.name} <span>× {form.products[id]}</span></b>
                  })}
                </div>
              </div>
              <div className="confirm-row"><span>{t('sale_payment_label')}</span><b>{form.payment}</b></div>
              {form.observations ? <div className="confirm-row"><span>Observações</span><b>{form.observations}</b></div> : null}
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" onClick={submitSale}>
                {t('sale_finalize')}
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  )
}

function DeliveriesScreen({ deliveries, loading, onNew, onSelect, t }) {
  return (
    <section className="account-screen">
      <div className="page-heading">
        <span className="small-badge"><Truck size={15} /> Entregas</span>
        <h1>Suas entregas</h1>
        <p>Acompanhe as entregas atribuídas a você e os pedidos de cada rota.</p>
      </div>

      <button type="button" className="new-delivery-btn" onClick={onNew}>
        <Plus size={18} /> Nova entrega
      </button>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="order-card skeleton" style={{ height: 80 }} />
        ))
      ) : deliveries.length === 0 ? (
        <div className="empty-account">
          <Truck size={36} />
          <h2>Nenhuma entrega encontrada</h2>
          <p>Quando uma entrega for atribuída a você ela aparecerá aqui.</p>
        </div>
      ) : deliveries.map((delivery) => (
        <div key={delivery.id} className="delivery-card" role="button" tabIndex={0} onClick={() => onSelect && onSelect(delivery)} onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(delivery)}>
          <div className="delivery-card-header">
            <div className="delivery-card-title">
              <Truck size={16} />
              <strong>{delivery.code}</strong>
            </div>
            {delivery.status && (
              <span className={`delivery-status-badge ${deliveryStatusColor(delivery.status)}`}>{delivery.status}</span>
            )}
          </div>
          {delivery.route && (
            <p className="delivery-route"><MapPin size={13} /> {delivery.route}</p>
          )}
          {delivery.deliveryDate && (
            <p className="delivery-date">Saída: {new Date(delivery.deliveryDate).toLocaleDateString('pt-BR')}</p>
          )}
          {delivery.orders.length > 0 && (
            <div className="delivery-orders-list">
              {delivery.orders.map((order) => (
                <div key={order.id} className="delivery-order-item">
                  <span className="delivery-order-id">{order.id}</span>
                  <span className="delivery-order-client">{order.clientName}</span>
                  <span className={`delivery-order-status ${deliveryStatusColor(order.status)}`}>{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  )
}

function NewDeliverySheet({ onClose, vehicles, account, onCreated }) {
  const [step, setStep] = useState('route')
  const [selectedCities, setSelectedCities] = useState([])
  const [citySearch, setCitySearch] = useState('')
  const [showCitySugg, setShowCitySugg] = useState(false)
  const [selectedOrderIds, setSelectedOrderIds] = useState([])
  const [eligibleOrders, setEligibleOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [form, setForm] = useState({ vehicleName: '', temperature: '-18', departureDate: '', arrivalDate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const cityInputRef = useRef(null)

  useEffect(() => {
    if (step === 'orders' && eligibleOrders.length === 0 && !ordersLoading) {
      setOrdersLoading(true)
      fetch(`${API_URL}/api/deliveries?userId=${account.id}&eligibleOrders=true`)
        .then((r) => r.json())
        .then((data) => { if (data.orders) setEligibleOrders(data.orders) })
        .catch(() => {})
        .finally(() => setOrdersLoading(false))
    }
  }, [step])

  const citySuggestions = citySearch.trim().length >= 2
    ? SC_CITIES.filter((c) =>
        c.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
          citySearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ) && !selectedCities.includes(c)
      ).slice(0, 8)
    : []

  const addCity = (city) => {
    setSelectedCities((prev) => [...prev, city])
    setCitySearch('')
    setShowCitySugg(false)
    setTimeout(() => cityInputRef.current?.focus(), 50)
  }
  const removeCity = (city) => setSelectedCities((prev) => prev.filter((c) => c !== city))
  const toggleOrder = (id) => setSelectedOrderIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const route = selectedCities.join(' → ')

  async function submit() {
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`${API_URL}/api/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: account.id,
          route,
          vehicleName: form.vehicleName,
          temperature: form.temperature ? parseFloat(form.temperature) : -18.0,
          status: 'Carregando',
          departureDate: form.departureDate || null,
          arrivalDate: form.arrivalDate || null,
          notes: form.notes,
          orderIds: selectedOrderIds,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error || 'Erro ao criar entrega.'); return }
      onCreated({
        id: data.id,
        code: data.code,
        status: 'Carregando',
        route,
        vehicle: form.vehicleName || '—',
        stops: selectedCities.length,
        temperature: form.temperature ? `${form.temperature}°C` : '-18.0°C',
        departureDate: form.departureDate || null,
        deliveryDate: form.departureDate || null,
        arrivalDate: form.arrivalDate || null,
        notes: form.notes,
        progress: 25,
        orderIds: selectedOrderIds,
        orders: eligibleOrders
          .filter((o) => selectedOrderIds.includes(o.id))
          .map((o) => ({ id: o.id, clientName: o.clientName, status: o.status })),
      })
    } catch {
      setSaveError('Não foi possível conectar ao servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="product-sheet new-delivery-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>

        {step === 'route' && (
          <>
            <div className="sale-step-header">
              <div className="sale-step-title">
                <MapPin size={20} />
                <h2>Rota da entrega</h2>
                <p>Adicione as cidades que compõem a rota</p>
              </div>
            </div>
            <div className="sheet-body nd-body">
              <div className="nd-city-picker">
                <div className="nd-city-tags">
                  {selectedCities.map((city, idx) => (
                    <span key={city} className="nd-city-tag">
                      {idx > 0 && <span className="nd-city-arrow">→</span>}
                      {city}
                      <button type="button" onClick={() => removeCity(city)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
                <div className="nd-city-search">
                  <Search size={15} />
                  <input
                    ref={cityInputRef}
                    value={citySearch}
                    onChange={(e) => { setCitySearch(e.target.value); setShowCitySugg(true) }}
                    onFocus={() => setShowCitySugg(true)}
                    onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                    placeholder={selectedCities.length === 0 ? 'Digite uma cidade de SC...' : 'Adicionar cidade...'}
                  />
                </div>
                {showCitySugg && citySuggestions.length > 0 && (
                  <ul className="nd-city-suggestions">
                    {citySuggestions.map((city) => (
                      <li key={city} onMouseDown={() => addCity(city)}><MapPin size={13} /> {city}</li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedCities.length > 0 && (
                <div className="nd-route-preview">
                  <Route size={14} /> <span>{route}</span>
                </div>
              )}
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" disabled={selectedCities.length === 0} onClick={() => setStep('orders')}>
                Próximo: Pedidos
              </button>
            </div>
          </>
        )}

        {step === 'orders' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('route')}><ChevronLeft size={16} /> Rota</button>
              <div className="sale-step-title">
                <PackageCheck size={20} />
                <h2>Pedidos da rota</h2>
                <p>Selecione os pedidos em separação para esta entrega</p>
              </div>
            </div>
            <div className="sheet-body nd-body">
              {ordersLoading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="order-card skeleton" style={{ height: 56 }} />)
              ) : eligibleOrders.length === 0 ? (
                <div className="empty-account" style={{ paddingTop: 24 }}>
                  <PackageCheck size={32} />
                  <h2>Nenhum pedido elegível</h2>
                  <p>Pedidos em Separação ou Pronto aparecerão aqui.</p>
                </div>
              ) : (
                <div className="nd-orders-checklist">
                  {eligibleOrders.map((o) => {
                    const sel = selectedOrderIds.includes(o.id)
                    return (
                      <div key={o.id} className={`nd-order-check${sel ? ' selected' : ''}`} role="button" tabIndex={0} onClick={() => toggleOrder(o.id)} onKeyDown={(e) => e.key === 'Enter' && toggleOrder(o.id)}>
                        <div className="nd-order-check-body">
                          <b>{o.id}</b>
                          <span>{o.clientName}</span>
                          <small>{o.city}{o.value ? ` • ${o.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : ''}</small>
                        </div>
                        <div className="nd-order-check-right">
                          <span className={`delivery-status-badge ${deliveryStatusColor(o.status)}`}>{o.status}</span>
                          {sel && <Check size={17} color="var(--orange)" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" onClick={() => setStep('details')}>
                {selectedOrderIds.length > 0 ? `Próximo: Detalhes (${selectedOrderIds.length} pedido${selectedOrderIds.length > 1 ? 's' : ''})` : 'Próximo: Detalhes'}
              </button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('orders')}><ChevronLeft size={16} /> Pedidos</button>
              <div className="sale-step-title">
                <Truck size={20} />
                <h2>Detalhes da rota</h2>
                <p>Veículo, temperatura e datas</p>
              </div>
            </div>
            <div className="sheet-body nd-body">
              <div className="sale-form">
                <div className="sale-field">
                  <label>Veículo / Câmara fria</label>
                  {vehicles.length === 0 ? (
                    <input placeholder="Ex: Câmara fria 01" value={form.vehicleName} onChange={(e) => set('vehicleName', e.target.value)} />
                  ) : (
                    <select value={form.vehicleName} onChange={(e) => set('vehicleName', e.target.value)}>
                      <option value="">Selecione o veículo</option>
                      {vehicles.map((v) => <option key={v.id} value={v.name}>{v.name}{v.plate ? ` • ${v.plate}` : ''}</option>)}
                    </select>
                  )}
                </div>
                <div className="sale-field">
                  <label>Temperatura da câmara (°C)</label>
                  <input type="number" placeholder="-18" value={form.temperature} onChange={(e) => set('temperature', e.target.value)} />
                </div>
                <div className="sale-field">
                  <label>Data de saída</label>
                  <input type="datetime-local" value={form.departureDate} onChange={(e) => set('departureDate', e.target.value)} />
                </div>
                <div className="sale-field">
                  <label>Chegada prevista</label>
                  <input type="datetime-local" value={form.arrivalDate} onChange={(e) => set('arrivalDate', e.target.value)} />
                </div>
                <div className="sale-field">
                  <label>Observações <span>(opcional)</span></label>
                  <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Instruções especiais, cuidados com a carga..." />
                </div>
              </div>
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" onClick={() => setStep('confirm')}>Revisar entrega</button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="sale-step-header">
              <button type="button" className="sale-back-btn" onClick={() => setStep('details')}><ChevronLeft size={16} /> Editar</button>
              <div className="sale-step-title">
                <Check size={20} />
                <h2>Confirmar entrega</h2>
                <p>Revise e crie a rota de entrega</p>
              </div>
            </div>
            <div className="sheet-body nd-body">
              <div className="confirm-summary">
                <div className="confirm-row"><span>Rota</span><b>{route}</b></div>
                {selectedOrderIds.length > 0 && (
                  <div className="confirm-row">
                    <span>Pedidos</span>
                    <div className="confirm-products">
                      {eligibleOrders.filter((o) => selectedOrderIds.includes(o.id)).map((o) => (
                        <b key={o.id}>{o.id} <span>· {o.clientName}</span></b>
                      ))}
                    </div>
                  </div>
                )}
                {form.vehicleName && <div className="confirm-row"><span>Veículo</span><b>{form.vehicleName}</b></div>}
                {form.temperature && <div className="confirm-row"><span>Temperatura</span><b>{form.temperature}°C</b></div>}
                {form.departureDate && <div className="confirm-row"><span>Saída</span><b>{new Date(form.departureDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</b></div>}
                {form.arrivalDate && <div className="confirm-row"><span>Chegada prevista</span><b>{new Date(form.arrivalDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</b></div>}
                {form.notes && <div className="confirm-row"><span>Observações</span><b>{form.notes}</b></div>}
              </div>
              {saveError && <p className="nd-save-error">{saveError}</p>}
            </div>
            <div className="sale-footer">
              <button className="primary-full" type="button" disabled={saving} onClick={submit}>
                {saving ? 'Criando...' : 'Criar entrega'}
              </button>
            </div>
          </>
        )}
      </article>
    </div>
  )
}

function DeliveryDetailSheet({ delivery, onClose }) {
  const statusSteps = ['Planejada', 'Carregando', 'Em rota', 'Concluída']
  const currentStep = statusSteps.indexOf(delivery.status)
  const isCancelled = delivery.status === 'Cancelada'

  const fmtDate = (val) => {
    if (!val) return '—'
    try {
      return new Date(val).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch { return val }
  }

  return (
    <div className="sheet-backdrop centered" onClick={onClose}>
      <article className="product-sheet delivery-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button>

        <div className="delivery-detail-header">
          <span className="small-badge"><Truck size={14} /> {delivery.code}</span>
          <h2>{delivery.route || 'Entrega'}</h2>
          {delivery.status && (
            <span className={`delivery-status-badge ${deliveryStatusColor(delivery.status)}`}>{delivery.status}</span>
          )}
        </div>

        <div className="sheet-scroll">

          {/* Progresso */}
          <div className="delivery-detail-section">
            <h4>Progresso</h4>
            {!isCancelled ? (
              <div className="delivery-steps">
                {statusSteps.map((s, idx) => (
                  <div key={s} className={`delivery-step${idx < currentStep ? ' done' : ''}${idx === currentStep ? ' active' : ''}`}>
                    <div className="delivery-step-dot">
                      {idx < currentStep ? <Check size={11} /> : <span>{idx + 1}</span>}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--red)', fontWeight: 700, margin: '10px 0 0' }}>Esta entrega foi cancelada.</p>
            )}
            {delivery.progress > 0 && !isCancelled && (
              <div className="delivery-progress-bar" style={{ marginTop: 14 }}>
                <div style={{ width: `${delivery.progress}%` }} />
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="delivery-detail-section">
            <h4>Informações</h4>
            <div className="order-detail-grid">
              {delivery.vehicle && (
                <div className="order-detail-item">
                  <span>Veículo</span>
                  <b>{delivery.vehicle}</b>
                </div>
              )}
              <div className="order-detail-item">
                <span>Paradas</span>
                <b>{delivery.stops || '—'}</b>
              </div>
              {delivery.temperature && (
                <div className="order-detail-item">
                  <span>Temperatura</span>
                  <b>{delivery.temperature}</b>
                </div>
              )}
              <div className="order-detail-item">
                <span>Status</span>
                <b className="status-text">{delivery.status}</b>
              </div>
            </div>
            {(delivery.departureDate || delivery.arrivalDate) && (
              <div className="order-detail-grid" style={{ marginTop: 10 }}>
                <div className="order-detail-item">
                  <span>Saída</span>
                  <b>{fmtDate(delivery.departureDate)}</b>
                </div>
                <div className="order-detail-item">
                  <span>Chegada prevista</span>
                  <b>{fmtDate(delivery.arrivalDate)}</b>
                </div>
              </div>
            )}
          </div>

          {/* Pedidos */}
          {delivery.orders?.length > 0 && (
            <div className="delivery-detail-section">
              <h4><PackageCheck size={15} /> Pedidos nesta entrega</h4>
              <div className="delivery-orders-list">
                {delivery.orders.map((order) => (
                  <div key={order.id} className="delivery-order-item">
                    <span className="delivery-order-id">{order.id}</span>
                    <span className="delivery-order-client">{order.clientName}</span>
                    <span className={`delivery-order-status ${deliveryStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observações */}
          {delivery.notes && (
            <div className="delivery-detail-section">
              <h4><ClipboardList size={15} /> Observações</h4>
              <p className="delivery-detail-notes">{delivery.notes}</p>
            </div>
          )}

        </div>
      </article>
    </div>
  )
}


function BottomNav({ tab, setTab, account, t }) {
  const items = [
    { id: 'catalog', label: t('nav_catalog'), icon: LayoutGrid },
    { id: 'news', label: t('nav_news'), icon: Sparkles },
    account?.role === 'seller'
      ? { id: 'deliveries', label: t('nav_deliveries'), icon: Truck }
      : { id: 'chat', label: t('nav_seller'), icon: MessageCircle },
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
