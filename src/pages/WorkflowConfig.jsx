import { useState, useEffect } from 'react'
import { Settings, Plus, Trash2, GripVertical, Save, RefreshCw, Play, Pause, CheckCircle, ArrowRight } from 'lucide-react'
import { api } from '../services/api'

export default function WorkflowConfig() {
  const [workflows, setWorkflows] = useState([])
  const [selectedWorkflow, setSelectedWorkflow] = useState(null)
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const stationsData = await api.get('/production/stations')
      setStations(stationsData)

      // Load saved workflows from localStorage
      const savedWorkflows = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
      if (savedWorkflows.length === 0) {
        // Create default workflow
        const defaultWorkflow = {
          id: 'default',
          name: 'Standard Cabinet Production',
          description: 'Default workflow for cabinet manufacturing',
          isActive: true,
          steps: stationsData.map((s, i) => ({
            id: s.id,
            name: s.name,
            order: i + 1,
            isRequired: true,
            estimatedTime: 30,
            autoAdvance: false
          }))
        }
        setWorkflows([defaultWorkflow])
        setSelectedWorkflow(defaultWorkflow)
      } else {
        setWorkflows(savedWorkflows)
        setSelectedWorkflow(savedWorkflows[0])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWorkflows = () => {
    setSaving(true)
    localStorage.setItem('customWorkflows', JSON.stringify(workflows))
    setTimeout(() => setSaving(false), 500)
  }

  const addWorkflow = () => {
    const newWorkflow = {
      id: `workflow-${Date.now()}`,
      name: 'New Workflow',
      description: '',
      isActive: false,
      steps: []
    }
    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
  }

  const deleteWorkflow = (id) => {
    if (workflows.length <= 1) return
    const updated = workflows.filter(w => w.id !== id)
    setWorkflows(updated)
    setSelectedWorkflow(updated[0])
  }

  const updateWorkflow = (field, value) => {
    if (!selectedWorkflow) return
    const updated = workflows.map(w => 
      w.id === selectedWorkflow.id ? { ...w, [field]: value } : w
    )
    setWorkflows(updated)
    setSelectedWorkflow({ ...selectedWorkflow, [field]: value })
  }

  const addStep = () => {
    if (!selectedWorkflow) return
    const newStep = {
      id: `step-${Date.now()}`,
      name: 'New Step',
      order: selectedWorkflow.steps.length + 1,
      isRequired: true,
      estimatedTime: 30,
      autoAdvance: false
    }
    updateWorkflow('steps', [...selectedWorkflow.steps, newStep])
  }

  const updateStep = (stepId, field, value) => {
    if (!selectedWorkflow) return
    const updatedSteps = selectedWorkflow.steps.map(s =>
      s.id === stepId ? { ...s, [field]: value } : s
    )
    updateWorkflow('steps', updatedSteps)
  }

  const deleteStep = (stepId) => {
    if (!selectedWorkflow) return
    const updatedSteps = selectedWorkflow.steps
      .filter(s => s.id !== stepId)
      .map((s, i) => ({ ...s, order: i + 1 }))
    updateWorkflow('steps', updatedSteps)
  }

  const moveStep = (stepId, direction) => {
    if (!selectedWorkflow) return
    const steps = [...selectedWorkflow.steps]
    const index = steps.findIndex(s => s.id === stepId)
    if (direction === 'up' && index > 0) {
      [steps[index], steps[index - 1]] = [steps[index - 1], steps[index]]
    } else if (direction === 'down' && index < steps.length - 1) {
      [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]]
    }
    const reordered = steps.map((s, i) => ({ ...s, order: i + 1 }))
    updateWorkflow('steps', reordered)
  }

  const setActiveWorkflow = (id) => {
    const updated = workflows.map(w => ({ ...w, isActive: w.id === id }))
    setWorkflows(updated)
    saveWorkflows()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={48} className="text-amber-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Workflow Configuration</h1>
          <p className="text-gray-600">Customize production workflows and station sequences</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={addWorkflow}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Plus size={18} />
            New Workflow
          </button>
          <button
            onClick={saveWorkflows}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Workflow List */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Workflows</h2>
          <div className="space-y-2">
            {workflows.map(workflow => (
              <button
                key={workflow.id}
                onClick={() => setSelectedWorkflow(workflow)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedWorkflow?.id === workflow.id
                    ? 'bg-amber-50 border-2 border-amber-500'
                    : 'bg-gray-50 border-2 border-transparent hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{workflow.name}</span>
                  {workflow.isActive && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">{workflow.steps.length} steps</p>
              </button>
            ))}
          </div>
        </div>

        {/* Workflow Editor */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          {selectedWorkflow ? (
            <div className="space-y-6">
              {/* Workflow Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workflow Name
                  </label>
                  <input
                    type="text"
                    value={selectedWorkflow.name}
                    onChange={(e) => updateWorkflow('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={selectedWorkflow.description}
                    onChange={(e) => updateWorkflow('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveWorkflow(selectedWorkflow.id)}
                  disabled={selectedWorkflow.isActive}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    selectedWorkflow.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-600 text-white hover:bg-amber-700'
                  }`}
                >
                  {selectedWorkflow.isActive ? <CheckCircle size={18} /> : <Play size={18} />}
                  {selectedWorkflow.isActive ? 'Currently Active' : 'Set as Active'}
                </button>
                {workflows.length > 1 && (
                  <button
                    onClick={() => deleteWorkflow(selectedWorkflow.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    <Trash2 size={18} />
                    Delete
                  </button>
                )}
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Workflow Steps</h3>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <Plus size={16} />
                    Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveStep(step.id, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveStep(step.id, 'down')}
                          disabled={index === selectedWorkflow.steps.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          ▼
                        </button>
                      </div>

                      <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                        {step.order}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Step name"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={step.estimatedTime}
                            onChange={(e) => updateStep(step.id, 'estimatedTime', parseInt(e.target.value))}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                          />
                          <span className="text-sm text-gray-500">min</span>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.isRequired}
                            onChange={(e) => updateStep(step.id, 'isRequired', e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Required</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.autoAdvance}
                            onChange={(e) => updateStep(step.id, 'autoAdvance', e.target.checked)}
                            className="w-4 h-4 text-amber-600 rounded"
                          />
                          <span className="text-sm text-gray-700">Auto-advance</span>
                        </label>
                      </div>

                      <button
                        onClick={() => deleteStep(step.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Workflow Preview</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`px-4 py-2 rounded-lg ${
                        step.isRequired ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        <p className="font-medium whitespace-nowrap">{step.name}</p>
                        <p className="text-xs opacity-75">{step.estimatedTime} min</p>
                      </div>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <ArrowRight size={24} className="text-gray-400 mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Settings size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a workflow to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
