import { IAutoMovieGait } from "../motion/IAutoMovieGait";
import { IAutoMovieChannelLimit } from "./IAutoMovieChannelLimit";
import { IAutoMovieDriver } from "./IAutoMovieDriver";
import { IAutoMovieProfileTrait } from "./IAutoMovieProfileTrait";

/**
 * A profile (a USD applied schema): a declarative capability layered onto a subtree of the node graph, contributing drivers, channel limits, typed traits and gaits.
 *
 * A model lists profile data, and an application pairs a profile with IAutoMovieProfileBinding. Limits, drivers, traits and gait declarations contribute only the behavior their existing consumers implement.
 *
 * Node references inside limits and drivers are semantic keys: bindProfile reads an own boneMap entry, prepends the placement prefix and refuses missing entries or blank mapped node ids. Pointer channels pass through unchanged. Bound-limit findings carry the profile id; traits declare capability metadata without performing an action.
 *
 * @evidence contracts/common.md#principled-implementation bindProfile maps cited node references and refuses gaps; bindProfileGaits synthesizes each uniquely named gait for the target skeleton. validateProfileCapabilities requires nonblank profile ids and names, unique ids among a model's profiles and at most one trait of each kind; display names need not be unique.
 * @evidence contracts/common.md#clear-and-simple-design One record groups everything a capability contributes so a single binding applies it, with each member typed by the pass that owns it; the `gaits` field is the one `core` to `motion` reference, kept because moving gaits into `core` would pull skeleton and easing types after it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profiles are matched by id and capabilities by typed trait, never by model or profile name; only executable drivers, admitted limits, capability traits and synthesized gaits are carried, without an unread control-default channel.
 * @evidence contracts/common.md#meaningful-documentation States profile ownership, semantic mapping and binding failures, insertion versus dependency execution order, limit precedence, capability metadata admission and gait-name uniqueness.
 * @author Samchon
 */
export interface IAutoMovieProfile {
  /**
   * Id a binding's `profile` must equal; non-blank and unique among one model's profiles, and attached to every violation of a bound limit.
   */
  id: string;

  /** Non-blank profile name, such as `"humanoid"` or `"hinge"`. */
  name: string;

  /**
   * Drivers contributed with semantic node keys. Bound descriptors precede direct descriptors in the frame's input list; channel-space dependency sorting may reorder execution, while world drivers preserve their combined list order.
   */
  drivers: IAutoMovieDriver[];

  /**
   * Value limits the profile contributes (its default range of motion), with node channels written as semantic keys. Bound limits clamp before the caller's own limits, so a caller's limit has the final word.
   */
  limits: IAutoMovieChannelLimit[];

  /**
   * Typed semantic capabilities this profile declares, at most one of each kind; omitted is an empty list.
   *
   * `validateProfileCapabilities` and the production design lint validate them; declaring a trait alone performs no action. Model names and free-form labels are never a substitute. Locomotion is the gaits field, not a trait.
   */
  traits?: IAutoMovieProfileTrait[];

  /**
   * The characteristic gaits this profile's body performs, such as a horse's walk, trot, canter and gallop. `bindProfileGaits` synthesises each one into a clip for a concrete skeleton, so one gait set drives many bodies, and throws on a repeated gait name. Omitted or empty for a profile that does not locomote, such as a door.
   */
  gaits?: IAutoMovieGait[];
}
