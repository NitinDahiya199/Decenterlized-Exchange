import Fastify from "fastify";
import { Server } from "socket.io";
import { parseServerEnv, TYPES_PACKAGE } from "@dex-terminal/types";

const env = parseServerEnv(process.env);
const host = env.API_HOST;
const port = env.API_PORT;

const fastify = Fastify({ logger: true });

await fastify.get("/health", async () => ({
  ok: true,
  types: TYPES_PACKAGE,
}));

await fastify.ready();

const io = new Server(fastify.server, {
  cors: { origin: env.API_ORIGIN ?? "http://localhost:3000" },
});

io.on("connection", (socket) => {
  fastify.log.info({ id: socket.id }, "socket connected");
  socket.emit("welcome", { message: "DEX Terminal API (dev)" });
});

await fastify.listen({ port, host });
