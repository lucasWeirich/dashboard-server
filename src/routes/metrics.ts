import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function metricsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  app.get('/metrics', async (req) => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0);
    const endDate = new Date(currentYear, currentMonth - 1, currentDay, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        companyId: req.user.sub,
        updateStatusAt: {
          gte: startDate,
          lte: endDate,
        },
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

  // Código produzido por IA [chatGPT]
  app.get('/year-sales-metrics', async (req) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    const startDate = new Date(currentYear, 0, 1, 0, 0, 0);
    const endDate = new Date(currentYear, 11, 31, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        companyId: req.user.sub,
        updateStatusAt: {
          gte: startDate,
          lte: endDate,
        },
        statusId: 2,
      },
      select: {
        updateStatusAt: true,
        value: true
      }
    })

    const monthlySales = <any>[];

    orders.forEach(order => {
      const orderMonth = order.updateStatusAt.getMonth();
      const orderValue = order.value;

      if (!monthlySales[orderMonth]) {
        monthlySales[orderMonth] = 0;
      }

      monthlySales[orderMonth] += orderValue;
    });

    const allSales = Object.keys(monthlySales).map(month => {
      const monthName = new Date(currentYear, Number(month), 1).toLocaleString('default', { month: 'long' });
      return [monthName, monthlySales[month]];
    });

    return {
      allSales,
    }
  })
}