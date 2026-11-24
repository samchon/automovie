import type { IAutoMovieHumanFootPrior } from "@automovie/interface";

import { AutoMovieHumanFootPlaces } from "./AutoMovieHumanFootPlaces";

/** Population foot measurements and independent geometric priors. */
export namespace AutoMovieHumanFootPrior {
  /**
   * Foot length used to normalize the Maestro head differences, mm. ANSUR II
   * sex-mean midpoint.
   */
  export const CASCADE_FOOT: number = AutoMovieHumanFootPlaces.CASCADE_FOOT;

  /**
   * Relative longitudinal positions of the consecutive heads in millimetres.
   * Positive second-to-fifth differences are shortening. Maestro et al. 2003
   * and the reported reference means of the 2018 reliability study.
   */
  const CASCADE: readonly number[] = AutoMovieHumanFootPlaces.CASCADE;

  /**
   * ESTIMATE of toe breadth shares. Assign width by equal transverse bays, with
   * two bays for the hallux and one each for the four other toes. A round
   * distal section is the baseline in the absence of supplied depth.
   */
  const BREADTH: readonly number[] = [2 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];

  /** Toe dimensions from phalange ratios and the nominal transverse partition. */
  function toe(index: number): IAutoMovieHumanFootPrior.IToe {
    const position = AutoMovieHumanFootPlaces.TOES[index]!;
    const bones: readonly number[] = AutoMovieHumanFootPlaces.PHALANGES[index]!;
    const length: number = bones.reduce(
      (sum: number, value: number): number => sum + value,
      0,
    );
    const breadth: number = BREADTH[index]!;
    return {
      name: `toe.{side}.${index + 1}`,
      tip: [position.tip, position.across + 1 / 2],
      head: position.across + 1 / 2,
      height: (breadth * 0.377) / 2,
      breadth,
      depth: 1,
      pulp: 1,
      joints: bones
        .slice(0, -1)
        .map(
          (_, i: number): number =>
            bones
              .slice(0, i + 1)
              .reduce((sum: number, value: number): number => sum + value, 0) /
            length,
        ),
      order: 32,
      sections: 21,
    };
  }

  /**
   * ESTIMATE of the toe web ends. A web between two rays ends halfway from
   * their mean head to the shorter tip, with both toes independently available
   * beyond it. Their midpoint supplies the transverse station.
   */
  function cleft(index: number): [number, number] {
    const a = AutoMovieHumanFootPlaces.TOES[index]!;
    const b = AutoMovieHumanFootPlaces.TOES[index + 1]!;
    const to: number = Math.min(a.tip, b.tip);
    return [
      (AutoMovieHumanFootPlaces.BALL + to) / 2,
      (a.across + b.across) / 2 + 1 / 2,
    ];
  }

  /**
   * Public ANSUR II foot-length, breadth and malleolus defaults are preserved.
   * Without a tape at the legacy ankle-ring site, place it one third of a
   * malleolus height above that landmark (ESTIMATE). The rounded malleoli share
   * a 15 mm relief radius with 3 mm rise as a weak anatomical model estimate.
   * The medial malleolus is assigned one eighth extra height.
   */
  export const PRIOR: IAutoMovieHumanFootPrior.IPrior = {
    yaw: (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180,
    expected: {
      length: [0.151, 0.154],
      breadth: [0.377, 0.376],
      ankle: [
        [6.0, 0.0348],
        [5.0, 0.0387],
      ],
    },
    ring: 1 + 1 / 3,
    ankle: [AutoMovieHumanFootPlaces.ANKLE, 1 / 2],
    first: AutoMovieHumanFootPlaces.BALL,
    cascade: CASCADE,
    clefts: [cleft(0), cleft(1), cleft(2), cleft(3)],
    toes: [toe(0), toe(1), toe(2), toe(3), toe(4)],
    malleoli: {
      lateral: { height: 1, prominence: 3, radius: 15 },
      medial: { height: 1 + 1 / 8, prominence: 3, radius: 15 },
    },
    toeDorsal: 1 / 2,
  };
}
