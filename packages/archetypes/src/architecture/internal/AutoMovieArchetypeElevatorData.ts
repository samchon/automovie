import { ADA_RANGES } from "../constants/ADA_RANGES";

export namespace AutoMovieArchetypeElevatorData {
  /*
   * The accessible car read.
   */
  export const ADA: string =
    "2010 ADA Standards 407.4.1 and Table 407.4.1, centered door: door clear width 42 in (1065 mm), inside car 80 in (2030 mm) side to side, 51 in (1295 mm) back wall to front return, 54 in (1370 mm) back wall to inside face of door; a tolerance of minus 5/8 in (16 mm) on the door (https://www.access-board.gov/ada/chapter/ch04/)";

  /*
   * The call button's height read.
   */
  export const CALL: string = `2010 ADA Standards 407.2.1.1, call buttons "located within one of the reach ranges specified in 308", measured to the centreline of the highest operable part (https://www.access-board.gov/ada/chapter/ch04/); ${ADA_RANGES.reach.source}`;
}
