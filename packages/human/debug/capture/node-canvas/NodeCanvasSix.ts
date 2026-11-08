/** Compatibility path for resident debug consumers; implementation belongs to the Human source owner. */
export { NodeCanvasSix } from "../../../src/executable/NodeCanvasSix";
import { NodeCanvasSix } from "../../../src/executable/NodeCanvasSix";

if (require.main === module) NodeCanvasSix(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
