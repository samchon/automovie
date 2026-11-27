
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core/index";

export namespace AutoMovieArchetypeRockData {
  /*
   * The Udden-Wentworth size classes, read in a university textbook.
   */
  export const WENTWORTH: string =
    "Udden-Wentworth grain-size scale: cobble 64 to 256 mm, boulder 256 mm and up, its small to medium classes 256 to 1024 mm (Earle, Physical Geology 2nd ed., BCcampus, 6.1, https://opentextbc.ca/physicalgeology2ed/chapter/6-1-clastic-sedimentary-rocks/)";

  /*
   * Granite's bulk density, read.
   */
  export const GRANITE: string =
    "granite's dry bulk density, 2.66 g/cm3 with a standard deviation of 0.06 over 334 samples (Encyclopaedia Britannica, Rock: physical properties, https://www.britannica.com/science/rock-geology/Physical-properties)";

  /*
   * Granite's specific gravity, its mean density plus and minus one standard
   * deviation over water's 1 g/cm3.
   */
  export const GRAVITY: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    2.6,
    2.72,
    GRANITE,
  );
}
