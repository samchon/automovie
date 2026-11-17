import {
  type IAutoMovieResolvedBone,
  physicalInertiaTensor,
  prepareAutoMovieMassModel as M,
  type resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

/**
 * An explicitly owned mass preparation snapshots bone-local SI quantities
 * while recomputing from the actual changing bone frames.
 *
 * Scenarios:
 * 1. Masses 2 and 1 at (1,0,0) and (-1,2,0) have centre (1/3,2/3,0).
 *    Principal-frame rotations and the parallel-axis theorem independently
 *    give the complete symmetric inertia tensor about that centre.
 * 2. Caller edits to source mass, local centre, inertia and principal axes
 *    cannot alter that preparation. Mutating any returned nested data also
 *    leaves later centre/parts reads intact, including a prior centre-only read.
 * 3. Mutating a posed bone in place changes the actual centre. A common
 *    translation over 0.5 seconds has momentum M times displacement/time
 *    and zero angular momentum about the centre, without retained endpoints.
 * 4. Returned demand sets are independent. Missing posed bones refuse;
 *    repeated release is harmless and every later query refuses.
 * 5. An owned local-point accessor first supplies1 and changes its later
 *    value toNaN. The factory must validate and retain the captured numeric
 *    snapshot, keeping finite COM(1,2,3) and literal diagonal inertia(2,3,4).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States kilogram/metre/second frames, snapshot versus live-bone ownership, hand-derived centre/inertia/momentum and released-token behavior across five scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises public prepare/bones/place/pose/inertia/between/release against owned models, bone maps and outputs. It checks all tensor entries, actual momenta, changed-frame invalidation, fresh nested outputs, captured-accessor admission/retention, missing frames and every released reader.
 * @evidence contracts/development/testing.md#independent-expectations Weighted means fix the two point centres. Z90 times X90 permutes principal moments to (1.5,0.5,1); the parallel-axis sum gives diagonal (31/6,31/6,28/3) and xy=8/3. Uniform translation gives velocity (2,-4,1), linear momentum (6,-12,3) and zero angular momentum. A single unit-mass segment at captured local(1,2,3) in an identity bone frame has that same COM and unchanged diagonal inertia(2,3,4). Later accessor values cannot replace that already captured admitted value. No cached or unprepared output supplies those physical expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers centre-only before parts, nonidentity principal axes, later source and output edits, same-object bone mutation, independently posed endpoints, missing bones, returned-set mutation, source accessor capture-before-admission and every released reader. Arbitrary biomechanical populations and airborne integration acceptance remain in their existing physical specifications.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable numerical unit owns its complete two-segment and accessor singleton models and all maps. It starts no renderer or process and changes no shared Human profile, tolerance, foreign method or global; preparation releases in finally.
 */
export function test_motion_prepared_model_contracts(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const source: resolveAutoMovieCenterOfMass.IModel = {
    mass: 3,
    segments: [
      { bone: "hips", mass: 2, point: { x: 1, y: 0, z: 0 },
        inertia: { x: 1, y: 2, z: 3 }, axes: { ...identity } },
      { bone: "chest", mass: 1, point: { x: 0, y: 1, z: 0 },
        inertia: { x: 0.5, y: 1, z: 1.5 },
        axes: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 } },
    ],
  };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
    ["hips", bone("hips", { x: 0, y: 0, z: 0 }, identity)],
    ["chest", bone("chest", { x: 0, y: 2, z: 0 },
      { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 })],
  ]);
  const prepared: M.IPrepared = M(source);
  try {
    TestValidator.predicate("centre-only demand has the physical mean",
      vclose(M.place(prepared, bones), { x: 1 / 3, y: 2 / 3, z: 0 }, 1e-12),
    );
    const first: resolveAutoMovieMomentum.IPosed = M.pose(prepared, bones);
    TestValidator.predicate("parts preserve segment order and centres",
      first.parts.length === 2 && first.parts[0]!.mass === 2 &&
      first.parts[1]!.mass === 1 &&
      vclose(first.parts[0]!.centerOfMass, { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(first.parts[1]!.centerOfMass, { x: -1, y: 2, z: 0 }, 1e-12) &&
      qclose(first.parts[1]!.inertiaRotation, { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }, 1e-12),
    );
    const tensor: number[][] = physicalInertiaTensor(first.parts, first.centre);
    const expected: readonly (readonly number[])[] = [
      [31 / 6, 8 / 3, 0], [8 / 3, 31 / 6, 0], [0, 0, 28 / 3],
    ];
    const ownedTensor: number[][] = M.inertia(prepared, first);
    TestValidator.predicate("rotated principal frames and parallel axes remain physical",
      [tensor, ownedTensor].every((value: number[][]): boolean =>
        value.every((row: number[], i: number): boolean =>
          row.every((entry: number, j: number): boolean =>
            nclose(entry, expected[i]![j]!, 1e-12)))),
    );
    ownedTensor[0]![0] = 999;

    source.mass = 999;
    source.segments[0]!.mass = 900;
    source.segments[0]!.point.x = 77;
    source.segments[0]!.inertia.y = 88;
    source.segments[1]!.axes.w = 0;
    first.centre.x = 111;
    first.parts[0]!.centerOfMass.x = 222;
    first.parts[0]!.inertia.y = 333;
    first.parts[1]!.inertiaRotation.w = 444;
    const intact: resolveAutoMovieMomentum.IPosed = M.pose(prepared, bones);
    const replayTensor: number[][] = M.inertia(prepared, intact);
    TestValidator.predicate("source and output edits cannot poison the snapshot",
      vclose(intact.centre, { x: 1 / 3, y: 2 / 3, z: 0 }, 1e-12) &&
      intact.parts[0]!.mass === 2 &&
      vclose(intact.parts[0]!.centerOfMass, { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(intact.parts[0]!.inertia, { x: 1, y: 2, z: 3 }, 1e-12) &&
      qclose(intact.parts[1]!.inertiaRotation, { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }, 1e-12) &&
      first.centre.x === 111 && first.parts[0]!.centerOfMass.x === 222 &&
      first.parts[0]!.inertia.y === 333 && first.parts[1]!.inertiaRotation.w === 444,
    );
    TestValidator.predicate("prepared tensor output mutation cannot poison a later tensor",
      replayTensor !== ownedTensor && replayTensor[0] !== ownedTensor[0] &&
      ownedTensor[0]![0] === 999 &&
      replayTensor.every((row: number[], i: number): boolean =>
        row.every((value: number, j: number): boolean =>
          nclose(value, expected[i]![j]!, 1e-12))),
    );
    TestValidator.predicate("nested result records are fresh",
      intact !== first && intact.centre !== first.centre &&
      intact.parts[0] !== first.parts[0] &&
      intact.parts[0]!.centerOfMass !== first.parts[0]!.centerOfMass &&
      intact.parts[0]!.inertia !== first.parts[0]!.inertia &&
      intact.parts[1]!.inertiaRotation !== first.parts[1]!.inertiaRotation,
    );

    bones.get("hips")!.worldPosition.x = 3;
    TestValidator.predicate("same bone identity admits changed coordinates",
      vclose(M.place(prepared, bones), { x: 7 / 3, y: 2 / 3, z: 0 }, 1e-12),
    );
    bones.get("hips")!.worldPosition.x = 0;
    const before: resolveAutoMovieMomentum.IPosed = M.pose(prepared, bones);
    for (const value of bones.values()) {
      value.worldPosition.x += 1;
      value.worldPosition.y -= 2;
      value.worldPosition.z += 0.5;
    }
    const after: resolveAutoMovieMomentum.IPosed = M.pose(prepared, bones);
    const momentum: resolveAutoMovieMomentum.IMomentum = M.between(prepared, before, after, 0.5);
    TestValidator.predicate("uniform translation retains physical momentum",
      vclose(momentum.velocity, { x: 2, y: -4, z: 1 }, 1e-12) &&
      vclose(momentum.linear, { x: 6, y: -12, z: 3 }, 1e-12) &&
      vclose(momentum.angular, { x: 0, y: 0, z: 0 }, 1e-12),
    );
    TestValidator.predicate("later frames leave endpoint snapshots unchanged",
      vclose(before.centre, { x: 1 / 3, y: 2 / 3, z: 0 }, 1e-12) &&
      vclose(after.centre, { x: 4 / 3, y: -4 / 3, z: 0.5 }, 1e-12),
    );
    const demanded: Set<AutoMovieHumanoidBone> = M.bones(prepared) as Set<AutoMovieHumanoidBone>;
    demanded.clear();
    TestValidator.equals("returned demand sets do not alter the model",
      Array.from(M.bones(prepared)), ["hips", "chest"],
    );
    bones.delete("chest");
    TestValidator.predicate("a cached segment still requires its current posed bone",
      throwsError((): resolveAutoMovieMomentum.IPosed => M.pose(prepared, bones), "chest"),
    );
    M.release(prepared);
    M.release(prepared);
    for (const read of [
      (): unknown => M.bones(prepared),
      (): unknown => M.place(prepared, bones),
      (): unknown => M.pose(prepared, bones),
      (): unknown => M.inertia(prepared, before),
      (): unknown => M.between(prepared, before, after, 0.5),
    ]) TestValidator.predicate("released mass preparation refuses every query",
      throwsError(read, "released"),
    );
  } finally {
    M.release(prepared);
  }
  capturedAccessor();
}

/** Supply an owned common-frame bone with independent nested records. */
function bone(
  name: AutoMovieHumanoidBone,
  position: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion,
): IAutoMovieResolvedBone {
  return { bone: name, localRotation: { ...rotation },
    worldPosition: { ...position }, worldRotation: { ...rotation } };
}

/** Validate the same captured numerical point that subsequent physical queries consume. */
function capturedAccessor(): void {
  let current: number = 1;
  const point: IAutoMovieVector3 = {
    get x(): number { const captured: number = current; current = NaN; return captured; }, y: 2, z: 3,
  };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const model: resolveAutoMovieCenterOfMass.IModel = { mass: 1, segments: [
    { bone: "hips", mass: 1, point, inertia: { x: 2, y: 3, z: 4 }, axes: identity },
  ] };
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
    ["hips", bone("hips", { x: 0, y: 0, z: 0 }, identity)],
  ]);
  const prepared: M.IPrepared = M(model);
  try {
    const posed: resolveAutoMovieMomentum.IPosed = M.pose(prepared, bones);
    const tensor: number[][] = M.inertia(prepared, posed);
    TestValidator.predicate("physical reads consume the actual admitted copy rather than a later raw accessor value",
      Number.isNaN(point.x) && vclose(M.place(prepared, bones), { x: 1, y: 2, z: 3 }, 1e-12) &&
      vclose(posed.centre, { x: 1, y: 2, z: 3 }, 1e-12) &&
      vclose(posed.parts[0]!.centerOfMass, { x: 1, y: 2, z: 3 }, 1e-12) &&
      tensor.every((row: number[], i: number): boolean => row.every((value: number, j: number): boolean =>
        nclose(value, i === j ? i + 2 : 0, 1e-12))));
  } finally { M.release(prepared); }
}
