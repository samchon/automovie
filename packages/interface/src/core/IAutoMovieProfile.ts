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
 * @author Samchon
 */
export interface IAutoMovieProfile {
  /** Stable id. */
  id: string;

  /** Profile name (e.g. `"humanoid"`, `"hinge"`). */
  name: string;

  /** The named controls this profile exposes. */
  controls: IAutoMovieProfileControl[];

  /**
   * Standard drivers that resolve the controls (eye look-at, finger curl,
   * springs).
   */
  drivers: IAutoMovieDriver[];

  /** Standard value constraints (the profile's default ROM / limits). */
  limits: IAutoMovieChannelLimit[];

  /**
   * Typed semantic capabilities this profile proves.
   *
   * Omitted is equivalent to an empty list. An engine verb must find the
   * matching trait here; model names and free-form capability labels never
   * grant permission. Locomotion remains the existing `gaits` capability and is
   * not duplicated as a second trait marker.
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
