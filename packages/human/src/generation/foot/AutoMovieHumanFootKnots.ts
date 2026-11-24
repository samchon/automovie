import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFootBody,
  IAutoMovieHumanFootFrame,
  IAutoMovieHumanFootGuide,
  IAutoMovieHumanFootKnots,
  IAutoMovieHumanFootWebLine,
} from "@automovie/interface";

import { AutoMovieHumanFootArch } from "../AutoMovieHumanFootArch";
import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanFootAchilles } from "./AutoMovieHumanFootAchilles";
import { AutoMovieHumanFootColumn } from "./AutoMovieHumanFootColumn";
import { AutoMovieHumanFootCrestForefoot } from "./AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootLateralForefoot } from "./AutoMovieHumanFootLateralForefoot";

/** Independent forefoot, arch, heel and ankle guide regions in anatomical order. */
export namespace AutoMovieHumanFootKnots {
  /** The front-to-back regions of each continuous guide. */
  export const GUIDES: Readonly<
    Record<
      keyof IAutoMovieHumanFootBody.IGuides,
      readonly IAutoMovieHumanFootKnots.Region[]
    >
  > = {
    crest: ["crestForefoot", "crestAnkle"],
    lateral: ["lateralForefoot", "lateralHeel", "lateralColumn"],
    contactLateral: [
      "contactLateralBall",
      "contactLateralMidfoot",
      "contactLateralHeel",
      "heelCornerLateral",
      "achillesLateral",
    ],
    contactMedial: [
      "contactMedialBall",
      "contactMedialMidfoot",
      "contactMedialHeel",
      "heelCornerMedial",
      "achillesMedial",
    ],
    medial: ["medialForefoot", "medialNavicular", "medialColumn"],
  };

  /** Nominal metatarsal site used by the legacy foot's normalized chart. */
  const BALL: number = AutoMovieHumanFootPlaces.BALL;

  /** Nominal ankle position and calcaneal contact end in foot lengths. */
  const ANKLE: number = AutoMovieHumanFootPlaces.ANKLE;
  const CONTACT: number = AutoMovieHumanFootHeelCorner.END;

  /**
   * ESTIMATE of the standing footprint. Both edges of the ball and heel bear
   * weight. Gray's lower lateral arch carries a narrow outer contact strip
   * between them. The rear endpoints meet the heel corner exactly.
   */
  const FLOOR: Readonly<
    Record<
      | "contactLateralBall"
      | "contactLateralMidfoot"
      | "contactLateralHeel"
      | "contactMedialBall"
      | "contactMedialMidfoot"
      | "contactMedialHeel",
      readonly (readonly [number, number])[]
    >
  > = {
    contactLateralBall: [
      [(1 + BALL) / 2, 3 / 4],
      [BALL, 7 / 8],
    ],
    contactLateralMidfoot: [
      [1 / 2, 5 / 6],
      [ANKLE, 3 / 4],
    ],
    contactLateralHeel: [
      [(ANKLE + CONTACT) / 2, 3 / 4],
      [CONTACT, 1 / 2 + AutoMovieHumanFootHeelCorner.HALF],
    ],
    contactMedialBall: [
      [(1 + BALL) / 2, 1 / 4],
      [BALL, 1 / 8],
    ],
    contactMedialMidfoot: [
      [1 / 2, 2 / 3],
      [ANKLE, 1 / 3],
    ],
    contactMedialHeel: [
      [(ANKLE + CONTACT) / 2, 1 / 4],
      [CONTACT, 1 / 2 - AutoMovieHumanFootHeelCorner.HALF],
    ],
  };

  /** Read one guide region's original world points, from front to back. */
  export function knots(
    region: IAutoMovieHumanFootKnots.Region,
    frame: IAutoMovieHumanFootFrame.IFrame,
    line: IAutoMovieHumanFootWebLine.IWebLine,
  ): AutoMovieVector3Tuple[] {
    switch (region) {
      case "crestForefoot":
        return AutoMovieHumanFootCrestForefoot.knots(frame);
      case "crestAnkle":
        return [frame.at(2 * ANKLE, 1 / 2, frame.ring)];
      case "lateralForefoot":
        return AutoMovieHumanFootLateralForefoot.knots(frame, line);
      case "lateralColumn":
        return AutoMovieHumanFootColumn.knots("lateral", frame, line);
      case "medialColumn":
        return AutoMovieHumanFootColumn.knots("medial", frame, line);
      case "lateralHeel":
        return [
          frame.at(ANKLE, 5 / 6, AutoMovieHumanFootHeelCorner.height(frame)),
        ];
      case "medialForefoot":
        return [(1 + BALL) / 2, BALL].map(
          (share: number): AutoMovieVector3Tuple =>
            frame.at(
              share,
              0,
              (AutoMovieHumanFootCrestForefoot.depth(share) * frame.L) / 2,
            ),
        );
      case "medialNavicular":
        return [
          frame.at(2 * ANKLE, 1 / 8, AutoMovieHumanFootArch.navicular(frame.L)),
        ];
      case "heelCornerLateral":
        return AutoMovieHumanFootHeelCorner.knots(frame, 1);
      case "heelCornerMedial":
        return AutoMovieHumanFootHeelCorner.knots(frame, -1);
      case "achillesLateral":
        return AutoMovieHumanFootAchilles.knots(frame, 1);
      case "achillesMedial":
        return AutoMovieHumanFootAchilles.knots(frame, -1);
      case "contactLateralBall":
      case "contactLateralMidfoot":
      case "contactLateralHeel":
      case "contactMedialBall":
      case "contactMedialMidfoot":
      case "contactMedialHeel":
        return FLOOR[region].map(
          ([a, u]): AutoMovieVector3Tuple => frame.at(a, u, 0),
        );
    }
  }

  /** Join each guide's independent regions in the same public chart. */
  export function guides(
    frame: IAutoMovieHumanFootFrame.IFrame,
    line: IAutoMovieHumanFootWebLine.IWebLine,
  ): IAutoMovieHumanFootBody.IGuides {
    const guide = (
      name: keyof IAutoMovieHumanFootBody.IGuides,
    ): IAutoMovieHumanFootGuide.IGuide =>
      AutoMovieHumanFootGuide.of(
        frame,
        line,
        GUIDES[name].flatMap(
          (region: IAutoMovieHumanFootKnots.Region): AutoMovieVector3Tuple[] =>
            knots(region, frame, line),
        ),
      );

    return {
      crest: guide("crest"),
      lateral: guide("lateral"),
      contactLateral: guide("contactLateral"),
      contactMedial: guide("contactMedial"),
      medial: guide("medial"),
    };
  }
}
