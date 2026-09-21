/**
 * The arithmetic of the pose corrective generator: the axis groups and their
 * sample angles, the per-pair tissue budget, the posed-frame skinning both
 * ways (linear blend, and the rigid blend whose difference is the volume the
 * linear blend loses), the crossing solve, the carry of a posed displacement
 * back to the rest frame, and the candidate basis that carries one more
 * corrective.
 */
import { Quaternion } from "@automovie/engine";
import {
  type IAutoMovieHumanBodyBasis,
  type createHumanBodyBasisBuilder,
  evaluateHumanBodyShape,
  humanBodyBasisWeights,
  skinHumanBodySurface,
} from "@automovie/human";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type IFoldPlane,
  type IPushTrace,
  type PushRule,
  crossedVertices,
  pushApart,
} from "./pushApart";

/** Sweeps over a state's pairs before the solve is handed to verification. */
const SWEEPS = 4;
/**
 * The most a rest row may exceed the posed displacement it carries; beyond
 * it the vertex's blend is too near singular for a row to be worth
 * publishing (a 140 degree knee reaches 2.7).
 */
const AMPLIFICATION = 3;

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
export interface IDocument {
  id: string;
  name: string;
  basis: string;
  shape: Record<string, number>;
  pose: IAutoMovieJointPose[];
}
type Transforms = Map<
  AutoMovieHumanoidBone,
  {
    rest: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
    posed: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion };
  }
>;

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

function matrixOf(q: IAutoMovieQuaternion): number[][] {
  const { x, y, z, w } = q;
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

function invert(m: number[][]): number[][] {
  const [a, b, c] = m[0];
  const [d, e, f] = m[1];
  const [g, h, i] = m[2];
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-6)
    throw new Error(
      "a blended bone rotation collapsed; the pose cannot be carried to rest",
    );
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

/** The closest points of two segments `p0p1` and `q0q1` (Ericson 5.1.9). */
function closestBetweenSegments(
  p0: number[],
  p1: number[],
  q0: number[],
  q1: number[],
): [number[], number[]] {
  const d1 = [0, 1, 2].map((k) => p1[k] - p0[k]);
  const d2 = [0, 1, 2].map((k) => q1[k] - q0[k]);
  const r = [0, 1, 2].map((k) => p0[k] - q0[k]);
  const dot = (x: number[], y: number[]) =>
    x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  let s = 0;
  let t = 0;
  if (a <= 1e-12 && e <= 1e-12) {
    s = 0;
    t = 0;
  } else if (a <= 1e-12) {
    t = clamp(f / e);
  } else {
    const c = dot(d1, r);
    if (e <= 1e-12) s = clamp(-c / a);
    else {
      const b = dot(d1, d2);
      const denominator = a * e - b * b;
      s = denominator !== 0 ? clamp((b * f - c * e) / denominator) : 0;
      t = (b * s + f) / e;
      if (t < 0) {
        t = 0;
        s = clamp(-c / a);
      } else if (t > 1) {
        t = 1;
        s = clamp((b - c) / a);
      }
    }
  }
  return [
    [0, 1, 2].map((k) => p0[k] + d1[k] * s),
    [0, 1, 2].map((k) => q0[k] + d2[k] * t),
  ];
}

/** Area-weighted unit vertex normals of a triangle mesh. */
export function vertexNormals(
  positions: number[],
  indices: number[],
): number[] {
  const normals = new Array<number>(positions.length).fill(0);
  for (let t = 0; t < indices.length; t += 3) {
    const [i, j, k] = [indices[t], indices[t + 1], indices[t + 2]];
    const u = [0, 1, 2].map((c) => positions[j * 3 + c] - positions[i * 3 + c]);
    const v = [0, 1, 2].map((c) => positions[k * 3 + c] - positions[i * 3 + c]);
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    for (const vertex of [i, j, k])
      for (let c = 0; c < 3; c++) normals[vertex * 3 + c] += n[c];
  }
  for (let v = 0; v < normals.length; v += 3) {
    const size = Math.hypot(normals[v], normals[v + 1], normals[v + 2]) || 1;
    for (let c = 0; c < 3; c++) normals[v + c] /= size;
  }
  return normals;
}

/**
 * Rigid (dual quaternion) blend skinning of the same rest surface: each bone's
 * `posed ∘ rest⁻¹` as a unit dual quaternion, blended per vertex by the skin
 * weights in the hemisphere of the first bone, normalized, and applied. It
 * keeps the volume the linear blend loses at a twist or a fold, so its
 * difference from the linear blend is the volume corrective.
 */
function skinRigidly(
  rest: number[],
  skin: IAutoMovieHumanBodyBasis["surfaces"][number]["skin"],
  transforms: Transforms,
): number[] {
  const bones = skin.joints.map((bone) => {
    const transform = transforms.get(bone)!;
    const q = Quaternion.multiply(
      transform.posed.rotation,
      Quaternion.inverse(transform.rest.rotation),
    );
    const m = matrixOf(q);
    const rp = transform.rest.position;
    const pp = transform.posed.position;
    const t = [
      pp.x - (m[0][0] * rp.x + m[0][1] * rp.y + m[0][2] * rp.z),
      pp.y - (m[1][0] * rp.x + m[1][1] * rp.y + m[1][2] * rp.z),
      pp.z - (m[2][0] * rp.x + m[2][1] * rp.y + m[2][2] * rp.z),
    ];
    // dual part = 0.5 * (t as pure quaternion) * q
    const dual = {
      x: 0.5 * (t[0] * q.w + t[1] * q.z - t[2] * q.y),
      y: 0.5 * (-t[0] * q.z + t[1] * q.w + t[2] * q.x),
      z: 0.5 * (t[0] * q.y - t[1] * q.x + t[2] * q.w),
      w: 0.5 * (-t[0] * q.x - t[1] * q.y - t[2] * q.z),
    };
    return { real: q, dual };
  });
  const out = new Array<number>(rest.length);
  for (let v = 0; v < rest.length / 3; v++) {
    const real = { x: 0, y: 0, z: 0, w: 0 };
    const dual = { x: 0, y: 0, z: 0, w: 0 };
    let pivot: IAutoMovieQuaternion | null = null;
    for (let k = 0; k < 4; k++) {
      const weight = skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = bones[skin.boneIndices[v * 4 + k]];
      pivot ??= bone.real;
      const sign =
        pivot.x * bone.real.x +
          pivot.y * bone.real.y +
          pivot.z * bone.real.z +
          pivot.w * bone.real.w <
        0
          ? -1
          : 1;
      for (const key of ["x", "y", "z", "w"] as const) {
        real[key] += sign * weight * bone.real[key];
        dual[key] += sign * weight * bone.dual[key];
      }
    }
    const size = Math.hypot(real.x, real.y, real.z, real.w) || 1;
    for (const key of ["x", "y", "z", "w"] as const) {
      real[key] /= size;
      dual[key] /= size;
    }
    const m = matrixOf(real);
    // translation = 2 * dual * conj(real)
    const t = [
      2 *
        (-dual.w * real.x +
          dual.x * real.w -
          dual.y * real.z +
          dual.z * real.y),
      2 *
        (-dual.w * real.y +
          dual.x * real.z +
          dual.y * real.w -
          dual.z * real.x),
      2 *
        (-dual.w * real.z -
          dual.x * real.y +
          dual.y * real.x +
          dual.z * real.w),
    ];
    const p = [rest[v * 3], rest[v * 3 + 1], rest[v * 3 + 2]];
    for (let r = 0; r < 3; r++)
      out[v * 3 + r] = m[r][0] * p[0] + m[r][1] * p[1] + m[r][2] * p[2] + t[r];
  }
  return out;
}

/** The posed state of one document over a working basis, both skinnings. */
export function poseState(
  working: IAutoMovieHumanBodyBasis,
  build: ReturnType<typeof createHumanBodyBasisBuilder>,
  document: IDocument,
) {
  const surface = working.surfaces[0];
  const built = build(document);
  const transforms: Transforms = new Map(
    built.bones.map((bone) => [
      bone.bone,
      { rest: bone.rest, posed: bone.posed },
    ]),
  );
  const rest = evaluateHumanBodyShape(
    working,
    humanBodyBasisWeights(working, document),
    undefined,
  ).surfaces[0];
  // the per-vertex blend of bone rotations, whose inverse carries a posed
  // displacement back to the rest frame exactly under linear blend skinning
  const blend = (v: number): number[][] => {
    const L = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let k = 0; k < 4; k++) {
      const weight = surface.skin.weights[v * 4 + k];
      if (weight === 0) continue;
      const bone = transforms.get(
        surface.skin.joints[surface.skin.boneIndices[v * 4 + k]],
      )!;
      const m = matrixOf(
        Quaternion.multiply(
          bone.posed.rotation,
          Quaternion.inverse(bone.rest.rotation),
        ),
      );
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) L[r][c] += weight * m[r][c];
    }
    return L;
  };
  // A vertex whose blend is near singular (half its weight on each side of
  // a joint bent toward 180 degrees, where the two rotations cancel) has no
  // rest row: the inverse would be enormous, the row would be exact at this
  // one angle and a spike everywhere else on the ramp, and the displacement
  // itself lies in the direction the linear blend cannot express there. Such
  // vertices are left out, and the verification decides whether what remains
  // still clears the crossing.
  const toRest = (posed: Map<number, number[]>): Map<number, number[]> => {
    const out = new Map<number, number[]>();
    for (const [v, d] of posed) {
      const inverse = invert(blend(v));
      const row = [0, 1, 2].map(
        (r) =>
          inverse[r][0] * d[0] + inverse[r][1] * d[1] + inverse[r][2] * d[2],
      );
      if (
        Math.hypot(row[0], row[1], row[2]) >
        AMPLIFICATION * Math.hypot(d[0], d[1], d[2])
      )
        continue;
      out.set(v, row);
    }
    return out;
  };
  const toPosed = (v: number, d: number[]): number[] => {
    const L = blend(v);
    return [0, 1, 2].map(
      (r) => L[r][0] * d[0] + L[r][1] * d[1] + L[r][2] * d[2],
    );
  };
  // each bone's rest length from its head to its tail landmark, so a bone
  // line can be drawn from the posed head along the posed axis
  const lengths = new Map<AutoMovieHumanoidBone, number>();
  const landmark = (id: string): number[] => {
    const at = working.landmarks.ids.indexOf(id);
    return working.landmarks.positions.slice(at * 3, at * 3 + 3);
  };
  for (const joint of working.joints) {
    const head = landmark(joint.head);
    const tail = landmark(joint.tail);
    lengths.set(
      joint.bone,
      Math.hypot(tail[0] - head[0], tail[1] - head[1], tail[2] - head[2]),
    );
  }
  return {
    surface,
    rest,
    transforms,
    lengths,
    linear: skinHumanBodySurface(rest, surface.skin, transforms),
    rigid: () => skinRigidly(rest, surface.skin, transforms),
    blend,
    toRest,
    toPosed,
  };
}

/**
 * The volume the linear blend loses at this pose, as posed displacements per
 * vertex: rigid minus linear, kept where it exceeds `threshold` metres and,
 * when the pose folds the joint, only outside the fold.
 *
 * The rigid blend restores the round of a knee cap or a twisted forearm that
 * the linear blend flattened, and that is the volume to give back. Inside a
 * fold it does the opposite: it swings the crease out on the arc, into the
 * segment the joint is closing against, where real skin folds in. So the
 * interior of a fold, the half space past the joint along the direction the
 * child bone swung toward, keeps the linear crease and leaves the contact to
 * the crossing solver. A twist swings nothing and has no interior.
 */
export function volumeDisplacement(
  state: ReturnType<typeof poseState>,
  threshold: number,
  fold: { point: number[]; interior: number[] } | null,
): Map<number, number[]> {
  const rigid = state.rigid();
  const out = new Map<number, number[]>();
  for (let v = 0; v < rigid.length / 3; v++) {
    const d = [0, 1, 2].map((k) => rigid[v * 3 + k] - state.linear[v * 3 + k]);
    if (Math.hypot(d[0], d[1], d[2]) < threshold) continue;
    if (
      fold !== null &&
      [0, 1, 2].reduce(
        (total, k) =>
          total + (state.linear[v * 3 + k] - fold.point[k]) * fold.interior[k],
        0,
      ) > 0
    )
      continue;
    out.set(v, d);
  }
  return out;
}

/**
 * The fold a pose makes at a bone: the joint, and the direction the child
 * bone swung toward from its rest direction. Null when the bone has not
 * swung more than a few degrees (a twist, a straightening back toward the
 * anatomical zero), which is when the rigid blend is right everywhere. The
 * rest bend itself is not a fold: the elbow rests at 43 degrees and a
 * pronation of that forearm folds nothing.
 */
export function foldOf(
  state: ReturnType<typeof poseState>,
  bone: AutoMovieHumanoidBone,
  parent: AutoMovieHumanoidBone | null,
): { point: number[]; interior: number[] } | null {
  if (parent === null) return null;
  const own = state.transforms.get(bone)!;
  const axis = (q: IAutoMovieQuaternion): number[] => {
    const m = matrixOf(q);
    return [m[0][1], m[1][1], m[2][1]];
  };
  const child = axis(own.posed.rotation);
  const rest = axis(own.rest.rotation);
  const interior = [0, 1, 2].map((k) => child[k] - rest[k]);
  const size = Math.hypot(interior[0], interior[1], interior[2]);
  if (size < 0.15) return null;
  const head = own.posed.position;
  return {
    point: [head.x, head.y, head.z],
    interior: interior.map((one) => one / size),
  };
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
