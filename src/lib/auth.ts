import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        console.log("[auth] Attempting login for:", email);

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) {
          console.log("[auth] User not found:", email);
          return null;
        }

        console.log("[auth] User found, comparing password");
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          console.log("[auth] Invalid password for:", email);
          return null;
        }

        console.log("[auth] Login successful for:", email);
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});
