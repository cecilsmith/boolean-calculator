<template>
  <div class="app">
    <header>
      <div class="header-content">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <nav class="navigation">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/kmap/solver" class="nav-link">K-Map Solver</router-link>
        <router-link to="/kmap/builder" class="nav-link">K-Map Builder</router-link>
        <router-link to="/division" class="nav-link">Boolean Division</router-link>
        <router-link to="/multiplication" class="nav-link">Boolean Multiplication</router-link>
        <router-link to="/signed" class="nav-link">Signed Number Calculator</router-link>
      </nav>
    </header>
    
    <main>
      <router-view />
    </main>

    <footer>
      <p>&copy; 2025 Nathanael Smith</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Boolean Calculator')
// const subtitle = ref('Built with Vue 3 + Vite')
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: white;
  padding: 2rem;
}

.header-content {
  text-align: center;
  margin-bottom: 1.5rem;
}

header h1 {
  margin: 0;
  font-size: 2.5rem;
}

header p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
}

.navigation {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1.5rem;
  border-radius: 4px;
  transition: background 0.3s;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

main {
  flex: 1;
}

footer {
  background: #35495e;
  color: white;
  text-align: center;
  padding: 1rem;
}

footer p {
  margin: 0;
}
</style>
