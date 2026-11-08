import { NodeCanvasExperiment } from "./NodeCanvasExperiment";
import { HumanNodePaths } from "./HumanNodePaths";

/** Fixed existing receipts shared by explicit CLI, bare CLI and no-plugin measurements. */
const PAIRS: string = "packages/human/.shots/comparison_xhigh/node-ortho-pairs.json";

/**
 * Runs the same six actual f1 saved-camera pairs with no environment controls or child launcher.
 * Empty argv and the explicit historical selection both delegate to the same existing renderer.
 * The package script fixes --no-plugins and the Human package tsconfig for Node execution.
 */
export async function NodeCanvasSix(argv: readonly string[]): Promise<void> {
  if (argv.length !== 0 && !(argv.length === 2 && argv[0] === "--pairs-only" && argv[1] === PAIRS)) throw new Error("Usage: pnpm --dir packages/human node:six [--pairs-only " + PAIRS + "]");
  await NodeCanvasExperiment(["--pairs-only", HumanNodePaths.resolve(PAIRS)]);
}

if (require.main === module) NodeCanvasSix(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
