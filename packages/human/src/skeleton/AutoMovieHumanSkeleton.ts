import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanNeckSurface } from "../generation/AutoMovieHumanNeckSurface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanPoseChannels } from "./AutoMovieHumanPoseChannels";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

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

    /** Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. */
    readonly neckSurface?: Readonly<AutoMovieHumanNeckSurface.IOutput>;
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
    return prepare(params)(params.pose ?? {}, clamp);
  }

  /** One body's existing clinical pose evaluator; each result owns fresh placement, bone and clamp arrays. */
  export type PoseEvaluator = (
    pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
    clamp?: boolean,
  ) => IOutput;

  /**
   * Prepare one fixed body's joints, clinical axes and mm-to-metre scales once.
   * The returned evaluator reuses the existing channel/clamp/FK code and owns
   * only joint arrays/maps, optional exterior neck data and scales, without retaining the calibration
   * or input. Recreate it when the body's parameters or rest construction change.
   * Exterior neck admission runs only when requested; ordinary skeleton generation does not depend on it.
   * @param params Fixed body input; each evaluation supplies its own public pose.
   * @param options Explicit exterior-display admission; omitted by one-shot generation.
   * @returns Reusable clinical evaluator with independent output arrays and optional neck snapshots.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    options: {
      /** Include the independent exterior-display descriptor. */ neckSurface?: boolean;
    } = {},
  ): PoseEvaluator {
    const height: number | null = params.body.controls.height.value;
    if (height === null || !(height > 0))
      throw new Error("Human stickman requires a positive height control");

    // The skeleton is derived from the same calibration the skin is lofted
    // from, the shape law's output for these parameters.
    const calibration: IAutoMovieHumanBodyCalibration =
      AutoMovieHumanBodyLaw.calibrate(params).body;
    const mmScale: number = height / calibration.stature;
    const scale: number = mmScale / 1000;
    const neckSurface: AutoMovieHumanNeckSurface.IOutput | undefined =
      options.neckSurface
        ? AutoMovieHumanNeckSurface.derive(
            calibration,
            scale,
            params.body.controls.neck.value,
            params.body.controls.neckLength.value,
          )
        : undefined;

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
      return Math3D.unit(Math3D.sub(j.toward, j.position));
    };
    const axes: Map<string, IAxes> = new Map(
      joints.map((j: AutoMovieHumanJointCentres.IJoint): [string, IAxes] => [
        j.bone,
        Math3D.boneAxes(j.bone, direction(j.bone), byBone),
      ]),
    );

    return (
      input: NonNullable<IAutoMovieHumanParameters["pose"]> = {},
      clamp: boolean = true,
    ): IOutput => {
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
      const pose: unknown = input;
      const kneeFlexion: Map<string, number> = new Map();
      for (const row of AutoMovieHumanPoseChannels)
        for (const side of row[0].includes("<side>")
          ? ["left", "right"]
          : [""]) {
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
              Math3D.restAngle(bone, "flexion", direction, byBone);
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
                    ...Math3D.sub(
                      byBone.get(bone)!.tip!,
                      byBone.get(bone)!.position,
                    ),
                  )) *
                (180 / Math.PI)
              : applied;
          set(
            bone,
            axis,
            sign * degrees - Math3D.restAngle(bone, axis, direction, byBone),
          );
        }

      // Forward kinematics with identity rest rotations.
      const world: Map<string, IPlacement> = new Map();
      const posed: IPlacement[] = joints.map(
        (j: AutoMovieHumanJointCentres.IJoint): IPlacement => {
          const a: IAxes = axes.get(j.bone)!;
          const r: Record<string, number> = rig.get(j.bone) ?? {};
          const qf: Quaternion = Math3D.fromAxisAngle(
            a.flexion,
            r.flexion ?? 0,
          );
          const qa: Quaternion = Math3D.fromAxisAngle(
            a.abduction,
            r.abduction ?? 0,
          );
          const qt: Quaternion = Math3D.fromAxisAngle(a.twist, r.twist ?? 0);
          const local: Quaternion = j.bone.endsWith("LowerArm")
            ? Math3D.multiply(Math3D.multiply(qa, qf), qt)
            : Math3D.multiply(Math3D.multiply(qt, qa), qf);
          const parent: IPlacement | undefined =
            j.parent === null ? undefined : world.get(j.parent);
          const offset: Vector =
            j.parent === null
              ? [0, 0, 0]
              : Math3D.sub(j.position, byBone.get(j.parent)!.position);
          const shifted: Vector = [
            offset[0] + (r.forward ?? 0) * mmScale,
            offset[1],
            offset[2] + (r.lateral ?? 0) * mmScale,
          ];
          const placement: IPlacement =
            parent === undefined
              ? {
                  bone: j.bone,
                  position: Math3D.times(j.position, scale),
                  rotation: local,
                }
              : {
                  bone: j.bone,
                  position: Math3D.add(
                    parent.position,
                    Math3D.times(
                      Math3D.rotate(parent.rotation, shifted),
                      scale,
                    ),
                  ),
                  rotation: Math3D.multiply(parent.rotation, local),
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
            position: Math3D.times(j.position, scale),
            tip: j.tip === null ? null : Math3D.times(j.tip, scale),
            radius: j.radius * scale,
          }),
        ),
        posed,
        clamped,
        ...(neckSurface === undefined
          ? {}
          : { neckSurface: structuredClone(neckSurface) }),
      };
    };
  }
}

/** Registered-frame vector used by the preserved skeleton law. */
type Vector = Math3D.Vector;

/** Unit quaternion used by the preserved rigid FK. */
type Quaternion = Math3D.Quaternion;

/** Existing clinical axis convention. */
type IAxes = Math3D.IAxes;

/** Value at a dotted path of the pose, or undefined when any step is absent. */
function read(pose: unknown, path: string): number | undefined {
  let node: unknown = pose;
  for (const key of path.split(".")) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "number" ? node : undefined;
}
