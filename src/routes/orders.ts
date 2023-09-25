import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

export async function ordersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/orders', async (req) => {
    const orders = await prisma.order.findMany({
      where: {
        companyId: req.user.sub
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {

      }
    })

    return orders.map(order => {
      return {
        id: order.id,
        quantity: order.quantity,
        value: order.value,
        statusId: order.statusId,
        createdAt: order.createdAt
      }
    })
  })

  // ------------------------------------------------
  app.get('/order/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    const order = await prisma.order.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        product: true,
      }
    })

    if (order.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    return order
  })

  // ------------------------------------------------
  app.post('/order', async (req, reply) => {
    const bodySchema = z.object({
      quantity: z.number(),
      statusId: z.number(),
      productId: z.string().uuid(),
    })

    const { quantity, statusId, productId } = bodySchema.parse(req.body)

    const { price } = await prisma.product.findUniqueOrThrow({
      where: {
        id: productId,
        companyId: req.user.sub
      },
      select: {
        price: true
      }
    })

    if (!price) return reply.status(404).send()

    const value = Number(price * quantity)

    const order = await prisma.order.create({
      data: {
        quantity,
        value,
        statusId,
        productId,
        companyId: req.user.sub
      }
    })

    return order
  })

  // ------------------------------------------------
  app.put('/order/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const bodySchema = z.object({
      statusId: z.number()
    })

    const { id } = paramsSchema.parse(req.params)
    const { statusId } = bodySchema.parse(req.body)

    let order = await prisma.order.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if (order.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    order = await prisma.order.update({
      where: {
        id,
      },
      data: {
        statusId,
        createdAt: new Date(),
      }
    })

    return order
  })

  // ------------------------------------------------
  app.delete('/order/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    const order = await prisma.order.findUniqueOrThrow({
      where: {
        id,
      }
    })

    if (order.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    await prisma.order.delete({
      where: {
        id,
      }
    })
  })
}