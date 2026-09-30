import type { IAutoMovieHumanBodyBasis } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IBodyCorrectiveState } from "./bodyCorrectiveState";

/** A census finding as the census receipt records it. */
export interface IBodyCensusFinding {
  name: string;
  document: {
    shape?: Record<string, number>;
    pose?: IAutoMovieJointPose[];
  };
}

/** The census receipt's sets, by name. */
export type BodyCensusSets = Record<string, { findings: IBodyCensusFinding[] }>;

/**
 * Every mobile joint axis of the basis at the census sample angles, each side
 * of its rest, in ascending travel within a group.
 *
 * A sample is the half and the whole of the range's reach toward the side; a
 * side whose reach is zero has none, and the elbow, which rests bent, has one
 * sample on its extension side because its half and whole reaches coincide. A
 * group is one joint axis, so its samples are solved in order on one shard and
 * the larger angle wears the corrective solved at the smaller one. The state
 * name is `<bone>.<axis>@<angle>` and its set is `single`.
 */
export function listSingleAxisStates(
  basis: IAutoMovieHumanBodyBasis,
): IBodyCorrectiveState[] {
  const out: IBodyCorrectiveState[] = [];
  for (const joint of basis.joints) {
    if (joint.constraint === null) continue;
    for (const axis of ["flexion", "abduction", "twist"] as const) {
      const range = joint.constraint[axis];
      if (range === null) continue;
      for (const side of ["positive", "negative"] as const) {
        const samples = [
          ...new Set(
            [0.5, 1].map((fraction) =>
              side === "positive"
                ? fraction * range.max
                : fraction * range.min,
            ),
          ),
        ].filter((angle) =>
          side === "positive"
            ? angle > joint.neutral[axis]
            : angle < joint.neutral[axis],
        );
        for (const angle of samples)
          out.push({
            name: `${joint.bone}.${axis}@${angle}`,
            set: "single",
            group: `${joint.bone}.${axis}`,
            shape: {},
            pose: [
              {
                bone: joint.bone,
                flexion: null,
                abduction: null,
                twist: null,
                [axis]: angle,
              },
            ],
          });
      }
    }
  }
  return out;
}

/**
 * The census findings of the named sets as states, shape-only states first.
 *
 * A shape-only state's corrective is a product of one-sided channel ramps that
 * hold past their full weight, so it stays on at every body further along
 * those channels, and one solved beside another on a separate shard is added
 * to it where both hold and the heavier bodies cross worse than before either
 * was solved. Every shape-only state is therefore one group, `rest`, solved on
 * one shard in order of generality (fewest channels, then least total weight),
 * so each corrective carries only what the more general ones left. The same
 * holds for one pose worn by several shapes, so a shaped posed state is grouped
 * by its pose (`pose:<json>`). A posed state with no shape is grouped by its
 * name before `@`.
 */
export function listCensusStates(
  census: BodyCensusSets,
  sets: string[],
): IBodyCorrectiveState[] {
  const out: IBodyCorrectiveState[] = [];
  for (const one of sets)
    for (const finding of census[one]?.findings ?? []) {
      const pose = finding.document.pose ?? [];
      out.push({
        name: finding.name,
        set: one,
        group:
          pose.length === 0
            ? "rest"
            : Object.keys(finding.document.shape ?? {}).length > 0
              ? "pose:" + JSON.stringify([pose, []])
              : finding.name.split("@")[0],
        shape: finding.document.shape ?? {},
        pose,
      });
    }
  const generality = (state: IBodyCorrectiveState): [number, number] => {
    const weights = Object.values(state.shape).filter((w) => w !== 0);
    return [weights.length, weights.reduce((s, w) => s + Math.abs(w), 0)];
  };
  const shaped = (state: IBodyCorrectiveState): boolean =>
    state.group === "rest" || state.group.startsWith("pose:");
  const ordered = out.filter(shaped).sort((a, b) => {
    const [ca, wa] = generality(a);
    const [cb, wb] = generality(b);
    return ca - cb || wa - wb;
  });
  return [...ordered, ...out.filter((state) => !shaped(state))];
}
