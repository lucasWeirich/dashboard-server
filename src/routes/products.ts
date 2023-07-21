import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

export async function productsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/products', async (req) => {
    const products = await prisma.product.findMany({
      where: {
        companyId: req.user.sub
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        Order: true,
      }
    })

    return products.map(product => {
      return {
        id: product.id,
        image: product.image,
        name: product.name,
        price: product.price,
        orders: product.Order.length
      }
    })
  })

  // ------------------------------------------------
  app.get('/product/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    const product = await prisma.product.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        Order: true,
        Sales: true
      }
    })

    if (product.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    return product
  })

  // ------------------------------------------------
  app.post('/product', async (req) => {
    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
      image: z.string(),
      price: z.number(),
      quantity_in_stock: z.number(),
    })

    const { name, description, image, price, quantity_in_stock } = bodySchema.parse(req.body)

    const product = await prisma.product.create({
      data: {
        name,
        description,
        image,
        price,
        quantity_in_stock,
        companyId: req.user.sub
      }
    })

    return product
  })


  // ------------------------------------------------
  app.put('/product/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const bodySchema = z.object({
      name: z.string(),
      description: z.string(),
      image: z.string(),
      price: z.number(),
      quantity_in_stock: z.number(),
    })

    const { id } = paramsSchema.parse(req.params)
    const { name, description, image, price, quantity_in_stock } = bodySchema.parse(req.body)

    let product = await prisma.product.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if (product.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    product = await prisma.product.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        image,
        price,
        quantity_in_stock
      }
    })

    return product
  })

  // ------------------------------------------------
  app.delete('/product/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    const product = await prisma.product.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if (product.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    await prisma.product.delete({
      where: {
        id,
      }
    })
  })
}