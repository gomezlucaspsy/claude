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
};

export default nextConfig;