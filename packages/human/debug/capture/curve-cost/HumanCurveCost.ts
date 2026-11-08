/** Compatibility path for resident debug consumers; implementation belongs to the Human source owner. */
export { HumanCurveCost } from "../../../src/executable/HumanCurveCost";
import { HumanCurveCost } from "../../../src/executable/HumanCurveCost";

if (require.main === module) HumanCurveCost(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
