import { AutoMovieArchetypeUnits } from "../../core/index";

/*
 * The roof hatch read.
 */
export const BILCO: string =
  'Bilco Type S ladder access roof hatch product data: size "(width x length)" 36 x 30 in (914 x 762 mm), S-20 steel 183 lb (83 kg) and S-50 aluminum 110 lb (50 kg); the section drawing across the 3\'-0" (914 mm) width with the HINGE at one side and the cover held open at 70 degrees (https://www.buildsite.com/pdf/bilco/Type-S-Roof-Hatch-Ladder-Access-Product-Data-B32903.pdf)';

/*
 * A Bilco Type S hatch's sizes, metres and degrees, from the maker's sheet: the
 * opening's `width` from the ladder's side to the hinge and `length` along the
 * hinge, "36 x 30" as "(width x length)", Bilco's guide specifications saying
 * "Length denotes hinge side"; the curb's `curb` height, "12" (305mm) in
 * height", and `wall` thickness, the section's 2 1/4 in (57 mm) either side of
 * the opening; the cover's `cover` thickness, its "1" (25.4mm) concealed
 * fiberglass insulation"; and the cover's `swing`, the section's 70 degrees
 * open.
 */
export const HATCH: Readonly<{
  width: number;
  length: number;
  curb: number;
  wall: number;
  cover: number;
  swing: number;
}> = {
  width: 36 * AutoMovieArchetypeUnits.INCH,
  length: 30 * AutoMovieArchetypeUnits.INCH,
  curb: 12 * AutoMovieArchetypeUnits.INCH,
  wall: 2.25 * AutoMovieArchetypeUnits.INCH,
  cover: 1 * AutoMovieArchetypeUnits.INCH,
  swing: 70,
};
