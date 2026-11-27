import { AutoMovieArchetypeUnits } from "../../../core";

/*
 * Saimre's study, with his measurements of Hansen's replica.
 */
export const SAIMRE: string =
  "Saimre, Trebuchet - a gravity-operated siege engine, Estonian Journal of Archaeology 10/1 (2006), p. 75, Hansen's Danish replica measured from its blueprint (https://kirj.ee/wp-content/plugins/kirj/pub/arch-2006-1-3_20210108123408.pdf)";

/*
 * Hansen's own report of his replica.
 */
export const HANSEN: string =
  "Hansen, Experimental reconstruction of a medieval trebuchet, Acta Archaeologica 63 (1992) (https://linnamuuseum.ee/JaanMarss/juhendid/Mehaanilised_kaugrelvad_keskajal/andmebaas/Middelaldercentret/Peter%20Vemming%20Hansen/acta.html)";

/*
 * Tarver's traction trebuchet.
 */
export const TARVER: string =
  "Tarver, The Traction Trebuchet: A Reconstruction of an Early Medieval Siege Engine, Technology and Culture 36/1 (1995), pp. 149-161 (https://uccshes.wordpress.com/wp-content/uploads/2012/09/reconstruction-of-a-traction-trebuchet.pdf)";

/*
 * What was searched and not found for the engines' frames, winches and masses.
 */
export const UNREAD: string =
  "not found (searched: Saimre 2006, Hansen 1992, Tarver 1995, Chevedden et al. 1995, Denny 2005, Siano; records-siege.md)";

/*
 * A traction trebuchet's beam, 16 ft at al-Tarsusi's six to one.
 */
export const BEAM: number = 16 * AutoMovieArchetypeUnits.FOOT;

/*
 * A traction trebuchet's pullers: twenty threw its 2.5 kg stones 100 m on
 * average (Tarver, p. 161).
 */
export const PULLERS: number = 20;

/*
 * A puller's steady haul, kilograms of weight: an estimate, no reconstruction
 * measuring a puller's force (searched: Tarver 1995, Chevedden et al. 1995).
 */
export const HAUL: number = 25;
