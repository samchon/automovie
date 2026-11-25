import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkFacing,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { WalkPath } from "./WalkPath";
import { stand } from "./stand";
import { walkHeading } from "./walkHeading";
import { walkStepFoot } from "./walkStepFoot";

/**
 * A walk's footprints (`walkSteps.plan`): each footfall's side, heel strike,
 * toe-off and flat footprint along the path, turned toward its asked heading,
 * kept apart from the other foot and leaned no further than the ankle holds,
 * with the pelvis's heading at each heel strike midway between the two feet it
 * stands on, read from the plan's body, path, timing, headings and widths.
 *
 * @param scope What the plan lays its footprints from.
 * @returns The footfalls, the heading knots and the in-place heel strikes.
 */
export function walkStepsFootprints(
  scope: walkStepsFootprints.IScope,
): walkStepsFootprints.IFootprints {
  const {
    m,
    path,
    facing,
    inPlace,
    airborne,
    yaw0,
    lead,
    n,
    turning,
    extra,
    first,
    swing,
    T,
    half,
    hipWidth,
    rest,
    place,
    progress,
    along$,
    towardAt,
  }: walkStepsFootprints.IScope = scope;
  // The footprints, and the pelvis's heading at each heel strike: midway
  // between the facings of the two feet it then stands on.
  const leeway: number =
    Math.tan((walkHeading.ROLL * Math.PI) / 180) *
    (m.hipHeight - m.ankleHeight);
  const steps: IStep[] = [];
  const knots: IHeading[] = [{ seconds: 0, yaw: yaw0 }];
  let faced: number = yaw0;
  const lastOf: Partial<Record<AutoMovieHumanSide, walkHeading.ISeparated>> =
    {};
  // The heel strikes of the footfalls taken in place at the arrival.
  const turnedAt: Set<number> = new Set();
  for (let j: number = 1; j <= n + 1; j++) {
    const side: AutoMovieHumanSide =
      j % 2 === 1 ? lead : lead === "left" ? "right" : "left";
    const heelStrike: number = first + swing + (j - 1) * T;
    const toeOut: number = side === "left" ? stand.TOE_OUT : -stand.TOE_OUT;
    const distance: number = place(j);
    const along: number = facing === undefined ? 0 : along$(distance);
    // Going aside, the feet keep their rest separation and never cross.
    const aside: number =
      facing === undefined
        ? 0
        : Math.sin(((along - towardAt(j)) * Math.PI) / 180) ** 2;
    const lateral: number =
      (side === "left" ? 1 : -1) *
      (inPlace || j >= n || j <= turning
        ? rest(side)
        : half + (rest(side) - half) * aside);
    const toward: number = towardAt(j);
    // A walk facing off its way closes a foot up rather than cross it, the closing pair's first footprint
    // too (the other foot's last still stands); an arrival's extra step turns and closing pair step round the standing foot.
    const other: walkHeading.ISeparated | undefined =
      lastOf[side === "left" ? "right" : "left"];
    const flat: IAutoMovieVector3 = HumanFrame.point(
      { origin: path.at(distance), yaw: toward },
      { x: lateral, y: m.ankleHeight, z: 0 },
    );
    const laid: IAutoMovieVector3 =
      extra > 0 && j > n - extra && other !== undefined
        ? walkHeading.around(other, toward, side, lateral, flat.y)
        : flat;
    const point: IAutoMovieVector3 =
      facing === undefined || j > n
        ? laid
        : walkHeading.separated(laid, other, toward, side, lateral);
    lastOf[side] = { point, lateral };
    if (extra > 0 && j > n - extra) turnedAt.add(heelStrike);
    // A footprint the pelvis leaves behind leans its leg no further than
    // the ankle holds when the foot lifts, at the toe-off two footfalls on,
    // the hip then being furthest past it and the pelvis facing between
    // this footprint and the next; a hip behind a foot walking a way it
    // does not face leans the leg the other way.
    const footHeading: number =
      !inPlace && j < n
        ? walkHeading.leaned(
            toward + toeOut,
            point,
            HumanFrame.point(
              {
                origin: path.at(progress(first + (j + 1) * T)),
                yaw: (toward + towardAt(j + 1)) / 2,
              },
              {
                x: (side === "left" ? 1 : -1) * hipWidth[side],
                y: 0,
                z: 0,
              },
            ),
            leeway,
            facing !== undefined,
          )
        : toward + toeOut;
    steps.push({
      side,
      heelStrike,
      toeOff: j === 1 && side === airborne ? 0 : heelStrike - swing,
      flat: { ankle: point, rotation: HumanFoot.rotation(footHeading, 0) },
      heading: footHeading,
      push: -walkStepFoot.PUSH,
      // Going more than 120 degrees from its facing, a foot steps backward.
      ...(facing !== undefined &&
      Math.cos(((along - toward) * Math.PI) / 180) < -0.5
        ? { backward: true }
        : {}),
    });
    knots.push({
      seconds: heelStrike,
      yaw: (faced + footHeading - toeOut) / 2,
    });
    faced = footHeading - toeOut;
  }

  return { steps, knots, turnedAt };
}

/** What a walk's footprints read and what they are. */
export namespace walkStepsFootprints {
  /** What a walk plan lays its footprints from. */
  export interface IScope {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The body's measure. */
    m: IAutoMovieMotionHumanBody["measure"];

    /** The walk's path on the floor. */
    path: WalkPath;

    /** What the walk faces; its way when absent. */
    facing: IAutoMovieMotionHumanWalkFacing.IFacing | undefined;

    /** Whether the walk turns in place. */
    inPlace: boolean;

    /** The foot entered in the air while the other stands, if any. */
    airborne: AutoMovieHumanSide | undefined;

    /** The entered heading, degrees. */
    yaw0: number;

    /** The foot that takes the first step. */
    lead: AutoMovieHumanSide;

    /** The footfalls before the closing one. */
    n: number;

    /** The opening steps taken before forward travel. */
    turning: number;

    /** The footfalls added in place at the arrival. */
    extra: number;

    /** The first toe-off, seconds. */
    first: number;

    /** The swing, seconds. */
    swing: number;

    /** The step period, seconds. */
    T: number;

    /** Half the gait's step width, metres. */
    half: number;

    /** Each hip's lateral offset from the midline at rest, metres. */
    hipWidth: Record<AutoMovieHumanSide, number>;

    /**
     * A foot's rest separation from the midline.
     *
     * @param side The foot.
     * @returns The separation, metres.
     */
    rest: (side: AutoMovieHumanSide) => number;

    /**
     * A footfall's distance along the path.
     *
     * @param j The footfall, from 1.
     * @returns The distance, metres.
     */
    place: (j: number) => number;

    /**
     * The pelvis's distance along the path at a second.
     *
     * @param t Action seconds.
     * @returns The distance, metres.
     */
    progress: (t: number) => number;

    /**
     * The path's heading at a distance, nearest the starting heading.
     *
     * @param s The distance, metres.
     * @returns The heading, degrees.
     */
    along$: (s: number) => number;

    /**
     * A footfall's asked heading.
     *
     * @param j The footfall, from 1.
     * @returns The heading, degrees.
     */
    towardAt: (j: number) => number;
  }

  /** The footfalls and the pelvis's heading knots. */
  export interface IFootprints {
    /** The footfalls. */
    steps: walkStepFoot.IStep[];

    /** The pelvis's heading knots. */
    knots: IHeading[];

    /** The heel strikes of the footfalls taken in place at the arrival. */
    turnedAt: Set<number>;
  }
  /** Heading knots of the turn, in action seconds and unwrapped degrees. */
  export interface IHeading {
    /** Action seconds. */
    seconds: number;

    /** Pelvis heading in degrees. */
    yaw: number;
  }
}

/** One footfall (`walkStepFoot.IStep`). */
type IStep = walkStepFoot.IStep;

/** A heading knot of the turn (`walkStepsFootprints.IHeading`). */
type IHeading = walkStepsFootprints.IHeading;
