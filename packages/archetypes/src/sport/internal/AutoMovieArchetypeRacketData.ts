import type { IAutoMovieArchetypeBand } from "../../core";
import { AutoMovieArchetypeBand } from "../../core";

/*
 * A band in metres.
 */
export const m = (
  minimum: number,
  maximum: number,
  source: string,
  provisional: boolean = false,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.metres(minimum, maximum, source, provisional);

/*
 * A mass band.
 */
export const kg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional: boolean = false,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

/*
 * ITF, Rules of Tennis 2026, Appendix II.
 */
export const ITF: string =
  "ITF Rules of Tennis 2026, Appendix II c (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

/*
 * A maker's tennis racket.
 */
export const BABOLAT: string =
  "Babolat Pure Drive Gen11, 685 mm long, a 645 cm2 head, 300 g +/- 7 unstrung (https://www.babolat.com/us/pure-drive-gen11-unstrung/100-101552.html)";

/*
 * The BWF Laws of Badminton, Law 4.
 */
export const BWF: string =
  "BWF Laws of Badminton, Law 4.1 and 4.2.2 (https://worldbadminton.com/laws/index.html)";

/*
 * Butterfly's blade sizes.
 */
export const BUTTERFLY: string =
  "Butterfly Timo Boll ALC, a 157 x 150 mm blade, a 100 x 22 to 24 mm handle, 84 to 86 g (https://www.butterflyonline.com/butterfly-blade-specifications, https://tabletennisstore.us/products/butterfly-timo-boll-alc-offensive-table-tennis-blade)";

/*
 * The squash specification as third-party pages give it.
 */
export const WSF: string =
  "the World Squash Federation racket limits of 686 mm, 215 mm and 255 g as third-party pages give them; the WSF's own specification was searched for and could not be opened";

/*
 * FIP, Rules of Padel, The Racket.
 */
export const FIP: string =
  "FIP Rules of Padel, The Racket (https://www.padelfip.com/documents/)";

/*
 * Manufacturer mass for the padel model.
 */
export const HEAD: string =
  "HEAD Gravity Motion 2027, 360 g (https://www.head.com/en_US/product/gravity-motion-2027-224027)";

/*
 * What no source read gives.
 */
export const UNREAD: string =
  "no source read gives it; the makers' pages read do not state it";
