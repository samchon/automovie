import type { IAutoMovieHumanPersonBodyView } from "../structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonHeadView } from "../structures/IAutoMovieHumanPersonHeadView";

/**
 * Join the head and body files of one published person generation into the
 * one-skin evaluator's input.
 *
 * Refuses files of different generations (`id` mismatch) and a partition view
 * whose skin surface is not registered on that generation. No value is
 * created or changed; the result references the two files' members.
 *
 * @evidence contracts/common.md#principled-implementation The two files are halves of one producer output; the join only checks that they are the same generation and pairs them.
 * @evidence contracts/common.md#clear-and-simple-design Two identity checks and one object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mixed pair refuses by name instead of evaluating two generations as one skin.
 * @evidence contracts/common.md#meaningful-documentation States what is checked and that nothing is derived.
 * @evidence contracts/modeling.md#shared-boundaries Both views must be registered on the same generation, the premise of their shared neck samples.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The join defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The join defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The join emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The join converts no coordinates.
 * @evidenceExclude contracts/modeling.md#rendered-observation The join is not observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The join carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The join admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The join defines no input.
 */
export function joinHumanPersonGeneration(
  head: IAutoMovieHumanPersonHeadView,
  body: IAutoMovieHumanPersonBodyView,
): IAutoMovieHumanPersonGeneration {
  if (head.id !== body.id)
    throw new Error("The person head file (" + head.id + ") and body file (" + body.id + ") are different generations.");
  const registered = (surfaces: readonly { sourcePartition?: { generation: string } }[]): boolean =>
    surfaces.some((surface) => surface.sourcePartition?.generation === head.id);
  if (!registered(head.face.surfaces))
    throw new Error("The person head file's face view is not registered on generation " + head.id + ".");
  if (!registered(body.body.surfaces))
    throw new Error("The person body file's body view is not registered on generation " + head.id + ".");
  return {
    id: head.id,
    face: head.face,
    body: body.body,
    headSkin: head.headSkin,
    band: body.band,
    aliases: head.aliases,
    drivers: head.drivers,
  };
}
