/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Allow a separate frontend (different origin) to call this API during dev.
    // TODO: restrict origin to your actual frontend URL before deploying.
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,DELETE,OPTIONS" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
