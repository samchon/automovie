import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { AutoMovieArchetypeDrawSession } from "./AutoMovieArchetypeDrawSession";
import type { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";
import type { AutoMovieArchetypeMaterial } from "./AutoMovieArchetypeMaterial";

/**
 * The builder's producer identity and primitive-part options.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Owns builder input records, dimension provenance, physical material declaration, optical colour, relative mass and part placement units.
 * @evidence contracts/development/design.md#principled-representation Typed records separate producer metadata from primitive part options, using existing SI vectors, quaternion and physical material owners. Material admission and positive density or complete mass-share validation remain runtime responsibilities.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieArchetypeBuilder and its existing public aliases consume these records without duplicating their fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No producer-specific branch or additional coefficient representation is introduced; existing density/share looseness remains documented on IOptions.
 */
export namespace ArchetypeBuilderTypes {
  /**
   * A model's identity and its producer's draws.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The model's identity and the producer's draw session, which carries the producer's name, the values keyed by its closed union and where each came from, so the archetype's record is the session's and cannot disagree with it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the builder; every producer writes one and `build` reads every member. `id` is optional because a scene holding one such thing needs none.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No registry key: the archetype's name is text for messages only.
   */
  export interface IProps<Dimension extends string> {
    /** The model's id; the producer's name when absent. */
    id?: string;

    /** The model's readable name. */
    name: string;

    /** The producer's draws, whose values the archetype records as its dimensions and whose provenance it keeps. */
    draw: AutoMovieArchetypeDrawSession<Dimension>;

    /** Physical reference material, separate from optical colours. Every producer declares it; build also refuses missing or unknown names received from an untyped caller rather than inferring them. */
    material: AutoMovieArchetypeMaterial.Kind;
  }

  /**
   * How one part differs from a grey solid of unit density at its unrotated place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation Optical swatch and proxy opacity, followed by positive relative density or absolute mass share, rigid rotation and physical surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the builder; each member is read when a part is recorded and set by at least one producer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Density and share are two optional members, not a union: a looseness that remains, bounded by the rule on `share` that a producer stating one states it for every part.
   */
  export interface IOptions {
    /** The part's flat colour as an sRGB swatch `#rrggbb`; a mid grey when absent. */
    color?: string;

    /** Zero for an explicitly transparent collision and mass proxy. The default surface is opaque. */
    opacity?: 0;

    /** The part's density relative to the other parts, positive; 1 when absent. It only shifts the centre of mass and inertia, since the total mass is stated. */
    density?: number;

    /** The part's share of the total mass, replacing its volume times density, for a body whose segment masses are measured; a producer that states one states it for every part. */
    share?: number;

    /** The part's rotation in the model's space, a unit quaternion; unrotated when absent. */
    rotation?: IAutoMovieQuaternion;

    /** What the part's surface is made of, for a part something touches: a tyre, a grip, a seat, a sole; undeclared when absent. `AutoMovieArchetype.friction` reads it against another material. */
    surface?: AutoMovieArchetypeFriction.Material;
  }
}
