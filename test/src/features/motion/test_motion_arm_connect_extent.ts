import { HumanArmConnect } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * RRT-Connect's connection ends because every step of a tree is a fifth of
 * the space's extent long (`HumanArmConnect`): a space whose extent is zero
 * or not finite steps no length, so a connection between two distinct
 * configurations added the same vertex forever, and such a query is now
 * refused.
 *
 * Scenarios:
 * 1. A unit square, every state valid, from (0, 0) to (1, 1) with its
 *    diagonal as the extent: the trees meet on the straight segment, and the
 *    shortcut path is the start and the goal alone.
 * 2. The same query with an extent of 0, -1, not-a-number or infinity is
 *    refused with a `RangeError`. Before, an extent of 0 or not-a-number
 *    made each connecting step leave the tree where it stood, and the
 *    connection never ended.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public planner on an ordinary and on degenerate spaces; a connection that never ends never returns, and a planner that refuses or reroutes the open square fails scenario 1.
 * @evidence contracts/development/testing.md#independent-expectations In a space where every state is valid the straight segment is valid, so its shortcut is the two ends; the refused extents follow from the step being a share of the extent.
 * @evidence contracts/development/testing.md#distinguishing-cases A positive finite extent beside zero, negative, not-a-number and infinite ones.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory planner call, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the step that ends a connection and the two scenarios.
 */
export function test_motion_arm_connect_extent(): void {
  const findings: string[] = [];
  const query = (extent: number): HumanArmConnect.IQuery => ({
    start: [0, 0],
    goal: [1, 1],
    sample: (random: () => number): number[] => [random(), random()],
    valid: (): boolean => true,
    extent,
  });
  const path: number[][] | null = HumanArmConnect.connect(query(Math.SQRT2));
  if (
    JSON.stringify(path) !==
    JSON.stringify([
      [0, 0],
      [1, 1],
    ])
  )
    findings.push(`open square: ${JSON.stringify(path)}`);
  for (const extent of [0, -1, NaN, Infinity])
    try {
      findings.push(
        `extent ${extent}: returned ${JSON.stringify(HumanArmConnect.connect(query(extent)))}`,
      );
    } catch (error) {
      if (!(error instanceof RangeError))
        findings.push(`extent ${extent}: threw ${String(error)}`);
    }
  TestValidator.equals("a connection steps a positive length", findings, []);
}
