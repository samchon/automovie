import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { CAR_MODELS } from "./CAR_MODELS";
import type { createCar } from "./createCar";

/** A band in degrees. */
const deg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IAutoMovieArchetypeBand =>
  AutoMovieArchetypeBand.of("degrees", minimum, maximum, source, provisional);

/** Two hatchbacks read at their maker's specification pages. */
const HATCH: string =
  "Honda Jazz Hybrid and Civic Hybrid specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

/** A panel van read at its maker's technical specification. */
const VAN: string =
  "Ford Transit Custom 2023 technical specification, L1H1 van (https://www.fordpers.be/content/documents/news/2023/2023_10_09_transit_custom_2023_technical_specification_eu.pdf)";

/** A crew-cab pickup read at its maker's technical specification. */
const PICKUP: string =
  "2025 Ford Ranger technical specifications, SuperCrew 4x2 and 4x4 (https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2025/specs/2025_Ford_Ranger_Technical_Specifications.pdf)";

/** The interior packaging standard. */
const J1100: string =
  "SAE J1100 (2001) (https://archive.org/stream/gov.law.sae.j1100.2001/sae.j1100.2001_djvu.txt)";

/** Interior positions the standard defines without giving values. */
const PACKAGE: string = `${J1100} defines this dimension without a value; the figure is a typical package, not read at a source`;

/** The bands every class shares. */
const SHARED: Readonly<
  Record<
    | "steeringDiameter"
    | "steeringAngle"
    | "doorSwing"
    | "pedalTravel"
    | "bonnetSwing"
    | "recline",
    IAutoMovieArchetypeBand
  >
> = {
  steeringDiameter: AutoMovieArchetypeBand.metres(
    0.35,
    0.39,
    `${J1100}: class A steering wheel diameter below 450 mm; the band itself is a typical passenger car wheel, not read at a source`,
    true,
  ),
  steeringAngle: deg(15, 30, PACKAGE, true),
  doorSwing: deg(
    60,
    70,
    "US patent 6817062 B2, a door hinge whose full opening is set at about 60 to 70 degrees (https://patents.google.com/patent/US6817062B2/en)",
  ),
  pedalTravel: AutoMovieArchetypeBand.metres(
    0.04,
    0.07,
    "pedal travel, not read at a source",
    true,
  ),
  bonnetSwing: deg(
    45,
    55,
    "a bonnet's opening: 54.6 degrees in a hood-linkage study (https://dergipark.org.tr/en/download/article-file/450731) and about 50 degrees held by a hood hinge's springs (US patent 12486704), seen in search results only",
    true,
  ),
  recline: deg(
    0,
    30,
    "a seat back reclined from the 23-degree torso angle of the SAE J826 manikin to 53 degrees, the settings of a seat-back study (Traffic Injury Prevention 2019, https://informahealthcare.com/doi/abs/10.1080/15389588.2019.1630733), seen in search results only",
    true,
  ),
};

/**
 * The least and the greatest of the hatchbacks' read grades' figures of one
 * dimension, for a band a class whose models state none borrows.
 *
 * @param dimension The dimension.
 * @returns The least and the greatest figure.
 */
function hatchbacks(dimension: createCar.Dimension): [number, number] {
  const figures: number[] = Object.values(CAR_MODELS.figures.hatchback)
    .map(
      (
        model:
          | Readonly<Partial<Record<createCar.Dimension, number>>>
          | undefined,
      ): number | undefined => model?.[dimension],
    )
    .filter(
      (figure: number | undefined): figure is number => figure !== undefined,
    );
  return [Math.min(...figures), Math.max(...figures)];
}

/**
 * The turns lock to lock of a class whose models state none: the span of the
 * hatchbacks' read grades, borrowed for want of the class's own.
 */
const TURNS: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
  "",
  ...hatchbacks("lockTurns"),
  `${HATCH}: the grades' turns lock to lock, borrowed by a class whose models state none`,
  true,
);

/** The bands of the classes that are passenger cars. */
const CAR: Readonly<
  Record<"seatHeight" | "steeringRatio" | "bootSwing", IAutoMovieArchetypeBand>
> = {
  seatHeight: AutoMovieArchetypeBand.metres(
    0.127,
    0.405,
    `${J1100}: class A seat height H30, 127 to 405 mm`,
  ),
  steeringRatio: AutoMovieArchetypeBand.of(
    "",
    12,
    20,
    "overall steering ratio of most passenger cars, 12:1 to 20:1 (Wikipedia, Steering ratio, https://en.wikipedia.org/wiki/Steering_ratio)",
    true,
  ),
  bootSwing: deg(
    85,
    95,
    "a liftgate pivoting about 90 degrees about its horizontal hinge (US patents 6425205 and 6637157), seen in search results only; the band is that figure's neighbourhood",
    true,
  ),
};

/**
 * The seat height of the light commercial classes, read with the passenger-car
 * band.
 */
const COMMERCIAL_SEAT: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.127,
  0.405,
  `${J1100}: class A seat height H30, 127 to 405 mm, applied to a light commercial vehicle until the standard's class B values are read`,
  true,
);

/**
 * The band of each free dimension of a car, by class, with the source it was
 * read at; `createCar.BANDS` is this table. A class lacks the dimensions of the
 * parts it does not have: only the sedan and the hatchback have a boot, only
 * the van a sliding door and a cargo floor, only the pickup a bed. A model's
 * own figures are its read model's (`CAR_MODELS`), not bands; the van's sliding
 * door, step and cargo floor are the L1's read figures, the L2's dealer page
 * giving the same 1,030 mm door and none of the others, so the L2 takes the
 * L1's, the same body section: provisional for the L2.
 */
export const CAR_BANDS: Readonly<
  Record<
    createCar.Kind,
    Readonly<Partial<Record<createCar.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  hatchback: {
    ...SHARED,
    ...CAR,
  },
  sedan: {
    ...SHARED,
    ...CAR,
    lockTurns: TURNS,
    wheelDiameter: AutoMovieArchetypeBand.metres(
      ...hatchbacks("wheelDiameter"),
      `${HATCH}: the span of the grades' tyres' outer diameters, computed from their sizes, borrowed for want of a sedan's read tyre`,
      true,
    ),
  },
  van: {
    ...SHARED,
    seatHeight: COMMERCIAL_SEAT,
    lockTurns: TURNS,
    steeringRatio: AutoMovieArchetypeBand.of(
      "",
      15.7,
      15.7,
      `${VAN}: ratio 15.7:1`,
    ),
    sideDoorWidth: AutoMovieArchetypeBand.metres(
      1.03,
      1.03,
      `${VAN}: side door aperture width`,
    ),
    sideDoorHeight: AutoMovieArchetypeBand.metres(
      1.301,
      1.301,
      `${VAN}: side door aperture height`,
    ),
    sideStep: AutoMovieArchetypeBand.metres(
      0.393,
      0.435,
      `${VAN}: side door step height`,
    ),
    cargoFloor: AutoMovieArchetypeBand.metres(
      0.575,
      0.593,
      `${VAN}: rear door loading height`,
    ),
  },
  pickup: {
    ...SHARED,
    seatHeight: COMMERCIAL_SEAT,
    steeringRatio: CAR.steeringRatio,
    lockTurns: TURNS,
    length: AutoMovieArchetypeBand.metres(
      210.6 * AutoMovieArchetypeUnits.INCH,
      210.6 * AutoMovieArchetypeUnits.INCH,
      PICKUP,
    ),
    width: AutoMovieArchetypeBand.metres(
      75.5 * AutoMovieArchetypeUnits.INCH,
      75.5 * AutoMovieArchetypeUnits.INCH,
      `${PICKUP}: width excluding mirrors`,
    ),
    wheelbase: AutoMovieArchetypeBand.metres(
      128.7 * AutoMovieArchetypeUnits.INCH,
      128.7 * AutoMovieArchetypeUnits.INCH,
      PICKUP,
    ),
    bedLength: AutoMovieArchetypeBand.metres(
      59.6 * AutoMovieArchetypeUnits.INCH,
      59.6 * AutoMovieArchetypeUnits.INCH,
      `${PICKUP}: cargo bed length at floor`,
    ),
    bedWidth: AutoMovieArchetypeBand.metres(
      62.4 * AutoMovieArchetypeUnits.INCH,
      62.4 * AutoMovieArchetypeUnits.INCH,
      `${PICKUP}: maximum width inside the box`,
    ),
    bedDepth: AutoMovieArchetypeBand.metres(
      20.8 * AutoMovieArchetypeUnits.INCH,
      20.9 * AutoMovieArchetypeUnits.INCH,
      "a 2024-2025 Ranger SuperCrew bed's inside height, 20.8 to 20.9 in, in dealers' and outfitters' guides (https://www.greghublerford.com/2024-ford-ranger-bed-size/, https://offroadtents.com/blogs/news/ford-ranger-bed-dimensions-guide-for-every-model), seen in search results only",
      true,
    ),
  },
};
