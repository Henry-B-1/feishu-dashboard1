/** @type {import('next').NextConfig} */
const nextConfig = {
  // 保留你项目原有的其他配置（比如reactStrictMode等），没有就直接写下面的headers
  async headers() {
    return [
      {
        // 对/api下的所有接口生效（包括你的/feishu/records）
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' }, // 允许所有前端访问
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' }, // 允许GET请求
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
