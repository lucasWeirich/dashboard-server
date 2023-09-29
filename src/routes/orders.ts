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
        product: {
          select: {
            name: true
          }
        }
      },
    })

    return orders.map(order => {
      return {
        id: order.id,
        quantity: order.quantity,
        value: order.value,
        statusId: order.statusId,
        createdAt: order.createdAt,
        updateStatusAt: order.updateStatusAt,
        nameProduct: order.product.name
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

    const { price, quantity_in_stock } = await prisma.product.findUniqueOrThrow({
      where: {
        id: productId,
        companyId: req.user.sub
      },
      select: {
        price: true,
        quantity_in_stock: true
      }
    })

    if (quantity < 1 || quantity > quantity_in_stock) return reply.status(400).send('Invalid quantity')
    if (!price) return reply.status(404).send()
    if (statusId !== 1 && statusId !== 2) return reply.status(400).send('Invalid status')

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

    await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        quantity_in_stock: {
          decrement: order.quantity
        }
      }
    })

    if (statusId === 2) {
      const [sale] = await prisma.sales.findMany({
        where: {
          productId: productId
        },
        select: {
          id: true,
          quantity: true,
          value: true
        }
      })

      if (sale) {
        await prisma.sales.update({
          where: {
            id: sale.id
          },
          data: {
            quantity: sale.quantity + order.quantity,
            value: sale.value + (order.quantity * order.value)
          }
        });
      } else {
        await prisma.sales.create({
          data: {
            quantity: order.quantity,
            value: order.value,
            productId: order.productId,
            companyId: req.user.sub
          }
        })
      }
    }

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

    if (order.statusId === 2 || order.statusId === 3) return reply.status(400).send('Blocked status')

    if (order.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    order = await prisma.order.update({
      where: {
        id,
      },
      data: {
        statusId,
        updateStatusAt: new Date(),
      }
    })

    if (statusId === 2) {
      const [sale] = await prisma.sales.findMany({
        where: {
          productId: order.productId
        },
        select: {
          id: true,
          quantity: true,
          value: true
        }
      })

      if (sale) {
        await prisma.sales.update({
          where: {
            id: sale.id
          },
          data: {
            quantity: sale.quantity + order.quantity,
            value: sale.value + (order.quantity * order.value)
          }
        });
      } else {
        await prisma.sales.create({
          data: {
            quantity: order.quantity,
            value: order.value,
            productId: order.productId,
            companyId: req.user.sub
          }
        })
      }
    }

    if (statusId === 3) {
      await prisma.product.update({
        where: {
          id: order.productId
        },
        data: {
          quantity_in_stock: {
            increment: order.quantity
          }
        }
      })
    }

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