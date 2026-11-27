import { Quaternion, Vector3, AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { stand } from "./stand";
import { walkFoot } from "./walkFoot";
import { walkReach } from "./walkReach";

/** The record of `IScheduleEndsResult`'s site. */
type IScheduleEndsResult = {
  from: IAutoMovieMotionHumanWalkFoot.IFoot;
  to: IAutoMovieMotionHumanWalkFoot.IFoot;
};

/** The record of `IScheduleEndsItem`'s site. */
type IScheduleEndsItem = {
  from: IAutoMovieMotionHumanWalkFoot.IFoot;
  to: IAutoMovieMotionHumanWalkFoot.IFoot;
};

/** The record of `IWindowsStancesItem`'s site. */
type IWindowsStancesItem = {
  side: AutoMovieHumanSide;
  from: number;
  to: number;
};

/** The record of `IWindowsB`'s site. */
type IWindowsB = { name: string; seconds: number };

/** The record of `IWindowsA`'s site. */
type IWindowsA = { name: string; seconds: number };

/** The record of `IWindowsEventsItem`'s site. */
type IWindowsEventsItem = { name: string; seconds: number };

/** The record of `IWindowsResult`'s site. */
type IWindowsResult = {
  events: IWindowsEventsItemResult[];
  stances: IWindowsStancesItemResult[];
};

/** The record of `IWindowsStancesItemResult`'s site. */
type IWindowsStancesItemResult = {
  side: AutoMovieHumanSide;
  from: number;
  to: number;
};

/** The record of `IWindowsEventsItemResult`'s site. */
type IWindowsEventsItemResult = { name: string; seconds: number };

/**
 * Each foot's schedule in a walk's footstep plan (`walkSteps`): from its
 * footfalls, the stance it holds before its first toe-off, the swing between a
 * toe-off and the next heel strike, and the stance on each footprint after it,
 * the rockers of each stance being `walkFoot`'s.
 */
export namespace walkStepFoot {
  /**
   * The toe-off pitch of a straight step, degrees toes-down: the toes' joints
   * are extended about 55° at the end of pre-swing, the toes still flat on the
   * floor and the knee 40° bent (Perry and Burnfield). A shallower foot leaves
   * the ankle behind the advancing hip, so the trailing knee straightens
   * through pre-swing where it bends.
   */
  export const PUSH: number = 55;

  /**
   * The share of its straight push-off pitch a foot turned from the pelvis by
   * `walkReach.TWIST` keeps: the ankle plantarflexion at toe-off of a step turn
   * against straight walking, 1.37° against 10.37° (Ficanha, Rastgaar, Moridian
   * and Mahmoudian 2013, ASME DSCC2013-3782, motion capture; the straight value
   * as the same group reports it in US patent 9,849,003), a turning step
   * pivoting more and pushing less in the sagittal plane (Hase and Stein
   * 1999).
   */
  export const TURNED_SHARE: number = 1.37 / 10.37;

  /** One footfall. */
  export interface IStep {
    /** The foot. */
    side: AutoMovieHumanSide;

    /** When the heel strikes, seconds. */
    heelStrike: number;

    /** When the foot left for this footfall, seconds. */
    toeOff: number;

    /** The foot flat on its footprint. */
    flat: IAutoMovieMotionHumanFoot.IPlacement;

    /** The footprint's heading, degrees. */
    heading: number;

    /**
     * The toe-off pitch of the foot leaving for this footfall, degrees,
     * negative.
     */
    push: number;

    /**
     * Whether the foot travels backward to this footfall: its stances' rockers
     * run in reverse (`walkFoot.prepareStance`). False when absent.
     */
    backward?: boolean;

    /** The next forefoot or heel plant carried from an outgoing run. */
    inherited?: IInherited;
  }

  /** Material contact and the displayed foot arriving at it. */
  export interface IInherited extends IAutoMovieMotionHumanWalkFoot.IFoot {
    /** Contact offset in the entering foot's own frame, if declared. */
    contact?: IAutoMovieVector3;
    /** Fixed world contact point, metres. */
    anchor: IAutoMovieVector3;
    /** Foot socket that retains the anchor through the first stance. */
    socket: "heel" | "mtp";
  }

  /**
   * A foot that enters a walk in the air, as a hurdler's trail leg comes over
   * the bar: where it is and how fast it moves at the start.
   */
  export interface IAirborne {
    /** The foot at the start: its placement, world metres, and toes. */
    foot: IAutoMovieMotionHumanWalkFoot.IFoot;

    /** Its ankle's velocity at the start, world metres per second. */
    velocity: IAutoMovieVector3;
  }

  /**
   * Set each footfall's push-off: a foot turned from the pelvis at its toe-off
   * pushes off less, since a turning step pivots more and pushes less in the
   * sagittal plane (Hase and Stein 1999): the pitch falls to `TURNED_SHARE` of
   * the straight one (Ficanha et al. 2013) as the turn reaches
   * `walkReach.TWIST`, linearly between (the interpolation is provisional, no
   * intermediate turn having been read), and a leg kept straight leaves the
   * floor nearly flat, a steep push-off needing the knee it does not bend.
   *
   * @param steps The footfalls, in order; each one's `push` is set.
   * @param start Each foot flat where the walk begins.
   * @param yaw The pelvis's heading at a second, degrees.
   * @param push The straight step's push-off pitch, degrees toes-down.
   * @param stiff The leg kept straight, if any.
   */
  export function pushed(
    steps: readonly IStep[],
    start: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    yaw: (seconds: number) => number,
    push: number,
    stiff?: AutoMovieHumanSide,
  ): void {
    for (const side of ["left", "right"] as const) {
      let leaving: number = HumanFoot.heading(start[side].rotation);
      for (const step of steps.filter((x: IStep): boolean => x.side === side)) {
        const turned: number = AutoMovieEngineMath.wrapDegrees(
          leaving -
            (yaw(step.toeOff) +
              (side === "left" ? stand.TOE_OUT : -stand.TOE_OUT)),
        );
        step.push =
          -push *
          (1 -
            (1 - TURNED_SHARE) *
              Math.min(1, Math.abs(turned) / walkReach.TWIST));
        if (stiff === side)
          step.push = Math.max(step.push, -walkFoot.STIFF_PUSH);
        leaving = step.heading;
      }
    }
  }

  /**
   * The named instants and each foot's stance spans of a walk's footfalls.
   *
   * @param steps The footfalls, in order.
   * @param last The last footfall, seconds.
   * @param duration The walk's length, seconds.
   * @returns Each foot's numbered toe-offs and heel strikes with the last
   *   footfall and the arrival, in time order, and each foot's stances from the
   *   start to the end.
   */
  export function windows(
    steps: readonly IStep[],
    last: number,
    duration: number,
  ): IWindowsResult {
    const counts: Record<string, number> = {};
    const events: IWindowsEventsItem[] = [];
    for (const step of steps) {
      counts[step.side] = (counts[step.side] ?? 0) + 1;
      events.push(
        {
          name: `${step.side}ToeOff${counts[step.side]}`,
          seconds: step.toeOff,
        },
        {
          name: `${step.side}HeelStrike${counts[step.side]}`,
          seconds: step.heelStrike,
        },
      );
    }
    events.push(
      { name: "lastFootfall", seconds: last },
      { name: "arrive", seconds: duration },
    );
    events.sort((a: IWindowsA, b: IWindowsB): number => a.seconds - b.seconds);
    const stances: IWindowsStancesItem[] = [];
    for (const side of ["left", "right"] as const) {
      let from: number = 0;
      for (const step of steps.filter((s: IStep): boolean => s.side === side)) {
        // A foot entered in the air swings from the start: no stance before it.
        if (step.toeOff > from) stances.push({ side, from, to: step.toeOff });
        from = step.heelStrike;
      }
      stances.push({ side, from, to: duration });
    }
    return { events, stances };
  }

  /**
   * A foot's schedule over its footfalls.
   *
   * @param body The body.
   * @param side The foot.
   * @param start The foot flat where the walk begins.
   * @param own The foot's footfalls, in order.
   * @param typical The gait's cruising stance, seconds, which an opening or
   *   closing stance's rockers take their shares of
   *   (`walkFoot.prepareStance`).
   * @param raised How far the gait holds the heels off the floor, degrees.
   * @param inPlace A stepping turn without a heel strike or forefoot push.
   * @param airborne A foot entered in the air, its first footfall's toe-off at
   *   the start: its first swing leaves from where it is, with the velocity it
   *   entered with, instead of from an opening stance. Absent for a foot
   *   standing at the start.
   * @returns The foot's scheduled stance at a second, with its swing while it
   *   swings.
   */
  export function schedule(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    start: IAutoMovieMotionHumanFoot.IPlacement,
    own: readonly IStep[],
    typical: number,
    raised: number,
    inPlace: boolean = false,
    airborne?: IAirborne,
  ): (t: number) => IAutoMovieMotionHumanWalkFoot.IScheduled {
    const stances: ((t: number) => IAutoMovieMotionHumanWalkFoot.IFoot)[] = [];
    for (let i: number = 0; i <= own.length; i++) {
      const previous: IStep | undefined = own[i - 1];
      const next: IStep | undefined = own[i];
      const flat: IAutoMovieMotionHumanFoot.IPlacement =
        previous?.flat ?? start;
      const facing: number =
        previous?.heading ?? HumanFoot.heading(start.rotation);
      const strike: number = previous?.heelStrike ?? -Infinity;

      // The opening stance follows its first step's direction; later ones
      // retain the direction of the footprint they stand on.
      const backward: boolean = (previous ?? next)?.backward === true;
      const staged = inPlace
        ? (): IAutoMovieMotionHumanWalkFoot.IFoot => ({
            placement: {
              ankle: { ...flat.ankle },
              rotation: { ...flat.rotation },
            },
            toes: 0,
          })
        : walkFoot.prepareStance(
            body,
            side,
            flat,
            facing,
            strike,
            next?.toeOff ?? Infinity,
            next?.push ?? -PUSH,
            typical,
            raised,
            backward,
          );
      stances.push(
        previous?.inherited === undefined
          ? staged
          : inheritedStance(
              body,
              side,
              previous.inherited,
              strike,
              next?.toeOff ?? Infinity,
              typical,
              staged,
            ),
      );
    }
    const ends: IScheduleEndsItem[] = own.map(
      (step: IStep, i: number): IScheduleEndsResult => ({
        from:
          i === 0 && airborne !== undefined
            ? {
                placement: {
                  ankle: { ...airborne.foot.placement.ankle },
                  rotation: { ...airborne.foot.placement.rotation },
                },
                toes: airborne.foot.toes,
              }
            : stances[i]!(step.toeOff),
        to: stances[i + 1]!(step.heelStrike),
      }),
    );
    return (t: number): IAutoMovieMotionHumanWalkFoot.IScheduled => {
      let low: number = 0;
      let high: number = own.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (t < own[middle]!.heelStrike) high = middle;
        else low = middle + 1;
      }
      const step: IStep | undefined = own[low];
      // Before the start a foot entered in the air was moving as it entered,
      // so its swing leaves with the entry's velocity.
      if (
        low === 0 &&
        airborne !== undefined &&
        step !== undefined &&
        t < step.toeOff
      )
        return {
          placement: {
            ankle: Vector3.add(
              airborne.foot.placement.ankle,
              Vector3.scale(airborne.velocity, t - step.toeOff),
            ),
            rotation: { ...airborne.foot.placement.rotation },
          },
          toes: airborne.foot.toes,
        };
      if (step === undefined || t < step.toeOff) return stances[low]!(t);
      const u: number = (t - step.toeOff) / (step.heelStrike - step.toeOff);
      const end: IAutoMovieMotionHumanWalkFoot.IFoot =
        u < 0.5 ? ends[low]!.from : ends[low]!.to;
      return {
        placement: {
          ankle: { ...end.placement.ankle },
          rotation: { ...end.placement.rotation },
        },
        toes: end.toes,
        swing: { u, off: step.toeOff, on: step.heelStrike },
      };
    };
  }
}

/**
 * Ease a previously scheduled landing into its new gait about the same sole
 * datum.
 */
function inheritedStance(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  foot: walkStepFoot.IInherited,
  strike: number,
  leaving: number,
  typical: number,
  staged: (seconds: number) => IAutoMovieMotionHumanWalkFoot.IFoot,
): (seconds: number) => IAutoMovieMotionHumanWalkFoot.IFoot {
  const settle: number = Math.min(typical, leaving - strike) / 3;
  const placed: IAutoMovieMotionHumanWalkFoot.IFoot = staged(strike + settle);
  const output: IAutoMovieVector3 = HumanFoot.offset(body, side, foot.socket);
  const input: IAutoMovieVector3 = foot.contact ?? output;
  const contact: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(
    input,
    output,
  );
  const anchor: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(
    foot.anchor,
    Vector3.add(
      placed.placement.ankle,
      Quaternion.rotateVector(placed.placement.rotation, output),
    ),
  );
  return (seconds: number): IAutoMovieMotionHumanWalkFoot.IFoot => {
    if (seconds <= strike)
      return { placement: foot.placement, toes: foot.toes };
    if (seconds >= strike + settle) return staged(seconds);
    const share: number = AutoMovieEngineMotionSampling.minimumJerkShare((seconds - strike) / settle);
    const rotation: IAutoMovieMotionHumanFoot.IPlacement["rotation"] =
      Quaternion.slerp(
        foot.placement.rotation,
        placed.placement.rotation,
        share,
      );
    return {
      placement: {
        rotation,
        ankle: Vector3.subtract(
          anchor(share),
          Quaternion.rotateVector(rotation, contact(share)),
        ),
      },
      toes: foot.toes + (placed.toes - foot.toes) * share,
    };
  };
}
