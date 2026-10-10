import { provisionBanks, retainHistory } from "../server/hindsight.ts";

await provisionBanks();
const stored = await retainHistory();
console.log(`Seeded ${stored} case documents across Bharat Arogya, Suraksha General, Navjeevan Health TPA, and Jan Raksha Yojana.`);
console.log("Banks are ready. Start the desk with npm run dev.");
