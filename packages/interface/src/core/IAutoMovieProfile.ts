import { IAutoMovieGait } from "../motion/IAutoMovieGait";
import { IAutoMovieChannelLimit } from "./IAutoMovieChannelLimit";
import { IAutoMovieDriver } from "./IAutoMovieDriver";
import { IAutoMovieProfileControl } from "./IAutoMovieProfileControl";
import { IAutoMovieProfileTrait } from "./IAutoMovieProfileTrait";

/**
 * A profile (= USD applied schema): a declarative capability layered onto a
 * subtree of the node graph that gives it a domain semantics: a named set of
 * controls, the standard drivers that resolve them, and the constraints that
 * bound them. The humanoid profile is the first instance (a bone-name → control
 * map plus anatomical ROM, eye look-at, finger curl); a door profile is a
 * one-DOF hinge; a costume profile is a cloth/spring rig.
 *
 * Profiles are **data, not code**: a new rig kind (or a community mod: a new
 * preset, hair pack, ethnicity) ships as a profile descriptor, registered at
 * runtime, never a release. This is the mechanism that keeps automovie additive
 * and mod-friendly, and the reason the model is expressed as interfaces rather
 * than classes. Adding a control with a default is a non-breaking change (old
 * data still resolves), so profiles version only on removals/type changes.
 *
 * Node references inside `limits` and `drivers` are semantic keys, not node
 * ids: `bindProfile` maps each through an {@link IAutoMovieProfileBinding}'s
 * `boneMap`, prepends the placement prefix, and throws on an unmapped or blank
 * key, while pointer channels pass through unchanged. No engine pass reads or
 * binds `controls` today.
 *
 * @evidence contracts/common.md#principled-implementation A USD-style applied schema as plain data: semantic keys in limits and drivers are resolved per application by `bindProfile` through the binding's `boneMap`, so one profile serves every bound subtree without being copied.
 * @evidence contracts/common.md#clear-and-simple-design Limits, drivers, controls, traits and gaits sit on one declarative record; `controls` and `traits` have no runtime consumer beyond validation and legacy-record conversion, which this chapter's rule against presumed future needs flags, and `gaits` is a documented one-way reference into motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile name is special-cased by binding or validation; an unmapped semantic key throws in `bindProfile` instead of silently dropping the limit or driver that cited it.
 * @evidence contracts/common.md#meaningful-documentation States that node references are semantic keys and how they bind, that pointers pass through, which fields lack a runtime consumer, the trait rule and its current readers, and why gaits reach into motion.
 * @author Samchon
 */
export interface IAutoMovieProfile {
  /** Stable id. */
  id: string;

  /** Profile name (e.g. `"humanoid"`, `"hinge"`). */
  name: string;

  /** The named controls this profile exposes; no engine pass reads them yet. */
  controls: IAutoMovieProfileControl[];

  /**
   * Standard drivers that resolve the controls (eye look-at, finger curl,
   * springs), with node fields written as semantic keys.
   */
  drivers: IAutoMovieDriver[];

  /**
   * Standard value constraints (the profile's default ROM / limits), with node
   * channels written as semantic keys. A violation of one is reported with this
   * profile's id.
   */
  limits: IAutoMovieChannelLimit[];

  /**
   * Typed semantic capabilities this profile proves.
   *
   * Omitted is equivalent to an empty list. An engine verb must find the
   * matching trait here; model names and free-form capability labels never
   * grant permission. Locomotion remains the existing `gaits` capability and is
   * not duplicated as a second trait marker. Today only
   * `validateProfileCapabilities` and the production design lint read traits.
   */
  traits?: IAutoMovieProfileTrait[];

  /**
   * The characteristic gaits this profile's body performs
   * ({@link IAutoMovieGait}): a horse profile's walk/trot/canter/gallop, a
   * humanoid's walk/run. The engine binds them onto a concrete skeleton to
   * synthesise locomotion, so the same abstract "move" resolves to each body's
   * own gait. Omitted/empty for a profile that does not locomote (a door, a
   * prop).
   *
   * This field is core's one upward reference (`core → motion`), kept
   * deliberately: a gait names humanoid bones and easing curves, so moving it
   * into core would drag `core → skeleton` and a second `core → motion` edge
   * along, replacing one documented type-only reference on an optional field
   * with two worse ones. The dependency is acyclic and confined to this field.
   */
  gaits?: IAutoMovieGait[];
}
