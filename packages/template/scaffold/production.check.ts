import { runProductionCheck } from "@automovie/evidence";

import config from "./evidence.config";

process.exitCode = await runProductionCheck({
  config,
  args: process.argv.slice(2),
});
