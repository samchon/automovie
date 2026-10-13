import { IAutoMovieGait } from "../motion/IAutoMovieGait";
import { IAutoMovieChannelLimit } from "./IAutoMovieChannelLimit";
import { IAutoMovieDriver } from "./IAutoMovieDriver";
import { IAutoMovieProfileControl } from "./IAutoMovieProfileControl";
import { IAutoMovieProfileTrait } from "./IAutoMovieProfileTrait";

/**
 * A profile (a USD applied schema): a declarative capability layered onto a
 * subtree of the node graph, giving it named controls, the drivers that
 * resolve them, the limits that bound them, typed traits and gaits.
 *
 * Profiles are data, not code. A model or model recipe lists its profiles, and
 * an application pairs one with an {@link IAutoMovieProfileBinding}, so a new
 * rig kind ships as a record rather than an engine release. The shipped
 * humanoid, horse and cat profiles carry only gaits; a forged prop's
 * articulation profile carries hinge limits and drivers.
 *
 * Node references inside `limits` and `drivers` are semantic keys, not node
 * ids: `bindProfile` maps each through the binding's `boneMap`, prepends the
 * placement prefix, and throws on an unmapped or blank key, while pointer
 * channels pass through unchanged. A violation of a bound limit is reported
 * with this profile's id. No engine pass reads or binds `controls`, and no
 * engine verb consults `traits` yet.
 *
 * @evidence contracts/common.md#principled-implementation `bindProfile` rewrites every node reference in limits and drivers through one total mapping and fails on any gap, `bindProfileGaits` synthesises each named gait into a clip for the bound skeleton, and `validateProfileCapabilities` requires a non-blank id and name unique among a model's profiles and at most one trait of each kind.
 * @evidence contracts/common.md#clear-and-simple-design One record groups everything a capability contributes so a single binding applies it, with each member typed by the pass that owns it; the `gaits` field is the one `core` to `motion` reference, kept because moving gaits into `core` would pull skeleton and easing types after it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Profiles are matched by id and capabilities by typed trait, never by model or profile name; `controls` is unread and documented as such rather than given a placeholder consumer, which remains an open gap in this core type.
 * @evidence contracts/common.md#meaningful-documentation States where profiles live, which shipped profiles fill which members, that node references are semantic keys and how they are bound and fail, which members no pass reads, and the validation rules on id, name, traits and gait names.
 * @author Samchon
 */
export interface IAutoMovieProfile {
  /**
   * Id a binding's `profile` must equal; non-blank and unique among one
   * model's profiles, and attached to every violation of a bound limit.
   */
  id: string;

  /** Non-blank profile name, such as `"humanoid"` or `"hinge"`. */
  name: string;

  /** The named controls this profile exposes; no engine pass reads them. */
  controls: IAutoMovieProfileControl[];

  /**
   * Drivers the profile contributes, with node fields written as semantic
   * keys. Bound drivers run before the caller's own drivers in the same frame.
   */
  drivers: IAutoMovieDriver[];

  /**
   * Value limits the profile contributes (its default range of motion), with
   * node channels written as semantic keys. Bound limits clamp before the
   * caller's own limits, so a caller's limit has the final word.
   */
  limits: IAutoMovieChannelLimit[];

  /**
   * Typed semantic capabilities this profile declares, at most one of each
   * kind; omitted is an empty list.
   *
   * `validateProfileCapabilities` and the production design lint validate
   * them, and no engine verb consults them yet. Model names and free-form
   * labels are never a substitute. Locomotion is the `gaits` field, not a
   * trait.
   */
  traits?: IAutoMovieProfileTrait[];

  /**
   * The characteristic gaits this profile's body performs, such as a horse's
   * walk, trot, canter and gallop. `bindProfileGaits` synthesises each one into
   * a clip for a concrete skeleton, so one gait set drives many bodies, and
   * throws on a repeated gait name. Omitted or empty for a profile that does
   * not locomote, such as a door.
   */
  gaits?: IAutoMovieGait[];
}
