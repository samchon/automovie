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

/** Two hatchbacks read at their maker's specification pages. */
const HATCH: string =
  "Honda Jazz Hybrid and Civic Hybrid specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

/** Two sedans read at a secondary source. */
const SEDAN: string =
  "Toyota Corolla (E210) sedan and Camry (XV70) infoboxes (https://en.wikipedia.org/wiki/Toyota_Corolla_(E210), https://en.wikipedia.org/wiki/Toyota_Camry_(XV70))";

/** The interior packaging standard. */
const J1100: string =
  "SAE J1100 (2001) (https://archive.org/stream/gov.law.sae.j1100.2001/sae.j1100.2001_djvu.txt)";

/** Interior positions the standard defines without giving values. */
const PACKAGE: string = `${J1100} defines this dimension without a value; the figure is a typical package, not read at a source`;

/** The bands both classes share. */
const SHARED: Readonly<
  Record<
    | "seatHeight"
    | "steeringDiameter"
    | "steeringAngle"
    | "steeringRatio"
    | "lockTurns"
    | "doorSwing"
    | "pedalTravel",
    IArchetypeBand
  >
> = {
  seatHeight: ArchetypeBand.metres(
    0.127,
    0.405,
    `${J1100}: class A seat height H30, 127 to 405 mm`,
  ),
  steeringDiameter: ArchetypeBand.metres(
    0.35,
    0.39,
    `${J1100}: class A steering wheel diameter below 450 mm; the band itself is a typical passenger car wheel, not read at a source`,
    true,
  ),
  steeringAngle: deg(15, 30, PACKAGE, true),
  steeringRatio: ArchetypeBand.of(
    "",
    12,
    20,
    "overall steering ratio of most passenger cars, 12:1 to 20:1 (Wikipedia, Steering ratio, https://en.wikipedia.org/wiki/Steering_ratio)",
    true,
  ),
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
};

/**
 * The band of each free dimension of a car, by class, with the source it was read at; `createCar.BANDS` is this table.
 */
export const CAR_BANDS: Readonly<
  Record<createCar.Kind, Readonly<Record<createCar.Dimension, IArchetypeBand>>>
> = {
  hatchback: {
    ...SHARED,
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
};
