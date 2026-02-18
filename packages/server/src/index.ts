import { buildApp } from "./app.js";

const port = Number(process.env.PORT ?? 3100);

async function main() {
  const app = await buildApp();

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
