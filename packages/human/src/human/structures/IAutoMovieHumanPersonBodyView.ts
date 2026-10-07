import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonGenerationBand } from "./IAutoMovieHumanPersonGenerationBand";

/**
 * The body file of a published person generation: the body partition view of
 * one source generation and the neck band's rows on it, as the offline
 * producer writes them.
 *
 * `body` is an ordinary body basis over the body cells; `band` holds the face
 * rows and continued jaw attachment on the body side of the neck. `id` is the
 * generation id and is the file's first field. The head file of the same
 * generation completes it (`joinHumanPersonGeneration`).
 *
 * @evidence contracts/common.md#principled-implementation The producer re-addresses the generation offline; the file is the body half of that output, so the runtime only admits and joins it.
 * @evidence contracts/common.md#clear-and-simple-design Three fields, each an existing type of the evaluator's input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing here is derived at runtime; a mismatched head file refuses at the join.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds and how the file pairs with its head file.
 * @evidence contracts/modeling.md#shared-boundaries The body view's source partition shares the registered neck samples with the head view of the same id.
 * @evidence contracts/modeling.md#spatial-conventions The body basis states the shared metre, Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The body basis owns its parts' identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The file adds no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The file emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The file is observed through the evaluated person.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The file carries source data, not anatomical measurements.
 * @evidenceExclude contracts/anatomy.md#permitted-range The body owner admits document values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The file is compiled data, not a caller input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonBodyView {
  /** The source generation id; the file's first field. */
  id: string;

  /** The body partition view as a body basis. */
  body: IAutoMovieHumanBodyBasis;

  /** The neck band's rows on the body side. */
  band: IAutoMovieHumanPersonGenerationBand;
}
