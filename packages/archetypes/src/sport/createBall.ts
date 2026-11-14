import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/** Kilograms in an ounce. */
const OUNCE: number = 0.028349523125;

/**
 * A ball of a game: a football, a basketball, a volleyball, a handball, a tennis ball, a baseball, a softball or a golf ball.
 *
 * The ball rests on the floor, its lowest point at the origin and its centre a radius above it. `grip` is the ball itself as a hand or two hands take it, at its centre with its diameter as the aperture: a kick, a throw or a catch reads the ball's centre and size from it. `top` is its highest point, facing up, where a head or a palm meets it from above.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The ball.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the ball rests, its two contacts and what reads them.
 * @evidence contracts/development/implementation.md#principled-implementation One sphere of the drawn diameter, its centre a radius above the origin; the rules give a circumference for the large balls and a diameter for the small ones, and each band is stated in its rule's own measure converted to a diameter.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one sphere, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No panels, seams or dimples; the ball is rigid, its bounce the act's.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBall(
  params: createBall.IParams,
  seed?: number | string,
): Archetype<createBall.Affordance, createBall.Dimension> {
  const kind: createBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind,
    createBall.KINDS,
  );
  const d: Record<createBall.Dimension, number> = ArchetypeDraw.dimensions(
    "ball",
    createBall.BANDS[kind],
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createBall.Affordance, createBall.Dimension> =
    new ArchetypeBuilder({
      archetype: "ball",
      id: params.id,
      name: `${kind} ball`,
      dimensions: d,
    });
  const radius: number = d.diameter / 2;
  const centre: IAutoMovieVector3 = Vector3.create(0, radius, 0);
  builder.ball("ball", radius, centre, { color: createBall.COLORS[kind] });
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(
      centre,
      Vector3.create(0, 1, 0),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    grip: d.diameter > createBall.TWO_HANDS ? "two-hand" : "power",
    aperture: d.diameter,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.diameter, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createBall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the games and one band per dimension per kind, each a rule's limits; a rule's circumference becomes a diameter by dividing by pi.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The size and mass a kick, a throw or a catch reads, and the two contacts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every kind has every dimension, so the table is total; each band is its rule as read, the rule's own limit where it states only one; the softball's bands, its rule book not opened, and the golf ball's mass, whose least the rule leaves open, are provisional.
 */
export namespace createBall {
  /** The kinds of ball. */
  export type Kind =
    | "football"
    | "basketball"
    | "volleyball"
    | "handball"
    | "tennis"
    | "baseball"
    | "softball"
    | "golf";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "football",
    "basketball",
    "volleyball",
    "handball",
    "tennis",
    "baseball",
    "softball",
    "golf",
  ];

  /** The diameter above which a ball is taken in two hands, metres: a handball's 0.19 m is still palmed, a football's 0.22 m is not. An estimate, not read at a source. */
  export const TWO_HANDS: number = 0.2;

  /** Each kind's flat colour, sRGB. */
  export const COLORS: Readonly<Record<Kind, string>> = {
    football: "#f2f2f2",
    basketball: "#d2691e",
    volleyball: "#f5e6a8",
    handball: "#3a7bd5",
    tennis: "#d4e157",
    baseball: "#f5f5f0",
    softball: "#f0e68c",
    golf: "#fafafa",
  };

  /**
   * The affordance ids:
   *
   * - `grip`: the ball as a hand or two take it, at its centre, its diameter the aperture.
   * - `top`: its highest point, facing up.
   */
  export type Affordance = "grip" | "top";

  /**
   * The free dimensions:
   *
   * - `diameter`: metres.
   * - `mass`: kilograms.
   */
  export type Dimension = "diameter" | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which ball. */
    kind: Kind;

    /** The model's id, unique in a scene; `ball` when absent. */
    id?: string;
  }

  /** A diameter band from a rule's circumference limits, metres. */
  const round = (
    minimum: number,
    maximum: number,
    source: string,
    provisional: boolean = false,
  ): IArchetypeBand =>
    ArchetypeBand.metres(
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
  ): IArchetypeBand =>
    ArchetypeBand.of("kg", minimum, maximum, source, provisional);

  /** IFAB, Laws of the Game, Law 2, the ball. */
  const IFAB: string =
    "IFAB Laws of the Game, Law 2 (https://www.theifab.com/laws/latest/the-ball/)";

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

  /** Official Baseball Rules 2024, rule 3.01. */
  const OBR: string =
    "Official Baseball Rules 2024, rule 3.01 (https://www.baseball.ca/uploads/files/2024%20Rules/2024%20MLB%20Official%20Rules%20-%20EN.pdf)";

  /** The R&A Rules of Equipment, Part 4. */
  const RANDA: string =
    "R&A Rules of Equipment, Part 4, 4.2 and 4.3 (https://www.randa.org/roe/the-rules-of-equipment/part-4-conformance-of-balls)";

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IArchetypeBand>>>
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
      diameter: ArchetypeBand.metres(
        0.0654,
        0.0686,
        `${ITF}: size 6.54 to 6.86 cm`,
      ),
      mass: kg(0.056, 0.0594, `${ITF}: 56.0 to 59.4 g`),
    },
    baseball: {
      diameter: round(
        9 * INCH,
        9.25 * INCH,
        `${OBR}: not less than nine nor more than 9 1/4 in round`,
      ),
      mass: kg(
        5 * OUNCE,
        5.25 * OUNCE,
        `${OBR}: not less than five nor more than 5 1/4 oz`,
      ),
    },
    softball: {
      diameter: round(
        11.88 * INCH,
        12.13 * INCH,
        "the 12 in fastpitch softball, 11.88 to 12.13 in round, as recalled; the WBSC rule book was searched for and not opened",
        true,
      ),
      mass: kg(
        6.25 * OUNCE,
        7 * OUNCE,
        "the 12 in fastpitch softball, 6.25 to 7 oz, as recalled; the WBSC rule book was searched for and not opened",
        true,
      ),
    },
    golf: {
      diameter: ArchetypeBand.metres(
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
  };
}