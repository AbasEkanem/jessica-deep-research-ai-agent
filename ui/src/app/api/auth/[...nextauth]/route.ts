import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.firstName) {
          return null;
        }
        
        return {
          id: credentials.email, // Using email as ID for simple session tracking
          name: `${credentials.firstName} ${credentials.lastName || ""}`.trim(),
          email: credentials.email,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        // You could use `token.sub` or other token data if needed
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Or your specific login route
  }
});

export { handler as GET, handler as POST };
