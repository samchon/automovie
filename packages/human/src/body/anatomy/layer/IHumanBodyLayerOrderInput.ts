import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyLayerReference } from "./IHumanBodyLayerReference";

/**
 * What one layer-order reading of a constructed body or person looks at.
 *
 * The references are the sheets every subject must stay inside. Read against
 * the skin, a subject outside is outside the body. Read against the fascial
 * face, it has also left the room the skin and subcutaneous layer take, which
 * is the stricter and anatomically meant condition for bone and muscle. A
 * body alone gives its own faces, open at the neck; a person adds the head's
 * skin, which continues them.
 *
 * @evidence contracts/common.md#principled-implementation The reading is given the surfaces it measures against, so the face that layers the body is the face that is judged.
 * @evidence contracts/common.md#clear-and-simple-design One record carries the model, the references, the subject selection and the tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No part is special-cased or skipped: every part under the subject prefix is read unless it is explicitly named as excluded.
 * @evidence contracts/common.md#meaningful-documentation States what the references are and how the skin and the fascial face differ as conditions.
 * @evidence contracts/modeling.md#spatial-conventions All coordinates are the model's metres in its one frame; the reader converts nothing.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The input selects existing parts and defines none.
 * @evidenceExclude contracts/modeling.md#parameter-channels The input carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The input emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The reader measures a relation and constructs no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation A numerical reading owns no rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The input carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The reader reports a relation; its admission owner decides.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The input is no authoring control.
 * @author Samchon
 */
export interface IHumanBodyLayerOrderInput {
  /** Constructed model whose parts are read; it is not changed. */
  model: IAutoMovieModel;

  /** Sheets that together bound the subjects from outside. */
  references: readonly IHumanBodyLayerReference[];

  /** Prefix of the part identities read against the references. */
  subjectPrefix: string;

  /** Subject identities that are themselves a layer outside the references and are not read. */
  excluded: readonly string[];

  /** Signed distance in metres beyond which a vertex counts as inside or outside. */
  toleranceMetres: number;
}
