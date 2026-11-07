import { PhysicalBalanceMatrix } from "../internal/PhysicalBalanceMatrix";

/** Actual internal joint actuation must support quiet Human/primitive stance, confirm a real recovery landing and permit an unrecoverable fall without an external root wrench. Six-second quiet cases also bound horizontal drift and speed. */
export async function test_physical_internal_balance(): Promise<void> {
  await PhysicalBalanceMatrix.run("internal");
}
