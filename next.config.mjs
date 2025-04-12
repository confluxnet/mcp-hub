/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['ethers', '@ethersproject'],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
