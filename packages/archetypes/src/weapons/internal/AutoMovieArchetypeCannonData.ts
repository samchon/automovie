import { AutoMovieArchetypeUnits } from "../../core/index";

export namespace AutoMovieArchetypeCannonData {
  /*
   * A hundredweight, kilograms: 112 pounds.
   */
  export const CWT: number = 112 * AutoMovieArchetypeUnits.POUND;

  /*
   * Griffiths' table of iron ordnance.
   */
  export const GRIFFITHS: string =
    "Griffiths, The Artillerist's Manual (1856), Length, Weight, Calibre, Charge, &c., of Ordnance: the iron 32-pounder of 56 cwt, 9 ft 6 in long, bore 6.41 in; its common garrison carriage 13 cwt 3 qr; trucks for land service, fore 1 ft 7 in and hind 1 ft 4 in (https://www.gutenberg.org/ebooks/73341)";

  /*
   * A swivel gun read at its museum record.
   */
  export const SWIVEL: string =
    "Royal Museums Greenwich KTP0053, bronze muzzleloading smoothbore swivel gun: calibre 2.25 in, overall 1000 x 170 x 101 mm (https://www.rmg.co.uk/collections/objects/rmgc-object-36835)";

  /*
   * Douglas's naval gunnery.
   */
  export const DOUGLAS: string =
    "Douglas, A Treatise on Naval Gunnery, 5th ed. (1860), p. 110: a 32-pounder with its carriage of 65 cwt, a 10 lb charge, a shot's initial velocity of 1600 ft/s, and a recoil observed at 9 ft on a platform inclined 2 1/2 degrees (https://archive.org/details/atreatiseonnava00douggoog)";
}
