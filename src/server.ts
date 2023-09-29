import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { companiesRoutes } from './routes/companies'
import { productsRoutes } from './routes/products'
import { ordersRoutes } from './routes/orders'
import { ordersStatusRoutes } from './routes/ordersStatus'
import { salesRoutes } from './routes/sales'

const app = fastify()

app.register(cors, {
  origin: true, // Ajustar com url do front-end ['url.local', 'url-web']
})

app.register(jwt, {
  secret: '9V3eA0iHVsdTRJ6ILIgTIgrR5hpJ7vGWYgVkuZbna7AjFJTivq',
})

app.register(authRoutes)
app.register(companiesRoutes)
app.register(productsRoutes)
app.register(ordersStatusRoutes) 
app.register(ordersRoutes)
app.register(salesRoutes)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running on http://localhost:3333')
  })