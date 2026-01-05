export { }

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'user' | 'admin';
      tier?: 'free' | 'developer' | 'pro';
    };
  }
}
