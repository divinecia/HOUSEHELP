import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { comparePassword } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "admin",
      credentials: {
        empId: { label: "Employee ID", type: "text" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.empId || !credentials?.password) {
          return null;
        }

        try {
          const supabase = createServerClient();

          // Find admin by employee ID or email
          const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .or(`emp_id.eq.${credentials.empId},email.eq.${credentials.empId}`)
            .single();

          if (error || !admin) {
            return null;
          }

          // Verify password
          const isValidPassword = await comparePassword(credentials.password, admin.password_hash);
          if (!isValidPassword) {
            return null;
          }

          // TODO: Add 2FA verification if code provided

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role || 'admin',
            empId: admin.emp_id,
          };
        } catch (error) {
          console.error('Admin authentication error:', error);
          return null;
        }
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        // Attach provider for reference
        // @ts-ignore
        token.provider = account.provider;
      }
      if (profile && typeof profile === "object") {
        // @ts-ignore
        token.name = token.name || profile.name;
        // @ts-ignore
        token.email = token.email || profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-ignore
      session.provider = token.provider;
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };
