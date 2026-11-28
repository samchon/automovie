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
 * Lightweight Human forward kinematics in a +X forward, +Y up and +Z
 * anatomical-left frame. The bind supplies the rest bones a skin follows.
 * Clinical values start at anatomical neutral, and exported placement
 * rotations are relative to the bind.
 */
export namespace AutoMovieHumanSkeleton {
  /**
   * Derive one lightweight Human skeleton and apply its supplied pose. Omitted
   * pose fields use anatomical neutral. Bounds are applied by default. Pass
   * false to evaluate the requested scalars directly. Returns bind bones,
   * posed placements and the changed clamp requests.
   */
  export function generate(
    params: IAutoMovieHumanParameters,
    clamp: boolean = true,
  ): IAutoMovieHumanSkeleton.IOutput {
    return prepare(params)(params.pose ?? {}, clamp);
  }

  /**
   * Prepare a reusable pose evaluator for one fixed Human body. Uses the
   * supplied calibration or calibrates that body and returns metre placements.
   * Optional foot or neck surfaces are prepared only when requested. Full
   * snapshots copy mutable placements. Projected evaluation returns selected
   * bones and clamp records.
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
    const neutral: IAutoMovieHumanNeutral.IOutput = AutoMovieHumanNeutral.of(
      calibration,
      (): IAutoMovieHumanNeutral.ISource => ({
        rings: AutoMovieHumanBindingInputs.rings(
          calibration,
          AutoMovieHumanNeutral.LEVEL,
        ),
        joints: bind,
      }),
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
