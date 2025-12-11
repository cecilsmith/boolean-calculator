<template>
  <div class="division-solver">
    <section class="intro">
      <h2>Boolean Division</h2>
      <p>Learn binary division with restoring and non-restoring division algorithms.</p>
    </section>

    <section class="input-section">
      <div class="input-group">
        <label for="dividend">Dividend (binary):</label>
        <input
          id="dividend"
          v-model="dividend"
          type="text"
          placeholder="e.g., 1101 (13 in decimal)"
          class="binary-input"
        />
      </div>

      <div class="input-group">
        <label for="divisor">Divisor (binary):</label>
        <input
          id="divisor"
          v-model="divisor"
          type="text"
          placeholder="e.g., 11 (3 in decimal)"
          class="binary-input"
        />
      </div>

      <div class="algorithm-selector">
        <label>
          <input type="radio" v-model="algorithm" value="restoring" />
          Restoring Division
        </label>
        <label>
          <input type="radio" v-model="algorithm" value="non-restoring" />
          Non-Restoring Division
        </label>
      </div>

      <button @click="calculate" class="btn-calculate">Calculate Division</button>
    </section>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <section v-if="result" class="results">
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Dividend:</span>
            <span class="value">{{ result.dividendBinary }} ({{ result.dividendDecimal }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Divisor:</span>
            <span class="value">{{ result.divisorBinary }} ({{ result.divisorDecimal }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Quotient:</span>
            <span class="value">{{ result.quotient }} ({{ parseInt(result.quotient, 2) }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Remainder:</span>
            <span class="value">{{ result.remainder }} ({{ parseInt(result.remainder, 2) }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Algorithm:</span>
            <span class="value">{{ algorithm === 'restoring' ? 'Restoring' : 'Non-Restoring' }}</span>
          </div>
        </div>
      </div>

      <div class="explanation">
        <h3>Algorithm Explanation</h3>
        <div v-if="algorithm === 'restoring'" class="algo-description">
          <p><strong>Restoring Division:</strong></p>
          <ol>
            <li>Initialize: Set quotient = 0, remainder = dividend</li>
            <li>For each bit position (from left to right):
              <ul>
                <li>Shift remainder left by 1 bit</li>
                <li>Subtract divisor from remainder</li>
                <li>If result is negative: restore remainder (add divisor back), set quotient bit = 0</li>
                <li>If result is non-negative: keep result, set quotient bit = 1</li>
              </ul>
            </li>
            <li>Final remainder and quotient are the results</li>
          </ol>
        </div>
        <div v-else class="algo-description">
          <p><strong>Non-Restoring Division:</strong></p>
          <ol>
            <li>Initialize: Set quotient = 0, remainder = dividend</li>
            <li>For each bit position (from left to right):
              <ul>
                <li>Shift remainder left by 1 bit</li>
                <li>If previous remainder was positive: subtract divisor</li>
                <li>If previous remainder was negative: add divisor</li>
                <li>If result is negative: set quotient bit = 0</li>
                <li>If result is non-negative: set quotient bit = 1</li>
              </ul>
            </li>
            <li>If final remainder is negative, add divisor to restore</li>
            <li>Final remainder and quotient are the results</li>
          </ol>
        </div>
      </div>

      <div class="steps">
        <h3>Step-by-Step Process</h3>
        <div class="step-controls">
          <button @click="currentStep = Math.max(0, currentStep - 1)" :disabled="currentStep === 0" class="btn-nav">
            ← Previous Step
          </button>
          <span class="step-indicator">Step {{ currentStep + 1 }} of {{ result.steps.length }}</span>
          <button @click="currentStep = Math.min(result.steps.length - 1, currentStep + 1)" 
                  :disabled="currentStep === result.steps.length - 1" class="btn-nav">
            Next Step →
          </button>
        </div>

        <div class="step-display">
          <div class="step-header">
            <h4>{{ result.steps[currentStep].title }}</h4>
            <p class="step-description">{{ result.steps[currentStep].description }}</p>
          </div>

          <div class="register-display">
            <table class="register-table">
              <thead>
                <tr>
                  <th>Register</th>
                  <th>Value</th>
                  <th>Decimal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="result.steps[currentStep].accumulator !== undefined">
                  <td><strong>A (Accumulator)</strong></td>
                  <td class="binary-value">{{ result.steps[currentStep].accumulator }}</td>
                  <td>{{ binaryToSignedDecimal(result.steps[currentStep].accumulator) }}</td>
                </tr>
                <tr v-if="result.steps[currentStep].quotient !== undefined">
                  <td><strong>Q (Quotient)</strong></td>
                  <td class="binary-value">{{ result.steps[currentStep].quotient }}</td>
                  <td>{{ parseInt(result.steps[currentStep].quotient, 2) }}</td>
                </tr>
                <tr v-if="result.steps[currentStep].divisor !== undefined">
                  <td><strong>M (Divisor)</strong></td>
                  <td class="binary-value">{{ result.steps[currentStep].divisor }}</td>
                  <td>{{ parseInt(result.steps[currentStep].divisor, 2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="result.steps[currentStep].operation" class="operation-display">
            <div class="operation-box">
              <span class="operation-label">Operation:</span>
              <span class="operation-text">{{ result.steps[currentStep].operation }}</span>
            </div>
          </div>

          <div v-if="result.steps[currentStep].note" class="note-display">
            <div class="note-box">
              <strong>Note:</strong> {{ result.steps[currentStep].note }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const dividend = ref('')
const divisor = ref('')
const algorithm = ref('restoring')
const result = ref(null)
const error = ref('')
const currentStep = ref(0)

// Validate binary input
function isValidBinary(str) {
  return /^[01]+$/.test(str)
}

// Two's complement for signed representation
function twosComplement(binary, bits) {
  const flipped = binary.split('').map(b => b === '0' ? '1' : '0').join('')
  const decimal = parseInt(flipped, 2) + 1
  return decimal.toString(2).padStart(bits, '0')
}

// Convert binary to signed decimal
function binaryToSignedDecimal(binary) {
  if (!binary || binary.length === 0) return 0
  const isNegative = binary[0] === '1'
  if (isNegative) {
    const inverted = binary.split('').map(b => b === '0' ? '1' : '0').join('')
    const magnitude = parseInt(inverted, 2) + 1
    return -magnitude
  }
  return parseInt(binary, 2)
}

// Binary subtraction
function binarySubtract(a, b, bits) {
  const aNum = parseInt(a, 2)
  const bNum = parseInt(b, 2)
  const result = aNum - bNum
  
  if (result < 0) {
    // Return two's complement representation
    const positive = Math.abs(result)
    const binary = positive.toString(2).padStart(bits, '0')
    return twosComplement(binary, bits)
  }
  
  return result.toString(2).padStart(bits, '0')
}

// Binary addition
function binaryAdd(a, b, bits) {
  const aNum = binaryToSignedDecimal(a)
  const bNum = parseInt(b, 2)
  const result = aNum + bNum
  
  if (result < 0) {
    const positive = Math.abs(result)
    const binary = positive.toString(2).padStart(bits, '0')
    return twosComplement(binary, bits)
  }
  
  return result.toString(2).padStart(bits, '0')
}

// Restoring Division Algorithm
function restoringDivision(dividendBin, divisorBin) {
  const n = dividendBin.length
  const aBits = n + 1 // accumulator/remainder width
  const qBits = n     // quotient width
  
  let A = '0'.repeat(aBits) // Accumulator (remainder)
  let Q = dividendBin.padStart(qBits, '0') // Quotient (initially dividend)
  const M = divisorBin.padStart(aBits, '0') // Divisor (align to A width)
  
  const steps = []
  
  steps.push({
    title: 'Initialization',
    description: 'Set accumulator (A) to 0, quotient (Q) to dividend, and divisor (M)',
    accumulator: A,
    quotient: Q,
    divisor: M,
    operation: null,
    note: `Starting ${algorithm.value} division`
  })
  
  for (let i = 0; i < n; i++) {
    // Shift left A and Q together (1 bit)
    const combined = A + Q
    const shifted = combined.substring(1) + '0'
    A = shifted.substring(0, aBits)
    Q = shifted.substring(aBits)
    
    steps.push({
      title: `Iteration ${i + 1}: Shift Left`,
      description: 'Shift accumulator and quotient left by 1 bit',
      accumulator: A,
      quotient: Q,
      divisor: M,
      operation: 'Shift A,Q left',
      note: 'MSB of Q moves into LSB of A, 0 enters LSB of Q'
    })
    
    // Subtract divisor from accumulator
    const oldA = A
    A = binarySubtract(A, M, aBits)
    
    steps.push({
      title: `Iteration ${i + 1}: Subtract Divisor`,
      description: 'Subtract divisor (M) from accumulator (A)',
      accumulator: A,
      quotient: Q,
      divisor: M,
      operation: `A = A - M = ${oldA} - ${M}`,
      note: null
    })
    
    // Check if result is negative
    const isNegative = A[0] === '1' && binaryToSignedDecimal(A) < 0
    
    if (isNegative) {
      // Restore: Add divisor back
      A = binaryAdd(A, M, aBits)
      Q = Q.substring(0, Q.length - 1) + '0'
      
      steps.push({
        title: `Iteration ${i + 1}: Restore (Negative Result)`,
        description: 'Result is negative, restore accumulator by adding divisor back, set Q₀ = 0',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: 'A = A + M, Q₀ = 0',
        note: 'Restoration needed because subtraction resulted in negative value'
      })
    } else {
      // Keep result, set quotient bit to 1
      Q = Q.substring(0, Q.length - 1) + '1'
      
      steps.push({
        title: `Iteration ${i + 1}: Keep Result (Non-Negative)`,
        description: 'Result is non-negative, keep it and set Q₀ = 1',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: 'Q₀ = 1',
        note: 'Subtraction successful, quotient bit set to 1'
      })
    }
  }
  
  steps.push({
    title: 'Final Result',
    description: 'Division complete',
    accumulator: A,
    quotient: Q,
    divisor: M,
    operation: null,
    note: `Quotient = ${Q}, Remainder = ${A}`
  })
  
  return {
    quotient: Q.replace(/^0+/, '') || '0',
    remainder: A.replace(/^0+/, '') || '0',
    steps
  }
}

// Non-Restoring Division Algorithm
function nonRestoringDivision(dividendBin, divisorBin) {
  const n = dividendBin.length
  const aBits = n + 1
  const qBits = n
  
  let A = '0'.repeat(aBits)
  let Q = dividendBin.padStart(qBits, '0')
  const M = divisorBin.padStart(aBits, '0')
  
  const steps = []
  
  steps.push({
    title: 'Initialization',
    description: 'Set accumulator (A) to 0, quotient (Q) to dividend, and divisor (M)',
    accumulator: A,
    quotient: Q,
    divisor: M,
    operation: null,
    note: `Starting ${algorithm.value} division`
  })
  
  let wasNegative = false
  
  for (let i = 0; i < n; i++) {
    // Shift left A and Q
    const combined = A + Q
    const shifted = combined.substring(1) + '0'
    A = shifted.substring(0, aBits)
    Q = shifted.substring(aBits)
    
    steps.push({
      title: `Iteration ${i + 1}: Shift Left`,
      description: 'Shift accumulator and quotient left by 1 bit',
      accumulator: A,
      quotient: Q,
      divisor: M,
      operation: 'Shift A,Q left',
      note: 'MSB of Q moves into LSB of A, 0 enters LSB of Q'
    })
    
    const oldA = A
    
    // If previous was negative, add; otherwise subtract
    if (wasNegative) {
      A = binaryAdd(A, M, aBits)
      steps.push({
        title: `Iteration ${i + 1}: Add Divisor`,
        description: 'Previous remainder was negative, so add divisor (M) to accumulator (A)',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: `A = A + M = ${oldA} + ${M}`,
        note: 'Addition because previous step was negative'
      })
    } else {
      A = binarySubtract(A, M, aBits)
      steps.push({
        title: `Iteration ${i + 1}: Subtract Divisor`,
        description: 'Previous remainder was non-negative, so subtract divisor (M) from accumulator (A)',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: `A = A - M = ${oldA} - ${M}`,
        note: 'Subtraction because previous step was non-negative'
      })
    }
    
    // Check if result is negative
    const isNegative = A[0] === '1' && binaryToSignedDecimal(A) < 0
    wasNegative = isNegative
    
    if (isNegative) {
      Q = Q.substring(0, Q.length - 1) + '0'
      steps.push({
        title: `Iteration ${i + 1}: Set Q₀ = 0`,
        description: 'Result is negative, set quotient bit to 0',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: 'Q₀ = 0',
        note: 'Quotient bit is 0 because result is negative'
      })
    } else {
      Q = Q.substring(0, Q.length - 1) + '1'
      steps.push({
        title: `Iteration ${i + 1}: Set Q₀ = 1`,
        description: 'Result is non-negative, set quotient bit to 1',
        accumulator: A,
        quotient: Q,
        divisor: M,
        operation: 'Q₀ = 1',
        note: 'Quotient bit is 1 because result is non-negative'
      })
    }
  }
  
  // Final restoration if needed
  if (wasNegative) {
    const oldA = A
    A = binaryAdd(A, M, aBits)
    steps.push({
      title: 'Final Restoration',
      description: 'Final remainder is negative, restore by adding divisor',
      accumulator: A,
      quotient: Q,
      divisor: M,
      operation: `A = A + M = ${oldA} + ${M}`,
      note: 'Final restoration to ensure positive remainder'
    })
  }
  
  steps.push({
    title: 'Final Result',
    description: 'Division complete',
    accumulator: A,
    quotient: Q,
    divisor: M,
    operation: null,
    note: `Quotient = ${Q}, Remainder = ${A}`
  })
  
  return {
    quotient: Q.replace(/^0+/, '') || '0',
    remainder: A.replace(/^0+/, '') || '0',
    steps
  }
}

function calculate() {
  error.value = ''
  result.value = null
  currentStep.value = 0
  
  // Validate inputs
  if (!dividend.value.trim() || !divisor.value.trim()) {
    error.value = 'Please enter both dividend and divisor'
    return
  }
  
  if (!isValidBinary(dividend.value)) {
    error.value = 'Dividend must be a binary number (only 0s and 1s)'
    return
  }
  
  if (!isValidBinary(divisor.value)) {
    error.value = 'Divisor must be a binary number (only 0s and 1s)'
    return
  }
  
  const divisorDecimal = parseInt(divisor.value, 2)
  if (divisorDecimal === 0) {
    error.value = 'Divisor cannot be zero'
    return
  }
  
  const dividendDecimal = parseInt(dividend.value, 2)
  
  // Perform division based on selected algorithm
  const divisionResult = algorithm.value === 'restoring' 
    ? restoringDivision(dividend.value, divisor.value)
    : nonRestoringDivision(dividend.value, divisor.value)
  
  result.value = {
    dividendBinary: dividend.value,
    dividendDecimal,
    divisorBinary: divisor.value,
    divisorDecimal,
    ...divisionResult
  }
}

// Reset step when algorithm changes
watch(algorithm, () => {
  if (result.value) {
    calculate()
  }
})
</script>

<style scoped>
.division-solver {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.intro {
  text-align: center;
  margin-bottom: 2rem;
}

.intro h2 {
  color: #42b883;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.input-section {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #35495e;
}

.binary-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1.1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.binary-input:focus {
  outline: none;
  border-color: #42b883;
}

.algorithm-selector {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 2rem;
}

.algorithm-selector label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.algorithm-selector input[type="radio"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.btn-calculate {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
  width: 100%;
}

.btn-calculate:hover {
  background: #35495e;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  border-left: 4px solid #c33;
}

.results {
  display: grid;
  gap: 2rem;
}

.summary, .explanation, .steps {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #35495e;
  margin-top: 0;
  margin-bottom: 1rem;
}

.summary-grid {
  display: grid;
  gap: 1rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.summary-item .label {
  font-weight: bold;
  color: #35495e;
}

.summary-item .value {
  font-family: 'Courier New', monospace;
  color: #42b883;
  font-weight: bold;
}

.algo-description {
  color: #35495e;
  line-height: 1.6;
}

.algo-description ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.algo-description li {
  margin: 0.5rem 0;
}

.algo-description ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.step-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.btn-nav {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-nav:hover:not(:disabled) {
  background: #35495e;
}

.btn-nav:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.step-indicator {
  font-weight: bold;
  color: #35495e;
}

.step-display {
  border: 2px solid #42b883;
  border-radius: 8px;
  padding: 1.5rem;
}

.step-header h4 {
  color: #42b883;
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
}

.step-description {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.register-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.register-table th,
.register-table td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

.register-table thead th {
  background: #35495e;
  color: white;
}

.binary-value {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #42b883;
  font-size: 1.1rem;
}

.operation-display {
  margin: 1rem 0;
}

.operation-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 4px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

.operation-label {
  font-weight: bold;
  color: #856404;
}

.operation-text {
  font-family: 'Courier New', monospace;
  color: #856404;
}

.note-display {
  margin: 1rem 0;
}

.note-box {
  background: #d1ecf1;
  border: 2px solid #0c5460;
  border-radius: 4px;
  padding: 1rem;
  color: #0c5460;
}

.note-box strong {
  margin-right: 0.5rem;
}
</style>
