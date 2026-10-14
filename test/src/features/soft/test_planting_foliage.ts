import { growPlanting } from "@automovie/engine";
import type {
  IAutoMoviePlantingFoliage,
  IAutoMoviePlantingState,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, qunit, vclose } from "../internal/predicates";
import { plantingRecipe } from "../internal/softFixtures";

/** The same recipe wearing one foliage rule. */
const leafed: (
  foliage: IAutoMoviePlantingFoliage | null,
  axis?: IAutoMovieVector3,
) => IAutoMoviePlantingState = (
  foliage: IAutoMoviePlantingFoliage | null,
  axis: IAutoMovieVector3 = { x: 0, y: 1, z: 0 },
): IAutoMoviePlantingState =>
  growPlanting(
    plantingRecipe({
      structure: { ...plantingRecipe().structure, axis },
      foliage,
    }),
  );

const PLAIN: IAutoMoviePlantingFoliage = {
  density: 4,
  minLevel: 1,
  size: { x: 0.05, y: 0.1, z: 0.05 },
  scaleJitter: 0,
  rollJitter: 0,
};

/**
 * Leaves are emitted as lossless full-TRS instance occurrences placed by a
 * density rule, not as a mesh the derivation bakes.
 *
 * The full transform is the point. GPU instancing consumes translation, a unit
 * quaternion and a per-axis scale, and anything the derivation reduced on the
 * way out — a yaw, one uniform number — would be a fact about the plant nobody
 * authored and nothing could recover.
 *
 * Every figure is hand-computable. A branch of length `L` bears `⌊density·L⌋`
 * leaves at parameters `(k + ½)/n` along it, so the first-order branch of
 * length `0.5` under `density = 4` bears two, the first at `0.25` of its
 * length: `(0, 0.5, 0) + (1, 1, 0)/√2 · 0.125`. The blade's own `+y` is carried
 * onto the branch axis by the shortest arc, which off a `45°` branch is exactly
 * the quaternion `(0, 0, −sin 22.5°, cos 22.5°)`.
 *
 * @evidence contracts/testing.md#behavioral-verification Derives foliage-free, ordinary, trunk-bearing, inverted and jittered plants; counts, branch references, hand-computed TRS and unit rotations expose missing or misoriented blades.
 * @evidence contracts/testing.md#independent-expectations Floor-density counts, a quarter-branch offset and a half-angle quaternion derive from the authored geometry, with nclose/vclose/qunit tolerances; the inverted scalar additionally preserves Object.is positive-zero identity.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent foliage, minimum-level gating, equal X/Z versus taller Y, an antiparallel axis and scale/roll variation; only Y-scale bounds are checked, and pruning, caps and cross-host replay belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership This discoverable named export runs portable growth semantics directly, owns all six scenarios and registers no host, GPU or dynamic cases.
 *
 * Scenarios:
 *
 * 1. A recipe with no foliage rule bears no leaves at all, and one with a rule
 *    bears exactly `⌊density·length⌋` per bearing branch.
 * 2. `minLevel` gates which branches bear: the trunk is bare while its children
 *    are not, and lowering the gate puts leaves on the trunk.
 * 3. The first leaf sits at its hand-computed position, carries the exact
 *    shortest-arc rotation onto its branch, and is scaled by the authored
 *    per-axis prototype size with equal X/Z and a distinct Y.
 * 4. Every emitted rotation is a unit quaternion, and every leaf names the branch
 *    that bears it.
 * 5. A trunk pointing exactly opposite the blade's own `+y` is the degenerate case
 *    where every perpendicular axis is a shortest arc; the derivation states
 *    its choice — a half turn about `+x` — instead of normalizing a zero.
 * 6. Seeded scale and roll vary the blades, Y scale stays within its declared
 *    jitter, and the rotations stay unit length.
 */
export function test_planting_foliage(): void {
  const bare: IAutoMoviePlantingState = leafed(null);
  const plain: IAutoMoviePlantingState = leafed(PLAIN);
  TestValidator.equals(
    "a density rule bears exactly the floor of density times length",
    namedFacts([
      ["bare", () => bare.leaves.length === 0],
      ["total", () => plain.leaves.length === 8],
      [
        "firstOrder",
        () =>
          plain.leaves.filter(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              leaf.branch === "trunk/a",
          ).length === 2,
      ],
      [
        "secondOrder",
        () =>
          plain.leaves.filter(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              leaf.branch === "trunk/a/a",
          ).length === 1,
      ],
    ]),
    { bare: true, total: true, firstOrder: true, secondOrder: true },
  );

  const lowered: IAutoMoviePlantingState = leafed({ ...PLAIN, minLevel: 0 });
  TestValidator.equals(
    "minLevel gates which branches bear",
    namedFacts([
      [
        "trunkBare",
        () =>
          plain.leaves.every(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              leaf.branch !== "trunk",
          ),
      ],
      [
        "trunkBears",
        () =>
          lowered.leaves.filter(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              leaf.branch === "trunk",
          ).length === 4,
      ],
    ]),
    { trunkBare: true, trunkBears: true },
  );

  const first: IAutoMoviePlantingState["leaves"][number] = plain.leaves[0];
  const step: number = 0.125 / Math.SQRT2;
  const halfTurn: number = Math.sqrt((1 - Math.SQRT1_2) / 2);
  TestValidator.equals(
    "a leaf carries a lossless full transform onto its branch",
    namedFacts([
      ["branch", () => first.branch === "trunk/a"],
      ["id", () => first.id === "trunk/a:leaf#0"],
      [
        "translation",
        () => vclose(first.translation, { x: step, y: 0.5 + step, z: 0 }),
      ],
      ["rotationX", () => nclose(first.rotation.x, 0)],
      ["rotationY", () => nclose(first.rotation.y, 0)],
      ["rotationZ", () => nclose(first.rotation.z, -halfTurn)],
      [
        "rotationW",
        () => nclose(first.rotation.w, Math.sqrt((1 + Math.SQRT1_2) / 2)),
      ],
      ["scale", () => vclose(first.scale, { x: 0.05, y: 0.1, z: 0.05 })],
      [
        "perAxis",
        () =>
          first.scale.x !== first.scale.y && first.scale.z !== first.scale.y,
      ],
    ]),
    {
      branch: true,
      id: true,
      translation: true,
      rotationX: true,
      rotationY: true,
      rotationZ: true,
      rotationW: true,
      scale: true,
      perAxis: true,
    },
  );

  TestValidator.equals(
    "every emitted rotation is a unit quaternion",
    namedFacts([
      [
        "plain",
        () =>
          plain.leaves.every(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              qunit(leaf.rotation),
          ),
      ],
      [
        "named",
        () =>
          plain.leaves.every(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              plain.branches.some(
                (
                  branch: IAutoMoviePlantingState["branches"][number],
                ): boolean => branch.id === leaf.branch,
              ),
          ),
      ],
    ]),
    { plain: true, named: true },
  );

  const inverted: IAutoMoviePlantingState = leafed(
    { ...PLAIN, minLevel: 0 },
    { x: 0, y: -1, z: 0 },
  );
  const trunkLeaf: IAutoMoviePlantingState["leaves"][number] =
    inverted.leaves.filter(
      (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
        leaf.branch === "trunk",
    )[0];
  TestValidator.equals(
    "an exactly antiparallel branch takes the stated half turn",
    namedFacts([
      [
        "rotation",
        () =>
          vclose(
            {
              x: trunkLeaf.rotation.x,
              y: trunkLeaf.rotation.y,
              z: trunkLeaf.rotation.z,
            },
            { x: 1, y: 0, z: 0 },
          ),
      ],
      ["w", () => Object.is(trunkLeaf.rotation.w, 0)],
      ["unit", () => qunit(trunkLeaf.rotation)],
    ]),
    { rotation: true, w: true, unit: true },
  );

  const varied: IAutoMoviePlantingState = leafed({
    ...PLAIN,
    scaleJitter: 0.5,
    rollJitter: 1,
  });
  TestValidator.equals(
    "seeded scale and roll vary the blades inside their declared jitter",
    namedFacts([
      [
        "scaleVaries",
        () =>
          new Set(
            varied.leaves.map(
              (leaf: IAutoMoviePlantingState["leaves"][number]): number =>
                leaf.scale.y,
            ),
          ).size > 1,
      ],
      [
        "scaleBounded",
        () =>
          varied.leaves.every(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              leaf.scale.y >= 0.05 && leaf.scale.y <= 0.15,
          ),
      ],
      [
        "rollVaries",
        () =>
          new Set(
            varied.leaves.map(
              (leaf: IAutoMoviePlantingState["leaves"][number]): number =>
                leaf.rotation.w,
            ),
          ).size > 1,
      ],
      [
        "unit",
        () =>
          varied.leaves.every(
            (leaf: IAutoMoviePlantingState["leaves"][number]): boolean =>
              qunit(leaf.rotation),
          ),
      ],
    ]),
    {
      scaleVaries: true,
      scaleBounded: true,
      rollVaries: true,
      unit: true,
    },
  );
}
