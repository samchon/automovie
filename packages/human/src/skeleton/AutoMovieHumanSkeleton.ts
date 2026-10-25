import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";

/**
 * Lightweight posable skeleton of the generated Human, the stickman mode, and
 * its forward kinematics under `params.pose`.
 *
 * Joint centres come from {@link AutoMovieHumanJointCentres}, scaled with the
 * body exactly as `AutoMovieHuman.generate` scales the skin (stature control
 * over calibration stature, millimetres to metres), so the rest skeleton
 * overlays the neutral skin. Bones use the engine's humanoid names where the
 * vocabulary has one; the scapula, atlas, subtalar, midfoot and per-toe bones
 * are the Human's own, because the shared humanoid vocabulary lacks them.
 *
 * Every bone rests with identity rotation in the registered frame (forward
 * +X, up +Y, left +Z) and declares three orthonormal clinical axes from its
 * rest direction d: flexion turns d toward the joint's flexion direction,
 * abduction toward the side away from the midline (the figure's right for
 * midline bones), twist runs along d. The foot bones evert about their long
 * axis; the eyes and the scapula use fixed body axes. Each pose field maps
 * onto one bone axis through {@link AutoMovieHumanPoseChannels}, clamped to
 * its range of motion, minus the clinical angle the bone already has at rest
 * (arm and thigh from the vertical, hinge angles between adjacent segments,
 * the ankle from the shank's lean), so an omitted field keeps the rest posture
 * and a given one is the clinical angle.
 *
 * Construction and preview only: no skin binding, weights or deformation
 * (campaign #2947).
 */
export namespace AutoMovieHumanSkeleton {
  /** Stickman skeleton at rest and under the requested pose. */
  export interface IOutput {
    /** Bones at rest in metres, parent before child. */
    bones: IBone[];

    /** World placement of every bone under `params.pose`, in the order of `bones`. */
    posed: IPlacement[];

    /** Pose fields whose requested value lay outside the range and was clamped. */
    clamped: IClamp[];
  }

  /** One bone at rest. */
  export interface IBone {
    /** Bone id. */
    bone: string;

    /** Parent bone, or null for the root. */
    parent: string | null;

    /** Joint centre at rest, metres. */
    position: [number, number, number];

    /** End of a leaf bone's drawn segment at rest, null for a bone whose children end it. */
    tip: [number, number, number] | null;

    /** Skin girth radius of the segment leaving the joint, metres. */
    radius: number;
  }

  /** One bone's world placement: rest geometry moves rigidly with it. */
  export interface IPlacement {
    /** Bone id. */
    bone: string;

    /** World position of the joint, metres. */
    position: [number, number, number];

    /** World rotation from rest as a unit quaternion `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /** A requested pose value replaced by its range limit. */
  export interface IClamp {
    /** Field path with the side resolved, such as `legs.left.knee.flexion`. */
    path: string;

    /** Requested value. */
    requested: number;

    /** Applied value. */
    applied: number;
  }

  /**
   * Derive the skeleton and pose it by `params.pose`.
   *
   * @param params Public input; the stature control and `pose` are read.
   * @param clamp Clamp each field into its range of motion; false applies requests as given, for comparison.
   * @returns Rest bones, posed placements and the clamped fields.
   */
  export function generate(
    params: IAutoMovieHumanParameters,
    clamp: boolean = true,
  ): IOutput {
    const height: number | null = params.body.controls.height.value;
    if (height === null || !(height > 0))
      throw new Error("Human stickman requires a positive height control");

    // The skeleton is derived from the same calibration the skin is lofted
    // from, the shape law's output for these parameters.
    const calibration: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanBodyLaw.calibrate(params).body;
    const mmScale: number = height / calibration.stature;
    const scale: number = mmScale / 1000;

    const joints: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const byBone: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    const direction: (bone: string) => Vector = (bone: string): Vector => {
      const j: AutoMovieHumanJointCentres.IJoint = byBone.get(bone)!;
      return unit(sub(j.toward, j.position));
    };
    const axes: Map<string, IAxes> = new Map(
      joints.map((j: AutoMovieHumanJointCentres.IJoint): [string, IAxes] => [
        j.bone,
        boneAxes(j.bone, direction(j.bone), byBone),
      ]),
    );

    // Rig angle per bone and axis: requested clinical value minus rest.
    const rig: Map<string, Record<string, number>> = new Map();
    const set: (bone: string, axis: string, value: number) => void = (
      bone: string,
      axis: string,
      value: number,
    ): void => {
      rig.set(bone, { ...rig.get(bone), [axis]: value });
    };
    const clamped: IClamp[] = [];
    const pose: unknown = params.pose ?? {};
    const kneeFlexion: Map<string, number> = new Map();
    for (const row of AutoMovieHumanPoseChannels)
      for (const side of row[0].includes("<side>") ? ["left", "right"] : [""]) {
        const path: string = row[0].replace("<side>", side);
        const bone: string = row[1].replace("<side>", side);
        const axis: string = row[2];
        const sign: number = row[3];
        let min: number = row[4];
        let max: number = row[5];
        const requested: number | undefined = read(pose, path);
        if (requested === undefined) continue;

        // Tibial rotation exists only with the knee bent (convention).
        if (path.endsWith("knee.rotation")) {
          const flexion: number =
            kneeFlexion.get(side) ??
            restAngle(bone, "flexion", direction, byBone);
          const f: number = Math.min(1, Math.max(0, flexion / 90));
          min *= f;
          max *= f;
        }
        const applied: number = clamp
          ? Math.min(max, Math.max(min, requested))
          : requested;
        if (applied !== requested) clamped.push({ path, requested, applied });
        if (path.endsWith("knee.flexion")) kneeFlexion.set(side, applied);

        if (axis === "forward" || axis === "lateral") {
          set(bone, axis, sign * applied);
          continue;
        }
        const degrees: number =
          path === "head.jaw.opening"
            ? (applied /
                Math.hypot(
                  ...sub(byBone.get(bone)!.tip!, byBone.get(bone)!.position),
                )) *
              (180 / Math.PI)
            : applied;
        set(
          bone,
          axis,
          sign * degrees - restAngle(bone, axis, direction, byBone),
        );
      }

    // Forward kinematics with identity rest rotations.
    const world: Map<string, IPlacement> = new Map();
    const posed: IPlacement[] = joints.map(
      (j: AutoMovieHumanJointCentres.IJoint): IPlacement => {
        const a: IAxes = axes.get(j.bone)!;
        const r: Record<string, number> = rig.get(j.bone) ?? {};
        const qf: Quaternion = fromAxisAngle(a.flexion, r.flexion ?? 0);
        const qa: Quaternion = fromAxisAngle(a.abduction, r.abduction ?? 0);
        const qt: Quaternion = fromAxisAngle(a.twist, r.twist ?? 0);
        const local: Quaternion = j.bone.endsWith("LowerArm")
          ? multiply(multiply(qa, qf), qt)
          : multiply(multiply(qt, qa), qf);
        const parent: IPlacement | undefined =
          j.parent === null ? undefined : world.get(j.parent);
        const offset: Vector =
          j.parent === null
            ? [0, 0, 0]
            : sub(j.position, byBone.get(j.parent)!.position);
        const shifted: Vector = [
          offset[0] + (r.forward ?? 0) * mmScale,
          offset[1],
          offset[2] + (r.lateral ?? 0) * mmScale,
        ];
        const placement: IPlacement =
          parent === undefined
            ? {
                bone: j.bone,
                position: times(j.position, scale),
                rotation: local,
              }
            : {
                bone: j.bone,
                position: add(
                  parent.position,
                  times(rotate(parent.rotation, shifted), scale),
                ),
                rotation: multiply(parent.rotation, local),
              };
        world.set(j.bone, placement);
        return placement;
      },
    );

    return {
      bones: joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): IBone => ({
          bone: j.bone,
          parent: j.parent,
          position: times(j.position, scale),
          tip: j.tip === null ? null : times(j.tip, scale),
          radius: j.radius * scale,
        }),
      ),
      posed,
      clamped,
    };
  }
}

/** A 3-vector. */
type Vector = [number, number, number];

/** A unit quaternion `[x, y, z, w]`. */
type Quaternion = [number, number, number, number];

/** Three orthonormal clinical axes of one bone in its rest frame. */
interface IAxes {
  /** Axis flexion turns about. */
  flexion: Vector;

  /** Axis abduction turns about. */
  abduction: Vector;

  /** Axis twist turns about, the long axis. */
  twist: Vector;
}

/** Body directions of the registered frame. */
const FORWARD: Vector = [1, 0, 0];
const UP: Vector = [0, 1, 0];
const LEFT: Vector = [0, 0, 1];

/** Value at a dotted path of the pose, or undefined when any step is absent. */
function read(pose: unknown, path: string): number | undefined {
  let node: unknown = pose;
  for (const key of path.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : undefined;
}

/**
 * Clinical axes of one bone from its rest direction d.
 *
 * Flexion turns d toward `flex`, abduction toward `abd` orthogonalized
 * against flexion, twist runs along d with the given sign.
 */
function boneAxes(
  bone: string,
  d: Vector,
  byBone: Map<string, AutoMovieHumanJointCentres.IJoint>,
): IAxes {
  const s: number = bone.startsWith("right") ? -1 : 1;
  const side: string = bone.startsWith("right") ? "right" : "left";
  const toward: (flex: Vector, abd: Vector, twistSign: number) => IAxes = (
    flex: Vector,
    abd: Vector,
    twistSign: number,
  ): IAxes => {
    const f: Vector = unit(cross(d, perp(flex, d)));
    const a0: Vector = unit(cross(d, perp(abd, d)));
    return {
      flexion: f,
      abduction: unit(sub(a0, times(f, dot(a0, f)))),
      twist: times(d, twistSign),
    };
  };
  const foot: () => IAxes = (): IAxes => {
    const f: Vector = unit(cross(d, perp(UP, d)));
    return {
      flexion: f,
      abduction: times(d, -s),
      twist: times(unit(cross(f, d)), -s),
    };
  };

  // Midline column and pelvis: flex forward, bend right, turn the face left.
  if (["hips", "spine", "chest", "neck", "atlas", "head"].includes(bone))
    return toward(FORWARD, times(LEFT, -1), -1);
  if (bone === "jaw") return toward(times(UP, -1), LEFT, 1);
  if (bone.endsWith("Eye"))
    return { flexion: LEFT, abduction: FORWARD, twist: times(UP, -1) };
  if (bone.endsWith("Scapula"))
    return {
      flexion: times(FORWARD, -s),
      abduction: UP,
      twist: times(LEFT, s),
    };
  if (bone.endsWith("Shoulder")) return toward(FORWARD, UP, 1);
  if (bone.endsWith("UpperArm") || bone.endsWith("UpperLeg"))
    return toward(FORWARD, times(LEFT, s), s);
  if (bone.endsWith("LowerArm")) return toward(FORWARD, times(LEFT, s), -s);
  if (bone.endsWith("LowerLeg"))
    return toward(times(FORWARD, -1), times(LEFT, s), s);
  if (
    bone.endsWith("Foot") ||
    bone.endsWith("Subtalar") ||
    bone.endsWith("Midfoot")
  )
    return foot();
  if (bone.includes("Hallux") || bone.includes("Toe"))
    return toward(
      times(UP, -1),
      times(LEFT, bone.includes("Hallux") ? -s : s),
      1,
    );

  // Hand and digits: palmar and radial directions of this hand at rest.
  const at: (name: string) => Vector = (name: string): Vector =>
    byBone.get(`${side}${name}`)!.position;
  const radial: Vector = unit(sub(at("IndexProximal"), at("LittleProximal")));
  const palmar: Vector = times(
    unit(cross(radial, unit(sub(at("MiddleProximal"), at("Hand"))))),
    s,
  );
  if (bone.includes("Thumb"))
    return toward(
      times(radial, -1),
      palmar,
      bone.endsWith("Metacarpal") ? -s : 1,
    );
  const ulnar: boolean = bone.includes("Ring") || bone.includes("Little");
  return toward(palmar, times(radial, ulnar ? -1 : 1), 1);
}

/**
 * Clinical angle, on one of a bone's axes, that the bone already has at rest.
 *
 * Arm and thigh: flexion and abduction of d from the vertical. Elbow, knee,
 * wrist, finger and toe joints: the signed angle from the parent's direction
 * to d about the bone's own axis. Ankle: dorsiflexion from the shank's lean
 * with the sole on the floor. Every other bone and axis rests at zero.
 */
function restAngle(
  bone: string,
  axis: string,
  direction: (bone: string) => Vector,
  byBone: Map<string, AutoMovieHumanJointCentres.IJoint>,
): number {
  const s: number = bone.startsWith("right") ? -1 : 1;
  const deg: number = 180 / Math.PI;
  const d: Vector = direction(bone);
  const parent: string | null = byBone.get(bone)!.parent;
  if (bone.endsWith("UpperArm") || bone.endsWith("UpperLeg")) {
    if (axis === "flexion")
      return Math.atan2(dot(d, FORWARD), -dot(d, UP)) * deg;
    if (axis === "abduction")
      return Math.atan2(s * dot(d, LEFT), -dot(d, UP)) * deg;
    return 0;
  }
  if (bone.endsWith("Foot") && axis === "flexion") {
    const shank: Vector = direction(parent!);
    return Math.atan2(-dot(shank, FORWARD), -dot(shank, UP)) * deg;
  }
  const hinge: boolean =
    /(LowerArm|LowerLeg|Hand|Proximal|Intermediate|Distal)$/.test(bone) &&
    !bone.includes("Thumb") &&
    (axis === "flexion" || (axis === "abduction" && bone.endsWith("Hand")));
  if (!hinge || parent === null) return 0;
  const about: Vector = boneAxes(bone, d, byBone)[axis as "flexion"];
  const a: Vector = unit(perp(direction(parent), about));
  const b: Vector = unit(perp(d, about));
  return Math.atan2(dot(cross(a, b), about), dot(a, b)) * deg;
}

/** Quaternion of a turn by `degrees` about a unit axis. */
function fromAxisAngle(axis: Vector, degrees: number): Quaternion {
  const h: number = (degrees * Math.PI) / 360;
  const s: number = Math.sin(h);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(h)];
}

/** Hamilton product p q. */
function multiply(p: Quaternion, q: Quaternion): Quaternion {
  return [
    p[3] * q[0] + p[0] * q[3] + p[1] * q[2] - p[2] * q[1],
    p[3] * q[1] - p[0] * q[2] + p[1] * q[3] + p[2] * q[0],
    p[3] * q[2] + p[0] * q[1] - p[1] * q[0] + p[2] * q[3],
    p[3] * q[3] - p[0] * q[0] - p[1] * q[1] - p[2] * q[2],
  ];
}

/** Rotate v by unit quaternion q. */
function rotate(q: Quaternion, v: Vector): Vector {
  const r: Quaternion = multiply(multiply(q, [v[0], v[1], v[2], 0]), [
    -q[0],
    -q[1],
    -q[2],
    q[3],
  ]);
  return [r[0], r[1], r[2]];
}

/** Component of v orthogonal to unit n. */
function perp(v: Vector, n: Vector): Vector {
  return sub(v, times(n, dot(v, n)));
}

/** Dot product. */
function dot(a: Vector, b: Vector): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Cross product a x b. */
function cross(a: Vector, b: Vector): Vector {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/** Sum a + b. */
function add(a: Vector, b: Vector): Vector {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Difference a - b. */
function sub(a: Vector, b: Vector): Vector {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Scalar multiple. */
function times(v: Vector, k: number): Vector {
  return [v[0] * k, v[1] * k, v[2] * k];
}

/** Unit vector. */
function unit(v: Vector): Vector {
  const n: number = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
}
