import { fileURLToPath } from "node:url";
import { checkModelProseConsistency } from "./checkModelProseConsistency.mjs";
/** Direct CLI for the authored prose census. Acquisition and ordered diagnostics
 * belong to checkModelProseConsistency; this entry maps any failure to exit 1.
 * Imports perform no census and this entry exports no alternate public owners. */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  process.exitCode = checkModelProseConsistency().failures.length ? 1 : 0;
