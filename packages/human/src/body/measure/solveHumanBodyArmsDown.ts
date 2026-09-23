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
import { segmentHumanBodyModel } from "./segmentHumanBodyModel";

const SIDES = ["left", "right"] as const;

/**
 * Lower both arms to the side of the body it is asked of, as far as that
 * body's own skin lets them hang.
 *
 * Where a relaxed arm comes to rest depends on the body: the width of the
 * chest, belly and hips, the bulk of the arm, sex and mass. A fixed
 * elevation drives a heavy body's forearms through its flanks and leaves a
 * slender one's arms short of its sides, so the preset is solved on the
 * document's own evaluated surface rather than typed. Each arm hangs in the
 * lateral plane (TT plane 0) with no axial rotation and a straight elbow,
 * and its total elevation is bisected between 0 (hanging straight down) and
 * the measured A-pose rest elevation to one degree: the lowest elevation at
 * which no segment of that arm's chain (the upper arm and everything below
 * it) crosses a segment outside the chain more than it does with the arm at
 * the rest elevation. Contact the body already has with the arm raised to
 * its rest is the body's, not the preset's, and is not charged to it. Both
 * arms are solved together, one build per step, each keeping its own
 * bracket, so an asymmetric body gets asymmetric arms.
 *
 * The result is ordinary document data: the document's own pose with each
 * lower arm's flexion set to 0 and each upper arm's TT goal replaced; shape,
 * materials and every other joint are untouched. The caller applies it as
 * one edit. A document the builder refuses at either end of the bracket (a
 * girdle or elbow the preset combines past its range) refuses here with the
 * builder's reason; nothing is clamped. Cost is about eight builds and
 * arm-only crossing reads, which is why the editor runs it off the page.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Gives the Arms down preset a body-specific rest at first skin contact instead of a fixed angle that drives the arms through heavy bodies.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Solves the preset's lateral-plane elevation per arm against the same segment crossing instrument the contact check uses, charging only contact the rest pose lacks.
 */
export function solveHumanBodyArmsDown(
  basis: IAutoMovieHumanBodyBasis,
  build: (
    document: IAutoMovieHumanBodyBasisDocument,
  ) => IAutoMovieHumanBodyBuild,
  document: IAutoMovieHumanBodyBasisDocument,
): Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders"> {
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
  /** Triangles each chain's segments and the rest of the body cross, per outside pair. */
  const contacts = (elevations: number[]): Map<string, number>[] => {
    const parts = segmentHumanBodyModel(
      basis,
      build({ ...document, pose, shoulders: goals(elevations) }),
    ).model.parts.map((part) => ({
      // the partition emits the builder's resident meshes only
      bone: part.id.split("/")[0],
      id: part.id,
      mesh: (part.geometry as { mesh: IAutoMovieMesh }).mesh,
    }));
    return chains.map((chain) => {
      const found = new Map<string, number>();
      for (const own of parts.filter((part) => chain.has(part.bone)))
        for (const other of parts.filter((part) => !chain.has(part.bone))) {
          const crossed = crossings(own.mesh, other.mesh);
          if (crossed > 0) found.set(`${own.id}|${other.id}`, crossed);
        }
      return found;
    });
  };
  const baseline = contacts(rest);
  const clean = (reading: Map<string, number>, k: number): boolean =>
    [...reading].every(
      ([pair, count]) => count <= (baseline[k].get(pair) ?? 0),
    );
  const low = [0, 0];
  const high = [...rest];
  const bottom = contacts(low);
  const solved = [false, false];
  for (const k of [0, 1])
    if (clean(bottom[k], k)) {
      high[k] = 0;
      solved[k] = true;
    }
  while (SIDES.some((_, k) => !solved[k] && high[k] - low[k] > 1)) {
    const middle = SIDES.map((_, k) =>
      solved[k] ? high[k] : (low[k] + high[k]) / 2,
    );
    const reading = contacts(middle);
    for (const k of [0, 1]) {
      if (solved[k]) continue;
      if (clean(reading[k], k)) high[k] = middle[k];
      else low[k] = middle[k];
      if (high[k] - low[k] <= 1) solved[k] = true;
    }
  }
  return { pose, shoulders: goals(high) };
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
