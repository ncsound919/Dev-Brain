// Cloudflare Container entry for Dev-Brain.
// The Worker routes every request to a single warm container instance running
// the Dev-Brain server (dist/server.cjs) on port 8080. The container sleeps
// after 10m idle and wakes on the next request.
import { Container } from "@cloudflare/containers";

export class DevBrain extends Container {
  defaultPort = 8080;
  sleepAfter = "10m";
  envVars = {
    NODE_ENV: "production",
    HOST: "0.0.0.0",
    PORT: "8080",
  };
}

interface Env {
  DEVBRAIN: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = env.DEVBRAIN.getByName("primary");
    return await container.fetch(request);
  },
};
