import { AutoMoviePhysicalInertiaTensor } from "@automovie/engine";
import type { IAutoMovieCombinePhysicalMassProperties } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../internal/PhysicalTolerance";
import { nclose } from "../../internal/nclose";

/**
 * An operation-local inertia reader reuses only a part's unchanged intrinsic
 * tensor while every mass and parallel-axis displacement stays current.
 *
 * Scenarios:
 *
 * 1. A 2 kg part with moments (1,2,4) at (1,2,3) gives the literal parallel-axis
 *    tensor about the origin. Rotating Z90 exchanges X/Y moments; changing one
 *    moment afterward changes its rotated component.
 * 2. Changing only mass, then centre, then reference point changes the translation
 *    term. Earlier output rows and caller-mutated rows remain independently
 *    owned across all those same-record edits.
 * 3. Adding a point mass, emptying the assembly and restoring it gives the current
 *    sum without retaining any removed part's contribution.
 * 4. An owned positive X-moment accessor changes2→100 across observations. Each
 *    tensor must use its actual captured scalar for both its key and
 *    arithmetic: the first diagonalXX is2, the next100, and old rows stay2.
 */
export function test_engine_physics_physical_inertia_tensor(): void {
  const part: IAutoMovieCombinePhysicalMassProperties.IPart = {
    mass: 2,
    centerOfMass: { x: 1, y: 2, z: 3 },
    inertia: { x: 1, y: 2, z: 4 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const parts: IAutoMovieCombinePhysicalMassProperties.IPart[] = [part];
  const read: ReturnType<typeof AutoMoviePhysicalInertiaTensor.prepare> =
    AutoMoviePhysicalInertiaTensor.prepare();
  const origin: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 };
  const first: number[][] = read(parts, origin);
  tensor("initial physical tensor", first, [
    [27, -4, -6],
    [-4, 22, -12],
    [-6, -12, 14],
  ]);
  part.inertiaRotation.z = Math.SQRT1_2;
  part.inertiaRotation.w = Math.SQRT1_2;
  tensor("changed principal rotation", read(parts, origin), [
    [28, -4, -6],
    [-4, 21, -12],
    [-6, -12, 14],
  ]);
  part.inertia.x = 3;
  tensor("changed moment under a warmed principal frame", read(parts, origin), [
    [28, -4, -6],
    [-4, 23, -12],
    [-6, -12, 14],
  ]);
  part.mass = 4;
  tensor("changed mass without intrinsic change", read(parts, origin), [
    [54, -8, -12],
    [-8, 43, -24],
    [-12, -24, 24],
  ]);
  part.centerOfMass.y = 0;
  part.centerOfMass.z = 0;
  const current: number[][] = read(parts, origin);
  tensor("changed centre without intrinsic change", current, [
    [2, 0, 0],
    [0, 7, 0],
    [0, 0, 8],
  ]);
  tensor(
    "changed reference point keeps positive xy shift",
    read(parts, { x: 0, y: 1, z: 0 }),
    [
      [6, 4, 0],
      [4, 7, 0],
      [0, 0, 12],
    ],
  );
  tensor("earlier tensor retains its actual original values", first, [
    [27, -4, -6],
    [-4, 22, -12],
    [-6, -12, 14],
  ]);
  first[0]![0] = 123;
  first[1] = [456, 789, 111];
  const replay: number[][] = read(parts, origin);
  tensor("caller row mutation cannot poison replay", replay, [
    [2, 0, 0],
    [0, 7, 0],
    [0, 0, 8],
  ]);
  TestValidator.predicate(
    "fresh tensor and nested rows retain caller ownership",
    replay !== current &&
      replay[0] !== current[0] &&
      replay[1] !== current[1] &&
      replay[2] !== current[2] &&
      nclose(first[0]![0]!, 123, 0) &&
      nclose(first[1]![0]!, 456, 0),
  );
  parts.push({
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 2 },
    inertia: { x: 0, y: 0, z: 0 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  tensor("second point mass contributes only its shift", read(parts, origin), [
    [6, 0, 0],
    [0, 11, 0],
    [0, 0, 8],
  ]);
  parts.length = 0;
  tensor("empty assembly has zero tensor", read(parts, origin), [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]);
  parts.push(part);
  tensor(
    "restored singleton excludes removed point mass",
    read(parts, origin),
    [
      [2, 0, 0],
      [0, 7, 0],
      [0, 0, 8],
    ],
  );
  let moment: number = 2;
  const capturedPart: IAutoMovieCombinePhysicalMassProperties.IPart = {
    mass: 1,
    centerOfMass: { x: 0, y: 0, z: 0 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
    inertia: {
      get x(): number {
        const value: number = moment;
        moment = 100;
        return value;
      },
      y: 3,
      z: 4,
    },
  };
  const captured: ReturnType<typeof AutoMoviePhysicalInertiaTensor.prepare> =
    AutoMoviePhysicalInertiaTensor.prepare();
  const earlier: number[][] = captured([capturedPart], origin);
  tensor(
    "first captured positive moment drives the actual first tensor",
    earlier,
    [
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 4],
    ],
  );
  tensor(
    "next actual moment replaces only its current intrinsic component",
    captured([capturedPart], origin),
    [
      [100, 0, 0],
      [0, 3, 0],
      [0, 0, 4],
    ],
  );
  tensor(
    "later accessor capture leaves the earlier issued tensor unchanged",
    earlier,
    [
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 4],
    ],
  );
}

/**
 * Compare all nine independently expected physical entries without symmetry
 * assumptions.
 */
function tensor(
  label: string,
  actual: readonly (readonly number[])[],
  expected: readonly (readonly number[])[],
): void {
  TestValidator.predicate(
    label,
    actual.length === 3 &&
      actual.every(
        (row: readonly number[], i: number): boolean =>
          row.length === 3 &&
          row.every((value: number, j: number): boolean =>
            nclose(value, expected[i]![j]!, PhysicalTolerance.ROUNDING),
          ),
      ),
  );
}
