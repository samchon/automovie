import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { prepareAutoMovieMassModel } from "../kinematics/prepareAutoMovieMassModel";
import { resolveAutoMovieMomentum } from "../kinematics/resolveAutoMovieMomentum";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";

/**
 * The three reductions a flight's shape history makes of posed bones, chosen
 * together for one mass model: the posed mass parts of a bone map, the
 * momentum of the motion between two posed instants, and a posed instant's
 * composite inertia tensor about its centre; with the admission of that
 * tensor. A raw model reduces through `resolveAutoMovieMomentum` and
 * `physicalInertiaTensor`; a prepared token through its own entries, which
 * share its private last-frame work. Constructing the reduction of a
 * prepared token reads the token once, so a released token is refused before
 * any shape is read.
 *
 * @param model The body's mass model, or a prepared token of it that stays unreleased while the reduction is used.
 * @returns The reductions of that one model.
 * @throws {Error} For a released prepared token.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three reductions, their owners for each kind of model, the token's admission and the tensor's.
 * @evidence contracts/development/implementation.md#principled-implementation The mass snapshot and its reductions are selected together, so an unrelated raw model cannot be paired with a prepared token; each reduction is its existing owner's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One selection by the model's kind; the histories that read shapes own their sampling and memo.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reduction is restated: every number comes from the existing momentum and tensor owners, and the admission keeps their zero and NaN refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant selection; each reduction keeps its owner's O(S) work over the model's S parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the stencil history and the tabulated history; a prepared token's private frame reuse stays inside its own entries.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the model reference only, for as long as its history does; the caller releases a prepared token after its history.
 */
export function AirborneShapeReduction(
  model: IAutoMovieResolveCenterOfMass.IModel | prepareAutoMovieMassModel.IPrepared,
): AirborneShapeReduction.IReduction {
  if (!("segments" in model)) prepareAutoMovieMassModel.bones(model);
  return "segments" in model
    ? {
        pose: (bones: AirborneShapeReduction.IBones): resolveAutoMovieMomentum.IPosed =>
          resolveAutoMovieMomentum.pose(model, bones),
        between: (
          before: resolveAutoMovieMomentum.IPosed,
          after: resolveAutoMovieMomentum.IPosed,
          seconds: number,
        ): IAutoMovieBodyMomentum =>
          resolveAutoMovieMomentum.between(model, before, after, seconds),
        tensor: (posed: resolveAutoMovieMomentum.IPosed): number[][] =>
          physicalInertiaTensor(posed.parts, posed.centre),
        admit,
      }
    : {
        pose: (bones: AirborneShapeReduction.IBones): resolveAutoMovieMomentum.IPosed =>
          prepareAutoMovieMassModel.pose(model, bones),
        between: (
          before: resolveAutoMovieMomentum.IPosed,
          after: resolveAutoMovieMomentum.IPosed,
          seconds: number,
        ): IAutoMovieBodyMomentum =>
          prepareAutoMovieMassModel.between(model, before, after, seconds),
        tensor: (posed: resolveAutoMovieMomentum.IPosed): number[][] =>
          prepareAutoMovieMassModel.inertia(model, posed),
        admit,
      };
}

/** Refuse a tensor with no positive finite scale, before any rate or stencil work reads it. */
function admit(matrix: number[][]): void {
  let scale: number = Number.NEGATIVE_INFINITY;
  for (const row of matrix)
    for (const value of row) scale = Math.max(scale, Math.abs(value));
  if (!(scale > 0)) throw new Error("Invalid aggregate inertia tensor");
}

/**
 * The reductions of one mass model and the bone map they read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its input, output, frame and unit.
 * @evidence contracts/development/design.md#principled-representation Posed parts, an interval's momentum and a tensor: the sufficient statistics of a shape for the flight's equation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four operations, each read by a shape history.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The records are the momentum owner's own; nothing is restated.
 */
export namespace AirborneShapeReduction {
  /** Resolved bones by name, in one common frame: the map a shape callback returns. */
  export type IBones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;

  /** One model's reductions; both kinds of model give all four. */
  export interface IReduction {
    /** The model's rigid parts and mass-weighted centre under a bone map, in the bones' frame. */
    pose(bones: IBones): resolveAutoMovieMomentum.IPosed;

    /** The momentum of the motion from one posed instant to another `seconds` later; its angular part is about the mean of their centres, kg m²/s. */
    between(
      before: resolveAutoMovieMomentum.IPosed,
      after: resolveAutoMovieMomentum.IPosed,
      seconds: number,
    ): IAutoMovieBodyMomentum;

    /** A posed instant's composite inertia tensor about its centre, kg m², as fresh rows. */
    tensor(posed: resolveAutoMovieMomentum.IPosed): number[][];

    /** Throw unless the tensor has a positive finite scale. */
    admit(matrix: number[][]): void;
  }
}
