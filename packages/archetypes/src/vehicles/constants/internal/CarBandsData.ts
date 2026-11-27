
import {
  type IAutoMovieArchetypeBand,
  AutoMovieArchetypeBand,
} from "../../../core";
import type { AutoMovieArchetypeCar } from "../../AutoMovieArchetypeCar";
import { CAR_MODELS } from "../CAR_MODELS";

export namespace CarBandsData {
  /*
   * A band in degrees.
   */
  export const deg = (
    minimum: number,
    maximum: number,
    source: string,
    provisional?: boolean,
  ): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.of("degrees", minimum, maximum, source, provisional);

  /*
   * Two hatchbacks read at their maker's specification pages.
   */
  export const HATCH: string =
    "Honda Jazz Hybrid and Civic Hybrid specifications (https://www.honda.co.uk/cars/new/jazz-hybrid/specifications.html, https://www.honda.co.uk/cars/new/civic-hybrid/specifications.html)";

  /*
   * A panel van read at its maker's technical specification.
   */
  export const VAN: string =
    "Ford Transit Custom 2023 technical specification, L1H1 van (https://www.fordpers.be/content/documents/news/2023/2023_10_09_transit_custom_2023_technical_specification_eu.pdf)";

  /*
   * A crew-cab pickup read at its maker's technical specification.
   */
  export const PICKUP: string =
    "2025 Ford Ranger technical specifications, SuperCrew 4x2 and 4x4 (https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2025/specs/2025_Ford_Ranger_Technical_Specifications.pdf)";

  /*
   * The interior packaging standard.
   */
  export const J1100: string =
    "SAE J1100 (2001) (https://archive.org/stream/gov.law.sae.j1100.2001/sae.j1100.2001_djvu.txt)";

  /*
   * Interior positions the standard defines without giving values.
   */
  export const PACKAGE: string = `${J1100} defines this dimension without a value; the figure is a typical package, not read at a source`;

  /*
   * The bands every class shares.
   */
  export const SHARED: Readonly<
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

  /*
   * The least and the greatest of the hatchbacks' read grades' figures of one
   * dimension, for a band a class whose models state none borrows.
   * Parameter dimension: The dimension.
   * Returns: The least and the greatest figure.
   */
  export function hatchbacks(
    dimension: AutoMovieArchetypeCar.Dimension,
  ): [number, number] {
    const figures: number[] = Object.values(CAR_MODELS.figures.hatchback)
      .map(
        (
          model:
            | Readonly<Partial<Record<AutoMovieArchetypeCar.Dimension, number>>>
            | undefined,
        ): number | undefined => model?.[dimension],
      )
      .filter(
        (figure: number | undefined): figure is number => figure !== undefined,
      );
    return [Math.min(...figures), Math.max(...figures)];
  }

  /*
   * The turns lock to lock of a class whose models state none: the span of the
   * hatchbacks' read grades, borrowed for want of the class's own.
   */
  export const TURNS: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    ...hatchbacks("lockTurns"),
    `${HATCH}: the grades' turns lock to lock, borrowed by a class whose models state none`,
    true,
  );

  /*
   * The bands of the classes that are passenger cars.
   */
  export const CAR: Readonly<
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

  /*
   * The seat height of the light commercial classes, read with the passenger-car
   * band.
   */
  export const COMMERCIAL_SEAT: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.127,
    0.405,
    `${J1100}: class A seat height H30, 127 to 405 mm, applied to a light commercial vehicle until the standard's class B values are read`,
    true,
  );
}
