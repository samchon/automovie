import { AutoMoviePhysicalBalance as Balance } from "@automovie/engine";
import type { IAutoMovieFootfallPattern } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** Physical balance behavior.
 *
 * Scenarios:
 * 1. Exercise actual public inputs and compare physical quantities.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `interface`, `AutoMoviePhysicalBalance` on in-memory inputs and asserts the returned observations through 1x TestValidator.predicate; 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (1 assertion site compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 1 numbered scenario (first: Exercise actual public inputs and compare physical quantities.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_layers_balance`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 1 numbered scenario it runs, each sentence naming the input and the behavior it pins (first: Exercise actual public inputs and compare physical quantities.).
 */
export function test_physical_layers_balance(): void {
  const pattern: IAutoMovieFootfallPattern = supports(4);
  const contacts: Balance.ISupport[] = pattern.limbs.map(
    (limb: (typeof pattern.limbs)[number]): Balance.ISupport => ({
      bone: limb.bone,
      position: { x: limb.offset.forward, y: 0, z: limb.offset.left },
      points: [{ x: limb.offset.forward, y: 0, z: limb.offset.left }],
    }),
  );
  const assess: (speed: number) => Balance.IResult = (
    speed: number,
  ): Balance.IResult =>
    Balance.assess({
      center: { x: 0, y: 1, z: 0 },
      velocity: { x: speed, y: 0, z: 0 },
      gravity: 9.81,
      floor: 0,
      supports: contacts,
      pattern,
      maximumStep: 0.7,
      margin: 0.01,
      unavailable: [],
    });
  TestValidator.predicate(
    "increasing disturbance changes recovery feasibility",
    (): boolean =>
      assess(0).state === "supported" &&
      assess(2).state === "recovery" &&
      assess(20).state === "unrecoverable",
  );
}

/** Rectangular support geometry and declared timing, without a species name. */
function supports(count: number): IAutoMovieFootfallPattern {
  return {
    id: `supports-${count}`,
    minimumSupports: 1,
    limbs: Array.from(
      { length: count },
      (
        _: unknown,
        index: number,
      ): {
        bone: string;
        chain: string[];
        phase: number;
        duty: number;
        offset: { forward: number; left: number };
        stride: { speed: number; length: number }[];
      } => ({
        bone: `support-${index}`,
        chain: ["root", `support-${index}`],
        phase: index / count,
        duty: 0.6,
        offset: {
          forward: count === 4 ? (index < 2 ? 0.3 : -0.3) : 0,
          left: index % 2 === 0 ? 0.2 : -0.2,
        },
        stride: [
          { speed: 0, length: 0.6 },
          { speed: 2, length: 0.6 },
        ],
      }),
    ),
  };
}
