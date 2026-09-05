import { readFileSync } from "fs";

// Force-load .env.local so a stale system env var cannot override it
try {
  const envLocal = readFileSync(".env.local", "utf8");
  for (const line of envLocal.split("\n")) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  // The live-call voice pipeline only ever touches these via a dynamic import()
  // inside browser event-handler code in a "use client" component — never from
  // server code. serverExternalPackages alone wasn't enough: Next's output file
  // tracer still copied their native binaries (onnxruntime-node, sharp) into the
  // server function's filesystem "just in case", which blew every deploy past
  // Vercel's 250MB function-size limit. Excluding the files directly is what
  // actually keeps them out.
  serverExternalPackages: ["@huggingface/transformers", "@ricky0123/vad-web", "onnxruntime-node", "onnxruntime-web", "sharp"],
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@huggingface/transformers/dist/transformers.node.*",
      "node_modules/onnxruntime-node/**",
      "node_modules/sharp/**",
      "node_modules/@img/sharp-*/**",
      "node_modules/@ricky0123/vad-web/**",
    ],
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