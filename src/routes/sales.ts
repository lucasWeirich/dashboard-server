import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../lib/prisma";

export async function salesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/sales', async (req) => {
    const sales = await prisma.sales.findMany({
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

    return sales.map(sale => {
      return {
        id: sale.id,
        quantity: sale.quantity,
        value: sale.value,
        createdAt: sale.createdAt,
        nameProduct: sale.product.name
      }
    })
  })

  // ------------------------------------------------
  app.get('/sales/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    const sales = await prisma.sales.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        product: true,
      }
    })

    if (sales.companyId !== req.user.sub) {
      return reply.status(401).send()
    }

    return sales
  })
}