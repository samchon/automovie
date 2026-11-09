/** Compatibility path for resident debug consumers; implementation belongs to the Human source owner. */
export { HumanScalarPreparationCost } from "../../../src/executable/HumanScalarPreparationCost";
import { HumanScalarPreparationCost } from "../../../src/executable/HumanScalarPreparationCost";

if (require.main === module) HumanScalarPreparationCost(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
