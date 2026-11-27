import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import type { AutoMovieArchetypeBall } from "../AutoMovieArchetypeBall";
import * as BallBuildData from "./BallBuildData";
import {
  round as BallBuildDataRound,
  kg as BallBuildDataKg,
} from "./BallBuildData";

/*
 * The ball and puck specifications, draw and local grip and top contacts.
 */
export namespace BallBuild {
  /*
   * The values draw accepts at this place in its signature.
   */
  export type DrawMaterial = "composite" | "rubber";

  /*
   * What draw prepares for its caller.
   */
  export interface IDrawResult<Id extends AutoMovieArchetypeBall.Affordance> {
    /*
     * The prepared `builder` this call returns.
     */
    builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeBall.Dimension>;

    /*
     * The prepared `d` this call returns.
     */
    d: Partial<Record<AutoMovieArchetypeBall.Dimension, number>>;
  }

  /*
   * The saved kinds in their original order.
   */
  export const KINDS: readonly AutoMovieArchetypeBall.Kind[] = [
    "football",
    "futsal",
    "basketball",
    "volleyball",
    "handball",
    "tennis",
    "tableTennis",
    "padel",
    "squash",
    "baseball",
    "softball",
    "golf",
    "cricket",
    "bowling",
    "pool",
    "rugby",
    "americanFootball",
    "fieldHockey",
    "lacrosse",
    "puck",
  ];

  /*
   * The grip aperture threshold in metres, a grasp estimate retained from the
   * original producer.
   */
  export const TWO_HANDS: number = 0.2;

  /*
   * The original flat sRGB colours by recipe.
   */
  export const COLORS: Readonly<Record<AutoMovieArchetypeBall.Kind, string>> = {
    football: "#f2f2f2",
    futsal: "#f0e7ce",
    basketball: "#d2691e",
    volleyball: "#f5e6a8",
    handball: "#3a7bd5",
    tennis: "#d4e157",
    tableTennis: "#fafafa",
    padel: "#d4e157",
    squash: "#202020",
    baseball: "#f5f5f0",
    softball: "#f0e68c",
    golf: "#fafafa",
    cricket: "#9b1c1c",
    bowling: "#1f3a93",
    pool: "#faf5e8",
    rugby: "#f2efe6",
    americanFootball: "#7a3e1d",
    fieldHockey: "#f5f5ec",
    lacrosse: "#fafafa",
    puck: "#111111",
  };

  /*
   * The recorded units of each dimension.
   */
  export const UNITS: Readonly<
    Record<AutoMovieArchetypeBall.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    length: "m",
    mass: "kg",
  };

  /*
   * The published bands by sport and shape.
   */
  export const BANDS: Readonly<
    Record<
      AutoMovieArchetypeBall.Kind,
      Readonly<Partial<Record<AutoMovieArchetypeBall.Dimension, IAutoMovieArchetypeBand>>>
    >
  > = {
    football: {
      diameter: BallBuildDataRound(0.68, 0.7, `${BallBuildData.IFAB}: circumference 68 to 70 cm`),
      mass: BallBuildDataKg(0.41, 0.45, `${BallBuildData.IFAB}: 410 to 450 g at the start of the match`),
    },
    basketball: {
      diameter: BallBuildDataRound(0.75, 0.77, `${BallBuildData.FIBA}: circumference 750 to 770 mm`),
      mass: BallBuildDataKg(0.58, 0.62, `${BallBuildData.FIBA}: 580 to 620 g`),
    },
    volleyball: {
      diameter: BallBuildDataRound(0.65, 0.67, `${BallBuildData.FIVB}: circumference 65 to 67 cm`),
      mass: BallBuildDataKg(0.26, 0.28, `${BallBuildData.FIVB}: 260 to 280 g`),
    },
    handball: {
      diameter: BallBuildDataRound(0.58, 0.6, `${BallBuildData.IHF}: circumference 58 to 60 cm`),
      mass: BallBuildDataKg(0.425, 0.475, `${BallBuildData.IHF}: 425 to 475 g`),
    },
    tennis: {
      diameter: AutoMovieArchetypeBand.metres(
        0.0654,
        0.0686,
        `${BallBuildData.ITF}: size 6.54 to 6.86 cm`,
      ),
      mass: BallBuildDataKg(0.056, 0.0594, `${BallBuildData.ITF}: 56.0 to 59.4 g`),
    },
    baseball: {
      diameter: BallBuildDataRound(
        9 * AutoMovieArchetypeUnits.INCH,
        9.25 * AutoMovieArchetypeUnits.INCH,
        `${BallBuildData.OBR}: not less than nine nor more than 9 1/4 in round`,
      ),
      mass: BallBuildDataKg(
        5 * AutoMovieArchetypeUnits.OUNCE,
        5.25 * AutoMovieArchetypeUnits.OUNCE,
        `${BallBuildData.OBR}: not less than five nor more than 5 1/4 oz`,
      ),
    },
    softball: {
      diameter: BallBuildDataRound(0.302, 0.308, BallBuildData.WBSC),
      mass: BallBuildDataKg(0.178, 0.1984, BallBuildData.WBSC),
    },
    golf: {
      diameter: AutoMovieArchetypeBand.metres(
        0.04267,
        0.04267,
        `${BallBuildData.RANDA}: not less than 1.680 in (42.67 mm) across, the limit the model takes`,
      ),
      mass: BallBuildDataKg(
        0.045,
        0.04593,
        `${BallBuildData.RANDA}: not greater than 1.620 oz (45.93 g); the rule sets no least weight and no maker's ball weight was read, so the lower end is provisional`,
        true,
      ),
    },
    cricket: {
      diameter: BallBuildDataRound(0.224, 0.229, `${BallBuildData.MCC}: 22.4 to 22.9 cm round`),
      mass: BallBuildDataKg(0.1559, 0.163, `${BallBuildData.MCC}: 155.9 to 163 g`),
    },
    bowling: {
      diameter: AutoMovieArchetypeBand.metres(
        8.5 * AutoMovieArchetypeUnits.INCH,
        8.595 * AutoMovieArchetypeUnits.INCH,
        `${BallBuildData.USBC}: 8.500 to 8.595 in in diameter`,
      ),
      mass: BallBuildDataKg(
        16 * AutoMovieArchetypeUnits.POUND,
        16 * AutoMovieArchetypeUnits.POUND,
        `${BallBuildData.USBC}: not exceeding 16.00 lb, with no minimum, the limit the model takes`,
      ),
    },
    rugby: {
      diameter: BallBuildDataRound(0.58, 0.62, BallBuildData.RUGBY),
      length: AutoMovieArchetypeBand.metres(0.28, 0.3, BallBuildData.RUGBY),
      mass: BallBuildDataKg(0.41, 0.46, BallBuildData.RUGBY),
    },
    americanFootball: {
      diameter: BallBuildDataRound(
        21 * AutoMovieArchetypeUnits.INCH,
        21.25 * AutoMovieArchetypeUnits.INCH,
        BallBuildData.NFL,
      ),
      length: AutoMovieArchetypeBand.metres(
        11 * AutoMovieArchetypeUnits.INCH,
        11.25 * AutoMovieArchetypeUnits.INCH,
        BallBuildData.NFL,
      ),
      mass: BallBuildDataKg(
        14 * AutoMovieArchetypeUnits.OUNCE,
        15 * AutoMovieArchetypeUnits.OUNCE,
        BallBuildData.NFL,
      ),
    },
    futsal: {
      diameter: BallBuildDataRound(0.62, 0.64, BallBuildData.FUTSAL),
      mass: BallBuildDataKg(0.4, 0.44, BallBuildData.FUTSAL),
    },
    tableTennis: {
      diameter: AutoMovieArchetypeBand.metres(0.04, 0.04, BallBuildData.ITTF),
      mass: BallBuildDataKg(0.00267, 0.00277, BallBuildData.ITTF_MASS),
    },
    padel: {
      diameter: AutoMovieArchetypeBand.metres(0.0635, 0.0677, BallBuildData.FIP),
      mass: BallBuildDataKg(0.056, 0.0594, BallBuildData.FIP),
    },
    squash: {
      diameter: AutoMovieArchetypeBand.metres(0.0395, 0.0405, BallBuildData.WSF),
      mass: BallBuildDataKg(0.023, 0.025, BallBuildData.WSF),
    },
    pool: {
      diameter: AutoMovieArchetypeBand.metres(
        2.25 * AutoMovieArchetypeUnits.INCH,
        2.255 * AutoMovieArchetypeUnits.INCH,
        BallBuildData.WPA,
      ),
      mass: BallBuildDataKg(
        5.5 * AutoMovieArchetypeUnits.OUNCE,
        6 * AutoMovieArchetypeUnits.OUNCE,
        BallBuildData.WPA,
      ),
    },
    fieldHockey: {
      diameter: BallBuildDataRound(0.224, 0.235, BallBuildData.FIH),
      mass: BallBuildDataKg(0.156, 0.163, BallBuildData.FIH),
    },
    lacrosse: {
      diameter: BallBuildDataRound(0.197, 0.203, BallBuildData.SIXES),
      mass: BallBuildDataKg(0.14175, 0.14883, BallBuildData.SIXES),
    },
    puck: {
      diameter: AutoMovieArchetypeBand.metres(0.076, 0.076, BallBuildData.PUCK),
      length: AutoMovieArchetypeBand.metres(0.025, 0.025, BallBuildData.PUCK),
      mass: BallBuildDataKg(0.156, 0.17, BallBuildData.PUCK),
    },
  };

  /*
   * Draw the selected shape profile in the original ball seed namespace.
   */
  export function draw<Id extends AutoMovieArchetypeBall.Affordance>(
    kind: AutoMovieArchetypeBall.Kind,
    params: Readonly<Omit<AutoMovieArchetypeBall.IParams, "kind">>,
    seed: number | undefined,
    material: DrawMaterial,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBall.Dimension> =
      new AutoMovieArchetypeDrawSession("ball", UNITS, seed, params);
    const d: Partial<Record<AutoMovieArchetypeBall.Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<Id, AutoMovieArchetypeBall.Dimension> =
      new AutoMovieArchetypeBuilder({
        material,
        id: params.id,
        name: kind === "puck" ? "puck" : `${kind} ball`,
        draw,
      });
    return { builder, d };
  }

  /*
   * Declare a centre grip and upper contact for a shape whose lowest point lies
   * at the ground origin.
   * Parameter builder: The ball or puck builder that receives the contacts.
   * Parameter diameter: The short diameter in metres. It selects the grip pattern.
   * Parameter high: The model's height from the floor in metres. It sets the grip
   * aperture and top coordinate.
   */
  export function contacts(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeBall.Affordance,
      AutoMovieArchetypeBall.Dimension
    >,
    diameter: number,
    high: number,
  ): void {
    const centre: IAutoMovieVector3 = Vector3.create(0, high / 2, 0);
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        centre,
        Vector3.create(0, 1, 0),
        Vector3.create(1, 0, 0),
      ),
      extent: null,
      grip: diameter > TWO_HANDS ? "two-hand" : "power",
      aperture: high,
    });
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, high, 0)),
      extent: null,
    });
  }
}
