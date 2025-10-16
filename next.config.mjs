import withPWAInit from "next-pwa";

/** @type {import('next').NextConfig} */
const withPWA = withPWAInit({
  dest: "public",
});

const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  reactStrictMode: true,
};

export default withPWA(nextConfig);
