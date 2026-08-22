import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { config } from "./config.js";
import { compileRoutes } from "./routes/compile.js";
import { sessionsRoutes } from "./routes/sessions.js";
import { wsRoutes } from "./routes/ws.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(websocket);
await app.register(sessionsRoutes);
await app.register(compileRoutes);
await app.register(wsRoutes);

app.get("/api/health", async () => ({ status: "ok" }));

app.listen({ port: config.port, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
