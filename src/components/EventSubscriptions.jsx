import { useState, useEffect } from 'react'
import { Bell, BellOff, Mail, Smartphone, Monitor, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../services/api'

const CATEGORY_ICONS = {
  production: '🏭',
  inventory: '📦',
  quality: '✅',
  machines: '⚙️',
  designs: '🎨',
  orders: '📋',
  users: '👥',
  system: '🖥️',
  tracking: '📍',
  maintenance: '🔧'
}

function EventSubscriptions({ userId }) {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [eventsRes, subsRes] = await Promise.all([
        api.get('/subscriptions/events'),
        api.get(`/subscriptions/user/${userId}`)
      ])
      
      setEvents(eventsRes.data.events || [])
      setCategories(eventsRes.data.categories || [])
      setSubscriptions(subsRes.data || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
    setLoading(false)
  }

  const isSubscribed = (eventType) => {
    const sub = subscriptions.find(s => s.eventType === eventType)
    return sub?.isEnabled || false
  }

  const getSubscription = (eventType) => {
    return subscriptions.find(s => s.eventType === eventType)
  }

  const toggleSubscription = async (eventType) => {
    setSaving(true)
    try {
      if (isSubscribed(eventType)) {
        await api.post('/subscriptions/unsubscribe', { userId, eventType })
      } else {
        await api.post('/subscriptions/subscribe', { userId, eventType, notifyInApp: true })
      }
      await fetchData()
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
    setSaving(false)
  }

  const subscribeToCategory = async (category) => {
    setSaving(true)
    try {
      await api.post('/subscriptions/subscribe/category', { userId, category, notifyInApp: true })
      await fetchData()
    } catch (error) {
      console.error('Error subscribing to category:', error)
    }
    setSaving(false)
  }

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const getEventsByCategory = (category) => {
    return events.filter(e => e.category === category)
  }

  const getCategorySubscriptionCount = (category) => {
    const categoryEvents = getEventsByCategory(category)
    return categoryEvents.filter(e => isSubscribed(e.type)).length
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading subscriptions...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bell size={20} /> Event Subscriptions
        </h3>
        <span className="text-sm text-gray-500">
          {subscriptions.filter(s => s.isEnabled).length} of {events.length} events subscribed
        </span>
      </div>

      <p className="text-sm text-gray-600">
        Subscribe to events to receive notifications when they occur. You can choose to receive notifications via email, in-app, or push notifications.
      </p>

      <div className="space-y-3">
        {categories.map(category => {
          const categoryEvents = getEventsByCategory(category)
          const subscribedCount = getCategorySubscriptionCount(category)
          const isExpanded = expandedCategories[category]
          
          return (
            <div key={category} className="bg-white rounded-lg border overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[category] || '📌'}</span>
                  <div>
                    <h4 className="font-medium text-gray-800 capitalize">{category}</h4>
                    <p className="text-sm text-gray-500">
                      {subscribedCount}/{categoryEvents.length} events subscribed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      subscribeToCategory(category)
                    }}
                    disabled={saving}
                    className="px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded hover:bg-amber-200 disabled:opacity-50"
                  >
                    Subscribe All
                  </button>
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t divide-y">
                  {categoryEvents.map(event => {
                    const subscribed = isSubscribed(event.type)
                    const sub = getSubscription(event.type)
                    
                    return (
                      <div key={event.type} className="p-3 flex items-center justify-between hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{event.name}</p>
                          <p className="text-sm text-gray-500">{event.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {subscribed && (
                            <div className="flex items-center gap-1">
                              <button 
                                className={`p-1 rounded ${sub?.notifyEmail ? 'bg-blue-100 text-blue-600' : 'text-gray-300'}`}
                                title="Email notifications"
                              >
                                <Mail size={16} />
                              </button>
                              <button 
                                className={`p-1 rounded ${sub?.notifyInApp ? 'bg-green-100 text-green-600' : 'text-gray-300'}`}
                                title="In-app notifications"
                              >
                                <Monitor size={16} />
                              </button>
                              <button 
                                className={`p-1 rounded ${sub?.notifyPush ? 'bg-purple-100 text-purple-600' : 'text-gray-300'}`}
                                title="Push notifications"
                              >
                                <Smartphone size={16} />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => toggleSubscription(event.type)}
                            disabled={saving}
                            className={`p-2 rounded-full transition-colors ${
                              subscribed 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {subscribed ? <Bell size={18} /> : <BellOff size={18} />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EventSubscriptions
