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
