import { provisionBanks, retainHistory } from "../server/hindsight.ts";

try {
  console.log("Provisioning fictional insurer memory banks…");
  await provisionBanks();
  console.log("Retaining 64 simulated case outcomes…");
  const stored = await retainHistory();
  console.log(`Seeded ${stored} case documents across all four insurer banks.`);
  console.log("Banks are ready. Start the desk with npm run dev.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Seed failed: ${message}`);
  process.exitCode = 1;
}
