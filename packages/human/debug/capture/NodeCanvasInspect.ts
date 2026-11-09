/** Compatibility path for resident debug consumers; implementation belongs to the Human source owner. */
export { NodeCanvasInspect } from "../../src/executable/NodeCanvasInspect";
import { NodeCanvasInspect } from "../../src/executable/NodeCanvasInspect";

if (require.main === module) NodeCanvasInspect(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
