import type { IAutoMovieCompilePracticalLightMotion } from "./IAutoMovieCompilePracticalLightMotion";

/**
 * Bind a staged light to a named emitter on a staged prop for one shot.
 *
 * @evidence contracts/development/design.md#principled-representation Scene references identify the light and prop, and a model-local affordance id supplies emitter placement once the prop's model resolves. The shot compiler supplies duration and final object-motion clips.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Inherits clip id, sample times and switch interval from the practical compiler input. Only the scene/model references differ from the resolved input to that compiler.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The registered prop model supplies the affordance frame, and the final shot object clips determine motion. No model coordinates or second trajectory are supplied here.
 * @evidence contracts/development/common.md#meaningful-documentation Names the scene/model scopes, fixed emitter premise and the shared timing contract.
 */
export interface IAutoMoviePracticalLightBinding extends Pick<
  IAutoMovieCompilePracticalLightMotion,
  "id" | "sampleTimes" | "on"
> {
  /** Id of a point or spot light staged in this shot. */
  light: string;

  /** Id of the prop placement in the shot's scene. */
  prop: string;

  /** Fixed emitter affordance id on the prop model registered for the shot. */
  emitter: string;
}
