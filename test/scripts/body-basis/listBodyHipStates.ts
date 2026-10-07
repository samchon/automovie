import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";

/**
 * The hip-flexion review population: every body shape of a list, each with
 * the left thigh, the right thigh and both thighs flexed to each angle.
 *
 * The shapes are the neutral body, every macro channel of the basis at each
 * end of its envelope, and the shapes the caller adds (a body between the
 * envelope's ends, where a corrective solved at an end is only partly worn).
 * A state is named `<shape>:<pose>` with the pose `leftUpperLeg.flexion@110`,
 * `rightUpperLeg.flexion@110` or `both:UpperLeg.flexion@110`, the names the
 * census receipt's `shapes` and `combos` findings use. The angles are clinical
 * degrees of the trunk-relative thigh flexion, the document's own. An angle
 * the hip does not admit is not filtered here: the builder refuses it and the
 * census instrument reports the refusal.
 */
export function listBodyHipStates(
  basis: IAutoMovieHumanBodyBasis,
  angles: number[],
  extraShapes: Record<string, Record<string, number>> = {},
): IBodyCorrectiveState[] {
  const shapes: [string, Record<string, number>][] = [
    ["neutral", {}],
    ...basis.channels
      .filter((channel) => channel.group === "macro")
      .flatMap((channel): [string, Record<string, number>][] => [
        [`${channel.id}@${channel.maximum}`, { [channel.id]: channel.maximum }],
        ...(channel.minimum < 0
          ? ([
              [`${channel.id}@${channel.minimum}`, { [channel.id]: channel.minimum }],
            ] as [string, Record<string, number>][])
          : []),
      ]),
    ...Object.entries(extraShapes),
  ];
  const pose = (bones: string[], angle: number) =>
    bones.map((bone) => ({
      bone: bone as "leftUpperLeg",
      flexion: angle,
      abduction: null,
      twist: null,
    }));
  const out: IBodyCorrectiveState[] = [];
  for (const [shapeName, shape] of shapes)
    for (const angle of angles)
      for (const [poseName, bones] of [
        [`leftUpperLeg.flexion@${angle}`, ["leftUpperLeg"]],
        [`rightUpperLeg.flexion@${angle}`, ["rightUpperLeg"]],
        [`both:UpperLeg.flexion@${angle}`, ["leftUpperLeg", "rightUpperLeg"]],
      ] as const)
        out.push({
          name: `${shapeName}:${poseName}`,
          set: "hips",
          group: "hips",
          shape,
          pose: pose([...bones], angle),
        });
  return out;
}
