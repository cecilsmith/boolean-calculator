<template>
  <div class="signed">
    <section class="intro">
      <h2>Signed Number Calculator</h2>
      <p>Find the 2's complement representation of a binary, decimal, or hexidecimal number.</p>
    </section>

    <section class="input-section">
      <div class="mode-toggle">
        <label>
          <input type="radio" value="auto" v-model="inputMode" />
          Auto
        </label>
        <label>
          <input type="radio" value="binary" v-model="inputMode" />
          Binary input
        </label>
        <label>
          <input type="radio" value="decimal" v-model="inputMode" />
          Decimal input
        </label>
        <label>
          <input type="radio" value="hex" v-model="inputMode" />
          Hexidecimal input
        </label>
      </div>

      <div class="mode-toggle">
        <label>
          <input type="radio" value="auto" v-model="inputSign" />
          Auto
        </label>
        <label>
          <input type="radio" value="positive" v-model="inputSign" />
          Positive
        </label>
        <label>
          <input type="radio" value="negative" v-model="inputSign" />
          Negative
        </label>
      </div>

      <div class="input-group">
        <label for="input">Input:</label>
        <input
          id="input"
          v-model="input"
          type="text"
          :placeholder="inputMode === 'binary' ? 'e.g., 1011' : 'e.g., 11'"
          class="number-input"
        />
      </div>

      <button class="btn-primary" @click="calculate">Calculate</button>
    </section>

    <div v-if="error" class="error">{{ error }}</div>

    <section v-if="result" class="results">
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div>
            <h3>Input</h3>
                <div class="label">Binary:  {{result.inputBinary }}</div>
                <div class="label">Hex:     {{result.inputHex }}</div>
                <div class="label">Decimal: {{result.inputDecimal }}</div>
            </div>
          </div>
          <div class="summary-item">
            <div>
            <h3>Result</h3>
                <div class="label">Binary:  {{result.resultBinary }}</div>
                <div class="label">Hex:     {{result.resultHex }}</div>
                <div class="label">Decimal: {{result.resultDecimal }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const input = ref(null)
const inputMode = ref('auto')
const inputSign = ref('auto')
const result = ref(null)
const error = ref('')

function autoDetectBase(a) {
  if (typeof a !== 'string') a = String(a)

  if (/^0b[01]+$/i.test(a) || /^[01]+$/.test(a)) return 'binary'
  if (/^-?\d+$/.test(a)) return 'decimal'
  if (/^0x[0-9a-f]+$/i.test(a) || /^[0-9a-f]+$/i.test(a)) return 'hex'

  return null
}

function isValidBinary(str) {
  return /^[01]+$/.test(str)
}

function isValidDecimal(str) {
  return /^-?\d+$/.test(str)
}

function isValidHex(str) {
  return /^[0-9a-fA-F]+$/.test(str)
}

function parseValue(value, baseMode, signMode) {
  const trimmed = value.trim()
  const first = trimmed[0].toUpperCase()
  if (!trimmed) throw new Error('Inputs cannot be empty')

  if (baseMode === 'auto') {
    baseMode = autoDetectBase(trimmed)
    if (!baseMode) {
        throw new Error('Invalid input, could not detect base')
    }
  }
  
  if (signMode === 'auto') {
    if (baseMode === 'binary' && first === '1') {
      signMode = 'negative'
    }
    else if (baseMode === 'decimal' && first === '-') {
      signMode = 'negative'
    }
    else if (baseMode === 'hex') {
      if (['8','9','A','B','C','D','E','F'].includes(first)) {
        signMode = 'negative'
      } else {
        signMode = 'positive'
      }
    }
    else signMode = 'positive'
  }

  const signEnable = signMode === 'negative' ? 1 : 0

  if (baseMode === 'binary') {
    if (!isValidBinary(trimmed)) throw new Error('Binary inputs must contain only 0 or 1')
      return parseInt(trimmed, 2) - signEnable * 2 ** trimmed.length
  } else if (baseMode === 'hex') {
    if (!isValidHex(trimmed)) throw new Error('Hex inputs must contain digits 0-9 or A-F')
      return parseInt(trimmed, 16) - signEnable * 16 ** trimmed.length
  } else {
    if (!isValidDecimal(trimmed)) throw new Error('Decimal inputs must be digits 0-9')
    return parseInt(trimmed, 10)
  }
}

function toTwosComplementMinimal(value, minLength) {
  const abs = Math.abs(value)
  const bits = Math.max(minLength, Math.ceil(Math.log2(abs + 1)) + 1)
  return (value & ((1 << bits) - 1))
             .toString(2)
             .padStart(bits, '0')
}

function binaryToHex(binStr) {
  if (!/^[01]+$/.test(binStr)) throw new Error('Invalid binary string')

  const hexLength = Math.ceil(binStr.length / 4)
  const hex = parseInt(binStr, 2).toString(16).toUpperCase()
  return hex.padStart(hexLength, '0')
}

function calculate() {
  error.value = ''
  result.value = null

  try {
    const a = parseValue(input.value, inputMode.value, inputSign.value)

    const inputLength = input.value.length;

    result.value = {
      inputBinary: toTwosComplementMinimal(a, inputLength),
      inputDecimal: (a),
      inputHex: binaryToHex(toTwosComplementMinimal(a, inputLength)),
      resultBinary: toTwosComplementMinimal(~a + 1, inputLength),
      resultDecimal: (-a),
      resultHex: binaryToHex(toTwosComplementMinimal(~a + 1, inputLength))
    }
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.signed {
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
  flex-direction: column;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.75rem;
  gap: 0.5rem;
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