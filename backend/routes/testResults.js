import express from 'express'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// File path for persistent storage
const HISTORY_FILE = path.join(__dirname, '..', 'test-history.json')

// Load test history from file
const loadHistory = () => {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading test history:', error)
  }
  return []
}

// Save test history to file
const saveHistory = (history) => {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2))
  } catch (error) {
    console.error('Error saving test history:', error)
  }
}

// Store test results - load from file on startup
let lastTestRun = null
let testRunHistory = loadHistory()

// Run Jest tests and capture results
router.post('/run', async (req, res) => {
  try {
    const backendDir = path.join(__dirname, '..')
    
    // Run Jest with JSON reporter and suppress console output
    const { stdout, stderr } = await execAsync(
      'npm test -- --json --passWithNoTests --silent 2>&1',
      { cwd: backendDir, maxBuffer: 10 * 1024 * 1024, env: { ...process.env, NODE_ENV: 'test' } }
    )
    
    // Parse Jest JSON output
    let testResults = null
    try {
      // Find JSON in output
      const jsonMatch = stdout.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/)
      if (jsonMatch) {
        testResults = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error('Failed to parse Jest output:', parseError)
    }
    
    // Create user-friendly summary
    const total = testResults?.numTotalTests || 0
    const passed = testResults?.numPassedTests || 0
    const failed = testResults?.numFailedTests || 0
    const duration = testResults?.testResults?.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) || 0
    
    // Parse test suites for detailed breakdown
    const testSuiteDetails = []
    if (testResults?.testResults) {
      for (const suite of testResults.testResults) {
        const suiteName = suite.name.split('/').pop().replace('.test.js', '')
        const suiteTests = suite.assertionResults || []
        
        testSuiteDetails.push({
          name: suiteName,
          status: suite.status,
          passed: suiteTests.filter(t => t.status === 'passed').length,
          failed: suiteTests.filter(t => t.status === 'failed').length,
          tests: suiteTests.map(t => ({
            name: t.title,
            status: t.status,
            duration: t.duration || 0,
            failureMessage: t.failureMessages?.join('\n') || null
          }))
        })
      }
    }
    
    // Build user-friendly output
    let userFriendlyOutput = `
📊 TEST RESULTS SUMMARY
========================
✅ Passed: ${passed}
❌ Failed: ${failed}
📋 Total: ${total}
⏱️ Duration: ${duration}ms

${failed > 0 ? '⚠️ Some tests failed. See details below.' : '🎉 All tests passed successfully!'}

📁 TEST SUITES:
`
    
    for (const suite of testSuiteDetails) {
      const icon = suite.failed > 0 ? '❌' : '✅'
      userFriendlyOutput += `\n${icon} ${suite.name} (${suite.passed}/${suite.passed + suite.failed} passed)\n`
      
      for (const test of suite.tests) {
        const testIcon = test.status === 'passed' ? '  ✓' : '  ✗'
        userFriendlyOutput += `${testIcon} ${test.name} (${test.duration}ms)\n`
        if (test.failureMessage) {
          userFriendlyOutput += `    Error: ${test.failureMessage.substring(0, 200)}...\n`
        }
      }
    }
    
    userFriendlyOutput = userFriendlyOutput.trim()

    const result = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      success: failed === 0,
      rawOutput: userFriendlyOutput,
      parsed: testResults,
      summary: {
        total,
        passed,
        failed,
        duration: testResults?.testResults?.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) || 0
      }
    }
    
    lastTestRun = result
    testRunHistory.unshift(result)
    testRunHistory = testRunHistory.slice(0, 20)
    saveHistory(testRunHistory)
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stdout: error.stdout?.substring(0, 2000),
      stderr: error.stderr?.substring(0, 2000)
    })
  }
})

// Get last test run
router.get('/last', (req, res) => {
  if (lastTestRun) {
    res.json(lastTestRun)
  } else {
    res.status(404).json({ error: 'No test runs yet' })
  }
})

// Get test run history
router.get('/history', (req, res) => {
  res.json(testRunHistory)
})

// Get test summary (quick endpoint)
router.get('/summary', (req, res) => {
  if (lastTestRun) {
    res.json({
      lastRun: lastTestRun.timestamp,
      ...lastTestRun.summary,
      historyCount: testRunHistory.length
    })
  } else {
    res.json({
      lastRun: null,
      total: 0,
      passed: 0,
      failed: 0,
      historyCount: 0
    })
  }
})

export default router
