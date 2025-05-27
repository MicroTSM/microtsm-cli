import { PreviewServer, ViteDevServer } from 'vite';

export default function modifyResolvedUrls(server: PreviewServer | ViteDevServer) {
  if (server.resolvedUrls)
    server.resolvedUrls.local = server.resolvedUrls?.local?.filter?.((url) => !url.includes('vite'));
}
