/** Compatibility path for resident debug consumers; implementation belongs to the Human source owner. */
export { NodeCanvasExperiment } from "../../src/executable/NodeCanvasExperiment";
import { NodeCanvasExperiment } from "../../src/executable/NodeCanvasExperiment";

if (require.main === module) NodeCanvasExperiment(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
