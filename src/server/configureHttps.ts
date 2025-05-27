import { InlineConfig } from 'vite';
import viteBasicSslPlugin from '@vitejs/plugin-basic-ssl';

export default function configureHTTPSServer(conf: InlineConfig, prop: 'server' | 'preview' = 'server'): void {
  const CERT_NAME = 'serve';

  conf.plugins = [
    ...(conf.plugins || []),
    viteBasicSslPlugin({ name: CERT_NAME, domains: ['*'], certDir: '/Users/.../.devServer/cert' }),
  ];

  conf[prop] = {
    ...conf[prop],
    https: { key: `/Users/.../.devServer/cert/${CERT_NAME}.key`, cert: `/Users/.../.devServer/cert/${CERT_NAME}.crt` },
    cors: { origin: '*', credentials: true },
  };
}
