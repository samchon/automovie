import type { IAutoMovieHumanFootPlaces } from "@automovie/interface";

import { AutoMovieHumanFootArch } from "./AutoMovieHumanFootArch";

/** Independent standing foot placement and normalized forefoot rules. */
export namespace AutoMovieHumanFootPlaces {
  /**
   * Symmetric toe-out angle from McIlroy and Maki 1997. Their preferred quiet
   * stance angle is 14 degrees across the two foot axes (PMID 11415674).
   */
  export const YAW: number = 14 / 2;

  /**
   * ESTIMATE of the ankle centre's along-axis fraction from the heel. A rear
   * fifth leaves the joint over the hindfoot and behind the arch.
   */
  export const ANKLE: number = 1 / 5;

  /**
   * Nominal Brannock first metatarsal-head station, ANSUR II sex means rounded
   * to hundredths.
   */
  export const BALL: number = 0.74;

  /**
   * Foot length used to normalize the Maestro head differences, mm. ANSUR II
   * sex-mean midpoint.
   */
  export const CASCADE_FOOT: number = 258.75;

  /**
   * Maestro's second head lead and the subsequent drops between heads,
   * millimetres.
   */
  export const CASCADE: readonly number[] = [0, 3.3, 6.5, 12];

  /**
   * Sex-mean averages of the proximal, middle and distal phalanx lengths in
   * millimetres, in toe order (Patil et al. 2017, Table/Fig-3). The hallux has
   * two phalanges. These lengths supply ratios for a nominal morphology, which
   * the completed foot scales to the person's longest toe.
   */
  export const PHALANGES: readonly (readonly number[])[] = [
    [26.9, 21.65],
    [25.25, 10.2, 6.9],
    [23.6, 8.55, 6.3],
    [21.85, 6.7, 5.45],
    [20.3, 5.45, 4.8],
  ];

  /**
   * Nominal head positions along the foot. Maestro cascade differences of 0,
   * 3.3, 6.5 and 12 mm divide by the ANSUR II adult midpoint foot length of
   * 258.75 mm. The medial head stands at the published ball-length site.
   */
  const HEADS: readonly number[] = [
    BALL,
    ...CASCADE.map(
      (_, index: number): number =>
        BALL +
        (CASCADE[0]! -
          CASCADE.slice(1, index + 1).reduce(
            (sum: number, drop: number): number => sum + drop,
            0,
          )) /
          CASCADE_FOOT,
    ),
  ];

  /**
   * ESTIMATE of transverse packing. The hallux has twice each other toe's
   * nominal share of breadth.
   */
  const ACROSS: readonly number[] = [-1 / 3, -1 / 12, 1 / 12, 1 / 4, 5 / 12];

  /**
   * Skin tip stations from the relative phalanx spans and head cascade, with
   * signed centres in nominal foot breadths.
   */
  export const TOES: IAutoMovieHumanFootPlaces.Toes = [
    toe(0),
    toe(1),
    toe(2),
    toe(3),
    toe(4),
  ];

  /**
   * Construct a normalized toe position and its share of the transverse
   * partition.
   */
  function toe(index: number): { tip: number; across: number } {
    const sum = (parts: readonly number[]): number =>
      parts.reduce((total: number, part: number): number => total + part, 0);
    return {
      tip:
        HEADS[index]! +
        ((1 - BALL) * sum(PHALANGES[index]!)) / sum(PHALANGES[0]!),
      across: ACROSS[index]!,
    };
  }

  /** Read the nominal vertical outline at the regular forefoot display stations. */
  export const FOREFOOT: IAutoMovieHumanFootPlaces.Forefoot = [
    row(0.6),
    row(0.7),
    row(0.8),
    row(0.9),
  ];

  /** A normalized sample of the same continuous outline. */
  function row(share: number): { share: number; height: number } {
    return { share, height: dorsum(1, share) };
  }

  /** Position the ankle centre from the heel along the foot in millimetres. */
  export function ankle(footLength: number): number {
    return ANKLE * footLength;
  }

  /**
   * Nominal roof height in millimetres. The arch height index anchors the
   * dorsum halfway along the foot. ESTIMATE: the heel and toe roof levels use
   * one-half and one-quarter of this height. Cubic steps maintain a horizontal
   * tangent at the middle and both endpoints. The foot's actual ankle and arch
   * controls are bound separately on the owning surface.
   */
  export function dorsum(footLength: number, share: number): number {
    const t: number = Math.min(1, Math.abs(2 * share - 1));
    const step: number = t * t * (3 - 2 * t);
    const reduction: number = share < 0.5 ? 1 / 2 : 3 / 4;
    return (
      footLength *
      AutoMovieHumanFootArch.ARCH_HEIGHT_INDEX *
      BALL *
      (1 - reduction * step)
    );
  }
}
