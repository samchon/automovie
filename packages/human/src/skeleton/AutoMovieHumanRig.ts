import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieMeshSkin,
  IAutoMovieModelPart,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import type { AutoMovieHumanSkeleton } from "./AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * The engine rig of a generated Human, and its skin binding.
 *
 * The Human skeleton has joints the humanoid vocabulary lacks: the scapula, the
 * atlas, the subtalar and midfoot joints and each toe. Each folds into the
 * nearest named bone that carries it, so the rig stays the shared vocabulary
 * while the clinical skeleton keeps its own joints.
 *
 * A vertex's weights are a function of its place alone. Parts are tessellated
 * apart and their seams hold copies of one physical point, so a binding read
 * from a part or a chain would give those copies different weights and open
 * the seam under any pose. Here equal places get equal weights.
 *
 * Influence falls with a point's height over each limb's capsule, the bone's
 * segment thickened by the limb's radius, so a point on a thigh belongs to the
 * thigh however thick the trunk beside it, and a transition is as wide as the
 * limbs that meet there. The left and right sides do not reach across the
 * midline, or a thigh would pull its neighbour.
 */
export namespace AutoMovieHumanRig {
  /** A prepared rig. */
  export interface IRig {
    /** The rig the model carries. */
    skeleton: IAutoMovieSkeleton;

    /**
     * Bind a mesh's vertices.
     *
     * @param positions Vertices in metres, grouped in threes.
     * @param bone Bind every vertex to this bone alone, for a rigid part.
     * @returns Four influences per vertex.
     */
    bind(
      positions: readonly number[],
      bone?: AutoMovieHumanoidBone,
    ): IAutoMovieMeshSkin;
  }

  /** One bone's transform in its parent's frame, metres. */
  export interface ILocal {
    /** Offset from the parent. */
    translation: [number, number, number];

    /** Rotation from the parent, `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /**
   * Prepare the rig of one body.
   *
   * @param calibration The body.
   * @param scale Metres per calibration millimetre.
   * @returns The rig and its binder.
   */
  export function prepare(
    calibration: IAutoMovieHumanBodyCalibration,
    scale: number,
  ): IRig {
    const joints: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    // The scapula's segment lies along the upper arm, so it would hand the arm
    // to the shoulder bone.
    const drawn: AutoMovieHumanJointCentres.IJoint[] = joints.filter(
      (j: AutoMovieHumanJointCentres.IJoint): boolean =>
        !j.bone.endsWith("Scapula"),
    );
    const segments: ISegment[] = drawn.map(
      (j: AutoMovieHumanJointCentres.IJoint): ISegment => ({
        bone: named(j.bone),
        side: j.bone.startsWith("left")
          ? 1
          : j.bone.startsWith("right")
            ? -1
            : 0,
        from: Math3D.times(j.position, scale),
        to: Math3D.times(j.tip ?? j.toward, scale),
        radius: Math.max(j.radius, MINIMUM_RADIUS) * scale,
      }),
    );
    const bones: AutoMovieHumanoidBone[] = [
      ...new Set(joints.map((j): AutoMovieHumanoidBone => named(j.bone))),
    ];
    const place = new Map<AutoMovieHumanoidBone, Vector>();
    const parentOf = new Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null>();
    for (const j of joints) {
      const bone: AutoMovieHumanoidBone = named(j.bone);
      if (place.has(bone)) continue;
      place.set(bone, Math3D.times(j.position, scale));
      parentOf.set(bone, j.parent === null ? null : named(j.parent));
    }
    const byBone = new Map<string, AutoMovieHumanJointCentres.IJoint>(
      joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): [string, AutoMovieHumanJointCentres.IJoint] => [
          j.bone,
          j,
        ],
      ),
    );
    const skeleton: IAutoMovieSkeleton = {
      id: "automovie-human",
      bones: bones.map((bone: AutoMovieHumanoidBone): IAutoMovieBone => {
        const parent: AutoMovieHumanoidBone | null = parentOf.get(bone)!;
        const at: Vector = place.get(bone)!;
        const base: Vector = parent === null ? [0, 0, 0] : place.get(parent)!;
        const own: AutoMovieHumanJointCentres.IJoint = byBone.get(joint(bone))!;
        const axes: Math3D.IAxes = Math3D.boneAxes(
          own.bone,
          Math3D.unit(Math3D.sub(own.toward, own.position)),
          byBone,
        );
        return {
          bone,
          parent,
          axes: {
            flexion: vector(axes.flexion),
            abduction: vector(axes.abduction),
            twist: vector(axes.twist),
            twistPlacement: placement(bone),
          },
          rest: {
            translation: {
              x: at[0] - base[0],
              y: at[1] - base[1],
              z: at[2] - base[2],
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          constraint: null,
        };
      }),
    };
    const index = new Map<AutoMovieHumanoidBone, number>(
      bones.map((b: AutoMovieHumanoidBone, i: number): [AutoMovieHumanoidBone, number] => [b, i]),
    );
    const slots: number[] = segments.map(
      (s: ISegment): number => index.get(s.bone)!,
    );
    return {
      skeleton,
      bind: (
        positions: readonly number[],
        bone?: AutoMovieHumanoidBone,
      ): IAutoMovieMeshSkin => {
        const count: number = positions.length / 3;
        const boneIndices: number[] = new Array<number>(4 * count).fill(0);
        const weights: number[] = new Array<number>(4 * count).fill(0);
        for (let v: number = 0; v < count; v++) {
          if (bone !== undefined) {
            boneIndices[4 * v] = index.get(bone)!;
            weights[4 * v] = 1;
            continue;
          }
          const top: [number, number][] = influences(
            [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!],
            segments,
            slots,
            bones.length,
          );
          top.forEach(([b, w]: [number, number], i: number): void => {
            boneIndices[4 * v + i] = b;
            weights[4 * v + i] = w;
          });
        }
        return { joints: bones, boneIndices, weights };
      },
    };
  }

  /**
   * Give every part a skin. Construction curves take the same place-based
   * binding, so they stay on the skin they generate under any pose, and rigid
   * features ride one bone.
   *
   * @param parts The model's parts, in metres.
   * @param rig The body's rig.
   * @returns The parts bound to the rig.
   */
  export function dress(
    parts: readonly IAutoMovieModelPart[],
    rig: IRig,
  ): IAutoMovieModelPart[] {
    return parts.map((part: IAutoMovieModelPart): IAutoMovieModelPart => {
      if (part.geometry.type !== "mesh") return part;
      const mesh = part.geometry.mesh;
      return {
        ...part,
        geometry: {
          ...part.geometry,
          mesh: {
            ...mesh,
            skin: {
              ...rig.bind(mesh.positions, rigid(part.id)),
              method: BLEND,
            },
          },
        },
      };
    });
  }

  /**
   * An evaluated Human pose as each rig bone's transform in its parent's frame.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns Per bone, the local transform to apply.
   */
  export function locals(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): Map<AutoMovieHumanoidBone, ILocal> {
    const placed = new Map<string, AutoMovieHumanSkeleton.IPlacement>(
      pose.posed.map((p): [string, AutoMovieHumanSkeleton.IPlacement] => [p.bone, p]),
    );
    const out = new Map<AutoMovieHumanoidBone, ILocal>();
    for (const bone of rest.bones) {
      const own: AutoMovieHumanSkeleton.IPlacement = placed.get(joint(bone.bone))!;
      const parent: AutoMovieHumanSkeleton.IPlacement | undefined =
        bone.parent === null ? undefined : placed.get(joint(bone.parent));
      if (parent === undefined) {
        out.set(bone.bone, { translation: own.position, rotation: own.rotation });
        continue;
      }
      const inverse: Math3D.Quaternion = [
        -parent.rotation[0],
        -parent.rotation[1],
        -parent.rotation[2],
        parent.rotation[3],
      ];
      out.set(bone.bone, {
        translation: Math3D.rotate(inverse, Math3D.sub(own.position, parent.position)),
        rotation: Math3D.multiply(inverse, own.rotation),
      });
    }
    return out;
  }

  /**
   * An evaluated Human pose as the engine's clinical pose of this rig.
   *
   * The rig's rest rotations are identity and its bones declare the Human's own
   * axes and composition, so each local rotation splits exactly into the three
   * angles the engine composes back. Only translation has no channel: a jaw's
   * protrusion and a shoulder girdle's slide are lost, and the bones they move
   * are listed so a caller can refuse them.
   *
   * @param rest The rig.
   * @param pose The evaluator's output for the same body.
   * @returns The engine pose, and the bones whose translation it cannot carry.
   */
  export function enginePose(
    rest: IAutoMovieSkeleton,
    pose: AutoMovieHumanSkeleton.IOutput,
  ): IEnginePose {
    const local: Map<AutoMovieHumanoidBone, ILocal> = locals(rest, pose);
    const joints: IAutoMovieJointPose[] = [];
    const translated: AutoMovieHumanoidBone[] = [];
    let root: Vector = [0, 0, 0];
    for (const bone of rest.bones) {
      const own: ILocal = local.get(bone.bone)!;
      const t = bone.rest.translation;
      const shift: Vector = [
        own.translation[0] - t.x,
        own.translation[1] - t.y,
        own.translation[2] - t.z,
      ];
      if (bone.parent === null) root = shift;
      else if (Math.hypot(...shift) > TRANSLATED) translated.push(bone.bone);
      joints.push({ bone: bone.bone, ...angles(own.rotation, bone.axes!) });
    }
    return {
      pose: {
        skeleton: rest.id,
        root: {
          translation: { x: root[0], y: root[1], z: root[2] },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        joints,
      },
      translated,
    };
  }

  /** An engine pose with what it could not carry. */
  export interface IEnginePose {
    /** The clinical pose. */
    pose: IAutoMoviePose;

    /** Bones that moved along their parent, which the engine's rig cannot do. */
    translated: AutoMovieHumanoidBone[];
  }
}

type Vector = [number, number, number];

/** A tuple as an interface vector. */
function vector(v: readonly number[]): { x: number; y: number; z: number } {
  return { x: v[0]!, y: v[1]!, z: v[2]! };
}

/** Where a bone's twist sits: the forearm's is distal, as the skeleton composes it. */
function placement(bone: AutoMovieHumanoidBone): "distal" | "proximal" {
  return bone.endsWith("LowerArm") ? "distal" : "proximal";
}

/** A local rotation as the three clinical angles of its axes, degrees. */
function angles(
  q: readonly [number, number, number, number],
  axes: IAutoMovieJointAxes,
): Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist"> {
  const tuple = (v: { x: number; y: number; z: number }): Vector => [v.x, v.y, v.z];
  const distal: boolean = axes.twistPlacement === "distal";
  const f: Vector = tuple(axes.flexion);
  const a: Vector = tuple(axes.abduction);
  const t: Vector = tuple(axes.twist);

  // The composition is first * second * third about these axes. A left-handed
  // triple turns its last axis over, and that angle's sign with it.
  const first: Vector = distal ? a : t;
  const second: Vector = distal ? f : a;
  const third: Vector = distal ? t : f;
  const crossed: Vector = cross(first, second);
  const hand: number = dot(crossed, third) < 0 ? -1 : 1;
  const k: Vector = Math3D.times(third, hand);
  const m = (u: Vector, v: Vector): number =>
    dot(u, Math3D.rotate([q[0], q[1], q[2], q[3]], v));
  const beta: number = Math.asin(Math.max(-1, Math.min(1, m(first, k))));
  const alpha: number = Math.atan2(-m(second, k), m(k, k));
  const gamma: number = Math.atan2(-m(first, second), m(first, first));
  const degrees = (r: number): number => (r * 180) / Math.PI;
  const out: [number, number, number] = [
    degrees(alpha),
    degrees(beta),
    hand * degrees(gamma),
  ];
  return distal
    ? { abduction: out[0], flexion: out[1], twist: out[2] }
    : { twist: out[0], abduction: out[1], flexion: out[2] };
}

function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** One bone's drawn segment. */
interface ISegment {
  /** The rig bone it pulls. */
  bone: AutoMovieHumanoidBone;

  /** Side of the body: left 1, right -1, midline 0. */
  side: number;

  /** Start, metres. */
  from: Vector;

  /** End, metres. */
  to: Vector;

  /** Radius of the limb round it, metres. */
  radius: number;
}

/** The rig bone a Human joint folds into. */
function named(joint: string): AutoMovieHumanoidBone {
  if (joint === "atlas") return "neck";
  const side: "left" | "right" = joint.startsWith("left") ? "left" : "right";
  if (joint.endsWith("Scapula")) return `${side}Shoulder`;
  if (joint.endsWith("Subtalar") || joint.endsWith("Midfoot"))
    return `${side}Foot`;
  if (/Hallux|Toe\d/.test(joint)) return `${side}Toes`;
  return joint as AutoMovieHumanoidBone;
}

/** The Human joint that places a rig bone: the toes hang off the great toe's. */
function joint(bone: AutoMovieHumanoidBone): string {
  return bone.endsWith("Toes") ? bone.replace("Toes", "HalluxProximal") : bone;
}

/** The bone a rigid part rides, if it is one. */
function rigid(id: string): AutoMovieHumanoidBone | undefined {
  if (id.startsWith("human.eye.left")) return "leftEye";
  if (id.startsWith("human.eye.right")) return "rightEye";
  if (/^human\.(hair|brow|lash|eyebrow|eyelash)/.test(id)) return "head";
  return undefined;
}

/** The strongest four influences on a point, normalized. */
function influences(
  p: Vector,
  segments: readonly ISegment[],
  slots: readonly number[],
  count: number,
): [number, number][] {
  // A point's depth under each limb's capsule, so a thick trunk reaches no
  // further into a thigh than the thigh's own surface.
  const reached: number[] = [];
  const depths: number[] = [];
  let nearest: number = Infinity;
  segments.forEach((s: ISegment, i: number): void => {
    if (s.side !== 0 && s.side * p[2] < -MIDLINE) return;
    const d: number = distance(p, s.from, s.to) - s.radius;
    reached.push(i);
    depths.push(d);
    nearest = Math.min(nearest, d);
  });

  // The transition's width follows the limbs at hand, read softly so that it
  // does not jump where the nearest limb changes.
  let share: number = 0;
  let width: number = 0;
  depths.forEach((d: number, i: number): void => {
    const k: number = Math.exp(-(d - nearest) / READ);
    share += k;
    width += k * segments[reached[i]!]!.radius;
  });
  width = (SOFTNESS * width) / share;

  // Each bone's strongest pull, then the strongest four bones, the first met
  // leading on a tie.
  const pulls: Float64Array = new Float64Array(count).fill(-1);
  const met: number[] = [];
  depths.forEach((d: number, i: number): void => {
    const w: number = Math.exp(-(d - nearest) / width);
    const slot: number = slots[reached[i]!]!;
    if (pulls[slot]! < 0) met.push(slot);
    pulls[slot] = Math.max(pulls[slot]!, w);
  });
  const top: [number, number][] = [];
  for (const slot of met) {
    const w: number = pulls[slot]!;
    let at: number = top.length;
    while (at > 0 && w > top[at - 1]![1]) at--;
    if (at === 4) continue;
    top.splice(at, 0, [slot, w]);
    if (top.length > 4) top.pop();
  }
  const total: number = top.reduce(
    (a: number, e: [number, number]): number => a + e[1],
    0,
  );

  // A thousandth of a bone's pull is below what a skin can show, and every
  // weight is carried as text to the page, so the strongest takes the remainder
  // of the rounding and the rest stay short.
  const rounded: [number, number][] = top
    .slice(1)
    .map(([b, w]: [number, number]): [number, number] => [
      b,
      Math.round((w / total) * STEPS) / STEPS,
    ]);
  const rest: number = rounded.reduce(
    (a: number, e: [number, number]): number => a + e[1],
    0,
  );
  return [
    [top[0]![0], Math.round((1 - rest) * STEPS) / STEPS],
    ...rounded,
  ];
}

/** Distance from a point to a segment. */
function distance(p: Vector, a: Vector, b: Vector): number {
  const d: Vector = Math3D.sub(b, a);
  const e: Vector = Math3D.sub(p, a);
  const length: number = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const f: number =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, (e[0] * d[0] + e[1] * d[1] + e[2] * d[2]) / length));
  return Math.hypot(e[0] - f * d[0], e[1] - f * d[1], e[2] - f * d[2]);
}

/** Shift along a parent below which a bone has not moved, metres. */
const TRANSLATED: number = 1e-6;

/**
 * How the skin blends its bones. A linear blend thinned the bent thigh and the
 * elbow's inside on the same pose; this keeps their volume, at the price of a
 * slight corner outside a deep bend.
 */
const BLEND = "dual-quaternion" as const;

/** Steps of a weight. */
const STEPS: number = 1000;

/** How far past the midline a side's bones are ignored, metres. */
const MIDLINE: number = 0.002;

/** Smallest limb radius a segment's reach is measured in, mm. */
const MINIMUM_RADIUS: number = 4;

/** A transition's width in the radii of the limbs at hand. */
const SOFTNESS: number = 0.2;

/** Depth over which a limb stops counting toward that width, metres. */
const READ: number = 0.005;
