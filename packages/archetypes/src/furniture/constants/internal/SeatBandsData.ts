
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";

export namespace SeatBandsData {
  /*
   * A band in metres.
   */
  export const band = (
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("m", minimum, maximum, source, provisional);

  /*
   * A provisional mass band in kilograms per place.
   */
  export const mass = (minimum: number, maximum: number): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of(
      "kg",
      minimum,
      maximum,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    );

  /*
   * Seat heights of chairs and lounge chairs reviewed by Blackler et al. 2018.
   */
  export const LOUNGE: string =
    "Blackler et al. 2018, Seating in aged care, SAGE Open Medicine: an optimal chair seat height of 430 mm and lounge seat heights of 380 to 457 mm (Christenson 1990) (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

  /*
   * Seat depth reviewed by Blackler et al. 2018.
   */
  export const DEPTH: string =
    "AS/NZS 4688.1:2000 effective seat depth 380 to 480 mm, as cited by Blackler et al. 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

  /*
   * Seat width between a recommended chair width and the office minimum.
   */
  export const WIDTH: string =
    "409 mm recommended by Kothiyal and Tettey 2001, as cited by Blackler et al. 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957), up to the 17.7 in minimum of ANSI/HFES 100-2007 p. 87 (https://uhs.berkeley.edu/sites/default/files/uc_task_chair_requirements_1.pdf)";

  /*
   * Back height between the office chair minimum and the bench back support.
   */
  export const BACK: string =
    "EN 1335-1:2020 Table 2, backrest at least 360 mm high (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf), up to the 18 in (455 mm) back support of 2010 ADA Standards 903.4 (https://www.access-board.gov/ada/)";

  /*
   * Fixed armrest height of an office chair, applied to upholstered arms.
   */
  export const ARMS: string =
    "EN 1335-1:2020 Table 2, fixed armrest height above the seat of type B, 225 to 275 mm (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf); Holden and Fernie 1989 give 250 mm (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

  /*
   * A stool's seat diameter, for which no standard was found.
   */
  export const STOOL: string = "typical round stool seat, not read at a source";
}
