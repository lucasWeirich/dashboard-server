import { FastifyInstance } from "fastify";
import axios from 'axios'
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from 'bcrypt'
import { FastifyJWT } from "@fastify/jwt";

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const bodySchema = z.object({
      login: z.string(),
      password: z.string(),
    })

    const { login, password } = bodySchema.parse(req.body)

    const company = await prisma.company.findUnique({
      where: {
        login,
      },
    })

    if (!company) {
      return reply.code(401).send({ message: 'unregistered company!' });
    }

    const isValidPassword = await bcrypt.compare(password, company.password);
    if (!isValidPassword) {
      return reply.code(401).send({ message: 'Invalid password!' });
    }

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
}