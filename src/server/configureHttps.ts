import { InlineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default function configureHTTPSServer(conf: InlineConfig): void {
  conf.plugins = [...(conf.plugins || []), mkcert()];
  conf.server = {
    ...conf.server,
    cors: true,
  };

  conf.preview = {
    ...conf.preview,
    cors: true
  };
}
