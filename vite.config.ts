import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          // Security headers for development
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
          next();
        });
      },
    },
    {
      name: 'stripe-api-dev',
      configureServer(server) {
        // Dev-only API endpoint for creating Stripe PaymentIntents
        // In production, use a Supabase Edge Function or serverless function
        server.middlewares.use('/api/create-payment-intent', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
          if (!STRIPE_SECRET) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'STRIPE_SECRET_KEY not set in .env' }));
            return;
          }

          // Read request body
          let body = '';
          for await (const chunk of req) body += chunk;

          try {
            const { amount, currency, metadata } = JSON.parse(body);

            if (!amount || !currency) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'amount and currency are required' }));
              return;
            }

            // Create PaymentIntent via Stripe API
            const params = new URLSearchParams();
            params.append('amount', String(Math.round(amount))); // must be integer (cents)
            params.append('currency', currency.toLowerCase());
            params.append('automatic_payment_methods[enabled]', 'true');
            if (metadata) {
              Object.entries(metadata).forEach(([k, v]) => {
                params.append(`metadata[${k}]`, String(v));
              });
            }

            const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${STRIPE_SECRET}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            });

            const data = await stripeRes.json() as Record<string, any>;

            if (!stripeRes.ok) {
              res.statusCode = stripeRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: data.error?.message || 'Stripe error' }));
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              clientSecret: data.client_secret,
              paymentIntentId: data.id,
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
          }
        });
      },
    },
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for security
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting for better performance
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-icons'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    strictPort: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
})
