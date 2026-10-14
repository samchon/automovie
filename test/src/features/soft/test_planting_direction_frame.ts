import { growPlanting } from "@automovie/engine";
import {
  IAutoMoviePlantingBranch,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, vclose } from "../internal/predicates";
import { plantingRecipe } from "../internal/softFixtures";

/** A two-level recipe with a single child, so one branch answers for the law. */
const oriented: (props: {
  axis?: { x: number; y: number; z: number } | undefined;
  direction?: { x: number; y: number; z: number } | undefined;
  gravitropism?: number | undefined;
  directionJitter?: number | undefined;
}) => IAutoMoviePlantingDomain = (props: {
  axis?: { x: number; y: number; z: number };
  direction?: { x: number; y: number; z: number };
  gravitropism?: number;
  directionJitter?: number;
}): IAutoMoviePlantingDomain =>
  plantingRecipe({
    structure: {
      ...plantingRecipe().structure,
      levels: 2,
      axis: props.axis ?? { x: 0, y: 1, z: 0 },
      children: [
        {
          id: "a",
          direction: props.direction ?? { x: 1, y: 0, z: 0 },
          offset: 0.5,
        },
      ],
      gravitropism: props.gravitropism ?? 0,
      directionJitter: props.directionJitter ?? 0,
    },
    budget: { maxBranches: 8, maxLeaves: 0 },
  });

/** The world direction the single child grew along. */
const childAxis: (domain: IAutoMoviePlantingDomain) => {
  x: number;
  y: number;
  z: number;
} = (domain: IAutoMoviePlantingDomain): { x: number; y: number; z: number } => {
  const child: IAutoMoviePlantingBranch = growPlanting(domain).branches[1];
  const length: number = Math.sqrt(
    (child.end.x - child.start.x) ** 2 +
      (child.end.y - child.start.y) ** 2 +
      (child.end.z - child.start.z) ** 2,
  );
  return {
    x: (child.end.x - child.start.x) / length,
    y: (child.end.y - child.start.y) / length,
    z: (child.end.z - child.start.z) / length,
  };
};

/** Verify authored child directions, signed parent-frame branches, vertical bias and seeded spread from emitted branch geometry.
 *
 * Scenarios:
 *
 * 1. Off a vertical trunk the authored `(1, 0, 0)` is exactly world `+x`, and `(1,
 *    1, 0)` is exactly `(1, 1, 0)/√2`: the frame is the identity in the
 *    ordinary case rather than an arbitrary rotation of it.
 * 2. Off a trunk pointing along `−z` — the branch of the frame construction the
 *    vertical case never reaches — the same authored direction lands at its
 *    hand-computed world position.
 * 3. Full positive gravitropism drives the authored +X child to `(0, −1, 0)`,
 *    and full negative drives it to `(0, 1, 0)`, within the vector tolerance.
 * 4. A half bias that exactly cancels the authored direction is the degenerate
 *    case: the blend has no length, so the child falls back to its parent's own
 *    axis rather than to a division by zero.
 * 5. Seeded spread moves the direction off the authored one and stays
 *    deterministic, while zero spread leaves it exactly where it was.

 *
 * @evidence contracts/testing.md#behavioral-verification Growth endpoints expose changed perpendicular-frame, bias/fallback or spread ordering while permitting the same authored-direction semantics; zero and nonzero spread distinguish an actual perturbation.
 * @evidence contracts/testing.md#independent-expectations Unit and diagonal +X/+Y directions, a -Z parent with hand-authored endpoint, and full up/down bias provide geometric expectations independent of the growth helper. Local repeat equality verifies replay only for this witness.
 * @evidence contracts/testing.md#distinguishing-cases Preserve vertical/-Z parent cases, diagonal direction, both full bias signs, exactly cancelling blend fallback and seeded/zero spread; leaf roll and member yaw are covered by foliage/arrangement owners.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit discovered as test_planting_direction_frame; fixture records and growth output own all assertions without an installed planting viewer or mock geometry builder.
 */
export function test_planting_direction_frame(): void {
  TestValidator.equals(
    "an authored direction is read in the parent's own frame",
    namedFacts([
      [
        "axial",
        (): boolean => vclose(childAxis(oriented({})), { x: 1, y: 0, z: 0 }),
      ],
      [
        "diagonal",
        (): boolean =>
          vclose(childAxis(oriented({ direction: { x: 1, y: 1, z: 0 } })), {
            x: Math.SQRT1_2,
            y: Math.SQRT1_2,
            z: 0,
          }),
      ],
    ]),
    { axial: true, diagonal: true },
  );

  const lying: IAutoMoviePlantingState = growPlanting(
    oriented({ axis: { x: 0, y: 0, z: -1 } }),
  );
  TestValidator.equals(
    "a trunk along −z takes the other branch of the frame construction",
    namedFacts([
      [
        "trunk",
        (): boolean => vclose(lying.branches[0].end, { x: 0, y: 0, z: -1 }),
      ],
      [
        "childBase",
        (): boolean => vclose(lying.branches[1].start, { x: 0, y: 0, z: -0.5 }),
      ],
      [
        "childTip",
        (): boolean => vclose(lying.branches[1].end, { x: 0.5, y: 0, z: -0.5 }),
      ],
    ]),
    { trunk: true, childBase: true, childTip: true },
  );

  TestValidator.equals(
    "a full vertical bias overrides whatever was authored",
    namedFacts([
      [
        "droop",
        (): boolean =>
          vclose(childAxis(oriented({ gravitropism: 1 })), {
            x: 0,
            y: -1,
            z: 0,
          }),
      ],
      [
        "lift",
        (): boolean =>
          vclose(childAxis(oriented({ gravitropism: -1 })), {
            x: 0,
            y: 1,
            z: 0,
          }),
      ],
    ]),
    { droop: true, lift: true },
  );

  TestValidator.equals(
    "an exactly cancelling bias falls back to the parent's axis",
    vclose(
      childAxis(
        oriented({ direction: { x: 0, y: 1, z: 0 }, gravitropism: 0.5 }),
      ),
      { x: 0, y: 1, z: 0 },
    ),
    true,
  );

  const spread: IAutoMoviePlantingDomain = oriented({ directionJitter: 0.5 });
  TestValidator.equals(
    "seeded spread moves the direction and stays deterministic",
    namedFacts([
      [
        "moved",
        (): boolean =>
          vclose(childAxis(spread), { x: 1, y: 0, z: 0 }, 1e-3) === false,
      ],
      [
        "stable",
        (): boolean => {
          const first: { x: number; y: number; z: number } = childAxis(spread);
          const second: { x: number; y: number; z: number } = childAxis(
            oriented({ directionJitter: 0.5 }),
          );
          return (
            Object.is(first.x, second.x) &&
            Object.is(first.y, second.y) &&
            Object.is(first.z, second.z)
          );
        },
      ],
      [
        "unspread",
        (): boolean => vclose(childAxis(oriented({})), { x: 1, y: 0, z: 0 }),
      ],
    ]),
    { moved: true, stable: true, unspread: true },
  );
}
