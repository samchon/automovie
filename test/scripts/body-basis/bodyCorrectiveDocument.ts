import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human/body/structures/IAutoMovieHumanBodyShoulderPose";

import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";
import type { IBodyCorrectiveWorld } from "./IBodyCorrectiveWorld";
import { interpolateBodyShoulderPose } from "./interpolateBodyShoulderPose";

/**
 * Own a solver sample without losing TT goals or mutating the source state.
 * Clinical rows and shape weights retain their exact endpoint arithmetic.
 * A zero pose fraction omits TT goals and keeps the native shaped rest. A full
 * fraction preserves every authored TT field. Intermediate TT samples require
 * rests read from that same shaped builder, supplied by the actual sampler.
 *
 * @evidence contracts/common.md#principled-implementation Complete TT goals travel separately from clinical rows; intermediate rest authority comes from the same shaped skeleton rather than fixed metadata.
 * @evidence contracts/common.md#clear-and-simple-design Clinical/shape arithmetic and complete shoulder sampling are explicit independent fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing shaped rest is refused instead of dropping plane/axial data or inventing a neutral.
 * @evidence contracts/common.md#meaningful-documentation States real solver consumer, owned outputs, exact endpoints and shaped-rest precondition.
 */
export function bodyCorrectiveDocument(
  world: IBodyCorrectiveWorld,
  state: IBodyCorrectiveState,
  t: number,
  u: number,
  basis: string,
  shoulderRest: readonly IAutoMovieHumanBodyShoulderPose[] = [],
): IAutoMovieHumanBodyBasisDocument {
  return {
    id: "solve",
    name: "solve",
    basis,
    shape: Object.fromEntries(
      Object.entries(state.shape).map(([channel, weight]) => [
        channel,
        u === 1 ? weight : u * weight,
      ]),
    ),
    pose: state.pose.map((joint) => ({
      bone: joint.bone,
      flexion: null,
      abduction: null,
      twist: null,
      ...Object.fromEntries(
        (["flexion", "abduction", "twist"] as const)
          .filter((axis) => joint[axis] !== null)
          .map((axis) => {
            const rest = world.neutral.get(joint.bone)![axis];
            return [
              axis,
              t === 1 ? joint[axis]! : rest + t * (joint[axis]! - rest),
            ];
          }),
      ),
    })),
    ...(state.shoulders === undefined
      ? {}
      : {
          shoulders:
            t === 0
              ? []
              : state.shoulders.map((goal) => {
                  if (t === 1) return { ...goal };
                  const from = shoulderRest.find(
                    (rest) => rest.bone === goal.bone,
                  );
                  if (from === undefined)
                    throw new Error(
                      "A TT sample needs the same shaped rest: " + goal.bone,
                    );
                  return interpolateBodyShoulderPose({
                    from,
                    to: goal,
                    fraction: t,
                  });
                }),
        }),
  };
}
