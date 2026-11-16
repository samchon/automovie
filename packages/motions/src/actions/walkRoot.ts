import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFrame } from "../posture/HumanFrame";
import type { walkSteps } from "./walkSteps";

/** Fixed body, path and timing inputs of a stepping take's unconstrained root. */
interface IProps {
  /** The body whose hip height scales sway and running bob. */
  body: IHumanBody;
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
 * @returns The same unconstrained root and start/stop amount at each second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the preparation boundary, units and the two readers used by walkSteps.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the original minimum-jerk gait ramps, heading-relative rest-foot centre, stance-relative sinusoidal sway/bob and entry-offset fade, with every path point evaluated at the actual queried distance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed rest geometry and phase origins precede amount, planned-root and entry-preserving root readers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every gait coefficient, phase, progress/heading call and root expression retains its original formula; no path or query time is sampled or rounded.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and root arithmetic per second, plus the supplied path/heading costs; rest points, phase origins and the initial planned root are read once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A take fixes the body, timing and path readers; this closure shares only those fixed prerequisites and not a result keyed by a later query.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned readers retain the fixed input record, rest centre and entry offset until the step plan releases them, with no growing query history.
 */
export function walkRoot(props: IProps): Pick<walkSteps.IPlan, "root" | "amount"> {
  const a: IAutoMovieVector3 = props.body.rest.get("leftFoot")!;
  const b: IAutoMovieVector3 = props.body.rest.get("rightFoot")!;
  const rest: IAutoMovieVector3 = { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 };
  const l: number = props.body.measure.hipHeight;
  const T: number = props.period;
  const over: number = props.firstLeft + props.front * T;
  const middle: number = props.firstLeft + (T - props.swing / 2);
  const amount: (t: number) => number = (t: number): number => {
    const up: number = minimumJerk.share((t - props.lag) / (props.first + T));
    const down: number = 1 - minimumJerk.share((t - props.stop) / (props.last + 0.2 - props.stop));
    return Math.max(0, Math.min(1, Math.min(up, down)));
  };
  const planned: (t: number) => IAutoMovieVector3 = (t: number): IAutoMovieVector3 => {
    const yaw: number = props.yaw(t);
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw }, rest,
    );
    const a: number = amount(t);
    const sway: number = 0.02 * (l / 0.93) * a * Math.cos((2 * Math.PI * (t - over)) / (2 * T));
    const bob: number = props.bob === undefined
      ? a * (-0.015 + 0.025 * Math.cos((2 * Math.PI * (t - over)) / T))
      : a * l * (props.bob.mean - props.bob.amplitude * Math.cos((2 * Math.PI * (t - middle)) / T));
    const s: number = props.progress(t);
    const along: IAutoMovieVector3 = props.at(s);
    const point: IAutoMovieVector3 = HumanFrame.point(
      { origin: along, yaw: props.heading(s, along) }, { x: sway, y: 0, z: 0 },
    );
    return { x: point.x - centre.x, y: -0.005 + bob, z: point.z - centre.z };
  };
  const initial: IAutoMovieVector3 = planned(0);
  const offset: IAutoMovieVector3 = {
    x: props.start.x - initial.x, y: props.start.y - initial.y, z: props.start.z - initial.z,
  };
  return {
    amount,
    root: (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk.share(t / 0.3);
      const point: IAutoMovieVector3 = planned(t);
      return { x: point.x + offset.x * fade, y: point.y + offset.y * fade, z: point.z + offset.z * fade };
    },
  };
}
