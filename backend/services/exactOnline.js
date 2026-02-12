import axios from 'axios'

// Exact Online API Configuration
const EXACT_CONFIG = {
  authUrl: 'https://start.exactonline.nl/api/oauth2/auth',
  tokenUrl: 'https://start.exactonline.nl/api/oauth2/token',
  apiBaseUrl: 'https://start.exactonline.nl/api/v1',
  // These should be stored in environment variables
  clientId: process.env.EXACT_CLIENT_ID || '',
  clientSecret: process.env.EXACT_CLIENT_SECRET || '',
  redirectUri: process.env.EXACT_REDIRECT_URI || 'http://localhost:3001/api/accounting/exact/callback'
}

// In-memory token storage (should be in database in production)
let tokenStorage = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  division: null
}

class ExactOnlineService {
  constructor() {
    this.config = EXACT_CONFIG
  }

  // Check if credentials are configured
  isConfigured() {
    return !!(this.config.clientId && this.config.clientSecret)
  }

  // Get authorization URL for OAuth2 flow
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      force_login: '0'
    })
    return `${this.config.authUrl}?${params.toString()}`
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      const response = await axios.post(this.config.tokenUrl, new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      tokenStorage = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: Date.now() + (response.data.expires_in * 1000),
        division: null
      }

      // Get the division (company) after authentication
      await this.getCurrentDivision()

      return { success: true, message: 'Connected to Exact Online' }
    } catch (error) {
      console.error('Exact Online token exchange error:', error.response?.data || error.message)
      throw new Error('Failed to connect to Exact Online: ' + (error.response?.data?.error_description || error.message))
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!tokenStorage.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(this.config.tokenUrl, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenStorage.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })

      tokenStorage.accessToken = response.data.access_token
      tokenStorage.refreshToken = response.data.refresh_token
      tokenStorage.expiresAt = Date.now() + (response.data.expires_in * 1000)

      return true
    } catch (error) {
      console.error('Token refresh error:', error.response?.data || error.message)
      tokenStorage = { accessToken: null, refreshToken: null, expiresAt: null, division: null }
      throw new Error('Session expired. Please reconnect to Exact Online.')
    }
  }

  // Check if connected and token is valid
  async ensureValidToken() {
    if (!tokenStorage.accessToken) {
      throw new Error('Not connected to Exact Online')
    }

    // Refresh if token expires in less than 5 minutes
    if (tokenStorage.expiresAt && Date.now() > tokenStorage.expiresAt - 300000) {
      await this.refreshAccessToken()
    }

    return tokenStorage.accessToken
  }

  // Make authenticated API request
  async apiRequest(endpoint, method = 'GET', data = null) {
    const token = await this.ensureValidToken()
    
    const url = `${this.config.apiBaseUrl}/${tokenStorage.division}${endpoint}`
    
    try {
      const response = await axios({
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        data
      })
      return response.data
    } catch (error) {
      console.error('Exact API error:', error.response?.data || error.message)
      throw new Error('Exact Online API error: ' + (error.response?.data?.error?.message?.value || error.message))
    }
  }

  // Get current division (company)
  async getCurrentDivision() {
    const token = await this.ensureValidToken()
    
    try {
      const response = await axios.get(`${this.config.apiBaseUrl}/current/Me?$select=CurrentDivision`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      tokenStorage.division = response.data.d.results[0].CurrentDivision
      return tokenStorage.division
    } catch (error) {
      console.error('Error getting division:', error.response?.data || error.message)
      throw new Error('Failed to get Exact Online division')
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: !!tokenStorage.accessToken,
      configured: this.isConfigured(),
      division: tokenStorage.division,
      expiresAt: tokenStorage.expiresAt
    }
  }

  // Disconnect from Exact Online
  disconnect() {
    tokenStorage = { accessToken: null, refreshToken: null, expiresAt: null, division: null }
    return { success: true, message: 'Disconnected from Exact Online' }
  }

  // ============ BUSINESS OPERATIONS ============

  // Sync invoices to Exact Online
  async syncInvoices(invoices) {
    const results = { synced: 0, failed: 0, errors: [] }

    for (const invoice of invoices) {
      try {
        // Create sales invoice in Exact Online
        const exactInvoice = {
          Journal: process.env.EXACT_SALES_JOURNAL || '70', // Default sales journal
          OrderedBy: invoice.customerId || null,
          Description: `Invoice ${invoice.id} - ${invoice.orderNumber}`,
          InvoiceDate: invoice.createdAt ? new Date(invoice.createdAt).toISOString() : new Date().toISOString(),
          SalesInvoiceLines: [{
            Description: invoice.designName || 'Cabinet Production',
            Quantity: invoice.totalPanels || 1,
            UnitPrice: invoice.amount / (invoice.totalPanels || 1)
          }]
        }

        await this.apiRequest('/salesinvoice/SalesInvoices', 'POST', exactInvoice)
        results.synced++
      } catch (error) {
        results.failed++
        results.errors.push({ invoiceId: invoice.id, error: error.message })
      }
    }

    return results
  }

  // Get customers from Exact Online
  async getCustomers() {
    const response = await this.apiRequest('/crm/Accounts?$select=ID,Name,Email,Phone&$filter=IsSupplier eq false')
    return response.d.results || []
  }

  // Get items/products from Exact Online
  async getItems() {
    const response = await this.apiRequest('/logistics/Items?$select=ID,Code,Description,SalesPrice')
    return response.d.results || []
  }

  // Get sales invoices from Exact Online
  async getSalesInvoices(fromDate = null) {
    let filter = ''
    if (fromDate) {
      filter = `&$filter=InvoiceDate ge datetime'${fromDate}'`
    }
    const response = await this.apiRequest(`/salesinvoice/SalesInvoices?$select=InvoiceID,InvoiceNumber,InvoiceDate,AmountDC,Status${filter}`)
    return response.d.results || []
  }

  // Get purchase invoices (expenses) from Exact Online
  async getPurchaseInvoices(fromDate = null) {
    let filter = ''
    if (fromDate) {
      filter = `&$filter=InvoiceDate ge datetime'${fromDate}'`
    }
    const response = await this.apiRequest(`/purchaseinvoice/PurchaseInvoices?$select=ID,InvoiceNumber,InvoiceDate,AmountDC,Status${filter}`)
    return response.d.results || []
  }

  // Create a customer in Exact Online
  async createCustomer(customerData) {
    const exactCustomer = {
      Name: customerData.name,
      Email: customerData.email || null,
      Phone: customerData.phone || null,
      IsSupplier: false,
      IsCustomer: true
    }

    const response = await this.apiRequest('/crm/Accounts', 'POST', exactCustomer)
    return response.d
  }
}

export const exactOnlineService = new ExactOnlineService()
export default exactOnlineService
