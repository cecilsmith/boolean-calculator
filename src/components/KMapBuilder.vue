<template>
  <div class="kmap-builder">
    <section class="intro">
      <h2>Manual K-Map Builder</h2>
      <p>Set cell values (1, 0, or X for don't care), then simplify to a boolean expression.</p>
    </section>

    <section class="card controls">
      <div class="control-row">
        <div class="control-group">
          <label for="var-count">Variables</label>
          <select id="var-count" v-model.number="variableCount" class="select-input">
            <option :value="2">2</option>
            <option :value="3">3</option>
            <option :value="4">4</option>
          </select>
        </div>
        <div class="control-actions">
          <button class="btn" @click="clearGrid">Clear</button>
          <button class="btn" @click="fillOnes">Fill 1s</button>
          <button class="btn" @click="fillZeros">Fill 0s</button>
        </div>
      </div>
      <p class="help">Click a cell to cycle through 0 → 1 → X (blank defaults to 0).</p>
    </section>

    <section class="card kmap-section">
      <div class="section-header">
        <div>
          <h3>Map ({{ variableCount }} variables)</h3>
          <p class="sub">Variables: {{ variables.join(', ') }}</p>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="legend-dot one"></span>1 (True)</span>
          <span class="legend-item"><span class="legend-dot zero"></span>0 (False)</span>
          <span class="legend-item"><span class="legend-dot dc"></span>X (Don't Care)</span>
        </div>
      </div>
      <div class="kmap-wrapper">
        <table class="kmap-table">
          <thead>
            <tr>
              <th class="corner">
                  <span class="corner-top">{{ cornerTopLabel }}</span>
                  <span class="corner-bottom">{{ cornerBottomLabel }}</span>
              </th>
              <th v-for="label in colLabels" :key="'c-' + label" class="edge-label">{{ label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIdx) in layout" :key="rowIdx">
              <th class="edge-label">{{ rowLabels[rowIdx] }}</th>
              <td
                v-for="minterm in row"
                :key="minterm"
                :class="cellClass(values[minterm])"
                @click="cycleValue(minterm)"
              >
                {{ values[minterm] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="actions">
        <button class="btn primary" @click="simplify">Simplify Expression</button>
        <span class="status" v-if="error">{{ error }}</span>
        <p class="hint">Uses Quine-McCluskey with don't-cares for minimization.</p>
      </div>
    </section>

    <section class="results" v-if="simplified">
      <div class="result-card">
        <h3>Simplified Expression</h3>
        <p class="expr">{{ simplified }}</p>
      </div>
      <div class="result-card">
        <h3>Minterms (1)</h3>
        <p>{{ minterms.length ? minterms.join(', ') : 'None (expression is 0)' }}</p>
      </div>
      <div class="result-card">
        <h3>Don't Cares (X)</h3>
        <p>{{ dontCares.length ? dontCares.join(', ') : 'None' }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const variableCount = ref(3)
const values = ref(Array(2 ** variableCount.value).fill('0'))
const simplified = ref('')
const minterms = ref([])
const dontCares = ref([])
const error = ref('')

const variables = computed(() => ['A', 'B', 'C', 'D'].slice(0, variableCount.value))

watch(variableCount, (count) => {
  values.value = Array(2 ** count).fill('0')
  simplified.value = ''
  minterms.value = []
  dontCares.value = []
  error.value = ''
})

const rowLabels = computed(() => {
  if (variableCount.value === 2) return ['0', '1']
  if (variableCount.value === 3) return ['0', '1']
  return ['00', '01', '11', '10']
})

const colLabels = computed(() => {
  if (variableCount.value === 2) return ['0', '1']
  if (variableCount.value === 3) return ['00', '01', '11', '10']
  return ['00', '01', '11', '10']
})

const layout = computed(() => getLayout(variableCount.value))

const cornerTopLabel = computed(() => {
  if (variableCount.value === 2) return variables.value[1]
  if (variableCount.value === 3) return `${variables.value[1]}${variables.value[2]}`
  return `${variables.value[2]}${variables.value[3]}`
})

const cornerBottomLabel = computed(() => {
  if (variableCount.value === 2) return variables.value[0]
  if (variableCount.value === 3) return variables.value[0]
  return `${variables.value[0]}${variables.value[1]}`
})

function getLayout(n) {
  if (n === 2) {
    return [
      [0, 1],
      [2, 3]
    ]
  }
  if (n === 3) {
    return [
      [0, 1, 3, 2],
      [4, 5, 7, 6]
    ]
  }
  return [
    [0, 1, 3, 2],
    [4, 5, 7, 6],
    [12, 13, 15, 14],
    [8, 9, 11, 10]
  ]
}

function cycleValue(index) {
  const order = ['0', '1', 'X']
  const current = values.value[index] || '0'
  const next = order[(order.indexOf(current) + 1) % order.length]
  const newValues = [...values.value]
  newValues[index] = next
  values.value = newValues
}

function clearGrid() {
  values.value = Array(values.value.length).fill('0')
  simplified.value = ''
  minterms.value = []
  dontCares.value = []
  error.value = ''
}

function fillZeros() {
  values.value = Array(values.value.length).fill('0')
}

function fillOnes() {
  values.value = Array(values.value.length).fill('1')
}

function simplify() {
  error.value = ''
  const ones = []
  const dcs = []
  values.value.forEach((v, idx) => {
    if (v === '1') ones.push(idx)
    else if (v.toUpperCase() === 'X') dcs.push(idx)
  })

  minterms.value = ones
  dontCares.value = dcs

  const n = variableCount.value
  const total = 2 ** n

  if (ones.length === 0) {
    simplified.value = '0'
    return
  }

  if (ones.length === total) {
    simplified.value = '1'
    return
  }

  simplified.value = quineMcCluskey(ones, dcs, variables.value)
}

function countOnes(str) {
  return str.split('').filter((c) => c === '1').length
}

function combine(a, b) {
  let diff = 0
  let combined = ''
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) {
      combined += a[i]
    } else {
      diff += 1
      combined += '-'
    }
    if (diff > 1) return null
  }
  return diff === 1 ? combined : null
}

function covers(implicant, mintermBits) {
  for (let i = 0; i < implicant.length; i++) {
    if (implicant[i] === '-') continue
    if (implicant[i] !== mintermBits[i]) return false
  }
  return true
}

function implicantToExpr(implicant, vars) {
  const parts = []
  implicant.split('').forEach((bit, idx) => {
    if (bit === '-') return
    parts.push(bit === '1' ? vars[idx] : `${vars[idx]}'`)
  })
  return parts.length ? parts.join('') : '1'
}

function quineMcCluskey(ones, dcs, vars) {
  const n = vars.length
  const all = [...ones, ...dcs]
  const grouped = new Map()

  all.forEach((m) => {
    const bits = m.toString(2).padStart(n, '0')
    const count = countOnes(bits)
    if (!grouped.has(count)) grouped.set(count, [])
    grouped.get(count).push({ bits, combined: false })
  })

  let currentGroups = grouped
  const primes = []

  while (currentGroups.size > 0) {
    const nextGroups = new Map()
    const counts = Array.from(currentGroups.keys()).sort((a, b) => a - b)
    const usedInThisRound = new Set()

    for (let i = 0; i < counts.length - 1; i++) {
      const groupA = currentGroups.get(counts[i]) || []
      const groupB = currentGroups.get(counts[i + 1]) || []
      groupA.forEach((a) => {
        groupB.forEach((b) => {
          const combo = combine(a.bits, b.bits)
          if (combo) {
            a.combined = true
            b.combined = true
            const comboCount = countOnes(combo.replace(/-/g, ''))
            if (!nextGroups.has(comboCount)) nextGroups.set(comboCount, [])
            if (!nextGroups.get(comboCount).some((item) => item.bits === combo)) {
              nextGroups.get(comboCount).push({ bits: combo, combined: false })
            }
            usedInThisRound.add(combo)
          }
        })
      })
    }

    currentGroups.forEach((items) => {
      items.forEach((item) => {
        if (!item.combined) {
          if (!primes.includes(item.bits)) primes.push(item.bits)
        }
      })
    })

    currentGroups = nextGroups
  }

  const mintermBits = ones.map((m) => m.toString(2).padStart(n, '0'))
  const chart = new Map()

  mintermBits.forEach((m) => {
    chart.set(m, primes.filter((p) => covers(p, m)))
  })

  const essential = new Set()
  const covered = new Set()

  chart.forEach((implicants, m) => {
    if (implicants.length === 1) {
      essential.add(implicants[0])
      covered.add(m)
    }
  })

  essential.forEach((pi) => {
    mintermBits.forEach((m) => {
      if (covers(pi, m)) covered.add(m)
    })
  })

  const remainingPis = primes.filter((p) => !essential.has(p))
  let uncovered = mintermBits.filter((m) => !covered.has(m))
  const chosen = []

  while (uncovered.length > 0 && remainingPis.length > 0) {
    let bestPi = null
    let bestCover = []
    remainingPis.forEach((pi) => {
      const coverSet = uncovered.filter((m) => covers(pi, m))
      if (coverSet.length > bestCover.length) {
        bestCover = coverSet
        bestPi = pi
      }
    })
    if (!bestPi) break
    chosen.push(bestPi)
    uncovered = uncovered.filter((m) => !covers(bestPi, m))
  }

  const finalImplicants = Array.from(new Set([...essential, ...chosen]))
  if (finalImplicants.length === 0) return '0'

  return finalImplicants.map((pi) => implicantToExpr(pi, vars)).join(' + ')
}

function cellClass(val) {
  return {
    cell: true,
    one: val === '1',
    zero: val === '0' || !val,
    dc: val.toUpperCase && val.toUpperCase() === 'X'
  }
}
</script>

<style scoped>
.kmap-builder {
  padding: 2rem;
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.intro {
  text-align: center;
}

.intro h2 {
  color: #42b883;
  font-size: 2rem;
  margin-bottom: 0.35rem;
}

.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-header h3 {
  margin: 0;
  color: #35495e;
}

.sub {
  margin: 0.15rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.legend {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: #374151;
  font-size: 0.95rem;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid #cbd5e1;
  display: inline-block;
}

.legend-dot.one {
  background: #42b883;
}

.legend-dot.zero {
  background: #ffffff;
}

.legend-dot.dc {
  background: #ffd166;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.control-group label {
  font-weight: bold;
  color: #35495e;
  margin-right: 0.5rem;
}

.select-input {
  padding: 0.5rem 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.control-actions {
  display: flex;
  gap: 0.5rem;
}

.help {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.95rem;
}

.kmap-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.kmap-wrapper {
  overflow-x: auto;
}

.kmap-table {
  border-collapse: collapse;
  margin: 0 auto;
  min-width: 420px;
  table-layout: fixed;
}

.kmap-table th,
.kmap-table td {
  border: 2px solid #ddd;
  padding: 0.9rem 1.2rem;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
}

.kmap-table thead th {
  background: #35495e;
  color: white;
}

.corner {
  background: #2d3a46;
  color: #fff;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  padding: 0.9rem 1.2rem;
}

.corner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(35deg, transparent 49%, #1f2831 50%, #1f2831 51%, transparent 52%);
  pointer-events: none;
}

.corner-top,
.corner-bottom {
  position: absolute;
  font-weight: 700;
}

.corner-bottom {
  bottom: 6px;
  left: 10px;
}

.corner-top {
  top: 6px;
  right: 10px;
}

.edge-label {
  background: #35495e;
  font-weight: bold;
  color: #ffffff;
}

.cell {
  cursor: pointer;
  transition: background 0.2s ease;
}

.cell.zero {
  background: #fff;
  color: #888;
}

.cell.one {
  background: #42b883;
  color: white;
  font-weight: bold;
}

.cell.dc {
  background: #ffd166;
  color: #5c4b1c;
  font-weight: bold;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  margin-top: 1rem;
  text-align: center;
}

.actions .btn.primary {
  width: 100%;
}

.action-right,
.actions .hint {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.btn {
  background: #e9ecef;
  color: #35495e;
  border: 1px solid #d1d5db;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  font-weight: 600;
}

.btn:hover {
  background: #dfe3e6;
}

.btn.primary {
  background: #42b883;
  color: white;
  border-color: #31926b;
}

.btn.primary:hover {
  background: #2f9c6f;
}

.status {
  color: #c33;
  font-weight: bold;
}

.results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.result-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.result-card h3 {
  margin-top: 0;
  color: #35495e;
}

.expr {
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  font-weight: bold;
  color: #42b883;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #42b883;
}
</style>
