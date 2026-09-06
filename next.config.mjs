import { readFileSync } from "fs";

// Force-load .env.local so a stale system env var cannot override it
try {
  const envLocal = readFileSync(".env.local", "utf8");
  for (const line of envLocal.split("\n")) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

// Next.js injects its own hydration <script> payloads without a nonce, and this app
// loads face-api.js model weights from jsdelivr plus Google Fonts — so script/style
// need 'unsafe-inline' rather than a strict nonce setup, but everything else (framing,
// object embeds, form targets, connect/img/font origins) is locked down for real.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.jsdelivr.net",
  "media-src 'self' blob:",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // next's output file tracer copies sharp's native binaries into the server
  // function's filesystem "just in case", which blows past Vercel's 250MB
  // function-size limit. This app never uses next/image optimization, so
  // excluding them directly is safe.
  serverExternalPackages: ["sharp"],
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/sharp-*/**"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // face-api.js drags in Node-only branches (fs, node-fetch's optional
      // "encoding" dep) that are never reached in the browser bundle.
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, encoding: false };
    }
    return config;
  },
};

export default nextConfig;