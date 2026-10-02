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
 * @evidence contracts/common.md#principled-implementation It pauses after each build and crossing read, scans whole-degree elevations from low to high with both arms in one build, keeps an arm's first clean angle and then rebuilds the final pair with cross-arm crossings restored, refusing a combination that adds a crossing. Pausing the generator changes no result, so a caller that stops iterating when a later request supersedes the solve leaves no partial state.
 * @evidence contracts/common.md#clear-and-simple-design One generator owns the search and its state; the synchronous solver only drains it, and the partition into segments comes from the segmenter that the worker may share.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No angle or contact is typed or hidden; the baseline contact at the rest goals is the only allowance and is read from the document's own skin.
 * @evidence contracts/common.md#meaningful-documentation States the scan order and why bisection is unsound, how the worker shares its partition, and how a responsive caller drives and abandons the steps.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no morph channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits shoulder goals and pose rows and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Elevations are whole degrees in the thorax-tt shoulder coordinates and crossings are read on the builder's rest-frame meshes; no unit or frame is converted here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary; it reads crossings between existing segments.
 * @evidence contracts/anatomy.md#parametric-authority It yields document pose data for named joints from the document's own skin; no input addresses a vertex or surface.
 */
export function* stepHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
  segment: ReturnType<
    typeof createHumanBodySegmenter
  > = createHumanBodySegmenter(basis),
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
