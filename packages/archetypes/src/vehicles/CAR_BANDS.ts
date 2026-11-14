import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createCar } from "./createCar";

/** A band in degrees. */
const deg = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IArchetypeBand =>
  ArchetypeBand.of("degrees", minimum, maximum, source, provisional);

/** A length in inches, in metres. */
const inch = (value: number): number => value * 0.0254;

/** Two hatchbacks read at their maker's specification pages. */
const HATCH: string =
  "Honda Jazz Hybrid and Civic Hybrid specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

/** Two sedans read at a secondary source. */
const SEDAN: string =
  "Toyota Corolla (E210) sedan and Camry (XV70) infoboxes (https://en.wikipedia.org/wiki/Toyota_Corolla_(E210), https://en.wikipedia.org/wiki/Toyota_Camry_(XV70))";

/** A panel van read at its maker's technical specification. */
const VAN: string =
  "Ford Transit Custom 2023 technical specification, L1H1 van (https://www.fordpers.be/content/documents/news/2023/2023_10_09_transit_custom_2023_technical_specification_eu.pdf)";

/** The van's long-wheelbase body, read at a dealer's sizing guide only. */
const VAN_LONG: string = `${VAN}; the L2 body's 5,450 mm and 3,500 mm from the vansdirect.co.uk sizing guide (https://www.vansdirect.co.uk/load-sizing-guide/ford-transit-custom-dimensions/), not read at the maker`;

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
    | "lockTurns"
    | "doorSwing"
    | "pedalTravel"
    | "bonnetSwing"
    | "recline",
    IArchetypeBand
  >
> = {
  steeringDiameter: ArchetypeBand.metres(
    0.35,
    0.39,
    `${J1100}: class A steering wheel diameter below 450 mm; the band itself is a typical passenger car wheel, not read at a source`,
    true,
  ),
  steeringAngle: deg(15, 30, PACKAGE, true),
  lockTurns: ArchetypeBand.of(
    "",
    2.2,
    2.63,
    `${HATCH}: 2.2 to 2.63 turns lock to lock`,
  ),
  doorSwing: deg(
    60,
    70,
    "US patent 6817062 B2, a door hinge whose full opening is set at about 60 to 70 degrees (https://patents.google.com/patent/US6817062B2/en)",
  ),
  pedalTravel: ArchetypeBand.metres(
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

/** The bands of the classes that are passenger cars. */
const CAR: Readonly<
  Record<"seatHeight" | "steeringRatio" | "bootSwing", IArchetypeBand>
> = {
  seatHeight: ArchetypeBand.metres(
    0.127,
    0.405,
    `${J1100}: class A seat height H30, 127 to 405 mm`,
  ),
  steeringRatio: ArchetypeBand.of(
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

/** The seat height of the light commercial classes, read with the passenger-car band. */
const COMMERCIAL_SEAT: IArchetypeBand = ArchetypeBand.metres(
  0.127,
  0.405,
  `${J1100}: class A seat height H30, 127 to 405 mm, applied to a light commercial vehicle until the standard's class B values are read`,
  true,
);

/**
 * The band of each free dimension of a car, by class, with the source it was read at; `createCar.BANDS` is this table. A class lacks the dimensions of the parts it does not have: only the sedan and the hatchback have a boot, only the van a sliding door and a cargo floor, only the pickup a bed.
 */
export const CAR_BANDS: Readonly<
  Record<
    createCar.Kind,
    Readonly<Partial<Record<createCar.Dimension, IArchetypeBand>>>
  >
> = {
  hatchback: {
    ...SHARED,
    ...CAR,
    length: ArchetypeBand.metres(4.089, 4.56, HATCH),
    width: ArchetypeBand.metres(1.694, 1.802, HATCH),
    height: ArchetypeBand.metres(1.408, 1.526, HATCH),
    wheelbase: ArchetypeBand.metres(2.517, 2.734, HATCH),
    wheelDiameter: ArchetypeBand.metres(
      0.603,
      0.647,
      `${HATCH}: tyres 185/60 R15 to 215/50 R17, the outer diameter computed from the size`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 1230, 1503, HATCH),
  },
  sedan: {
    ...SHARED,
    ...CAR,
    length: ArchetypeBand.metres(4.63, 4.91, SEDAN, true),
    width: ArchetypeBand.metres(1.78, 1.84, SEDAN, true),
    height: ArchetypeBand.metres(1.435, 1.46, SEDAN, true),
    wheelbase: ArchetypeBand.metres(2.7, 2.82, SEDAN, true),
    wheelDiameter: ArchetypeBand.metres(
      0.603,
      0.647,
      `${HATCH}: tyre sizes of comparable cars, the outer diameter computed from the size`,
      true,
    ),
    mass: ArchetypeBand.of("kg", 1290, 1660, SEDAN, true),
  },
  van: {
    ...SHARED,
    seatHeight: COMMERCIAL_SEAT,
    steeringRatio: ArchetypeBand.of("", 15.7, 15.7, `${VAN}: ratio 15.7:1`),
    length: ArchetypeBand.metres(5.05, 5.45, VAN_LONG, true),
    width: ArchetypeBand.metres(
      2.032,
      2.032,
      `${VAN}: overall width without mirrors`,
    ),
    height: ArchetypeBand.metres(1.968, 1.983, VAN),
    wheelbase: ArchetypeBand.metres(3.1, 3.5, VAN_LONG, true),
    wheelDiameter: ArchetypeBand.metres(
      0.686,
      0.69,
      `${VAN}: tyres 215/65 R16 to 215/60 R17, the outer diameter computed from the size`,
    ),
    mass: ArchetypeBand.of("kg", 1892, 1892, `${VAN}: kerb weight`),
    sideDoorWidth: ArchetypeBand.metres(
      1.03,
      1.03,
      `${VAN}: side door aperture width`,
    ),
    sideDoorHeight: ArchetypeBand.metres(
      1.301,
      1.301,
      `${VAN}: side door aperture height`,
    ),
    sideStep: ArchetypeBand.metres(
      0.393,
      0.435,
      `${VAN}: side door step height`,
    ),
    cargoFloor: ArchetypeBand.metres(
      0.575,
      0.593,
      `${VAN}: rear door loading height`,
    ),
    loadLength: ArchetypeBand.metres(
      2.394,
      2.394,
      `${VAN}: load length to the bulkhead`,
    ),
  },
  pickup: {
    ...SHARED,
    seatHeight: COMMERCIAL_SEAT,
    steeringRatio: CAR.steeringRatio,
    length: ArchetypeBand.metres(inch(210.6), inch(210.6), PICKUP),
    width: ArchetypeBand.metres(
      inch(75.5),
      inch(75.5),
      `${PICKUP}: width excluding mirrors`,
    ),
    height: ArchetypeBand.metres(inch(73.9), inch(74.4), PICKUP),
    wheelbase: ArchetypeBand.metres(inch(128.7), inch(128.7), PICKUP),
    wheelDiameter: ArchetypeBand.metres(
      0.788,
      0.789,
      `${PICKUP}: tyres 255/70 R17 to 255/65 R18, the outer diameter computed from the size`,
    ),
    mass: ArchetypeBand.of(
      "kg",
      4203 * 0.45359237,
      4415 * 0.45359237,
      `${PICKUP}: base curb weight, 4,203 to 4,415 lb`,
    ),
    bedLength: ArchetypeBand.metres(
      inch(59.6),
      inch(59.6),
      `${PICKUP}: cargo bed length at floor`,
    ),
    bedWidth: ArchetypeBand.metres(
      inch(62.4),
      inch(62.4),
      `${PICKUP}: maximum width inside the box`,
    ),
    bedDepth: ArchetypeBand.metres(
      inch(20.8),
      inch(20.9),
      "a 2024-2025 Ranger SuperCrew bed's inside height, 20.8 to 20.9 in, in dealers' and outfitters' guides (https://www.greghublerford.com/2024-ford-ranger-bed-size/, https://offroadtents.com/blogs/news/ford-ranger-bed-dimensions-guide-for-every-model), seen in search results only",
      true,
    ),
    bedFloor: ArchetypeBand.metres(
      inch(34.0),
      inch(34.7),
      `${PICKUP}: lift-in height`,
    ),
  },
};
