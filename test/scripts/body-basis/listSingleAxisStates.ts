import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";

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
              side === "positive" ? fraction * range.max : fraction * range.min,
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
