/**
 * How the internal anatomy of an assembly follows its skin when the body is shaped.
 *
 * An assembly is registered to one neutral skin. A shape channel moves that
 * skin, and the bones, muscles and other tissue under it have to move with
 * it or they are left behind and pierce it. This record declares that they
 * follow, and by which rule: each internal vertex takes the displacement of
 * the rest skin near it, as the inverse-distance weighted mean over its
 * nearest neutral skin vertices. A vertex close under the skin moves with
 * that skin; a vertex deep in a limb averages the skin all around it, so a
 * change of girth largely cancels there.
 *
 * This is a first, coarse rule and is declared as such. It is a smooth
 * interpolation of an exterior displacement, not a tissue model: it does not
 * keep a bone rigid, conserve a muscle's volume or know which tissue a
 * vertex belongs to. An assembly without this record follows nothing, and a
 * document whose shape differs from the registered one is then refused as
 * before.
 */
export interface IAutoMovieHumanBodyExteriorBinding {
  /** How many nearest neutral skin vertices each internal vertex averages. */
  neighbours: number;

  /** Exponent of the inverse distance that weights them. */
  power: number;

  /** Authoring account of the rule and of what it leaves unmodelled. */
  account: string;
}
