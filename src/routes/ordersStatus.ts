import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

export async function ordersStatusRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/orders_status', async (req) => {
    const ordersStatus = await prisma.orderStatus.findMany({
      orderBy: {
        id: 'asc'
      }
    })

    return ordersStatus;
  })

  // ------------------------------------------------
  app.post('/order_status', async (req) => {
    const bodySchema = z.object({
      label: z.string(),
    })

    const { label } = bodySchema.parse(req.body)

    const orderStatus = await prisma.orderStatus.create({
      data: {
        label,
      }
    })

    return orderStatus
  })

  // ------------------------------------------------
  app.put('/order_status/:id', async (req) => {
    const paramsSchema = z.object({
      id: z.string()
    })

    const bodySchema = z.object({
      label: z.string()
    })

    const { id } = paramsSchema.parse(req.params)
    const { label } = bodySchema.parse(req.body)

    const orderStatus = await prisma.orderStatus.update({
      where: {
        id: Number(id),
      },
      data: {
        label,
      }
    })

    return orderStatus
  })

  // ------------------------------------------------
  app.delete('/order_status/:id', async (req) => {
    const paramsSchema = z.object({
      id: z.string()
    })

    const { id } = paramsSchema.parse(req.params)

    await prisma.orderStatus.delete({
      where: {
        id: Number(id)
      }
    })
  })
}