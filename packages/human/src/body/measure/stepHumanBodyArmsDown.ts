import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMesh,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyShoulderPose } from "../structures/IAutoMovieHumanBodyShoulderPose";
import { createHumanBodySegmenter } from "./createHumanBodySegmenter";

const SIDES = ["left", "right"] as const;

/**
 * The arms-down solve (`solveHumanBodyArmsDown`) as a sequence of steps: the
 * generator pauses after each build and crossing read. It walks the allowed
 * whole-degree goals from low to high because contact can disappear and then
 * return as an arm passes different body regions; bisection would skip the
 * first clean interval. One build tests both arms at each degree while
 * omitting their mutual crossings from each first-safe reading; an arm
 * already clear holds its chosen angle. The final pair is built with
 * cross-arm crossings restored before returning it.
 * The resident worker passes its basis-compiled skin partition; a standalone
 * caller compiles that immutable ownership once for this solve.
 *
 * A caller that must stay responsive (the editor's body worker, which
 * evaluates one request at a time) hands its thread back between steps and
 * stops iterating when a later request supersedes the solve; the synchronous
 * function runs every step at once.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets the editor interrupt an arms-down solve a newer edit supersedes instead of holding the body worker for its whole length.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Pauses the preset's lateral-plane search after each crossing read so the worker can yield between steps.
 */
export function* stepHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
  segment: ReturnType<typeof createHumanBodySegmenter> =
    createHumanBodySegmenter(basis),
): Generator<
  undefined,
  Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">,
  undefined
> {
  const parent = new Map(
    basis.joints.map((joint) => [joint.bone, joint.parent]),
  );
  const chainOf = (side: (typeof SIDES)[number]): Set<string> => {
    const root = `${side}UpperArm` as AutoMovieHumanoidBone;
    return new Set(
      basis.joints
        .map((joint) => joint.bone)
        .filter((bone) => {
          let at: AutoMovieHumanoidBone | null | undefined = bone;
          while (at !== null && at !== undefined && at !== root)
            at = parent.get(at);
          return at === root;
        }),
    );
  };
  const chains = SIDES.map(chainOf);
  const rest = SIDES.map((side) => {
    const shoulder = basis.joints.find(
      (joint) => joint.bone === `${side}UpperArm`,
    )?.shoulder;
    if (shoulder === undefined)
      throw new Error("Arms down needs thorax-tt shoulder coordinates.");
    return shoulder.neutral.elevation;
  });
  const pose: IAutoMovieJointPose[] = [
    ...(document.pose ?? []).filter(
      (joint) =>
        joint.bone !== "leftLowerArm" && joint.bone !== "rightLowerArm",
    ),
    ...SIDES.map((side) => ({
      bone: `${side}LowerArm` as AutoMovieHumanoidBone,
      flexion: 0,
      abduction: null,
      twist: null,
    })),
  ];
  const goals = (elevations: number[]): IAutoMovieHumanBodyShoulderPose[] =>
    SIDES.map((side, k) => ({
      bone: `${side}UpperArm` as const,
      plane: 0,
      elevation: elevations[k],
      axialRotation: 0,
    }));
  /** Each chain's self and outside crossings, optionally deferring cross-arm pairs. */
  const contacts = (
    elevations: number[],
    omitOppositeArm = false,
  ): Map<string, number>[] => {
    const parts = segment(
      build({ ...document, pose, shoulders: goals(elevations) }),
    ).model.parts.map((part) => ({
      // the partition emits the builder's resident meshes only
      bone: part.id.split("/")[0],
      id: part.id,
      mesh: (part.geometry as { mesh: IAutoMovieMesh }).mesh,
    }));
    return chains.map((chain, k) => {
      const found = new Map<string, number>();
      for (const own of parts.filter((part) => chain.has(part.bone))) {
        // the chain's own segment folding through itself (the armpit skin
        // the upper arm carries) is contact too
        const folded = measureAutoMovieMeshCrossings(own.mesh, own.mesh).length;
        if (folded > 0) found.set(`${own.id}|${own.id}`, folded);
        for (const other of parts.filter(
          (part) =>
            !chain.has(part.bone) &&
            (!omitOppositeArm || !chains[1 - k].has(part.bone)),
        )) {
          const crossed = crossings(own.mesh, other.mesh);
          if (crossed > 0) found.set(`${own.id}|${other.id}`, crossed);
        }
      }
      return found;
    });
  };
  const baseline = contacts(rest);
  yield;
  const clean = (reading: Map<string, number>, k: number): boolean =>
    [...reading].every(
      ([pair, count]) => count <= (baseline[k].get(pair) ?? 0),
    );
  const solved: (number | null)[] = [null, null];
  for (let elevation = 0; elevation < Math.max(...rest); elevation++) {
    const trial = SIDES.map(
      (_, k) => solved[k] ?? Math.min(elevation, rest[k]),
    );
    const reading = contacts(trial, true);
    yield;
    for (const k of [0, 1])
      if (solved[k] === null && clean(reading[k], k)) solved[k] = trial[k];
    if (solved.every((value) => value !== null)) break;
  }
  const goalsAt = SIDES.map((_, k) => solved[k] ?? rest[k]);
  const combined = contacts(goalsAt);
  yield;
  if (SIDES.some((_, k) => !clean(combined[k], k)))
    throw new Error(
      "Arms down cannot combine both first-safe arm goals without new skin crossings.",
    );
  return { pose, shoulders: goals(goalsAt) };
}

/** Triangles of either mesh the other crosses, after a bounds rejection. */
function crossings(a: IAutoMovieMesh, b: IAutoMovieMesh): number {
  const bounds = (mesh: IAutoMovieMesh) => {
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    for (let at = 0; at < mesh.positions.length; at += 3)
      for (let axis = 0; axis < 3; axis++) {
        low[axis] = Math.min(low[axis], mesh.positions[at + axis]);
        high[axis] = Math.max(high[axis], mesh.positions[at + axis]);
      }
    return { low, high };
  };
  const p = bounds(a);
  const q = bounds(b);
  if (
    [0, 1, 2].some(
      (axis) => p.high[axis] < q.low[axis] || p.low[axis] > q.high[axis],
    )
  )
    return 0;
  return (
    measureAutoMovieMeshCrossings(a, b).length +
    measureAutoMovieMeshCrossings(b, a).length
  );
}
