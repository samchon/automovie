import { AutoMovieEngineKinematics } from "../../../kinematics/AutoMovieEngineKinematics";
import type { AutoMovieHumanoidBone, IAutoMovieBodyMomentum, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone } from "@automovie/interface";



import { AutoMoviePhysicalInertiaTensor } from "../../../physics/AutoMoviePhysicalInertiaTensor";

/**
 * The three reductions a flight's shape history makes of posed bones, chosen
 * together for one mass model: the posed mass parts of a bone map, the momentum
 * of the motion between two posed instants, and a posed instant's composite
 * inertia tensor about its centre; with the admission of that tensor. A raw
 * model reduces through `AutoMovieEngineKinematics.resolveAutoMovieMomentum` and `AutoMoviePhysicalInertiaTensor`;
 * a prepared token through its own entries, which share its private last-frame
 * work. Constructing the reduction of a prepared token reads the token once, so
 * a released token is refused before any shape is read.
 *
 * @param model The body's mass model, or a prepared token of it that stays
 *   unreleased while the reduction is used.
 * @returns The reductions of that one model.
 * @throws {Error} For a released prepared token.
 */
export function AirborneShapeReduction(
  model:
    | IAutoMovieResolveCenterOfMass.IModel
    | AutoMovieEngineKinematics.IPreparedMassModel,
): AirborneShapeReduction.IReduction {
  if (!("segments" in model)) AutoMovieEngineKinematics.prepareAutoMovieMassModelBones(model);
  return "segments" in model
    ? {
        pose: (
          bones: AirborneShapeReduction.IBones,
        ): AutoMovieEngineKinematics.IPosedBody =>
          AutoMovieEngineKinematics.resolveAutoMovieMomentumPose(model, bones),
        between: (
          before: AutoMovieEngineKinematics.IPosedBody,
          after: AutoMovieEngineKinematics.IPosedBody,
          seconds: number,
        ): IAutoMovieBodyMomentum =>
          AutoMovieEngineKinematics.resolveAutoMovieMomentumBetween(model, before, after, seconds),
        tensor: (posed: AutoMovieEngineKinematics.IPosedBody): number[][] =>
          AutoMoviePhysicalInertiaTensor.compute(posed.parts, posed.centre),
        admit,
      }
    : {
        pose: (
          bones: AirborneShapeReduction.IBones,
        ): AutoMovieEngineKinematics.IPosedBody =>
          AutoMovieEngineKinematics.prepareAutoMovieMassModelPose(model, bones),
        between: (
          before: AutoMovieEngineKinematics.IPosedBody,
          after: AutoMovieEngineKinematics.IPosedBody,
          seconds: number,
        ): IAutoMovieBodyMomentum =>
          AutoMovieEngineKinematics.prepareAutoMovieMassModelBetween(model, before, after, seconds),
        tensor: (posed: AutoMovieEngineKinematics.IPosedBody): number[][] =>
          AutoMovieEngineKinematics.prepareAutoMovieMassModelInertia(model, posed),
        admit,
      };
}

/**
 * Refuse a tensor with no positive finite scale, before any rate or stencil
 * work reads it.
 */
function admit(matrix: number[][]): void {
  let scale: number = Number.NEGATIVE_INFINITY;
  for (const row of matrix)
    for (const value of row) scale = Math.max(scale, Math.abs(value));
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
}

/** The reductions of one mass model and the bone map they read. */
export namespace AirborneShapeReduction {
  /**
   * Resolved bones by name, in one common frame: the map a shape callback
   * returns.
   */
  export type IBones = ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieResolvedBone
  >;

  /** One model's reductions; both kinds of model give all four. */
  export interface IReduction {
    /**
     * The model's rigid parts and mass-weighted centre under a bone map, in the
     * bones' frame.
     */
    pose(bones: IBones): AutoMovieEngineKinematics.IPosedBody;

    /**
     * The momentum of the motion from one posed instant to another `seconds`
     * later; its angular part is about the mean of their centres, kg m²/s.
     */
    between(
      before: AutoMovieEngineKinematics.IPosedBody,
      after: AutoMovieEngineKinematics.IPosedBody,
      seconds: number,
    ): IAutoMovieBodyMomentum;

    /**
     * A posed instant's composite inertia tensor about its centre, kg m², as
     * fresh rows.
     */
    tensor(posed: AutoMovieEngineKinematics.IPosedBody): number[][];

    /** Throw unless the tensor has a positive finite scale. */
    admit(matrix: number[][]): void;
  }
}
