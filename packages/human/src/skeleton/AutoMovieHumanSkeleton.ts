import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanFootSurface } from "../generation/AutoMovieHumanFootSurface";
import { AutoMovieHumanNeckSurface } from "../generation/AutoMovieHumanNeckSurface";
import type { IAutoMovieHumanBodyCalibration } from "../generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanNeutral } from "./AutoMovieHumanNeutral";
import { AutoMovieHumanPreparedKinematics as Kinematics } from "./AutoMovieHumanPreparedKinematics";
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
 * Three postures stay apart. The bind is the achieved posture the skin was
 * generated in, and `bones` hold it. Neutral is the standing body clinical
 * angles are measured from, and {@link AutoMovieHumanNeutral} reaches it from
 * the bind. A pose is a further turn of neutral: every field at zero, or
 * omitted, gives the neutral body, so `{}` is neutral and not the bind. Each
 * placement's rotation runs from the bind, because that is what a skin reads.
 *
 * Every bone declares three orthonormal clinical axes in the registered frame
 * (forward +X, up +Y, left +Z) from its neutral direction d: flexion turns d
 * toward the joint's flexion direction, abduction toward the side away from the
 * midline (the figure's right for midline bones), twist runs along d. The foot
 * bones evert about their long axis; the eyes and the scapula use fixed body
 * axes. Each pose field maps onto one bone axis through
 * the canonical channel table, clamped to its range of motion.
 *
 * The skin's binding and the engine's pose come from these placements through
 * {@link AutoMovieHumanRig}.
 */
export namespace AutoMovieHumanSkeleton {
  /** Stickman skeleton at its bind and under the requested pose. */
  export interface IOutput {
    /** Bones at the bind, the achieved posture, in metres, parent before child. */
    bones: IBone[];

    /** World placement of every bone under `params.pose`, in the order of `bones`. */
    posed: IPlacement[];

    /** Pose fields whose requested value lay outside the range and was clamped. */
    clamped: IClamp[];

    /** Owned exterior neck snapshot at rest when requested, metres; independent of rig radii and pivots. */
    readonly neckSurface?: Readonly<AutoMovieHumanNeckSurface.IOutput>;

    /** Deeply frozen canonical foot courses shared by this fixed body's evaluations. */
    readonly footSurface?: Readonly<AutoMovieHumanFootSurface.IOutput>;
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

  /** One bone's world placement: geometry at the bind moves rigidly with it. */
  export interface IPlacement {
    /** Bone id. */
    bone: string;

    /** World position of the joint, metres. */
    position: [number, number, number];

    /** World rotation from the bind as a unit quaternion `[x, y, z, w]`. */
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

  /** Independent requested placements and every canonical clamp, without exterior/rest materialization. */
  export interface IProjection {
    /** Requested bones in canonical parent-before-child order; arrays and tuples are owned. */
    posed: IPlacement[];

    /** All requested out-of-range clinical fields, including those outside the selected branches. */
    clamped: IClamp[];
  }

  /** A fixed bone selection, with fresh results under every current input pose. */
  export type ProjectionEvaluator = (
    pose?: NonNullable<IAutoMovieHumanParameters["pose"]>,
    clamp?: boolean,
  ) => IProjection;

  /** One body's clinical evaluator; public full results always own fresh mutable snapshots. */
  export interface PoseEvaluator {
    /** Evaluate all bones, bind data, clamps and requested exterior snapshots. */
    (pose?: NonNullable<IAutoMovieHumanParameters["pose"]>, clamp?: boolean): IOutput;

    /** Compile exact existing output bones and their dependencies once; custom evaluators may omit this capability. */
    project?: (bones: readonly string[]) => ProjectionEvaluator;
  }

  /**
   * Prepare one fixed body's joints, clinical axes and mm-to-metre scales once.
   * The returned evaluator reuses the existing channel/clamp/FK code and owns
   * joint arrays/maps, compiled canonical readers and one private local/world
   * placement cache, optional exterior neck data and scales. Its optional project
   * capability compiles requested bones and their ancestors for numerical trials,
   * retaining all channel clamps while omitting rest/exterior snapshot copies. Each evaluation
   * reads all current scalar values; identical applied local controls and parent
   * placement reuse exact branch arithmetic. Public tuples/arrays are copied,
   * so caller mutation and later evaluations cannot change earlier snapshots.
   * The calibration and input are not retained. Recreate when the body changes.
   * Exterior admission runs only when requested; ordinary skeleton generation does not depend on it. Foot courses are deeply frozen once and shared, rather than copied during every numerical FK evaluation.
   * @param params Fixed body input; each evaluation supplies its own public pose.
   * @param options Explicit exterior-display admission; omitted by one-shot generation.
   * @returns Reusable clinical evaluator with independent output arrays and optional neck snapshots.
   */
  export function prepare(
    params: IAutoMovieHumanParameters,
    options: {
      /** Include the independent exterior-display descriptor. */ neckSurface?: boolean;
      /** Include frozen canonical foot courses and actual source landmark addresses. */ footSurface?: boolean;
      /** The body already calibrated from these same `params`, spared generating it again. */ calibration?: IAutoMovieHumanBodyCalibration;
    } = {},
  ): PoseEvaluator {
    const height: number | null = params.body.controls.height.value;
    if (height === null || !(height > 0))
      throw new Error("Human stickman requires a positive height control");

    // The skeleton is derived from the same calibration the skin is lofted
    // from, the shape law's output for these parameters.
    const calibration: IAutoMovieHumanBodyCalibration =
      options.calibration ?? AutoMovieHumanBodyLaw.calibrate(params).body;
    const mmScale: number = height / calibration.stature;
    const scale: number = mmScale / 1000;
    const footSurface: AutoMovieHumanFootSurface.IOutput | undefined = options.footSurface
      ? AutoMovieHumanFootSurface.derive(calibration, scale)
      : undefined;
    const neckSurface: AutoMovieHumanNeckSurface.IOutput | undefined =
      options.neckSurface
        ? AutoMovieHumanNeckSurface.derive(
            calibration,
            scale,
            params.body.controls.neck.value,
            params.body.controls.neckLength.value,
          )
        : undefined;

    const bind: AutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const neutral: AutoMovieHumanNeutral.IOutput = AutoMovieHumanNeutral.derive(
      calibration,
      bind,
    );
    const joints: AutoMovieHumanJointCentres.IJoint[] = neutral.joints;
    const kinematics: Kinematics.IPrepared = Kinematics.prepare(joints, neutral, scale, mmScale);
    const rest: IBone[] = bind.map((joint: AutoMovieHumanJointCentres.IJoint): IBone => ({
      bone: joint.bone,
      parent: joint.parent,
      position: Math3D.times(joint.position, scale),
      tip: joint.tip === null ? null : Math3D.times(joint.tip, scale),
      radius: joint.radius * scale,
    }));

    const evaluate: PoseEvaluator = (
      input: NonNullable<IAutoMovieHumanParameters["pose"]> = {},
      clamp: boolean = true,
    ): IOutput => {
      const output: IProjection = kinematics.evaluate(input, clamp);
      return {
        bones: rest.map((bone: IBone): IBone => ({
          ...bone,
          position: [...bone.position],
          tip: bone.tip === null ? null : [...bone.tip],
        })),
        posed: output.posed,
        clamped: output.clamped,
        ...(neckSurface === undefined ? {} : {neckSurface: structuredClone(neckSurface)}),
        ...(footSurface === undefined ? {} : {footSurface}),
      };
    };
    evaluate.project = (names: readonly string[]): ProjectionEvaluator => {
      const selection: Kinematics.ISelection = kinematics.select(names);
      return (
        input: NonNullable<IAutoMovieHumanParameters["pose"]> = {},
        clamp: boolean = true,
      ): IProjection => kinematics.evaluate(input, clamp, selection);
    };
    return evaluate;
  }
}
