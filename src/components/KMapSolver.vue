<template>
  <div class="kmap-solver">
    <section class="intro">
      <h2>Karnaugh Map Solver</h2>
      <p>Enter a boolean expression to generate its Karnaugh map and simplified form.</p>
    </section>

    <section class="input-section">
      <div class="input-group">
        <label for="expression">Boolean Expression:</label>
        <input
          id="expression"
          v-model="expression"
          type="text"
          placeholder="e.g., A'B + AB' + AB or (!A && B) || (A && !B) || (A && B)"
          @keyup.enter="solve"
          class="expression-input"
        />
        <button @click="solve" class="btn-solve">Generate K-Map</button>
      </div>

      <div class="help-text">
        <p><strong>Supported operators:</strong></p>
        <ul>
          <li>AND: * or && or · (dot) or space</li>
          <li>OR: + or ||</li>
          <li>NOT: ' (apostrophe) or ! or ¬</li>
        </ul>
        <p><strong>Variables:</strong> A, B, C, D (up to 4 variables)</p>
      </div>
    </section>

    <section v-if="result" class="variables-control">
      <div class="control-group">
        <label for="num-variables">K-Map Variables:</label>
        <div class="slider-container">
          <span class="var-count">{{ displayVariables }}</span>
          <input
            id="num-variables"
            v-model.number="displayVariables"
            type="range"
            :min="minDisplayVariables"
            max="4"
            class="variable-slider"
          />
          <span class="var-label">{{ getAllVariableLabels }}</span>
        </div>
        <p class="control-hint">
          Adjust to see how your expression behaves with additional variables.
        </p>
      </div>
    </section>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <section v-if="result" class="results">
      <div class="truth-table">
        <h3>Truth Table</h3>
        <table>
          <thead>
            <tr>
              <th v-for="variable in result.variables" :key="variable">{{ variable }}</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in result.truthTable" :key="index">
              <td v-for="(value, varIndex) in row.inputs" :key="varIndex">{{ value }}</td>
              <td :class="{ active: row.output }">{{ row.output }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="kmap-display">
        <h3>Karnaugh Map ({{ displayVariables }} variables)</h3>
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
              <tr v-for="(row, rowIdx) in displayKMap" :key="rowIdx">
                <th class="edge-label">{{ rowLabels[rowIdx] }}</th>
                <td
                  v-for="(cell, colIdx) in row"
                  :key="colIdx"
                  :class="['cell', cell === 1 ? 'one' : 'zero', getGroupClass(rowIdx, colIdx)]"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="minterms">
        <h3>Minterms</h3>
        <p v-if="result.minterms.length > 0">
          Σm({{ result.minterms.join(', ') }})
        </p>
        <p v-else>No minterms (expression is always false)</p>
      </div>

      <div class="sop">
        <h3>Sum of Products Expression</h3>
        <p class="expr">{{ result.sopExpression || 'Processing...' }}</p>
      </div>

      <div class="pos">
        <h3>Product of Sums Expression</h3>
        <p class="expr">{{ result.posExpression || 'Processing...' }}</p>
      </div>

      <div class="simplified">
        <h3>Simplified Expression</h3>
        <p class="expr">{{ result.simplifiedExpression || 'Processing...' }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const expression = ref('')
const result = ref(null)
const error = ref('')
const displayVariables = ref(2)

const displayVarList = computed(() => {
  const n = displayVariables.value
  const base = result.value?.variables || [] // sorted unique from expression
  const allVars = ['A', 'B', 'C', 'D']

  // If we're showing no more than the variables present, keep the expression's order
  if (n <= base.length) {
    return base.slice(0, n)
  }

  // If we need more variables than present, fall back to the standard ABCD ordering
  return allVars.slice(0, n)
})

const getAllVariableLabels = computed(() => {
  return displayVarList.value.join(', ')
})

const minDisplayVariables = computed(() => {
  if (!result.value || !result.value.variables) return 2

  // Minimum is the count of unique variables (already sorted/unique) but at least 2
  return Math.max(2, result.value.variables.length)
})

// Reset displayVariables when a new result is generated
watch(result, (newResult) => {
  if (newResult) {
    displayVariables.value = minDisplayVariables.value
  }
})

const rowLabels = computed(() => {
  const n = displayVariables.value
  if (n === 2) return ['0', '1']
  if (n === 3) return ['0', '1']
  if (n === 4) return ['00', '01', '11', '10']
  return []
})

const colLabels = computed(() => {
  const n = displayVariables.value
  if (n === 2) return ['0', '1']
  if (n === 3) return ['00', '01', '11', '10']
  if (n === 4) return ['00', '01', '11', '10']
  return []
})

const cornerTopLabel = computed(() => {
  const vars = displayVarList.value
  const n = vars.length
  if (n === 2) return vars[1] || ''
  if (n === 3) return `${vars[1] || ''}${vars[2] || ''}`
  if (n === 4) return `${vars[2] || ''}${vars[3] || ''}`
  return ''
})

const cornerBottomLabel = computed(() => {
  const vars = displayVarList.value
  const n = vars.length
  if (n === 2) return vars[0] || ''
  if (n === 3) return vars[0] || ''
  if (n === 4) return `${vars[0] || ''}${vars[1] || ''}`
  return ''
})

// Computed K-map for the current display variable count
const displayKMap = computed(() => {
  if (!result.value) return []
  return generateKMapForDisplay(result.value.truthTable, result.value.variables)
})

// Expand groups to display variable count
const expandedGroups = computed(() => {
  if (!result.value || !result.value.groups || !result.value.variables) return []

  const originalVars = result.value.variables
  const displayVars = displayVariables.value

  // Recalculate groups for current display variable count with fixed ABCD ordering
  return result.value.groups.map((implicant) => {
    const minsterms = getMinstermsForImplicant(implicant, originalVars.length)
    if (originalVars.length === displayVars) {
      return minsterms
    }
    return expandMintermsToDisplayVariables(minsterms, originalVars)
  })
})

// Compute which minterm index corresponds to a K-map cell
function getMintermIndex(rowIdx, colIdx) {
  const n = displayVariables.value
  const layout = getLayout(n)
  if (rowIdx < layout.length && colIdx < layout[rowIdx].length) {
    return layout[rowIdx][colIdx]
  }
  return -1
}

// Get the K-map layout (same as in KMapBuilder)
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
  if (n === 4) {
    return [
      [0, 1, 3, 2],
      [4, 5, 7, 6],
      [12, 13, 15, 14],
      [8, 9, 11, 10]
    ]
  }
  return []
}

// Determine the group index for a cell, or -1 if not in any group
function getGroupIndex(rowIdx, colIdx) {
  const mintermIdx = getMintermIndex(rowIdx, colIdx)
  if (mintermIdx === -1) return -1
  
  const groups = result.value?.groups || []
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].includes(mintermIdx)) {
      return i
    }
  }
  return -1
}

function getGroupClass(rowIdx, colIdx) {
  const mintermIdx = getMintermIndex(rowIdx, colIdx)
  if (mintermIdx === -1) return ''
  
  const groups = expandedGroups.value
  const groupIndices = []
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].includes(mintermIdx)) {
      groupIndices.push(i)
    }
  }
  
  return groupIndices.map(i => `group-${i}`).join(' ')
}

// Expand minterms to display variable count
// For example, if expression uses [A, B] but display is 3 variables [A, B, C],
// minterm 1 (binary 01 for AB) becomes minterms 1 (001) and 5 (101) for ABC
function expandMintermsToDisplayVariables(originalMinterms, originalVariables) {
  const displayVars = displayVariables.value
  const originalVarCount = originalVariables.length
  if (originalVarCount === displayVars) return originalMinterms

  const currentDisplayVars = displayVarList.value
  const missingVars = currentDisplayVars.filter((v) => !originalVariables.includes(v))
  const missingPositions = missingVars.map((v) => currentDisplayVars.indexOf(v))

  // Map original variable names to positions in current display list
  const originalPositions = originalVariables.map((v) => currentDisplayVars.indexOf(v))

  const expanded = new Set()

  for (const minterm of originalMinterms) {
    const numMissing = missingPositions.length
    const combos = 1 << numMissing

    for (let c = 0; c < combos; c++) {
      const bits = Array(displayVars).fill(0)

      // Set bits for missing vars from combo
      missingPositions.forEach((pos, idx) => {
        const bit = (c >> (numMissing - 1 - idx)) & 1
        bits[pos] = bit
      })

      // Set bits for original variables from the minterm index
      for (let j = 0; j < originalVarCount; j++) {
        const pos = originalPositions[j]
        const bit = (minterm >> (originalVarCount - 1 - j)) & 1
        bits[pos] = bit
      }

      // Convert bits to index
      let idx = 0
      bits.forEach((b) => {
        idx = (idx << 1) | b
      })
      expanded.add(idx)
    }
  }

  return Array.from(expanded).sort((a, b) => a - b)
}

// Generate K-map for the display variable count
function generateKMapForDisplay(truthTable, originalVariables) {
  const displayVars = displayVariables.value
  const displayNames = displayVarList.value // e.g., ABD for 3 vars
  const originalVars = originalVariables.length

  // Map original variable names to their positions in the display list
  const originalPositions = originalVariables.map((v) => displayNames.indexOf(v))

  // Create full truth table for display variables using current names/order
  const fullTruthTable = []
  const numRows = Math.pow(2, displayVars)

  for (let i = 0; i < numRows; i++) {
    let originalIndex = 0
    for (let j = 0; j < originalVars; j++) {
      const pos = originalPositions[j]
      const bit = (i >> (displayVars - 1 - pos)) & 1
      originalIndex = (originalIndex << 1) | bit
    }

    fullTruthTable.push({
      inputs: [],
      output: originalIndex < truthTable.length ? truthTable[originalIndex].output : 0
    })
  }

  // Now generate K-map from full truth table
  if (displayVars === 2) {
    return [
      [fullTruthTable[0].output, fullTruthTable[1].output],
      [fullTruthTable[2].output, fullTruthTable[3].output]
    ]
  } else if (displayVars === 3) {
    return [
      [fullTruthTable[0].output, fullTruthTable[1].output, fullTruthTable[3].output, fullTruthTable[2].output],
      [fullTruthTable[4].output, fullTruthTable[5].output, fullTruthTable[7].output, fullTruthTable[6].output]
    ]
  } else if (displayVars === 4) {
    return [
      [fullTruthTable[0].output, fullTruthTable[1].output, fullTruthTable[3].output, fullTruthTable[2].output],
      [fullTruthTable[4].output, fullTruthTable[5].output, fullTruthTable[7].output, fullTruthTable[6].output],
      [fullTruthTable[12].output, fullTruthTable[13].output, fullTruthTable[15].output, fullTruthTable[14].output],
      [fullTruthTable[8].output, fullTruthTable[9].output, fullTruthTable[11].output, fullTruthTable[10].output]
    ]
  }
  
  return []
}

// Parse boolean expression
function parseExpression(expr) {
  // Normalize the expression
  let normalized = expr.toUpperCase()
  
  // Normalize NOT before variables so !A becomes A'
  normalized = normalized.replace(/!\s*([A-D])/g, "$1'")
  normalized = normalized.replace(/¬\s*([A-D])/g, "$1'")
  
  // Normalize NOT before grouped terms, keep logical ! for eval
  normalized = normalized.replace(/!\s*\(/g, '!(')
  normalized = normalized.replace(/¬\s*\(/g, '!(')
  
  // Replace common operators
  normalized = normalized.replace(/&&/g, '*')
  normalized = normalized.replace(/\|\|/g, '+')
  normalized = normalized.replace(/·/g, '*')
  
  // Extract variables
  const variables = [...new Set(normalized.match(/[A-D]/g) || [])].sort()
  
  if (variables.length === 0) {
    throw new Error('No variables found (use A, B, C, or D)')
  }
  
  if (variables.length > 4) {
    throw new Error('Maximum 4 variables supported')
  }
  
  return { normalized, variables }
}

// Evaluate expression for given variable values
function evaluateExpression(expr, varValues) {
  let evaluation = expr
  
  // Replace variables with their values
  for (const [variable, value] of Object.entries(varValues)) {
    const regex = new RegExp(variable + "'", 'g')
    evaluation = evaluation.replace(regex, value === 0 ? '1' : '0')
    
    const varRegex = new RegExp(variable, 'g')
    evaluation = evaluation.replace(varRegex, value.toString())
  }
  
  // Handle implicit AND (adjacent terms)
  evaluation = evaluation.replace(/(\d)\s+(\d)/g, '$1*$2')
  evaluation = evaluation.replace(/(\d)([01])/g, '$1*$2')
  
  // Replace operators with JavaScript operators
  evaluation = evaluation.replace(/\*/g, '&&')
  evaluation = evaluation.replace(/\+/g, '||')
  // Normalize remaining NOT to JS logical NOT
  evaluation = evaluation.replace(/!/g, '!')
  
  try {
    return eval(evaluation) ? 1 : 0
  } catch (e) {
    return 0
  }
}

// Generate truth table
function generateTruthTable(normalized, variables) {
  const numRows = Math.pow(2, variables.length)
  const truthTable = []
  const minterms = []
  
  for (let i = 0; i < numRows; i++) {
    const inputs = []
    const varValues = {}
    
    for (let j = 0; j < variables.length; j++) {
      const bit = (i >> (variables.length - 1 - j)) & 1
      inputs.push(bit)
      varValues[variables[j]] = bit
    }
    
    const output = evaluateExpression(normalized, varValues)
    truthTable.push({ inputs, output })
    
    if (output === 1) {
      minterms.push(i)
    }
  }
  
  return { truthTable, minterms }
}

// Generate K-map
function generateKMap(truthTable, variables) {
  const numVars = variables.length
  
  if (numVars === 2) {
    // 2x2 K-map
    return [
      [truthTable[0].output, truthTable[1].output],
      [truthTable[2].output, truthTable[3].output]
    ]
  } else if (numVars === 3) {
    // 2x4 K-map (Gray code order for columns)
    return [
      [truthTable[0].output, truthTable[1].output, truthTable[3].output, truthTable[2].output],
      [truthTable[4].output, truthTable[5].output, truthTable[7].output, truthTable[6].output]
    ]
  } else if (numVars === 4) {
    // 4x4 K-map (Gray code order for both rows and columns)
    return [
      [truthTable[0].output, truthTable[1].output, truthTable[3].output, truthTable[2].output],
      [truthTable[4].output, truthTable[5].output, truthTable[7].output, truthTable[6].output],
      [truthTable[12].output, truthTable[13].output, truthTable[15].output, truthTable[14].output],
      [truthTable[8].output, truthTable[9].output, truthTable[11].output, truthTable[10].output]
    ]
  }
  
  return []
}

// Sum of Products form
function generateSOP(minterms, variables) {
  if (minterms.length === 0) return '0'
  if (minterms.length === Math.pow(2, variables.length)) return '1'
  
  const terms = minterms.map(minterm => {
    const binary = minterm.toString(2).padStart(variables.length, '0')
    return binary.split('').map((bit, i) => 
      bit === '1' ? variables[i] : variables[i] + "'"
    ).join('')
  })
  
  return terms.join(' + ')
}

// Product of Sums form
function generatePOS(truthTable, variables) {
  const n = variables.length
  const numRows = Math.pow(2, n)
  const maxterms = []
  
  // Find all maxterms (positions where output is 0)
  for (let i = 0; i < numRows; i++) {
    if (truthTable[i].output === 0) {
      maxterms.push(i)
    }
  }
  
  if (maxterms.length === 0) return '1'
  if (maxterms.length === numRows) return '0'
  
  // Convert maxterms to sum terms (inverted bits)
  const sumTerms = maxterms.map(maxterm => {
    const binary = maxterm.toString(2).padStart(n, '0')
    const literals = binary.split('').map((bit, i) => 
      bit === '0' ? variables[i] : variables[i] + "'"
    )
    return '(' + literals.join(' + ') + ')'
  })
  
  return sumTerms.join(' · ')
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

// Convert implicant bitstring to list of covered minterms
function getMinstermsForImplicant(implicant, numVars) {
  const minterms = []
  const numTotal = Math.pow(2, numVars)
  
  for (let i = 0; i < numTotal; i++) {
    const binary = i.toString(2).padStart(numVars, '0')
    if (covers(implicant, binary)) {
      minterms.push(i)
    }
  }
  
  return minterms
}

function quineMcCluskey(ones, variables) {
  const n = variables.length
  const grouped = new Map()

  ones.forEach((m) => {
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
  if (finalImplicants.length === 0) return { simplified: '0', groups: [] }

  return {
    simplified: finalImplicants.map((pi) => implicantToExpr(pi, variables)).join(' + '),
    groups: finalImplicants
  }
}

function solve() {
  error.value = ''
  result.value = null
  
  if (!expression.value.trim()) {
    error.value = 'Please enter a boolean expression'
    return
  }
  
  try {
    const { normalized, variables } = parseExpression(expression.value)
    const { truthTable, minterms } = generateTruthTable(normalized, variables)
    const kmap = generateKMap(truthTable, variables)
    const sopExpression = generateSOP(minterms, variables)
    const posExpression = generatePOS(truthTable, variables)
    
    let simplifiedExpression = ''
    let groups = []
    if (minterms.length === 0) {
      simplifiedExpression = '0'
    } else if (minterms.length === Math.pow(2, variables.length)) {
      simplifiedExpression = '1'
    } else {
      const result = quineMcCluskey(minterms, variables)
      simplifiedExpression = result.simplified
      groups = result.groups.map(implicant => getMinstermsForImplicant(implicant, variables.length))
    }
    
    result.value = {
      variables,
      truthTable,
      kmap,
      minterms,
      sopExpression,
      posExpression,
      simplifiedExpression,
      groups
    }
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.kmap-solver {
  padding: 2rem;
  max-width: 1000px;
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
  margin-bottom: 1rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #35495e;
}

.expression-input {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-family: 'Courier New', monospace;
}

.expression-input:focus {
  outline: none;
  border-color: #42b883;
}

.btn-solve {
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

.btn-solve:hover {
  background: #35495e;
}

.help-text {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ddd;
  font-size: 0.9rem;
  color: #666;
}

.help-text ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.help-text li {
  margin: 0.25rem 0;
}

.variables-control {
  background: #f0f8ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #42b883;
}

.control-group {
  margin-bottom: 0;
}

.control-group label {
  display: block;
  margin-bottom: 1rem;
  font-weight: bold;
  color: #35495e;
  font-size: 1rem;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.var-count {
  display: inline-block;
  width: 2.5rem;
  text-align: center;
  font-weight: bold;
  color: #42b883;
  font-size: 1.1rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border-radius: 4px;
  border: 2px solid #42b883;
}

.variable-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.variable-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b883;
  cursor: pointer;
  transition: background 0.3s;
}

.variable-slider::-webkit-slider-thumb:hover {
  background: #35495e;
}

.variable-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #42b883;
  cursor: pointer;
  border: none;
  transition: background 0.3s;
}

.variable-slider::-moz-range-thumb:hover {
  background: #35495e;
}

.var-label {
  font-weight: bold;
  color: #35495e;
  min-width: 80px;
}

.control-hint {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-style: italic;
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

.truth-table, .kmap-display, .minterms, .sop, .pos, .simplified {
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

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  border: 2px solid #ddd;
  padding: 0.75rem;
  text-align: center;
}

thead th {
  background: #35495e;
  color: white;
  font-weight: bold;
}

tbody th {
  background: #f8f9fa;
  font-weight: bold;
}

td.active {
  background: #42b883;
  color: white;
  font-weight: bold;
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
  font-weight: bold;
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
  background: linear-gradient(15deg, transparent 49%, #1f2831 50%, #1f2831 51%, transparent 52%);
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
  cursor: default;
  transition: background 0.2s ease;
  position: relative;
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

/* Group colors for K-map groupings with layered borders */
.cell.group-0 {
  box-shadow: inset 0 0 0 3px #ff6b6b;
}

.cell.group-0.group-1 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #4c6ef5;
}

.cell.group-0.group-2 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #f59f00;
}

.cell.group-0.group-3 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #15aabf;
}

.cell.group-0.group-4 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #a8e6cf;
}

.cell.group-0.group-5 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #ffd3a5;
}

.cell.group-0.group-6 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #fd7272;
}

.cell.group-0.group-7 {
  box-shadow: inset 0 0 0 3px #ff6b6b, inset 0 0 0 6px #74b9ff;
}

.cell.group-1 {
  box-shadow: inset 0 0 0 3px #4c6ef5;
}

.cell.group-1.group-2 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #f59f00;
}

.cell.group-1.group-3 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #15aabf;
}

.cell.group-1.group-4 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #a8e6cf;
}

.cell.group-1.group-5 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #ffd3a5;
}

.cell.group-1.group-6 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #fd7272;
}

.cell.group-1.group-7 {
  box-shadow: inset 0 0 0 3px #4c6ef5, inset 0 0 0 6px #74b9ff;
}

.cell.group-2 {
  box-shadow: inset 0 0 0 3px #f59f00;
}

.cell.group-2.group-3 {
  box-shadow: inset 0 0 0 3px #f59f00, inset 0 0 0 6px #15aabf;
}

.cell.group-2.group-4 {
  box-shadow: inset 0 0 0 3px #f59f00, inset 0 0 0 6px #a8e6cf;
}

.cell.group-2.group-5 {
  box-shadow: inset 0 0 0 3px #f59f00, inset 0 0 0 6px #ffd3a5;
}

.cell.group-2.group-6 {
  box-shadow: inset 0 0 0 3px #f59f00, inset 0 0 0 6px #fd7272;
}

.cell.group-2.group-7 {
  box-shadow: inset 0 0 0 3px #f59f00, inset 0 0 0 6px #74b9ff;
}

.cell.group-3 {
  box-shadow: inset 0 0 0 3px #15aabf;
}

.cell.group-3.group-4 {
  box-shadow: inset 0 0 0 3px #15aabf, inset 0 0 0 6px #a8e6cf;
}

.cell.group-3.group-5 {
  box-shadow: inset 0 0 0 3px #15aabf, inset 0 0 0 6px #ffd3a5;
}

.cell.group-3.group-6 {
  box-shadow: inset 0 0 0 3px #15aabf, inset 0 0 0 6px #fd7272;
}

.cell.group-3.group-7 {
  box-shadow: inset 0 0 0 3px #15aabf, inset 0 0 0 6px #74b9ff;
}

.cell.group-4 {
  box-shadow: inset 0 0 0 3px #a8e6cf;
}

.cell.group-4.group-5 {
  box-shadow: inset 0 0 0 3px #a8e6cf, inset 0 0 0 6px #ffd3a5;
}

.cell.group-4.group-6 {
  box-shadow: inset 0 0 0 3px #a8e6cf, inset 0 0 0 6px #fd7272;
}

.cell.group-4.group-7 {
  box-shadow: inset 0 0 0 3px #a8e6cf, inset 0 0 0 6px #74b9ff;
}

.cell.group-5 {
  box-shadow: inset 0 0 0 3px #ffd3a5;
}

.cell.group-5.group-6 {
  box-shadow: inset 0 0 0 3px #ffd3a5, inset 0 0 0 6px #fd7272;
}

.cell.group-5.group-7 {
  box-shadow: inset 0 0 0 3px #ffd3a5, inset 0 0 0 6px #74b9ff;
}

.cell.group-6 {
  box-shadow: inset 0 0 0 3px #fd7272;
}

.cell.group-6.group-7 {
  box-shadow: inset 0 0 0 3px #fd7272, inset 0 0 0 6px #74b9ff;
}

.cell.group-7 {
  box-shadow: inset 0 0 0 3px #74b9ff;
}

.minterms p {
  font-size: 1.1rem;
  color: #35495e;
  font-family: 'Courier New', monospace;
}

.sop,
.pos,
.simplified {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.expr {
  font-size: 1.2rem;
  font-weight: bold;
  color: #42b883;
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #42b883;
  margin: 0;
}
</style>
