import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import { AutoMovieHumanFootHeads } from "./AutoMovieHumanFootHeads";
import { AutoMovieHumanFootColumn } from "./AutoMovieHumanFootColumn";
import { AutoMovieHumanFootToeJoints } from "./AutoMovieHumanFootToeJoints";
import { AutoMovieHumanFootToeLines } from "./AutoMovieHumanFootToeLines";

type Vec3 = G.Vec3;

/**
 * The foot's anatomical centres from its three dimensions, before any skin:
 * the ankle at the lateral malleolus height, the metatarsal heads
 * ({@link AutoMovieHumanFootHeads}), each toe's line and joints
 * ({@link AutoMovieHumanFootToeLines}, {@link AutoMovieHumanFootToeJoints}) and
 * the malleoli on their borders ({@link AutoMovieHumanFootColumn.centre}),
 * built in the left foot's
 * frame; the right foot's centres are its reflection.
 */
export namespace AutoMovieHumanFootBones {
  /** A foot's dimensions in calibration millimetres. */
  export type IDimensions = AutoMovieHumanFootFrame.IDimensions;

  /** One side's centres, reflected for the side. */
  export interface IBones {
    /** Ankle centre, at the lateral malleolus height. */
    ankle: Vec3;

    /** Lateral and medial malleoli. */
    malleoli: { lateral: Vec3; medial: Vec3 };

    /** Metatarsal head centres, hallux first. */
    heads: Vec3[];

    /** Mean of the metatarsal heads. */
    ball: Vec3;

    /**
     * Each toe's joints from its metatarsal head to its tip, hallux first: the
     * hallux's MTP, IP and tip, a lesser toe's MTP, PIP, DIP and tip.
     */
    toes: Vec3[][];
  }

  /** A foot's centres and the frame they stand in. */
  export interface ICentres {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** Toe lines: head centre and apex, left frame. */
    lines: AutoMovieHumanFootToeLines.ILine[];

    /** Centres, reflected for the side. */
    bones: IBones;
  }

  /**
   * A foot's centres.
   *
   * @param d Dimensions in calibration millimetres.
   * @param sign 1 for the left foot, -1 for the right's reflected centres.
   */
  export function of(d: IDimensions, sign: 1 | -1): ICentres {
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;
    const frame: AutoMovieHumanFootFrame.IFrame = AutoMovieHumanFootFrame.of(d);
    const heads: AutoMovieHumanFootHeads.IHeads = AutoMovieHumanFootHeads.of(frame);
    const lines: AutoMovieHumanFootToeLines.ILine[] = AutoMovieHumanFootToeLines.of(frame, heads.heads);
    const sided = (p: Vec3): Vec3 => G.sided(p, sign);

    return {
      frame,
      lines,
      bones: {
        ankle: [0, frame.H, 0],
        malleoli: {
          lateral: sided(AutoMovieHumanFootColumn.centre("lateral", frame, prior.malleoli.lateral.height)),
          medial: sided(AutoMovieHumanFootColumn.centre("medial", frame, prior.malleoli.medial.height)),
        },
        heads: heads.heads.map(sided),
        ball: sided(heads.ball),
        toes: AutoMovieHumanFootToeJoints.of(lines).map((joints: Vec3[]): Vec3[] => joints.map(sided)),
      },
    };
  }
}
