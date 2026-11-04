import { AutoMovieHumanFootAchilles } from "./AutoMovieHumanFootAchilles";
import type { AutoMovieHumanFootBody } from "./AutoMovieHumanFootBody";
import { AutoMovieHumanFootCrestForefoot } from "./AutoMovieHumanFootCrestForefoot";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import type { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootGuide } from "./AutoMovieHumanFootGuide";
import { AutoMovieHumanFootHeelCorner } from "./AutoMovieHumanFootHeelCorner";
import { AutoMovieHumanFootColumn } from "./AutoMovieHumanFootColumn";
import { AutoMovieHumanFootLateralForefoot } from "./AutoMovieHumanFootLateralForefoot";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * The foot's guide regions and the five guides they compose, as one table.
 *
 * A guide is its regions' knots, front to back, joined by the guide's own C2
 * spline (`AutoMovieHumanFootGuide.of`); each region has its own centre and its
 * knots in the foot frame's normalized coordinates (foot lengths `a`, foot
 * breadths `u`, and heights in foot lengths or lateral malleolus heights). The
 * regions with a rule of their own keep their files (the crest's forefoot, the
 * lateral forefoot, the two columns, the heel's corner and the Achilles); the
 * others are knot lists in this table, each a reference median awaiting a
 * published value:
 *
 * - crest: the instep's summit line from the first toe web back and up the
 *   column to the ankle ring, the guide the section's two dorsal pieces start
 *   from: the forefoot's part and the ankle's (`crestAnkle`: over the talus's
 *   neck to the ankle ring, centred at the lateral malleolus height, the last
 *   knot on the ring).
 * - lateral: the greatest across point of each of the fan's own planes, the
 *   fifth metatarsal's side, the heel's lateral wall (`lateralHeel`: the
 *   calcaneus's wall at shares 0.55 to 0.65; on every reference the extreme
 *   passes from this wall to the malleolus between 0.65 and 0.75, a branch
 *   change the guide bridges to the column's first knot) and the column up to
 *   the lateral malleolus.
 * - contactLateral: the sole's lateral boundary on the floor under the ball
 *   (`contactLateralBall`, round the fifth metatarsal head, a = 0.86 to 0.6),
 *   the midfoot (`contactLateralMidfoot`, along the cuboid and the fifth
 *   metatarsal's base, a = 0.5 to 0.2, where the lateral arch is lowest) and the
 *   heel (`contactLateralHeel`, round the calcaneal tuberosity to the contact's
 *   rear end, a = 0.1 and 0.075), then round the heel's posterior corner and up
 *   the Achilles.
 * - contactMedial: the sole's medial boundary under the ball
 *   (`contactMedialBall`, round the first metatarsal head and the sesamoids,
 *   crossing the sole as the arch begins), the medial arch's footprint
 *   (`contactMedialMidfoot`, centred on the navicular) and the heel
 *   (`contactMedialHeel`), then round the heel's corner and up the Achilles.
 * - medial: the least across point of each of the fan's own planes, the first
 *   ray's side (`medialForefoot`, from the web ring to 0.45 of the stations),
 *   the navicular's arch (`medialNavicular`, the medial longitudinal arch's
 *   crown at shares 0.5 to 0.65) and the column up to the medial malleolus.
 */
export namespace AutoMovieHumanFootKnots {
  /** A guide region. */
  export type Region =
    | "crestForefoot"
    | "crestAnkle"
    | "lateralForefoot"
    | "lateralHeel"
    | "lateralColumn"
    | "medialForefoot"
    | "medialNavicular"
    | "medialColumn"
    | "contactLateralBall"
    | "contactLateralMidfoot"
    | "contactLateralHeel"
    | "contactMedialBall"
    | "contactMedialMidfoot"
    | "contactMedialHeel"
    | "heelCornerLateral"
    | "heelCornerMedial"
    | "achillesLateral"
    | "achillesMedial";

  /** Each guide's regions, front to back. */
  export const GUIDES: Readonly<Record<keyof AutoMovieHumanFootBody.IGuides, readonly Region[]>> = {
    crest: ["crestForefoot", "crestAnkle"],
    lateral: ["lateralForefoot", "lateralHeel", "lateralColumn"],
    contactLateral: ["contactLateralBall", "contactLateralMidfoot", "contactLateralHeel", "heelCornerLateral", "achillesLateral"],
    contactMedial: ["contactMedialBall", "contactMedialMidfoot", "contactMedialHeel", "heelCornerMedial", "achillesMedial"],
    medial: ["medialForefoot", "medialNavicular", "medialColumn"],
  };

  /** The contact regions' knots on the floor, front first: `[a, u]` in foot lengths and breadths. */
  const FLOOR: Readonly<Record<"contactLateralBall" | "contactLateralMidfoot" | "contactLateralHeel" | "contactMedialBall" | "contactMedialMidfoot" | "contactMedialHeel", readonly (readonly [number, number])[]>> = {
    contactLateralBall: [
      [0.86, 0.6],
      [0.8, 0.61],
      [0.75, 0.77],
      [0.7, 0.91],
      [0.6, 0.93],
    ],
    contactLateralMidfoot: [
      [0.5, 0.845],
      [0.4, 0.78],
      [0.3, 0.72],
      [0.2, 0.7],
    ],
    contactLateralHeel: [
      [0.1, 0.61],
      [0.075, 0.58],
    ],
    contactMedialBall: [
      [0.86, 0.19],
      [0.8, 0.17],
      [0.75, 0.155],
      [0.7, 0.19],
      [0.6, 0.5],
    ],
    contactMedialMidfoot: [
      [0.5, 0.6],
      [0.4, 0.515],
      [0.3, 0.405],
      [0.2, 0.29],
    ],
    contactMedialHeel: [
      [0.1, 0.28],
      [0.075, 0.3335],
    ],
  };

  /** The crest's knots up the ankle's front, lowest first: `[a, u, eta]`, eta in lateral malleolus heights. */
  const ANKLE: readonly (readonly [number, number, number])[] = [
    [0.406, 0.39, 1.2],
    [0.377, 0.39, 1.4621],
  ];

  /** The border regions' knots read in the fan's own planes (`AutoMovieHumanFootGuide.fanned`): `[share, a, u, y / L, y / H]`. */
  const FANNED: Readonly<Record<"lateralHeel" | "medialForefoot" | "medialNavicular", readonly AutoMovieHumanFootGuide.IFanKnot[]>> = {
    lateralHeel: [
      [0.55, 0.276, 0.8411, 0.069, 0.2511],
      [0.6, 0.2221, 0.8275, 0.0651, 0.2321],
      [0.65, 0.1593, 0.8028, 0.082, 0.2774],
    ],
    medialForefoot: [
      [0, 0.8598, 0.0213, 0.0429, 0.1606],
      [0.05, 0.7926, 0.0124, 0.0504, 0.184],
      [0.1, 0.7293, 0.0001, 0.0585, 0.2096],
      [0.15, 0.6657, 0.0119, 0.0651, 0.2366],
      [0.2, 0.6054, 0.0289, 0.0827, 0.3071],
      [0.25, 0.55, 0.0405, 0.0996, 0.3621],
      [0.3, 0.5025, 0.0431, 0.1139, 0.4218],
      [0.35, 0.4628, 0.0417, 0.1181, 0.437],
      [0.4, 0.4291, 0.0422, 0.123, 0.4551],
      [0.45, 0.3976, 0.0452, 0.1287, 0.4751],
    ],
    medialNavicular: [
      [0.5, 0.3653, 0.0477, 0.1516, 0.5238],
      [0.55, 0.3304, 0.0475, 0.1453, 0.5411],
      [0.6, 0.3139, 0.0489, 0.1895, 0.7076],
      [0.65, 0.298, 0.0484, 0.2203, 0.796],
    ],
  };

  /**
   * A region's knots as world points, front to back.
   *
   * @param region The region.
   * @param frame The foot's frame.
   * @param line The foot's web line.
   * @returns The knots.
   */
  export function knots(region: Region, frame: AutoMovieHumanFootFrame.IFrame, line: AutoMovieHumanFootWebLine.IWebLine): Vec3[] {
    switch (region) {
      case "crestForefoot":
        return AutoMovieHumanFootCrestForefoot.knots(frame);
      case "crestAnkle":
        return ANKLE.map((q: readonly [number, number, number]): Vec3 => frame.at(q[0], q[1], q[2] * frame.H));
      case "lateralForefoot":
        return AutoMovieHumanFootLateralForefoot.knots(frame, line);
      case "lateralColumn":
        return AutoMovieHumanFootColumn.knots("lateral", frame, line);
      case "medialColumn":
        return AutoMovieHumanFootColumn.knots("medial", frame, line);
      case "lateralHeel":
      case "medialForefoot":
      case "medialNavicular":
        return AutoMovieHumanFootGuide.fanned(frame, line, FANNED[region]);
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
        return FLOOR[region].map((q: readonly [number, number]): Vec3 => frame.at(q[0], q[1], 0));
    }
  }

  /**
   * The five guides of a foot, each its regions' knots joined by the guide's
   * own spline.
   *
   * @param frame The foot's frame.
   * @param line The foot's web line.
   * @returns The guides.
   */
  export function guides(frame: AutoMovieHumanFootFrame.IFrame, line: AutoMovieHumanFootWebLine.IWebLine): AutoMovieHumanFootBody.IGuides {
    const guide = (name: keyof AutoMovieHumanFootBody.IGuides): AutoMovieHumanFootGuide.IGuide =>
      AutoMovieHumanFootGuide.of(
        frame,
        line,
        GUIDES[name].flatMap((r: Region): Vec3[] => knots(r, frame, line)),
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
