import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeQuadrupedMotion } from "../AutoMovieArchetypeQuadrupedMotion";
import type { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import type { QuadrupedStridePlan } from "./QuadrupedStridePlan";
import { QuadrupedSwingChord } from "./QuadrupedSwingChord";

/**
 * One hoof's anchored position and orientation through a turn or grounded
 * departure.
 */
export namespace QuadrupedHoofTrack {
  /** A committed stance, before it is converted into a world footprint. */
  export interface IStance {
    /** Fraction of a stride between this hoof's landing and lifting. */
    duty: number;
    /** Body state at touchdown, including its rigid world placement. */
    landed: AutoMovieArchetypeCourse.IState;
    /** Signed metres the body travels over the entire stance. */
    travel: number;

    /**
     * Body placement at release, read when the body heading departs from the
     * travel heading; the hoof is then centred between its neutral points at
     * landing and release.
     */
    lifted?: IAutoMovieTransform;

    /**
     * The body-frame shift of a crossing leg's stance in a two-track figure;
     * absent elsewhere.
     */
    across?: ICross;
  }

  /**
   * The sideways shift a two-track figure gives the stances of the legs away
   * from its movement.
   */
  export interface ICross {
    /**
     * The body-frame side the figure moves toward: +1 for +x (left), -1 for -x
     * (right).
     */
    toward: number;
    /**
     * Metres the crossing hoof's neutral point moves toward that side,
     * nonnegative.
     */
    shift: number;
  }

  /**
   * Read a stance's crossover from its landing and release seconds, its signed
   * travel and its end.
   */
  export type Crossing = (
    from: number,
    to: number,
    travel: number,
    fore: boolean,
  ) => ICross | undefined;

  /** Read a stance from the admitted course and its gait clock. */
  export function stances(
    plan: AutoMovieArchetypeCourse.IPlan,
    clock: QuadrupedRideClock.IClock,
    secondsAt: (phase: number) => number,
    body?: (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      fore: boolean,
    ) => IAutoMovieTransform,
    crossing?: Crossing,
  ): (
    at: number,
    stride: QuadrupedStridePlan.IStride,
    fore: boolean,
  ) => IStance {
    return (
      at: number,
      stride: QuadrupedStridePlan.IStride,
      fore: boolean,
    ): IStance => {
      const seconds: number = secondsAt(at);
      const route: AutoMovieArchetypeCourse.IState = onward(plan, seconds);
      const timing: AutoMovieArchetypeQuadrupedGait.ITiming = clock.timing(
        stride.gait,
        seconds,
      );
      const observed: number = fore
        ? timing.duty
        : (timing.hindDuty ?? timing.duty);
      const duty: number = stride.reinBack ? Math.max(0.5, observed) : observed;
      const release: number = secondsAt(at + duty);
      const travel: number = onward(plan, release).progress - route.progress;
      if (body === undefined) return { duty, landed: route, travel };
      const across: ICross | undefined = crossing?.(
        seconds,
        release,
        travel,
        fore,
      );
      return {
        duty,
        landed: { ...route, placement: body(route, seconds, fore) },
        travel,
        lifted: body(onward(plan, release), release, fore),
        ...(across === undefined ? {} : { across }),
      };
    };
  }

  /**
   * The course state at a second, continued past its end at its final velocity:
   * a horse at speed at the last mark runs on, so a footfall after the end
   * lands where the run carries it; a course ending at a halt stays where it
   * stopped.
   *
   * @param plan The course plan.
   * @param seconds The film second.
   * @returns The state.
   */
  export function onward(
    plan: AutoMovieArchetypeCourse.IPlan,
    seconds: number,
  ): AutoMovieArchetypeCourse.IState {
    if (!(seconds > plan.duration)) return plan.at(seconds);
    const last: AutoMovieArchetypeCourse.IState = plan.at(plan.duration);
    const over: number = (seconds - plan.duration) * last.speed;
    if (!(over > 0)) return last;
    return {
      ...last,
      progress: last.progress + over,
      distance: last.distance + over,
      placement: {
        ...last.placement,
        translation: Vector3.add(
          last.placement.translation,
          Vector3.scale(
            Quaternion.rotateVector(last.placement.rotation, {
              x: 0,
              y: 0,
              z: 1,
            }),
            over,
          ),
        ),
      },
    };
  }

  /** The authored surface under a point, or none where no plane covers it. */
  function covered(
    footing: AutoMovieArchetypeQuadrupedFooting.IPlan,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): AutoMovieArchetypeQuadrupedFooting.ILanding | undefined {
    try {
      return footing.landing(point, rotation);
    } catch (error) {
      if (error instanceof AutoMovieArchetypeRefusal) return undefined;
      throw error;
    }
  }
  /**
   * The swing height of a landmark gait: the toe raised to its coordinate along
   * the neutral cannon, measured above the neutral hoof endpoint.
   *
   * @param chain The limb's neutral joint points, model metres, from the top
   *   joint to the hoof endpoint.
   * @param landmark The gait's landmark elevation.
   * @param fore Whether the limb is a fore.
   * @returns Metres of swing clearance.
   */
  export function elevation(
    chain: readonly IAutoMovieVector3[],
    landmark: AutoMovieArchetypeQuadrupedGait.IElevation,
    fore: boolean,
  ): number {
    const share: number = fore ? landmark.fore : landmark.hind;
    return chain[3]!.y + share * (chain[2]!.y - chain[3]!.y) - chain[4]!.y;
  }

  /**
   * The world point a stance plants its hoof at.
   *
   * @param rest Neutral hoof endpoint in model metres.
   * @param support The stance.
   * @param under The model fore-aft position the hoof is centred toward: the
   *   proximal attachment's less the fetlock's lead on the hoof, so the
   *   fetlock, which the limb's reach holds, travels centred under the
   *   attachment; the neutral hoof's when absent.
   * @returns The world footprint before any authored surface is applied.
   */
  export function footprint(
    rest: IAutoMovieVector3,
    support: IStance,
    under: number = rest.z,
  ): IAutoMovieVector3 {
    const reach: number = Math.abs(support.travel) / 2;
    const z: number =
      rest.z + Math.max(-reach, Math.min(reach, under - rest.z));
    // A crossing leg's neutral point moves toward the figure's side; its partner, on that side, keeps its own.
    const x: number =
      support.across !== undefined &&
      Math.sign(rest.x) === -support.across.toward
        ? rest.x + support.across.toward * support.across.shift
        : rest.x;
    if (support.lifted === undefined)
      return AutoMovieArchetypeFrame.point(support.landed.placement, {
        x,
        y: 0,
        z: z + support.travel / 2,
      });
    const neutral: IAutoMovieVector3 = { x, y: 0, z };
    const point: IAutoMovieVector3 = Vector3.lerp(
      AutoMovieArchetypeFrame.point(support.landed.placement, neutral),
      AutoMovieArchetypeFrame.point(support.lifted, neutral),
      0.5,
    );
    return { ...point, y: support.landed.placement.translation.y };
  }

  /**
   * Admit an optional stationary departure anchor at the course start.
   *
   * @param plan The owned course plan with the initial time and body placement.
   * @param requested The explicit flag for planting the initially neutral
   *   hooves.
   * @param archetype Owner printed in the typed course refusal.
   * @returns The initial course state for holding the neutral footprints, when
   *   requested.
   * @throws {AutoMovieArchetypeRefusal} If the explicit flag or starting speed
   *   cannot represent standing.
   */
  export function departure(
    plan: AutoMovieArchetypeCourse.IPlan,
    requested: true | undefined,
    archetype: string,
  ): AutoMovieArchetypeCourse.IState | undefined {
    if (requested === undefined) return undefined;
    const initial: AutoMovieArchetypeCourse.IState = plan.at(plan.when(0));
    if (requested === true && initial.speed === 0) return initial;
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "startFromStanding",
      value: requested,
      feasible: null,
      reason:
        "standing departure requires a zero-speed start and the explicit true flag",
      fix: "Specify startSpeed 0 with acceleration or omit startFromStanding.",
    });
  }

  /**
   * Read the current planted anchor or its independently sampled swing.
   *
   * @param phase Current stride coordinate, with course start at zero.
   * @param landed Previous contact phase, which can precede course start.
   * @param coming Next real contact phase.
   * @param current Predicted ordinary stance and its admitted duty.
   * @param standing Starting placement when the rider requests a stand.
   * @returns Chosen anchor, contact state, and normalized swing
   *   displacement/height.
   */
  export function step(
    phase: number,
    landed: number,
    coming: number,
    current: IStance,
    standing: AutoMovieArchetypeCourse.IState | undefined,
  ): { from: IStance; planted: boolean; along: number; rise: number } {
    const initial: boolean = standing !== undefined && landed <= 0;
    const local: number = phase - landed;
    const liftOff: number = initial
      ? Math.max(-landed, current.duty)
      : current.duty;
    const planted: boolean = local < liftOff;
    const swing: number = planted
      ? 0
      : (local - liftOff) / (coming - landed - liftOff);
    return {
      from: initial ? { ...current, landed: standing!, travel: 0 } : current,
      planted,
      ...AutoMovieArchetypeQuadrupedMotion.swing(swing),
    };
  }

  /**
   * Convert the fixed world footprint or world swing to the current body frame.
   *
   * @param state Current course state, including the body's world placement.
   * @param rest Neutral hoof endpoints in model metres.
   * @param from Last committed stance.
   * @param to The next committed stance during swing. Omitted during stance.
   * @param amount The smooth swing progression from zero to one.
   * @param worldAnchors Whether turns or a standing start require world
   *   anchoring.
   * @param footing Optional independently placed world surfaces and authored
   *   obstacles.
   * @param under The model fore-aft position the hoof is centred toward
   *   (`footprint`'s).
   * @param clear Moves a world foothold clear of the footing's concave edges
   *   (`QuadrupedCorner`); footholds stand where the course puts them when
   *   absent.
   * @returns Model-space coordinates in metres. The world-anchor path also
   *   returns the relative terminal axis rotation.
   */
  export function target(
    state: AutoMovieArchetypeCourse.IState,
    rest: IAutoMovieVector3,
    from: IStance,
    to: IStance | undefined,
    amount: number,
    worldAnchors: boolean,
    footing?: AutoMovieArchetypeQuadrupedFooting.IPlan,
    under?: number,
    clear?: (point: IAutoMovieVector3) => IAutoMovieVector3,
  ): Pick<QuadrupedRidePose.IGoal, "x" | "z" | "orientation" | "surface"> {
    if (!worldAnchors && footing === undefined) {
      // Each stance's centre moves toward the attachment by at most half its travel, as the footprint places it.
      const centre = (support: IStance): number =>
        rest.z +
        Math.max(
          -Math.abs(support.travel) / 2,
          Math.min(Math.abs(support.travel) / 2, (under ?? rest.z) - rest.z),
        );
      if (to === undefined)
        return {
          z:
            centre(from) +
            from.travel / 2 -
            (state.progress - from.landed.progress),
        };
      // The ground path and the body path, blended as a world-anchored swing's (`QuadrupedSwingChord.blend`): at rest at both ends.
      const lifting: number =
        from.landed.progress + centre(from) + from.travel / 2;
      const landing: number = to.landed.progress + centre(to) + to.travel / 2;
      return {
        z: QuadrupedSwingChord.blend(
          lifting + (landing - lifting) * amount - state.progress,
          centre(from) -
            from.travel / 2 +
            (centre(to) + to.travel / 2 - centre(from) + from.travel / 2) *
              amount,
          amount,
        ),
      };
    }
    const placed = (stance: IStance): IAutoMovieVector3 => {
      const point: IAutoMovieVector3 = footprint(rest, stance, under);
      return clear === undefined ? point : clear(point);
    };
    const foot: IAutoMovieVector3 = placed(from);
    const landed: IAutoMovieQuaternion = from.landed.placement.rotation;
    const oldGround: AutoMovieArchetypeQuadrupedFooting.ILanding | undefined =
      footing?.landing(foot, landed);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      state.placement.rotation,
    );
    const nextFoot: IAutoMovieVector3 | undefined =
      to === undefined ? undefined : placed(to);
    const nextGround: AutoMovieArchetypeQuadrupedFooting.ILanding | undefined =
      nextFoot === undefined
        ? undefined
        : footing?.landing(nextFoot, to!.landed.placement.rotation);
    const beginning: IAutoMovieVector3 = oldGround?.point ?? foot;
    const arrival: IAutoMovieVector3 | undefined =
      nextFoot === undefined ? undefined : (nextGround?.point ?? nextFoot);

    // A swing travels under the body between its footholds as the one-dimensional track's does (`QuadrupedSwingChord`).
    const chord: IAutoMovieVector3 =
      arrival === undefined
        ? beginning
        : QuadrupedSwingChord.carried(
            state.placement,
            beginning,
            QuadrupedSwingChord.release(from),
            arrival,
            to!.landed.placement,
            amount,
          );
    // A swinging hoof rises above the ground beneath it, not only above the chord between its footholds, which passes under a crest between them.
    const beneath: AutoMovieArchetypeQuadrupedFooting.ILanding | undefined =
      arrival === undefined || footing === undefined
        ? undefined
        : covered(footing, chord, landed);
    const raised: boolean = beneath !== undefined && beneath.point.y > chord.y;
    const world: IAutoMovieVector3 = raised
      ? { ...chord, y: beneath!.point.y }
      : chord;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(world, state.placement.translation),
    );
    // A body pitched against the ground (a lean or a tilt) sees the level ground as a plane through the hoof's world point.
    const up: IAutoMovieVector3 = Quaternion.rotateVector(inverse, {
      x: 0,
      y: 1,
      z: 0,
    });
    return {
      x: local.x,
      z: local.z,
      orientation: Quaternion.multiply(
        inverse,
        to === undefined
          ? (oldGround?.rotation ?? landed)
          : Quaternion.slerp(
              oldGround?.rotation ?? landed,
              nextGround?.rotation ?? to.landed.placement.rotation,
              amount,
            ),
      ),
      ...(oldGround === undefined
        ? up.y === 1
          ? {}
          : { surface: { point: local, normal: up } }
        : {
            surface: {
              point: local,
              normal: Quaternion.rotateVector(
                inverse,
                raised
                  ? beneath!.normal
                  : nextGround === undefined
                    ? oldGround.normal
                    : Vector3.normalize(
                        Vector3.lerp(
                          oldGround.normal,
                          nextGround.normal,
                          amount,
                        ),
                      ),
              ),
            },
          }),
    };
  }
}
