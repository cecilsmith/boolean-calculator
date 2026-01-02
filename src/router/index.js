import { createRouter, createWebHistory } from 'vue-router'
import Home from '../components/Home.vue'
import KMapSolver from '../components/KMapSolver.vue'
import KMapBuilder from '../components/KMapBuilder.vue'
import BooleanDivision from '../components/BooleanDivision.vue'
import BooleanMultiplication from '../components/BooleanMultiplication.vue'
import SignedNumberCalculator from '../components/SignedNumberCalculator.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/kmap/solver',
        name: 'KMapSolver',
        component: KMapSolver
    },
    {
        path: '/kmap/builder',
        name: 'KMapBuilder',
        component: KMapBuilder
    },
    {
        path: '/division',
        name: 'BooleanDivision',
        component: BooleanDivision
    },
    {
        path: '/multiplication',
        name: 'BooleanMultiplication',
        component: BooleanMultiplication
    },
    {
        path: '/signed',
        name: 'SignedNumberCalculator',
        component: SignedNumberCalculator
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
