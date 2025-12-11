<template>
  <div class="home">
    <section class="hero">
      <h2>Welcome to Vue 3!</h2>
      <p>This is a sample website built with Vue 3 and Vite.</p>
    </section>

    <section class="counter">
      <h3>Interactive Counter</h3>
      <div class="counter-display">
        <button @click="decrement" class="btn">-</button>
        <span class="count">{{ count }}</span>
        <button @click="increment" class="btn">+</button>
      </div>
      <button @click="reset" class="btn-reset">Reset</button>
    </section>

    <section class="features">
      <h3>Features</h3>
      <ul>
        <li v-for="feature in features" :key="feature">
          {{ feature }}
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const features = ref([
  'Fast Hot Module Replacement (HMR)',
  'Composition API',
  'Reactive data binding',
  'Component-based architecture',
  'Easy to learn and use'
])

const increment = () => {
  count.value++
}

const decrement = () => {
  count.value--
}

const reset = () => {
  count.value = 0
}
</script>

<style scoped>
.home {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h2 {
  color: #42b883;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.counter {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 3rem;
}

.counter h3 {
  margin-top: 0;
  color: #35495e;
}

.counter-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  color: #42b883;
  min-width: 100px;
}

.btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn:hover {
  background: #35495e;
}

.btn-reset {
  background: #35495e;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-reset:hover {
  background: #42b883;
}

.features {
  margin-bottom: 3rem;
}

.features h3 {
  color: #35495e;
  margin-bottom: 1rem;
}

.features ul {
  list-style: none;
  padding: 0;
}

.features li {
  background: #f8f9fa;
  padding: 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 4px solid #42b883;
}
</style>
