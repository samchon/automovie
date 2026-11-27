import type { IAutoMovieQuaternion } from "@automovie/interface";

import type { AutoMovieArchetypeDrawSession } from "../AutoMovieArchetypeDrawSession";
import type { AutoMovieArchetypeFriction } from "../AutoMovieArchetypeFriction";
import type { AutoMovieArchetypeMaterial } from "../AutoMovieArchetypeMaterial";

/*
 * The builder's producer identity and primitive-part options.
 */
export namespace ArchetypeBuilderTypes {
  /*
   * A model's identity and its producer's draws.
   */
  export interface IProps<Dimension extends string> {
    /*
     * The model's id; the producer's name when absent.
     */
    id?: string;

    /*
     * The model's readable name.
     */
    name: string;

    /*
     * The producer's draws, whose values the archetype records as its
     * dimensions and whose provenance it keeps.
     */
    draw: AutoMovieArchetypeDrawSession<Dimension>;

    /*
     * Physical reference material, separate from optical colours. Every
     * producer declares it; build also refuses missing or unknown names
     * received from an untyped caller rather than inferring them.
     */
    material: AutoMovieArchetypeMaterial.Kind;
  }

  /*
   * How one part differs from a grey solid of unit density at its unrotated
   * place.
   */
  export interface IOptions {
    /*
     * The part's flat colour as an sRGB swatch `#rrggbb`; a mid grey when
     * absent.
     */
    color?: string;

    /*
     * Opacity in [0, 1]: zero for an explicitly transparent collision and mass
     * proxy, a value below one for a blended translucent surface such as a
     * lantern's glass globe. The default surface is opaque.
     */
    opacity?: number;

    /*
     * The part's density relative to the other parts, positive; 1 when absent.
     * It only shifts the centre of mass and inertia, since the total mass is
     * stated.
     */
    density?: number;

    /*
     * The part's share of the total mass, replacing its volume times density,
     * for a body whose segment masses are measured; a producer that states one
     * states it for every part.
     */
    share?: number;

    /*
     * The part's rotation in the model's space, a unit quaternion; unrotated
     * when absent.
     */
    rotation?: IAutoMovieQuaternion;

    /*
     * What the part's surface is made of, for a part something touches: a tyre,
     * a grip, a seat, a sole; undeclared when absent.
     * `AutoMovieArchetype.friction` reads it against another material.
     */
    surface?: AutoMovieArchetypeFriction.Material;
  }
}
