import {
  AutoMovieHumanoidBone,
  type IAutoMovieFootPlant,
  type IAutoMoviePinStanceTargets,
  IAutoMovieVector3,
} from "@automovie/interface";

import { STATIC_SUPPORT_HEIGHT_EPSILON } from "./constants/STATIC_SUPPORT_HEIGHT_EPSILON";
import { contactMask } from "./contactMask";

/**
 * Group each leg's stance into inclusive runs and assign one fixed model-frame
 * contact per run. On a timed support change, the prior target survives while
 * it remains supported at the same height. A run beginning at frame zero
 * resumes an authoritative opening target; otherwise its first foot supplies XZ
 * and sampled ground supplies Y. Parallel times/FK arrays are caller-admitted.
 */
export const pinStanceTargets: (
  props: IAutoMoviePinStanceTargets.IProps,
) => IAutoMoviePinStanceTargets.IResult = (
  props: IAutoMoviePinStanceTargets.IProps,
): IAutoMoviePinStanceTargets.IResult => {
  if (props.support !== undefined)
    return pinTimedStanceTargets(props, props.support);
  const { legs, resolved, times, groundAt, tolerance }: typeof props = props;
  const plants: IAutoMovieFootPlant[] = [];
  const targets: Array<Map<AutoMovieHumanoidBone, IAutoMovieVector3>> =
    times.map((): Map<AutoMovieHumanoidBone, IAutoMovieVector3> => new Map());

  for (const leg of legs) {
    const contact: boolean[] = contactMask({
      effector: leg.foot,
      resolved,
      groundAt,
      tolerance,
    });
    for (const run of stanceRuns(contact)) {
      const startFoot: IAutoMovieVector3 = resolved[run.start]!.get(
        leg.foot,
      )!.worldPosition;
      const carried: IAutoMovieVector3 | undefined =
        run.start === 0 ? props.openingTargets?.get(leg.foot) : undefined;
      const target: IAutoMovieVector3 =
        carried === undefined
          ? {
              x: startFoot.x,
              y: groundAt(startFoot.x, startFoot.z),
              z: startFoot.z,
            }
          : { ...carried };
      for (let f: number = run.start; f <= run.end; ++f)
        targets[f]!.set(leg.foot, target);
      plants.push({
        foot: leg.foot,
        start: times[run.start]!,
        end: times[run.end]!,
        position: target,
      });
    }
  }

  return { plants, targets };
};

/**
 * Track each contacting foot on the scope clock and reuse a pin while its
 * surface remains eligible.
 */
function pinTimedStanceTargets(
  props: IAutoMoviePinStanceTargets.IProps,
  support: NonNullable<IAutoMoviePinStanceTargets.IProps["support"]>,
): IAutoMoviePinStanceTargets.IResult {
  const plants: IAutoMovieFootPlant[] = [];
  const targets: Map<AutoMovieHumanoidBone, IAutoMovieVector3>[] =
    props.times.map(
      (): Map<AutoMovieHumanoidBone, IAutoMovieVector3> => new Map(),
    );
  const boundaries: Set<number> = new Set(support.boundaries);
  for (const { foot } of props.legs) {
    let active: IAutoMovieFootPlant | null = null;
    props.times.forEach((time: number, i: number): void => {
      const point: IAutoMovieVector3 | undefined =
        props.resolved[i]!.get(foot)?.worldPosition;
      const height: number | null =
        point === undefined ? null : support.at(time, point, "foot");

      if (
        point === undefined ||
        height === null ||
        point.y > height + props.tolerance
      ) {
        active = null;
        return;
      }
      if (active !== null && boundaries.has(time)) {
        const retained: number | null = support.at(
          time,
          active.position,
          "foot",
        );
        if (
          retained === null ||
          Math.abs(retained - active.position.y) > STATIC_SUPPORT_HEIGHT_EPSILON
        )
          active = null;
      }
      if (active === null) {
        const carried: IAutoMovieVector3 | undefined =
          i === 0 ? props.openingTargets?.get(foot) : undefined;
        const target: IAutoMovieVector3 =
          carried === undefined
            ? { x: point.x, y: height, z: point.z }
            : { ...carried };
        active = { foot, start: time, end: time, position: target };
        plants.push(active);
      }
      active.end = time;
      targets[i]!.set(foot, active.position);
    });
  }
  return { plants, targets };
}

/** Contiguous `true` runs of a contact mask, as inclusive frame ranges. */
const stanceRuns: (
  contact: readonly boolean[],
) => Array<{ start: number; end: number }> = (
  contact: readonly boolean[],
): Array<{ start: number; end: number }> => {
  const runs: Array<{ start: number; end: number }> = [];
  let start: number = -1;
  contact.forEach((inContact: boolean, index: number): void => {
    if (inContact && start === -1) start = index;
    else if (!inContact && start !== -1) {
      runs.push({ start, end: index - 1 });
      start = -1;
    }
  });
  if (start !== -1) runs.push({ start, end: contact.length - 1 });
  return runs;
};
