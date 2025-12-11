<template>
  <div class="multiplication">
    <section class="intro">
      <h2>Boolean Multiplication</h2>
      <p>Multiply two binary or decimal numbers with step-by-step partial products.</p>
    </section>

    <section class="input-section">
      <div class="mode-toggle">
        <label>
          <input type="radio" value="binary" v-model="inputMode" />
          Binary input
        </label>
        <label>
          <input type="radio" value="decimal" v-model="inputMode" />
          Decimal input
        </label>
      </div>

      <div class="input-group">
        <label for="multiplicand">Multiplicand:</label>
        <input
          id="multiplicand"
          v-model="multiplicand"
          type="text"
          :placeholder="inputMode === 'binary' ? 'e.g., 1011' : 'e.g., 11'"
          class="number-input"
        />
      </div>

      <div class="input-group">
        <label for="multiplier">Multiplier:</label>
        <input
          id="multiplier"
          v-model="multiplier"
          type="text"
          :placeholder="inputMode === 'binary' ? 'e.g., 101' : 'e.g., 5'"
          class="number-input"
        />
      </div>

      <button class="btn-primary" @click="calculate">Multiply</button>
    </section>

    <div v-if="error" class="error">{{ error }}</div>

    <section v-if="result" class="results">
      <div class="summary">
        <h3>Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Multiplicand:</span>
            <span class="value">{{ result.multiplicandBinary }} ({{ result.multiplicandDecimal }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Multiplier:</span>
            <span class="value">{{ result.multiplierBinary }} ({{ result.multiplierDecimal }})</span>
          </div>
          <div class="summary-item">
            <span class="label">Product:</span>
            <span class="value">{{ result.productBinary }} ({{ result.productDecimal }})</span>
          </div>
        </div>
      </div>

      <div class="steps">
        <h3>Step-by-Step</h3>
        <div class="step-controls" v-if="result.steps.length">
          <button class="btn" :disabled="currentStep === 0" @click="currentStep = Math.max(0, currentStep - 1)">
            ← Previous
          </button>
          <span class="step-indicator">Step {{ currentStep + 1 }} of {{ result.steps.length }}</span>
          <button class="btn" :disabled="currentStep === result.steps.length - 1" @click="currentStep = Math.min(result.steps.length - 1, currentStep + 1)">
            Next →
          </button>
        </div>

        <div v-if="result.steps.length" class="step-card">
          <h4>{{ result.steps[currentStep].title }}</h4>
          <p class="step-desc">{{ result.steps[currentStep].description }}</p>
          <table class="register-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Binary</th>
                <th>Decimal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Multiplicand</td>
                <td class="mono">{{ result.multiplicandBinary }}</td>
                <td>{{ result.multiplicandDecimal }}</td>
              </tr>
              <tr>
                <td>Multiplier</td>
                <td class="mono">{{ result.steps[currentStep].multiplier }}</td>
                <td>{{ parseInt(result.steps[currentStep].multiplier, 2) }}</td>
              </tr>
              <tr>
                <td>Partial</td>
                <td class="mono">{{ result.steps[currentStep].partial }}</td>
                <td>{{ parseInt(result.steps[currentStep].partial, 2) }}</td>
              </tr>
              <tr>
                <td>Running Sum</td>
                <td class="mono">{{ result.steps[currentStep].running }}</td>
                <td>{{ parseInt(result.steps[currentStep].running, 2) }}</td>
              </tr>
            </tbody>
          </table>
          <div class="note" v-if="result.steps[currentStep].note">
            {{ result.steps[currentStep].note }}
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const multiplicand = ref('')
const multiplier = ref('')
const inputMode = ref('binary')
const result = ref(null)
const error = ref('')
const currentStep = ref(0)

function isValidBinary(str) {
  return /^[01]+$/.test(str)
}

function isValidDecimal(str) {
  return /^\d+$/.test(str)
}

function parseValue(value, mode) {
  const trimmed = value.trim()
  if (!trimmed) throw new Error('Inputs cannot be empty')
  if (mode === 'binary') {
    if (!isValidBinary(trimmed)) throw new Error('Binary inputs must contain only 0 or 1')
    return { binary: trimmed.replace(/^0+(?!$)/, ''), decimal: parseInt(trimmed, 2) }
  }
  if (!isValidDecimal(trimmed)) throw new Error('Decimal inputs must be digits 0-9')
  const dec = parseInt(trimmed, 10)
  return { binary: dec.toString(2), decimal: dec }
}

function padLeft(str, length) {
  return str.padStart(length, '0')
}

function binaryAdd(a, b, width) {
  let carry = 0
  let res = ''
  for (let i = 0; i < width; i++) {
    const ai = a[a.length - 1 - i] === '1' ? 1 : 0
    const bi = b[b.length - 1 - i] === '1' ? 1 : 0
    const sum = ai + bi + carry
    res = (sum & 1) + res
    carry = sum >> 1
  }
  if (carry) res = '1' + res
  return res.padStart(width, '0')
}

function multiplyWithSteps(mBin, qBin) {
  const width = mBin.length + qBin.length + 1
  const steps = []
  let running = '0'.repeat(width)

  const qRev = qBin.split('').reverse()

  qRev.forEach((bit, idx) => {
    const shifted = bit === '1' ? padLeft(mBin + '0'.repeat(idx), width) : '0'.repeat(width)
    running = binaryAdd(running, shifted, width)
    steps.push({
      title: `Bit ${idx} (${bit})`,
      description: bit === '1' ? `Add multiplicand shifted by ${idx}` : 'Bit is 0, add 0',
      multiplier: padLeft(qBin, qBin.length),
      partial: shifted,
      running,
      note: bit === '1' ? `Added ${mBin} << ${idx}` : 'No addition this step'
    })
  })

  return { product: running.replace(/^0+(?!$)/, '') || '0', steps }
}

function calculate() {
  error.value = ''
  result.value = null
  currentStep.value = 0

  try {
    const m = parseValue(multiplicand.value, inputMode.value)
    const q = parseValue(multiplier.value, inputMode.value)

    if (q.decimal === 0 || m.decimal === 0) {
      const productBinary = '0'
      result.value = {
        multiplicandBinary: m.binary,
        multiplierBinary: q.binary,
        multiplicandDecimal: m.decimal,
        multiplierDecimal: q.decimal,
        productBinary,
        productDecimal: 0,
        steps: [
          {
            title: 'Zero product',
            description: 'One operand is zero; product is zero',
            multiplier: q.binary,
            partial: productBinary,
            running: productBinary,
            note: 'No steps required'
          }
        ]
      }
      return
    }

    const { product, steps } = multiplyWithSteps(m.binary, q.binary)

    result.value = {
      multiplicandBinary: m.binary,
      multiplierBinary: q.binary,
      multiplicandDecimal: m.decimal,
      multiplierDecimal: q.decimal,
      productBinary: product,
      productDecimal: m.decimal * q.decimal,
      steps
    }
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.multiplication {
  padding: 2rem;
  max-width: 1100px;
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
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.mode-toggle {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  font-weight: 600;
  color: #35495e;
}

.input-group {
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.4rem;
  font-weight: bold;
  color: #35495e;
}

.number-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
}

.number-input:focus {
  outline: none;
  border-color: #42b883;
}

.btn-primary {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: background 0.2s ease;
  width: 100%;
}

.btn-primary:hover {
  background: #2f9c6f;
}

.error {
  margin-top: 1rem;
  background: #fee;
  border-left: 4px solid #c33;
  padding: 0.75rem 1rem;
  color: #c33;
  border-radius: 4px;
}

.results {
  display: grid;
  gap: 1.5rem;
}

.summary {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
}

.label {
  font-weight: 700;
  color: #35495e;
}

.value {
  font-family: 'Courier New', monospace;
  color: #42b883;
}

.steps {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.step-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn {
  background: #e9ecef;
  color: #35495e;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-weight: 600;
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  background: #d1d5d8;
}

.step-indicator {
  font-weight: 700;
  color: #35495e;
}

.step-card {
  border: 2px solid #42b883;
  border-radius: 8px;
  padding: 1rem;
}

.step-card h4 {
  margin: 0 0 0.4rem 0;
  color: #42b883;
}

.step-desc {
  margin: 0 0 1rem 0;
  color: #555;
}

.register-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.register-table th,
.register-table td {
  border: 1px solid #ddd;
  padding: 0.65rem;
  text-align: left;
}

.register-table thead th {
  background: #35495e;
  color: white;
}

.mono {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #42b883;
}

.note {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 0.75rem;
  border-radius: 6px;
  color: #8a6d3b;
}
</style>
