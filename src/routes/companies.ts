import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function companiesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify()
  })

  /* app.get('/companies', async () => {
    const company = await prisma.company.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return company
  }) */

  // ------------------------------------------------
  app.get('/company/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    if (id !== req.user.sub) {
      return reply.status(401).send()
    }

    const company = await prisma.company.findUniqueOrThrow({
      where: {
        id,
      }
    })

    return company
  })

  // ------------------------------------------------
  /* app.post('/company', async (req) => {
    const bodySchema = z.object({
      name: z.string(),
      login: z.string(),
      password: z.string(),
      sales_goal: z.number().optional(),
      themeDark: z.coerce.boolean().optional()
    })

    const { name, login, password, sales_goal, themeDark } = bodySchema.parse(req.body)

    const company = await prisma.company.create({
      data: {
        name,
        login,
        password,
        sales_goal,
        themeDark,
      }
    })

    return company
  }) */

  // ------------------------------------------------
  app.put('/company/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const bodySchema = z.object({
      name: z.string(),
      sales_goal: z.number(),
      password: z.string(),
    })

    const { id } = paramsSchema.parse(req.params)
    const { name, sales_goal, password } = bodySchema.parse(req.body)

    if (id !== req.user.sub) {
      return reply.status(401).send()
    }

    const company = await prisma.company.update({
      where: {
        id,
      },
      data: {
        name,
        sales_goal,
        password // Futuramente, enviar um código de verificacao ao e-mail
      }
    })

    const token = app.jwt.sign(
      {
        name: company.name,
        login: company.login,
        sales_goal: company.sales_goal,
        themeDark: company.themeDark,
      },
      {
        sub: company.id,
        expiresIn: '1h'
      }
    )

    return { token }
  })

  // ------------------------------------------------
  app.patch('/company/theme/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    if (id !== req.user.sub) {
      return reply.status(401).send()
    }

    const { themeDark } = await prisma.company.findUniqueOrThrow({
      where: {
        id,
      }
    })

    const company = await prisma.company.update({
      where: {
        id,
      },
      data: {
        themeDark: !themeDark
      }
    })

    const token = app.jwt.sign(
      {
        name: company.name,
        login: company.login,
        sales_goal: company.sales_goal,
        themeDark: company.themeDark,
      },
      {
        sub: company.id,
        expiresIn: '1h'
      }
    )

    return { token }
  })

  // ------------------------------------------------
  /* app.delete('/company/:id', async (req, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = paramsSchema.parse(req.params)

    if (id !== req.user.sub) {
      return reply.status(401).send()
    }

    await prisma.company.delete({
      where: {
        id,
      }
    })
  }) */
}