import type { IAutoMovieHumanSkinScattering } from "./IAutoMovieHumanSkinScattering";

/**
 * Reusable finish properties for skin materials supplied by different bases.
 *
 * A person's skin is one organ drawn from two surfaces, the head's and the
 * body's, that meet at the neck. Whatever the renderer does to skin beyond
 * its albedo has to be the same on both sides of that join, or the join shows
 * as a change of material where the geometry is continuous. This record is
 * that shared part. Albedo is not in it: a person states one cheek colour,
 * the face wears it, and the body derives its sites from it and returns to
 * the cheek's own colour at the neck's cut.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanSkinFinish {
  /** Material id consumers use to identify their skin. */
  material: string;

  /** Subsurface scattering distance per linear RGB primary. */
  scattering: IAutoMovieHumanSkinScattering;
}
