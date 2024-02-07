import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function reportRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/report', async (req) => {
    const orders = await prisma.order.findMany({
      where: {
        companyId: req.user.sub,
      }
    })

    const sales = await prisma.sales.aggregate({
      _sum: {
        value: true
      }
    })

    let totalSales = 0;

    orders.map(order => {
      if (order.statusId === 2) {
        totalSales = totalSales + order.value;
      }
    })

    return {
      orders: orders.length,
      totalSales,
      allSales: sales._sum.value
    }
  })
}