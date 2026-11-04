import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import { AutoMovieHumanFootCrestForefoot } from "./AutoMovieHumanFootCrestForefoot";
import { AutoMovieHumanFootLateralForefoot } from "./AutoMovieHumanFootLateralForefoot";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";

type Vec3 = G.Vec3;

/**
 * The line of the toes' webs and the fan of section planes that starts on it.
 *
 * The body's first section is the oblique plane along the clefts' line: the
 * line fitted in plan through every cleft moved one margin radius back (half
 * the forefoot's depth under its crest there), so each web's crest lands on its
 * cleft. From that ring the planes turn about a vertical line beyond the
 * lateral border (the yaw fan) until square to the foot, and then about the
 * horizontal lateral axis through that line's top up to the horizontal ankle
 * ring (the turn fan); every plane meets every other only outside the foot.
 * This piece fixes the two axes, the levers and the stations; the planes
 * themselves are `AutoMovieHumanFootFan`.
 */
export namespace AutoMovieHumanFootWebLine {
  /** What the web line reads besides the frame. */
  export interface IInput {
    /** The foot's frame. */
    frame: AutoMovieHumanFootFrame.IFrame;

    /** The forefoot crest's height over the floor at a place along the foot, foot lengths. */
    depth: (a: number) => number;
  }

  /** The fan's axes, levers and stations. */
  export interface IWebLine {
    /** The shared point: on the vertical yaw axis and the horizontal turn axis. */
    origin: Vec3;

    /** Horizontal, across the foot toward its lateral side: the turn axis. */
    lateral: Vec3;

    /** Horizontal, along the foot toward the heel. */
    back: Vec3;

    /** The web ring's yaw from the square plane, radians. */
    yaw: number;

    /** Station at the square plane. */
    square: number;

    /** Station per radian of the yaw fan. */
    yawLever: number;

    /** Station per radian of the turn fan. */
    turnLever: number;

    /** Station at the ankle ring. */
    end: number;
  }

  /** The web line of a foot. */
  export function of(input: IInput): IWebLine {
    const frame: AutoMovieHumanFootFrame.IFrame = input.frame;
    const prior: AutoMovieHumanFootPrior.IPrior = AutoMovieHumanFootPrior.PRIOR;

    // Each cleft in the foot's own plan (along, across), mm, moved back by
    // half the forefoot's own height at the cleft: the web's margin radius.
    const points: [number, number][] = prior.clefts.map(
      (c: readonly [number, number]): [number, number] => [
        (c[1] - prior.ankle[1]) * frame.B,
        (c[0] - prior.ankle[0]) * frame.L - 0.5 * height(input.depth(c[0]), c[0], c[1]) * frame.L,
      ],
    );

    // Least squares line through them: along = my + slope (across - mx).
    const n: number = points.length;
    const mx: number = points.reduce((s: number, p: [number, number]): number => s + p[0], 0) / n;
    const my: number = points.reduce((s: number, p: [number, number]): number => s + p[1], 0) / n;
    let sxx: number = 0;
    let sxy: number = 0;
    for (const p of points) {
      sxx += (p[0] - mx) ** 2;
      sxy += (p[0] - mx) * (p[1] - my);
    }
    const slope: number = sxy / sxx;

    // The yaw axis stands PIVOT breadths beyond the lateral border, on that line.
    const c: number = Math.cos(prior.yaw);
    const s: number = Math.sin(prior.yaw);
    const plan = (along: number, across: number): Vec3 => [along * c - across * s, 0, along * s + across * c];
    const reach: number = (1 - prior.ankle[1] + PIVOT) * frame.B;
    const o: Vec3 = plan(my + slope * (reach - mx), reach);
    const yaw: number = Math.atan(-slope);
    const square: number = yaw * reach;

    return {
      origin: [o[0], frame.ring, o[2]],
      lateral: plan(0, 1),
      back: plan(-1, 0),
      yaw,
      square,
      yawLever: reach,
      turnLever: frame.ring,
      end: square + (Math.PI / 2) * frame.ring,
    };
  }
}

/**
 * The dorsum's height over the floor at a cleft's own across place, foot
 * lengths. The forefoot's dorsal arc runs from the crest, where its tangent
 * is level, to the lateral border, where it stands upright: a quarter, so its
 * height at an across place is the quarter ellipse's through the crest's
 * height and the border's,
 * `y = y_l + (y_c - y_l) sqrt(1 - x^2)`, `x = (u - u_c) / (1 - u_c)`; a cleft
 * on the crest's medial side reads the crest's own height.
 *
 * @param crest The crest's height at the cleft's place along the foot, foot lengths.
 * @param a The cleft's place along the foot, foot lengths.
 * @param u The cleft's across place, foot breadths.
 */
function height(crest: number, a: number, u: number): number {
  const uc: number = AutoMovieHumanFootCrestForefoot.across(a);
  const yl: number = AutoMovieHumanFootLateralForefoot.ringHeight();
  const x: number = Math.min(1, Math.max(0, (u - uc) / (1 - uc)));

  return yl + (crest - yl) * Math.sqrt(1 - x * x);
}

/** The yaw axis beyond the lateral border, in foot breadths. Convention: far enough that no plane of the fan meets the foot. */
const PIVOT: number = 1;
