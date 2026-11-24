import type {
  AutoMovieHumanPoseProjectionEvaluator,
  IAutoMovieHumanBindBone,
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanFootSurface,
  IAutoMovieHumanJointCentres,
  IAutoMovieHumanNeckSurface,
  IAutoMovieHumanNeutral,
  IAutoMovieHumanParameters,
  IAutoMovieHumanPoseEvaluator,
  IAutoMovieHumanPoseProjection,
  IAutoMovieHumanPreparedKinematics,
  IAutoMovieHumanSkeleton,
} from "@automovie/interface";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanFootSurface } from "../generation/AutoMovieHumanFootSurface";
import { AutoMovieHumanNeckSurface } from "../generation/AutoMovieHumanNeckSurface";
import { AutoMovieHumanBindingInputs } from "./AutoMovieHumanBindingInputs";
import { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import { AutoMovieHumanNeutral } from "./AutoMovieHumanNeutral";
import { AutoMovieHumanPreparedKinematics as Kinematics } from "./AutoMovieHumanPreparedKinematics";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";

/**
 * Lightweight posable skeleton of the generated Human, the stickman mode, and
 * its forward kinematics under `params.pose`.
 *
 * Joint centres come from {@link AutoMovieHumanJointCentres}, scaled with the
 * body exactly as `AutoMovieHuman.generate` scales the skin (resolved stature
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
  /**
   * Derive the skeleton and pose it by `params.pose`.
   *
   * @param params Public input; resolved anatomy and `pose` are read.
   * @param clamp Clamp each field into its range of motion; false applies requests as given, for comparison.
   * @returns Rest bones, posed placements and the clamped fields.
   */
  export function generate(
    params: IAutoMovieHumanParameters,
    clamp: boolean = true,
  ): IAutoMovieHumanSkeleton.IOutput {
    return prepare(params)(params.pose ?? {}, clamp);
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
    options: IAutoMovieHumanSkeleton.IPrepareOptions = {},
  ): IAutoMovieHumanPoseEvaluator {
    const height: number = AutoMovieHumanBodyAnatomy.resolve(params).stature;
    if (!(height > 0))
      throw new Error("Human stickman requires a positive stature");

    // The skeleton is derived from the same calibration the skin is lofted
    // from, the shape law's output for these parameters.
    const calibration: IAutoMovieHumanBodyCalibration =
      options.calibration ?? AutoMovieHumanBodyLaw.calibrate(params).body;
    const mmScale: number = height / calibration.stature;
    const scale: number = mmScale / 1000;
    const footSurface: IAutoMovieHumanFootSurface.IOutput | undefined =
      options.footSurface
        ? AutoMovieHumanFootSurface.derive(calibration, scale)
        : undefined;
    const neckSurface: IAutoMovieHumanNeckSurface.IOutput | undefined =
      options.neckSurface
        ? AutoMovieHumanNeckSurface.derive(
            calibration,
            scale,
            AutoMovieHumanBodyAnatomy.resolve(params).neckCircumference,
            AutoMovieHumanBodyLaw.headInputs(params).neckLength,
          )
        : undefined;

    const bind: IAutoMovieHumanJointCentres.IJoint[] =
      AutoMovieHumanJointCentres.derive(calibration);
    const neutral: IAutoMovieHumanNeutral.IOutput = AutoMovieHumanNeutral.derive(
      AutoMovieHumanBindingInputs.rings(
        calibration,
        AutoMovieHumanNeutral.LEVEL,
      ),
      bind,
    );
    const joints: IAutoMovieHumanJointCentres.IJoint[] = neutral.joints;
    const kinematics: IAutoMovieHumanPreparedKinematics.IPrepared =
      Kinematics.prepare(joints, neutral, scale, mmScale);
    const rest: IAutoMovieHumanBindBone[] = bind.map(
      (joint: IAutoMovieHumanJointCentres.IJoint): IAutoMovieHumanBindBone => ({
        bone: joint.bone,
        parent: joint.parent,
        position: Math3D.times(joint.position, scale),
        tip: joint.tip === null ? null : Math3D.times(joint.tip, scale),
        radius: joint.radius * scale,
      }),
    );

    const evaluate: IAutoMovieHumanPoseEvaluator = (
      input: NonNullable<IAutoMovieHumanParameters["pose"]> = {},
      clamp: boolean = true,
    ): IAutoMovieHumanSkeleton.IOutput => {
      const output: IAutoMovieHumanPoseProjection = kinematics.evaluate(
        input,
        clamp,
      );
      return {
        bones: rest.map(
          (bone: IAutoMovieHumanBindBone): IAutoMovieHumanBindBone => ({
            ...bone,
            position: [...bone.position],
            tip: bone.tip === null ? null : [...bone.tip],
          }),
        ),
        posed: output.posed,
        clamped: output.clamped,
        ...(neckSurface === undefined
          ? {}
          : { neckSurface: structuredClone(neckSurface) }),
        ...(footSurface === undefined ? {} : { footSurface }),
      };
    };
    evaluate.project = (
      names: readonly string[],
    ): AutoMovieHumanPoseProjectionEvaluator => {
      const selection: IAutoMovieHumanPreparedKinematics.ISelection =
        kinematics.select(names);
      return (
        input: NonNullable<IAutoMovieHumanParameters["pose"]> = {},
        clamp: boolean = true,
      ): IAutoMovieHumanPoseProjection =>
        kinematics.evaluate(input, clamp, selection);
    };
    return evaluate;
  }
}
