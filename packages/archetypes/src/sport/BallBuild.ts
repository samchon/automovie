import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { createBall } from "./createBall";

/** The ball and puck specifications, draw and local grip and top contacts. */
export namespace BallBuild {
  /** The saved kinds in their original order. */
  export const KINDS: readonly createBall.Kind[] = [
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

  /**
   * The grip aperture threshold in metres, a grasp estimate retained from the
   * original producer.
   */
  export const TWO_HANDS: number = 0.2;

  /** The original flat sRGB colours by recipe. */
  export const COLORS: Readonly<Record<createBall.Kind, string>> = {
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

  /** The recorded units of each dimension. */
  export const UNITS: Readonly<
    Record<createBall.Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    length: "m",
    mass: "kg",
  };

  /** A diameter band from a rule's circumference limits, metres. */
  const round = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(
      minimum / Math.PI,
      maximum / Math.PI,
      source,
      provisional,
    );

  /** A mass band, kilograms. */
  const kg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /** IFAB, Laws of the Game, Law 2, the ball. */
  const IFAB: string =
    "IFAB Laws of the Game, Law 2 (https://www.theifab.com/laws/latest/the-ball/)";

  /** FIFA Futsal, size and mass range. */
  const FUTSAL: string =
    "FIFA Futsal Laws of the Game 2025–26, Law 2 (https://www.stxref.org/wp-content/uploads/2025-26-FIFA-Futsal-LOTG.pdf)";

  /** FIBA, Official Basketball Rules 2026, Basketball Equipment, Table 1. */
  const FIBA: string =
    "FIBA Official Basketball Rules 2026, Basketball Equipment, 2.4 and Table 1, size 7 (https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2026-equipment-v1-0.pdf)";

  /** FIVB, Official Volleyball Rules 2025-2028, rule 3.1. */
  const FIVB: string =
    "FIVB Official Volleyball Rules 2025-2028, French edition, 3.1 (https://www.fivb.com/wp-content/uploads/2025/06/FIVB-Volleyball_Rules2025_2028-FR-v04.pdf)";

  /** IHF, Ball Regulations, Article 2.1, size 3 with resin. */
  const IHF: string =
    "IHF Technical Regulations, Ball Regulations, 9 December 2020, Article 2.1, size 3 with resin (https://www.ihf.info/sites/default/files/2025-02/13A%20-%20Ball%20Regulations_E.pdf)";

  /** ITF, Rules of Tennis 2026, Appendix I, Types 1 and 2. */
  const ITF: string =
    "ITF Rules of Tennis 2026, Appendix I, Types 1 and 2 (https://www.world.tennis/media/7221/2026-rules-of-tennis-english.pdf)";

  /** ITTF 2026 Statutes, Law 2.3. */
  const ITTF: string =
    "ITTF Statutes 2026, 2.3 (https://documents.ittf.sport/sites/default/files/public/2026-02/2026_Statutes_v1_consolidated_clean.pdf)";

  /** ITTF acceptance mass interval for one ball, distinct from batch means. */
  const ITTF_MASS: string =
    "ITTF Technical Leaflet T3, §B.1, individual ball mass (https://nttc.nl/wp-content/uploads/2015/05/ITTF_T3.pdf)";

  /** FIP padel rules, ball specifications. */
  const FIP: string =
    "FIP Rules of Padel, The Ball (https://www.padelfip.com/documents/)";

  /** World Squash singles rules, double yellow dot ball. */
  const WSF: string =
    "World Squash Singles Rules, Appendix 7 (https://worldsquashofficiating.com/rules-of-squash/)";

  /** Official Baseball Rules 2024, rule 3.01. */
  const OBR: string =
    "Official Baseball Rules 2024, rule 3.01 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

  /** The R&A Rules of Equipment, Part 4. */
  const RANDA: string =
    "R&A Rules of Equipment, Part 4, 4.2 and 4.3 (https://www.randa.org/roe/the-rules-of-equipment/part-4-conformance-of-balls)";

  /** MCC Laws of Cricket, Law 4, the men's ball. */
  const MCC: string =
    "MCC Laws of Cricket, 2017 Code 3rd Edition 2022, Law 4, weight and size (https://www.lords.org/getmedia/81bd1d01-c7e7-42f6-ac70-80473a050c32/Laws-of-Cricket-2017-Code-3rd-Edition-2022_1.docx)";

  /** USBC Equipment Specifications and Certifications Manual, bowling balls. */
  const USBC: string =
    "USBC Equipment Specifications and Certifications Manual, bowling ball weight and physical specifications (https://bowl.com/getmedia/7b8b2ee2-cd3a-4fe1-ba31-1389d8fc9bbf/es_manual.pdf)";

  /** World Rugby, Law 2. */
  const RUGBY: string =
    "World Rugby Law 2: length in line 280 to 300 mm, circumference in width 580 to 620 mm (2015 edition, https://passport.world.rugby/media/i0ejgzmf/ball_pressure_en.pdf); 410 to 460 g (Law 2.3, https://passport.world.rugby/laws-of-the-game/laws-by-number/2-ball/)";

  /** NFL Official Playing Rules 2026, Rule 2, Section 1. */
  const NFL: string =
    "NFL Official Playing Rules 2026, Rule 2, Section 1: long axis 11 to 11 1/4 in, short circumference 21 to 21 1/4 in, 14 to 15 oz (https://static.www.nfl.com/image/upload/fl_attachment/league/tqivdkzt9mu6wdgsh1ku.pdf)";

  /** IIHF Rule Book 2026/27, Rule 13.1, the puck. */
  const PUCK: string =
    "IIHF Official Rule Book 2026/27, Rule 13.1: 2.5 cm thick, 7.6 cm in diameter, 156 to 170 g (https://test.rulebook.iihf.com/documents/rule-book-2026-27/13)";

  /** FIH Rules of Hockey 2026, equipment specification 3.1. */
  const FIH: string =
    "FIH Rules of Hockey 2026, equipment §3.1 (https://www.fih.hockey/static-assets/pdf/fih-Rules-of-hockey-2026-final.pdf)";

  /** World Lacrosse Sixes 2026–28, ball specifications. */
  const SIXES: string =
    "World Lacrosse Sixes Rules 2026–28, §2.1.1 (https://worldlacrosse.sport/wp-content/uploads/2026/05/26-28-Sixes-Rule-Book_v2_0526.pdf)";

  /** WPA equipment specifications for standard pool balls. */
  const WPA: string =
    "WPA Recommended Equipment Specifications, Balls (https://www.wpapool.com/wp-content/uploads/2024/01/RECOMMENDED-EQUIPMENT-SPECIFICATIONS.pdf)";

  /** WBSC Fast Pitch Rules, completed 12-inch ball. */
  const WBSC: string =
    "WBSC Official Rules of Softball, Fast Pitch 2026–2029, Appendix 3 B.1 (https://static.wbsc.org/uploads/federations/0/cms/documents/c4423d39-179f-04ec-9054-99f919b1f85b.pdf)";

  /** The published bands by sport and shape. */
  export const BANDS: Readonly<
    Record<
      createBall.Kind,
      Readonly<Partial<Record<createBall.Dimension, IAutoMovieArchetypeBand>>>
    >
  > = {
    football: {
      diameter: round(0.68, 0.7, `${IFAB}: circumference 68 to 70 cm`),
      mass: kg(0.41, 0.45, `${IFAB}: 410 to 450 g at the start of the match`),
    },
    basketball: {
      diameter: round(0.75, 0.77, `${FIBA}: circumference 750 to 770 mm`),
      mass: kg(0.58, 0.62, `${FIBA}: 580 to 620 g`),
    },
    volleyball: {
      diameter: round(0.65, 0.67, `${FIVB}: circumference 65 to 67 cm`),
      mass: kg(0.26, 0.28, `${FIVB}: 260 to 280 g`),
    },
    handball: {
      diameter: round(0.58, 0.6, `${IHF}: circumference 58 to 60 cm`),
      mass: kg(0.425, 0.475, `${IHF}: 425 to 475 g`),
    },
    tennis: {
      diameter: AutoMovieArchetypeBand.metres(
        0.0654,
        0.0686,
        `${ITF}: size 6.54 to 6.86 cm`,
      ),
      mass: kg(0.056, 0.0594, `${ITF}: 56.0 to 59.4 g`),
    },
    baseball: {
      diameter: round(
        9 * AutoMovieArchetypeUnits.INCH,
        9.25 * AutoMovieArchetypeUnits.INCH,
        `${OBR}: not less than nine nor more than 9 1/4 in round`,
      ),
      mass: kg(
        5 * AutoMovieArchetypeUnits.OUNCE,
        5.25 * AutoMovieArchetypeUnits.OUNCE,
        `${OBR}: not less than five nor more than 5 1/4 oz`,
      ),
    },
    softball: {
      diameter: round(0.302, 0.308, WBSC),
      mass: kg(0.178, 0.1984, WBSC),
    },
    golf: {
      diameter: AutoMovieArchetypeBand.metres(
        0.04267,
        0.04267,
        `${RANDA}: not less than 1.680 in (42.67 mm) across, the limit the model takes`,
      ),
      mass: kg(
        0.045,
        0.04593,
        `${RANDA}: not greater than 1.620 oz (45.93 g); the rule sets no least weight and no maker's ball weight was read, so the lower end is provisional`,
        true,
      ),
    },
    cricket: {
      diameter: round(0.224, 0.229, `${MCC}: 22.4 to 22.9 cm round`),
      mass: kg(0.1559, 0.163, `${MCC}: 155.9 to 163 g`),
    },
    bowling: {
      diameter: AutoMovieArchetypeBand.metres(
        8.5 * AutoMovieArchetypeUnits.INCH,
        8.595 * AutoMovieArchetypeUnits.INCH,
        `${USBC}: 8.500 to 8.595 in in diameter`,
      ),
      mass: kg(
        16 * AutoMovieArchetypeUnits.POUND,
        16 * AutoMovieArchetypeUnits.POUND,
        `${USBC}: not exceeding 16.00 lb, with no minimum, the limit the model takes`,
      ),
    },
    rugby: {
      diameter: round(0.58, 0.62, RUGBY),
      length: AutoMovieArchetypeBand.metres(0.28, 0.3, RUGBY),
      mass: kg(0.41, 0.46, RUGBY),
    },
    americanFootball: {
      diameter: round(
        21 * AutoMovieArchetypeUnits.INCH,
        21.25 * AutoMovieArchetypeUnits.INCH,
        NFL,
      ),
      length: AutoMovieArchetypeBand.metres(
        11 * AutoMovieArchetypeUnits.INCH,
        11.25 * AutoMovieArchetypeUnits.INCH,
        NFL,
      ),
      mass: kg(
        14 * AutoMovieArchetypeUnits.OUNCE,
        15 * AutoMovieArchetypeUnits.OUNCE,
        NFL,
      ),
    },
    futsal: {
      diameter: round(0.62, 0.64, FUTSAL),
      mass: kg(0.4, 0.44, FUTSAL),
    },
    tableTennis: {
      diameter: AutoMovieArchetypeBand.metres(0.04, 0.04, ITTF),
      mass: kg(0.00267, 0.00277, ITTF_MASS),
    },
    padel: {
      diameter: AutoMovieArchetypeBand.metres(0.0635, 0.0677, FIP),
      mass: kg(0.056, 0.0594, FIP),
    },
    squash: {
      diameter: AutoMovieArchetypeBand.metres(0.0395, 0.0405, WSF),
      mass: kg(0.023, 0.025, WSF),
    },
    pool: {
      diameter: AutoMovieArchetypeBand.metres(
        2.25 * AutoMovieArchetypeUnits.INCH,
        2.255 * AutoMovieArchetypeUnits.INCH,
        WPA,
      ),
      mass: kg(
        5.5 * AutoMovieArchetypeUnits.OUNCE,
        6 * AutoMovieArchetypeUnits.OUNCE,
        WPA,
      ),
    },
    fieldHockey: {
      diameter: round(0.224, 0.235, FIH),
      mass: kg(0.156, 0.163, FIH),
    },
    lacrosse: {
      diameter: round(0.197, 0.203, SIXES),
      mass: kg(0.14175, 0.14883, SIXES),
    },
    puck: {
      diameter: AutoMovieArchetypeBand.metres(0.076, 0.076, PUCK),
      length: AutoMovieArchetypeBand.metres(0.025, 0.025, PUCK),
      mass: kg(0.156, 0.17, PUCK),
    },
  };

  /** The values {@link draw} accepts at this place in its signature. */
  export type DrawMaterial = "composite" | "rubber";

  /** What {@link draw} prepares for its caller. */
  export interface IDrawResult<Id extends createBall.Affordance> {
    /** The prepared `builder` this call returns. */
    builder: AutoMovieArchetypeBuilder<Id, createBall.Dimension>;

    /** The prepared `d` this call returns. */
    d: Partial<Record<createBall.Dimension, number>>;
  }

  /** Draw the selected shape profile in the original ball seed namespace. */
  export function draw<Id extends createBall.Affordance>(
    kind: createBall.Kind,
    params: Readonly<Omit<createBall.IParams, "kind">>,
    seed: number | string | undefined,
    material: DrawMaterial,
  ): IDrawResult<Id> {
    const draw: AutoMovieArchetypeDrawSession<createBall.Dimension> =
      new AutoMovieArchetypeDrawSession("ball", UNITS, seed, params);
    const d: Partial<Record<createBall.Dimension, number>> = draw.dimensions(
      BANDS[kind],
      BANDS,
    );
    const builder: AutoMovieArchetypeBuilder<Id, createBall.Dimension> =
      new AutoMovieArchetypeBuilder({
        material,
        id: params.id,
        name: kind === "puck" ? "puck" : `${kind} ball`,
        draw,
      });
    return { builder, d };
  }

  /**
   * Declare a centre grip and upper contact for a shape whose lowest point lies
   * at the ground origin.
   *
   * @param builder The ball or puck builder that receives the contacts.
   * @param diameter The short diameter in metres. It selects the grip pattern.
   * @param high The model's height from the floor in metres. It sets the grip
   *   aperture and top coordinate.
   */
  export function contacts(
    builder: AutoMovieArchetypeBuilder<
      createBall.Affordance,
      createBall.Dimension
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
