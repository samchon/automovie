import {
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../core/index";
import type { AutoMovieArchetypeHandhold } from "../AutoMovieArchetypeHandhold";



export namespace AutoMovieArchetypeHandholdData {
  /*
   * The federal handrail rule read.
   */
  export const CFR: string =
    "49 CFR 38.29(b): handrails between 1 1/4 and 1 1/2 inches in cross-sectional diameter, with at least 1 1/2 inches of knuckle clearance (https://www.govinfo.gov/content/pkg/CFR-2023-title49-vol1/xml/CFR-2023-title49-vol1-sec38-29.xml)";

  /*
   * The bus specification read.
   */
  export const DULUTH: string =
    "Duluth Transit Authority heavy-duty bus technical specifications (28 August 2020), 1.21 Passenger Assists: assists 1 1/4 inch in diameter, the overhead assist no less than 70 inches above the floor (https://www.duluthtransit.com/wp-content/uploads/2020/08/Heavy-Duty-Buses-Technical-Specifications.pdf)";

  /*
   * A strap's loop, metres: HAPPICH's 200 mm drawing label, the grip at its foot.
   */
  export const LOOP: number = 200 * AutoMovieArchetypeUnits.MILLIMETRE;

  /*
   * The bands every handhold shares.
   */
  export const SHARED: Readonly<Partial<Record<AutoMovieArchetypeHandhold.Dimension, IAutoMovieArchetypeBand>>> =
    {
      height: AutoMovieArchetypeBand.metres(
        70 * AutoMovieArchetypeUnits.INCH,
        70 * AutoMovieArchetypeUnits.INCH,
        `${DULUTH}; the model takes the least`,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        1.25 * AutoMovieArchetypeUnits.INCH,
        1.5 * AutoMovieArchetypeUnits.INCH,
        CFR,
      ),
    };
}
