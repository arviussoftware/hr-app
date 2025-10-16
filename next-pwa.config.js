/** @type {import('next-pwa').IPluginOptions} */
module.exports = {
  dest: 'public',                // where SW will be generated
  register: true,                // auto-register SW
  skipWaiting: true,             // immediately activate new SW
  disable: process.env.NODE_ENV === 'development',
}