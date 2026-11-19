import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieAffordance } from "../model/IAutoMovieAffordance";
import type { IAutoMoviePointLight } from "../scene/IAutoMoviePointLight";
import type { IAutoMovieSceneNode } from "../scene/IAutoMovieSceneNode";
import type { IAutoMovieSpotLight } from "../scene/IAutoMovieSpotLight";

/**
 * Bake a staged point or spot source at a prop's model-local emitter.
 *
 * @evidence contracts/development/design.md#principled-representation The staged node and object clips own world placement. The named affordance supplies the emitter frame, the staged light supplies photometry, and an optional half-open shot interval supplies switching.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses scene node, object clips, affordance and light contracts without new trajectory, renderer handle, or physical-light model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Placement times ask when to sample the prop, and never carry a second authored path. Switch times affect emission only.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies each borrowed source, the affine placement and beam conventions, supplied times, and boundary behavior for switching.
 */
export interface IAutoMovieCompilePracticalLightMotion {
  /** Unique id for the returned clip within the shot's lightMotions. */
  id: string;

  /** Positive finite shot duration in seconds. */
  duration: number;

  /** The staged practical light. Its intensity is the on-state value. */
  light: IAutoMoviePointLight | IAutoMovieSpotLight;

  /** Placed prop root. Its staged world TRS fills channels before they start. */
  prop: Pick<IAutoMovieSceneNode, "id" | "transform">;

  /**
   * The shot's admitted object-motion clips in playback order. Each started
   * prop TRS channel follows the engine's own per-channel clip authority.
   * Omit for a placed prop at rest.
   */
  objectMotions?: readonly IAutoMovieClip[];

  /**
   * The prop's fixed model-local emitter, such as the torch's lens or the
   * lamp's light affordance. A spot shines along the emitter's local +Y.
   * Supply the frame from the model as staged, including any fixed articulation.
   */
  emitter: Pick<IAutoMovieAffordance, "frame">;

  /**
   * Shot-local sample times in seconds within [0, duration]. Include every
   * output frame that needs exact alignment. A prop with TRS tracks requires
   * at least one explicit sample time. Position and aim interpolate between
   * samples, including around held or delayed source keys. The bake samples both shot
   * endpoints and switch boundaries, and canonicalizes order and duplicates.
   */
  sampleTimes?: readonly number[];

  /**
   * Shot-local [start, end) interval in seconds, 0 <= start < end <= duration.
   * Omit to preserve staged intensity across the shot, including its endpoint.
   */
  on?: readonly [start: number, end: number];
}
