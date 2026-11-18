import { minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { WalkPace } from "./WalkPace";

/** Fixed body, path and timing inputs of a stepping take's unconstrained root. */
interface IProps {
  /** The body whose hip height scales the sway and the bob, and whose leg settles the root. */
  body: IAutoMovieMotionHumanBody;

  /** The exact entry root, world metres. */
  start: IAutoMovieVector3;

  /** Step period, seconds. */
  period: number;

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
  bob: { mean: number; amplitude: number } | undefined;

  /** Distance along the fixed path at each action second, metres. */
  progress: (seconds: number) => number;

  /** Pelvis heading at each second, degrees. */
  yaw: (seconds: number) => number;

  /** Path point at an arc length, world metres. */
  at: (distance: number) => IAutoMovieVector3;

  /** Travel/facing heading at that distance and point, degrees. */
  heading: (distance: number, point: IAutoMovieVector3) => number;
}

/**
 * Prepare the fixed body/phase terms of a stepping take's root and gait amount.
 *
 * @param props The take's fixed measured body, entry root, path and clock.
 * @returns The unconstrained root and the start/stop amount at each second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preparation boundary, units and the two readers used by walkSteps; the namespace states each excursion's size, source or provisional status.
 * @evidence contracts/development/implementation.md#principled-implementation Minimum-jerk gait ramps, a heading-relative rest-foot centre, stance-relative sinusoidal sway and bob and an entry-offset fade, every path point read at the queried distance. Walking's sway and bob scale with the hip height over `REFERENCE_HIP` (dynamic similarity, Alexander 1984), a run's bob is given in hip heights, and the root settles by the leg's shortening at the stance knee's least flexion, read from the body's thigh and shank.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed rest geometry and phase origins precede amount, planned-root and entry-preserving root readers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every coefficient is a named constant of the namespace, sourced or marked provisional; no path or query time is sampled or rounded.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and root arithmetic per second, plus the supplied path/heading costs; rest points, phase origins and the initial planned root are read once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A take fixes the body, timing and path readers; this closure shares only those fixed prerequisites and not a result keyed by a later query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned readers retain the fixed input record, rest centre and entry offset until the step plan releases them, with no growing query history.
 */
export function walkRoot(props: IProps): Pick<IAutoMovieMotionHumanWalkSteps.IPlan, "root" | "amount"> {
  const a: IAutoMovieVector3 = props.body.rest.get("leftFoot")!;
  const b: IAutoMovieVector3 = props.body.rest.get("rightFoot")!;
  const rest: IAutoMovieVector3 = { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 };
  const l: number = props.body.measure.hipHeight;
  const T: number = props.period;
  const stride: number = 2 * T;

  // Walking's pelvic excursions are stated at the reference hip and scale
  // with the body's own hip height, as dynamic similarity scales every
  // length of a gait with the leg (Alexander 1984).
  const similar: number = l / walkRoot.REFERENCE_HIP;
  const swayScale: number = walkRoot.SWAY * similar;

  // The planned root sits as far under the entry root as the stance knee's
  // least flexion (`resolveHumanPosture.KNEE`) shortens the leg, so no
  // planted leg is planned at full stretch: the hip-to-ankle chord of a knee
  // bent `KNEE` is `sqrt(a^2 + b^2 + 2 a b cos KNEE)` against `a + b`.
  const thigh: number = props.body.measure.thigh;
  const shank: number = props.body.measure.shank;
  const settle: number =
    Math.sqrt(
      thigh * thigh + shank * shank +
        2 * thigh * shank * Math.cos((resolveHumanPosture.KNEE * Math.PI) / 180),
    ) - (thigh + shank);
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
  const amount: (t: number) => number = (t: number): number => {
    const up: number = minimumJerk.share((t - props.lag) / gathers);
    const down: number = 1 - minimumJerk.share((t - props.stop) / sheds);
    return Math.max(0, Math.min(1, Math.min(up, down)));
  };
  const planned: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3 => {
    const yaw: number = props.yaw(t);
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw }, rest,
    );
    const a: number = amount(t);
    const phase: number = 2 * Math.PI * (t - over);
    const sway: number = swayScale * a * Math.cos(phase / stride);
    const bob: number = props.bob === undefined
      ? a * similar * (walkRoot.BOB_MEAN + walkRoot.BOB * Math.cos(phase / T))
      : a * l * (props.bob.mean - props.bob.amplitude * Math.cos((2 * Math.PI * (t - middle)) / T));
    const s: number = props.progress(t);
    const along: IAutoMovieVector3 = props.at(s);
    const point: IAutoMovieVector3 = HumanFrame.point(
      { origin: along, yaw: props.heading(s, along) }, { x: sway, y: 0, z: 0 },
    );
    return { x: point.x - centre.x, y: settle + bob, z: point.z - centre.z };
  };
  const initial: IAutoMovieVector3 = planned(0);
  const offset: IAutoMovieVector3 = {
    x: props.start.x - initial.x, y: props.start.y - initial.y, z: props.start.z - initial.z,
  };
  return {
    amount,
    root: (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk.share(t / walkRoot.FADE);
      const point: IAutoMovieVector3 = planned(t);
      return { x: point.x + offset.x * fade, y: point.y + offset.y * fade, z: point.z + offset.z * fade };
    },
  };
}

/**
 * The excursions and spans of a stepping take's unconstrained root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each constant states its unit and its source or that it is provisional.
 * @evidence contracts/development/design.md#principled-representation Lengths in metres at the reference hip, scaled by the body's hip height where read, and spans in seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The numbers `walkRoot` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Named and marked, not numbers inside the function.
 */
export namespace walkRoot {
  /** The hip height of an average adult, metres, at which gait measurements of ordinary adults are stated and scaled to a body by dynamic similarity: Winter's greater-trochanter height, 0.530 of stature (Winter, Biomechanics and Motor Control of Human Movement, segment table after Drillis and Contini 1966), of the mean stature of United States men aged 20 and over, 175.3 cm (Fryar et al. 2021, Vital Health Stat 3(46), Table 11, NHANES 2015-2018), about 0.93 m. The walk's Froude paces give Bohannon's adult speeds at it (`walk.FROUDE`). */
  export const REFERENCE_HIP: number = 0.53 * 1.753;

  /** The pelvis's sway toward the stance foot at the reference hip, metres: 2 cm, half the 4 cm side-to-side travel of the centre of mass in normal gait (Perry and Burnfield). */
  export const SWAY: number = 0.02;

  /** The pelvis's rise and fall about its mean twice a stride at the reference hip, metres: 2.5 cm, half the 4 to 5 cm vertical excursion of the centre of mass (Perry and Burnfield). */
  export const BOB: number = 0.025;

  /** How far the walking pelvis's mean lies under its standing height at full gait at the reference hip, metres: one `BOB` down, so the pelvis rises to its standing height at mid-stance, where the stance leg stands straight over its foot as an inverted pendulum's, and falls `2 BOB` below it at double support (the inverted-pendulum stance of walking, Cavagna, Heglund and Taylor 1977, Am J Physiol 233:R243). */
  export const BOB_MEAN: number = -BOB;

  /** The share of a gait cycle, two step periods, a foot's loading response takes after its heel strike: the first 10 % of the cycle, the double support in which the limb accepts the body's weight (Perry and Burnfield, phases of gait). */
  export const LOADING: number = 0.1;

  /** Seconds over which the entry root's offset from the planned path fades: the gait's initiation (`WalkPace.FIRST`, Brenière, Do and Bouisset 1987), over which the body leaves its standing root. */
  export const FADE: number = WalkPace.FIRST;
}
