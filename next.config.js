/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ugcgxotjemmluprujufk.supabase.co",
        pathname: "/storage/v1/object/public/festa-images/**",
      },
      // Adicione outros padrões se necessário
    ],
  },
};

module.exports = nextConfig;