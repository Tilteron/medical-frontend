import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      "@polkadot/api",
      "@polkadot/keyring",
      "@polkadot/util",
      "@polkadot/util-crypto",
      "@polkadot/types"
    ]
  }
})
