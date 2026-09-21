/**
 * The pose corrective generator's plan and solve: the axis groups and their
 * sample angles, the per-pair tissue budget, the crossing solve that pushes
 * two segments apart against the plane that costs the least (an adjacent
 * pair's bisector or two limbs' contact plane), and the candidate basis
 * that carries one more corrective. The posed state it solves on lives in
 * `poseState.ts`.
 */
import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import {
  closestBetweenSegments,
  matrixOf,
  type poseState,
  vertexNormals,
} from "./poseState";
import {
  type IFoldPlane,
  type IPushTrace,
  type PushRule,
  pushApart,
} from "./pushApart";
import { crossedVertices } from "./pushApartGeometry";

/** Sweeps over a state's pairs before the solve is handed to verification. */
const SWEEPS = 4;

export type Axis = "flexion" | "abduction" | "twist";
export type Side = "positive" | "negative";
export interface IPair {
  part: string;
  other: string;
  triangles: number;
  otherTriangles: number;
}
export interface IGroup {
  bone: AutoMovieHumanoidBone;
  axis: Axis;
  side: Side;
  /** The rest angle of the axis, clinical degrees. */
  neutral: number;
  /** The census sample angles toward this side, clinical degrees, ascending in travel. */
  samples: number[];
}

/**
 * How far a vertex of either segment may move for a pair, in metres, half of
 * the tissue the two surfaces give up together. Fingers and toes are small
 * and get little; a thigh against a thigh or an arm against the chest is
 * fat and muscle on both sides and gets more; the knee fold gets the most,
 * because full knee flexion is where the calf and the hamstrings flatten
 * against each other by centimetres and is what stops the joint. At 140
 * degrees this rig's calf stands 46 mm past the fold plane, more than the
 * 30 or so a real calf gives, which the receipt records against the source
 * pivot rather than hides.
 */
export function budgetOf(a: string, b: string): number {
  const digit = /Thumb|Index|Middle|Ring|Little/;
  const arm = /UpperArm|LowerArm/;
  const torso = /^(chest|upperChest|spine|hips|leftShoulder|rightShoulder)$/;
  const leg = /UpperLeg|LowerLeg|Foot$/;
  if (digit.test(a) || digit.test(b)) return 0.008;
  if (/Toes/.test(a) || /Toes/.test(b)) return 0.01;
  if ((arm.test(a) && torso.test(b)) || (arm.test(b) && torso.test(a)))
    return 0.025;
  if (
    (a.endsWith("UpperLeg") && b.endsWith("LowerLeg")) ||
    (a.endsWith("LowerLeg") && b.endsWith("UpperLeg"))
  )
    return a.slice(0, 4) === b.slice(0, 4) ? 0.05 : 0.025;
  if (leg.test(a) && leg.test(b)) return 0.025;
  // the hip fold: the thigh against the groin at 62 degrees and against the
  // belly beyond 90, where the lower abdomen and the front of the thigh give
  // by centimetres as they do in a squat; the knee fold's figure, because
  // both are a limb folded flat against a soft mass
  if (
    (leg.test(a) && /^(hips|spine|chest|upperChest)$/.test(b)) ||
    (leg.test(b) && /^(hips|spine|chest|upperChest)$/.test(a))
  )
    return 0.05;
  if (arm.test(a) && arm.test(b)) return 0.025;
  return 0.015;
}

/**
 * Every mobile joint axis, each side of its rest, with the census's sample
 * angles on that side (the half and the whole of the range's reach, as the
 * census visited them). A side whose reach is zero has no samples.
 */
export function axisGroups(basis: IAutoMovieHumanBodyBasis): IGroup[] {
  const groups: IGroup[] = [];
  for (const joint of basis.joints) {
    if (joint.constraint === null) continue;
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const range = joint.constraint[axis];
      if (range === null) continue;
      const neutral = joint.neutral[axis];
      for (const side of ["positive", "negative"] as const) {
        // the elbow rests bent, so its extension side reaches 0 at both
        // fractions: one sample, not two
        const samples = [
          ...new Set(
            [0.5, 1].map((fraction) =>
              side === "positive" ? fraction * range.max : fraction * range.min,
            ),
          ),
        ].filter((angle) =>
          side === "positive" ? angle > neutral : angle < neutral,
        );
        if (samples.length === 0) continue;
        groups.push({ bone: joint.bone, axis, side, neutral, samples });
      }
    }
  }
  return groups.sort((a, b) =>
    (a.bone + a.axis + a.side).localeCompare(b.bone + b.axis + b.side),
  );
}
/**
 * Push the crossing pairs of one posed state apart and return the rest-space
 * rows. `previous` rest rows (an earlier pass at the same angle) are carried
 * into the posed frame as the starting displacement; the budget is measured
 * from the linear skin of the working basis, which already wears every
 * accepted corrective including the volume one.
 */
export function solve(
  state: ReturnType<typeof poseState>,
  pairs: IPair[],
  segments: Map<string, number[]>,
  near: Set<number>[],
  parents: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>,
  previous: Map<number, number[]> | null,
  trace: ((pair: string, event: IPushTrace) => void) | null = null,
): {
  rest: Map<number, number[]>;
  posed: Map<number, number[]>;
  rounds: Record<string, { rounds: number[]; rules: PushRule[] }>;
} {
  const base = state.linear;
  const positions = base.slice();
  const posed = new Map<number, number[]>();
  if (previous !== null)
    for (const [v, d] of previous) {
      const dp = state.toPosed(v, d);
      for (let k = 0; k < 3; k++) positions[v * 3 + k] += dp[k];
      posed.set(v, dp);
    }
  const restNormals = vertexNormals(state.rest, state.surface.indices);
  const normals = new Array<number>(state.rest.length).fill(0);
  for (let v = 0; v < state.rest.length / 3; v++) {
    const n = state.toPosed(v, [
      restNormals[v * 3],
      restNormals[v * 3 + 1],
      restNormals[v * 3 + 2],
    ]);
    const size = Math.hypot(n[0], n[1], n[2]) || 1;
    for (let k = 0; k < 3; k++) normals[v * 3 + k] = n[k] / size;
  }
  const rounds: Record<string, { rounds: number[]; rules: PushRule[] }> = {};
  // the fold plane of an adjacent pair: through the child's head, its normal
  // along the sum of the two bone directions, pointing to the `part` side
  const childOf = (part: string, other: string): string | null =>
    parents.get(other as AutoMovieHumanoidBone) === part
      ? other
      : parents.get(part as AutoMovieHumanoidBone) === other
        ? part
        : null;
  const direction = (bone: string): number[] => {
    const m = matrixOf(
      state.transforms.get(bone as AutoMovieHumanoidBone)!.posed.rotation,
    );
    return [m[0][1], m[1][1], m[2][1]];
  };
  // the contact plane of two limbs: perpendicular to the shortest line
  // between their bones, through its midpoint
  const contactPlane = (part: string, other: string): IFoldPlane | null => {
    // Two segments that do not meet at a joint meet as two limbs: the
    // plane between them is perpendicular to the shortest line between
    // their bones (the arm hanging beside the chest, the forearm across
    // the belly, a thigh against the other), through its midpoint. The
    // centroids of the crossing patches, which the solver otherwise uses,
    // nearly coincide when the patches overlap deeply, and the plane they
    // give then cuts along the contact instead of across it.
    const segment = (bone: string): [number[], number[]] => {
      const head = state.transforms.get(bone as AutoMovieHumanoidBone)!.posed
        .position;
      const start = [head.x, head.y, head.z];
      // the bone's own tail, not a child's head: the hips bone runs up the
      // spine while three children hang from its head end
      const length = state.lengths.get(bone as AutoMovieHumanoidBone)!;
      const end = start.map((one, k) => one + length * direction(bone)[k]);
      return [start, end];
    };
    const [p0, p1] = segment(part);
    const [q0, q1] = segment(other);
    const [pA, pB] = closestBetweenSegments(p0, p1, q0, q1);
    const apart = [0, 1, 2].map((k) => pA[k] - pB[k]);
    const size = Math.hypot(apart[0], apart[1], apart[2]);
    if (size < 0.001) return null;
    return {
      point: [0, 1, 2].map((k) => (pA[k] + pB[k]) / 2),
      normal: apart.map((one) => one / size),
    };
  };
  // the fold plane of an adjacent pair: through the child's head, bisecting
  // the two rays that leave the joint
  const bisectorPlane = (part: string, other: string): IFoldPlane | null => {
    const child = childOf(part, other);
    if (child === null) return null;
    const parent = child === part ? other : part;
    const head = state.transforms.get(child as AutoMovieHumanoidBone)!.posed
      .position;
    // The plane bisects the two rays that leave the joint: the child bone
    // and the parent's far end. Along a chain the parent points at the
    // joint, so its far end lies back along its own axis and the normal is
    // the sum of the two directions; the thighs hang from the head end of
    // the hips bone, which points away from them up the spine, so there
    // the far end lies along the axis and the parent's direction flips.
    const parentHead = state.transforms.get(parent as AutoMovieHumanoidBone)!
      .posed.position;
    const chained =
      (head.x - parentHead.x) * direction(parent)[0] +
        (head.y - parentHead.y) * direction(parent)[1] +
        (head.z - parentHead.z) * direction(parent)[2] >
      0;
    const sum = [0, 1, 2].map(
      (k) => direction(child)[k] + (chained ? 1 : -1) * direction(parent)[k],
    );
    const size = Math.hypot(sum[0], sum[1], sum[2]);
    if (size < 0.2) return null;
    const toward = child === part ? 1 : -1;
    return {
      point: [head.x, head.y, head.z],
      normal: sum.map((one) => (toward * one) / size),
    };
  };
  // How much tissue a plane asks the crossing patches to give once it is
  // centred between the deepest of each side: the sum of every crossed
  // vertex's shortfall from its own side. The groin at 62 degrees of hip
  // flexion is not a fold across the bisector; the inner thigh lies against
  // the pubis as two shallow sheets, and the plane that costs the least
  // movement is the one that separates them rather than cuts across them.
  const cost = (plane: IFoldPlane, a: number[], b: number[]): number => {
    const depthOf = (v: number): number =>
      [0, 1, 2].reduce(
        (total, k) =>
          total + (positions[v * 3 + k] - plane.point[k]) * plane.normal[k],
        0,
      );
    const hitA = [...crossedVertices(positions, a, b)];
    const hitB = [...crossedVertices(positions, b, a)];
    if (hitA.length === 0 || hitB.length === 0) return Infinity;
    const shift =
      (Math.min(...hitA.map(depthOf)) + Math.max(...hitB.map(depthOf))) / 2;
    return (
      hitA.reduce((sum, v) => sum + Math.max(0, shift - depthOf(v)), 0) +
      hitB.reduce((sum, v) => sum + Math.max(0, depthOf(v) - shift), 0)
    );
  };
  const foldPlane = (part: string, other: string): IFoldPlane | null => {
    const a = segments.get(part)!;
    const b = segments.get(other)!;
    const candidates = [
      bisectorPlane(part, other),
      contactPlane(part, other),
    ].filter((plane): plane is IFoldPlane => plane !== null);
    if (candidates.length === 0) return null;
    if (process.env.POSE_PLANE_DEBUG)
      console.log(
        "planes",
        part,
        other,
        candidates.map(
          (plane) =>
            plane.point.map((v) => v.toFixed(3)).join(",") +
            " n " +
            plane.normal.map((v) => v.toFixed(2)).join(",") +
            " cost " +
            (cost(plane, a, b) * 1000).toFixed(1),
        ),
      );
    return candidates.reduce((best, plane) =>
      cost(plane, a, b) < cost(best, a, b) ? plane : best,
    );
  };
  // Pairs share the skin, so clearing one can re-cross another (the ring
  // finger folded on the palm and pressed against the middle finger); sweep
  // the pairs until one whole sweep finds nothing left to move.
  // a vertex both segments' triangles touch sides with the bone that owns it
  const dominantOf = (v: number): string => {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (
        state.surface.skin.weights[v * 4 + k] >
        state.surface.skin.weights[v * 4 + best]
      )
        best = k;
    return state.surface.skin.joints[
      state.surface.skin.boneIndices[v * 4 + best]
    ];
  };
  const ownerOf = (part: string, other: string): Map<number, 1 | -1> => {
    const owner = new Map<number, 1 | -1>();
    for (const v of segments.get(other)!)
      owner.set(v, dominantOf(v) === other ? -1 : 1);
    for (const v of segments.get(part)!)
      owner.set(v, dominantOf(v) === other ? -1 : 1);
    return owner;
  };
  let previousLeft = Infinity;
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    let moved = false;
    let left = 0;
    for (const pair of pairs) {
      const result = pushApart(
        positions,
        base,
        base,
        posed,
        near,
        segments.get(pair.part)!,
        segments.get(pair.other)!,
        budgetOf(pair.part, pair.other),
        normals,
        foldPlane(pair.part, pair.other),
        ownerOf(pair.part, pair.other),
        trace === null
          ? null
          : (event) => trace(pair.part + " x " + pair.other, event),
      );
      if (result.rounds[0] > 0) moved = true;
      left += result.rounds[result.rounds.length - 1];
      const key =
        pair.part + " x " + pair.other + (sweep > 0 ? ` #${sweep + 1}` : "");
      rounds[key] = { rounds: result.rounds, rules: result.rules };
    }
    // nothing moved, or the sweep left as many crossing corners as the last
    if (!moved || left >= previousLeft) break;
    previousLeft = left;
  }
  return { rest: state.toRest(posed), posed, rounds };
}

/** A copy of the basis carrying one more corrective and its rest rows. */
export function withCorrective(
  basis: IAutoMovieHumanBodyBasis,
  id: string,
  driver: {
    bone: AutoMovieHumanoidBone;
    axis: Axis;
    side: Side;
    onset: number;
    full: number;
  },
  rest: Map<number, number[]>,
): IAutoMovieHumanBodyBasis {
  const rows: number[] = [];
  for (const v of [...rest.keys()].sort((x, y) => x - y)) {
    const d = rest.get(v)!;
    if (Math.hypot(d[0], d[1], d[2]) < 1e-6) continue;
    rows.push(v, ...d.map((one) => Math.round(one * 1e6) / 1e6));
  }
  const surface = basis.surfaces[0];
  return {
    ...basis,
    correctives: [
      ...(basis.correctives ?? []),
      { id, inputs: [driver], weight: 1, target: id },
    ],
    surfaces: [
      { ...surface, targets: { ...surface.targets, [id]: rows } },
      ...basis.surfaces.slice(1),
    ],
  };
}
