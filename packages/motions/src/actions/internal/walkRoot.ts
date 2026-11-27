import { AutoMovieGravity, Quaternion, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../../posture/HumanFrame";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { WalkPace } from "../WalkPace";

/** The record of `IPropsBob`'s site. */
type IPropsBob = { mean: number; amplitude: number };

/** Fixed body, path and timing inputs of a stepping take's unconstrained root. */
interface IProps {
  /**
   * The body whose hip height scales the sway and the bob, and whose leg
   * settles the root.
   */
  body: IAutoMovieMotionHumanBody;

  /** The exact entry root, world metres. */
  start: IAutoMovieVector3;

  /** Step period, seconds. */
  period: number;

  /** Mean cruising speed for a self-paced walking path in metres per second. */
  walkingSpeed?: number;

  /** Cruising distance between consecutive footprints, metres. */
  step: number;

  /** Opening-turn delay, seconds. */
  lag: number;

  /** Gait initiation span, seconds. */
  first: number;

  /** Last footfall, seconds. */
  last: number;

  /** Contact lead, in step periods. */
  front: number;

  /** Swing duration, seconds. */
  swing: number;

  /** Contact before the closing foot, seconds. */
  stop: number;

  /** First left heel strike, seconds. */
  firstLeft: number;

  /** Running root drop and oscillation, in hip heights; walking's when absent. */
  bob: IPropsBob | undefined;

  /** Distance along the fixed path at each action second, metres. */
  progress: (seconds: number) => number;

  /** Pelvis heading at each second, degrees. */
  yaw: (seconds: number) => number;

  /** Path point at an arc length, world metres. */
  at: (distance: number) => IAutoMovieVector3;

  /** Travel/facing heading at that distance and point, degrees. */
  heading: (distance: number, point: IAutoMovieVector3) => number;
}
/** The alternatives of `WalkRootResult`'s site. */
type WalkRootResult = "root" | "amount";

/**
 * Prepare the fixed body/phase terms of a stepping take's root and gait amount.
 *
 * @param props The take's fixed measured body, entry root, path and clock.
 * @returns The unconstrained root and the start/stop amount at each second.
 */
export function walkRoot(
  props: IProps,
): Pick<IAutoMovieMotionHumanWalkSteps.IPlan, WalkRootResult> {
  const a: IAutoMovieVector3 = props.body.rest.get("leftFoot")!;
  const b: IAutoMovieVector3 = props.body.rest.get("rightFoot")!;
  const rest: IAutoMovieVector3 = {
    x: (a.x + b.x) / 2,
    y: 0,
    z: (a.z + b.z) / 2,
  };
  const l: number = props.body.measure.hipHeight;
  const T: number = props.period;
  const stride: number = 2 * T;

  // Walking's pelvic excursions are stated at the reference hip and scale
  // with the body's own hip height, as dynamic similarity scales every
  // length of a gait with the leg (Alexander 1984).
  const similar: number = l / walkRoot.REFERENCE_HIP;
  const swayScale: number = walkRoot.SWAY * similar;

  // The planned root sits as far under the entry root as the stance knee's
  // least flexion (`lowerHumanPosture.KNEE`) shortens the leg, so no
  // planted leg is planned at full stretch: the hip-to-ankle chord of a knee
  // bent `KNEE` is `sqrt(a^2 + b^2 + 2 a b cos KNEE)` against `a + b`.
  const thigh: number = props.body.measure.thigh;
  const shank: number = props.body.measure.shank;
  const settle: number =
    Math.sqrt(
      thigh * thigh +
        shank * shank +
        2 * thigh * shank * Math.cos((lowerHumanPosture.KNEE * Math.PI) / 180),
    ) -
    (thigh + shank);
  const gathers: number = props.first + T;

  // A planned stop is made over the final step: the last push-off is cut
  // short and the foot that first reaches its terminal place brakes the
  // body (Jaeger and Vanitchatchavan 1992, J Biomech 25:1233; Vanitchatchavan
  // 2009), so the gait's amount sheds from that foot's heel strike, the
  // second-last, until the closing foot has taken the weight: its heel
  // strike and its loading response (`LOADING` of the cycle of two steps).
  const sheds: number = props.last - props.stop + 2 * walkRoot.LOADING * T;
  const over: number = props.firstLeft + props.front * T;
  const middle: number = props.firstLeft + (T - props.swing / 2);
  // Inverted-pendulum exchange (Cavagna et al., J Physiol 1976, PMID
  // 1011078; Griffin et al. 1999, doi:10.1152/jappl.1999.86.1.383): the difference in
  // squared speeds between the bottom and top is 2 g times their height
  // difference. Use the ratio of these speeds to set the modulation, so
  // its spatial derivative is positive even at a very slow mean pace.
  let contrast: number = 0;
  if (props.walkingSpeed !== undefined && props.walkingSpeed > 0) {
    const speed: number = props.walkingSpeed;
    const fast: number = Math.hypot(
      speed,
      Math.sqrt(4 * AutoMovieGravity.STANDARD * similar * walkRoot.BOB),
    );

    // The swing advances two steps in its swing time. Differentiate its
    // minimum-jerk path at mid-swing to account for distal mass momentum.
    const footSpeed: number =
      (minimumJerk.rate(0.5) * 2 * props.step) / props.swing;
    const residual: number =
      speed - walkRoot.distalShare(props.body) * footSpeed;

    // The same carried mass factor divides both speeds and cancels in
    // their contrast. A nonpositive residual is outside this approximation.
    if (residual > 0 && fast > residual)
      contrast = (fast - residual) / (fast + residual);
  }
  const amount: (t: number) => number = (t: number): number => {
    const up: number = minimumJerk.share((t - props.lag) / gathers);
    const down: number = 1 - minimumJerk.share((t - props.stop) / sheds);
    return Math.max(0, Math.min(1, Math.min(up, down)));
  };
  const planned: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => {
    const yaw: number = props.yaw(t);
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      rest,
    );
    const a: number = amount(t);
    const phase: number = 2 * Math.PI * (t - over);
    const sway: number = swayScale * a * Math.cos(phase / stride);
    const bob: number =
      props.bob === undefined
        ? a * similar * (walkRoot.BOB_MEAN + walkRoot.BOB * Math.cos(phase / T))
        : a *
          l *
          (props.bob.mean -
            props.bob.amplitude * Math.cos((2 * Math.PI * (t - middle)) / T));
    const distance: number = props.progress(t);
    // Each heel-strike interval advances exactly its planned distance.
    // The spatial derivative 1 + contrast*cos is positive, including on
    // the shortened departure and arrival steps, and agrees across strikes.
    let s: number = distance;
    if (contrast > 0 && t > props.lag && t < props.last) {
      const strike: number =
        props.firstLeft + T * Math.floor((t - props.firstLeft) / T);
      const start: number = props.progress(Math.max(props.lag, strike));
      const end: number = props.progress(Math.min(props.last, strike + T));
      if (end > start) {
        const wave: number = (2 * Math.PI) / (end - start);
        s += (contrast / wave) * Math.sin(wave * (distance - start));
      }
    }
    const along: IAutoMovieVector3 = props.at(s);
    const point: IAutoMovieVector3 = HumanFrame.point(
      { origin: along, yaw: props.heading(s, along) },
      { x: sway, y: 0, z: 0 },
    );
    return { x: point.x - centre.x, y: settle + bob, z: point.z - centre.z };
  };
  const initial: IAutoMovieVector3 = planned(0);
  const offset: IAutoMovieVector3 = {
    x: props.start.x - initial.x,
    y: props.start.y - initial.y,
    z: props.start.z - initial.z,
  };
  return {
    amount,
    root: (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk.share(t / walkRoot.FADE);
      const point: IAutoMovieVector3 = planned(t);
      return {
        x: point.x + offset.x * fade,
        y: point.y + offset.y * fade,
        z: point.z + offset.z * fade,
      };
    },
  };
}

/** The excursions and spans of a stepping take's unconstrained root. */
export namespace walkRoot {
  /**
   * Ankle-equivalent mass of one leg as a fraction of total body mass. The
   * segmental first moment about the hip determines how much moving an ankle
   * translates the whole centre in the straight-leg approximation.
   *
   * @param body The actor's neutral segment frames, masses and hip-to-ankle
   *   span.
   * @returns The mean of the two legs' equivalent mass fractions.
   */
  export function distalShare(body: IAutoMovieMotionHumanBody): number {
    let moment: number = 0;
    for (const segment of body.profile.segments) {
      if (!/^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/.test(segment.bone))
        continue;
      const centre: number =
        segment.neutral.position.y +
        Quaternion.rotateVector(segment.neutral.rotation, segment.centerOfMass)
          .y;
      moment += segment.mass * (body.measure.hipHeight - centre);
    }
    return (
      moment /
      (2 *
        body.profile.mass *
        (body.measure.hipHeight - body.measure.ankleHeight))
    );
  }
  /**
   * The hip height of an average adult, metres, at which gait measurements of
   * ordinary adults are stated and scaled to a body by dynamic similarity:
   * Winter's greater-trochanter height, 0.530 of stature (Winter, Biomechanics
   * and Motor Control of Human Movement, segment table after Drillis and
   * Contini 1966), of the mean stature of United States men aged 20 and over,
   * 175.3 cm (Fryar et al. 2021, Vital Health Stat 3(46), Table 11, NHANES
   * 2015-2018), about 0.93 m. The walk's Froude paces give Bohannon's adult
   * speeds at it (`walk.FROUDE`).
   */
  export const REFERENCE_HIP: number = 0.53 * 1.753;

  /**
   * The pelvis's sway toward the stance foot at the reference hip, metres: 2
   * cm, half the 4 cm side-to-side travel of the centre of mass in normal gait
   * (Perry and Burnfield).
   */
  export const SWAY: number = 0.02;

  /**
   * The pelvis's rise and fall about its mean twice a stride at the reference
   * hip, metres: 2.5 cm, half the 4 to 5 cm vertical excursion of the centre of
   * mass (Perry and Burnfield).
   */
  export const BOB: number = 0.025;

  /**
   * How far the walking pelvis's mean lies under its standing height at full
   * gait at the reference hip, metres: one `BOB` down, so the pelvis rises to
   * its standing height at mid-stance, where the stance leg stands straight
   * over its foot as an inverted pendulum's, and falls `2 BOB` below it at
   * double support (the inverted-pendulum stance of walking, Cavagna, Heglund
   * and Taylor 1977, Am J Physiol 233:R243).
   */
  export const BOB_MEAN: number = -BOB;

  /**
   * The share of a gait cycle, two step periods, a foot's loading response
   * takes after its heel strike: the first 10 % of the cycle, the double
   * support in which the limb accepts the body's weight (Perry and Burnfield,
   * phases of gait).
   */
  export const LOADING: number = 0.1;

  /**
   * Seconds over which the entry root's offset from the planned path fades: the
   * gait's initiation (`WalkPace.FIRST`, Brenière, Do and Bouisset 1987), over
   * which the body leaves its standing root.
   */
  export const FADE: number = WalkPace.FIRST;
}
