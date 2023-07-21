import '@fastify/jwt'

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      sub: string
      name: string
      login: string
      sales_goal: number
      themeDark: boolean
    }
  }
}
