import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyLayerReference } from "./IHumanBodyLayerReference";

/**
 * What one layer-order reading of a constructed body or person looks at.
 *
 * The references are the sheets every subject must stay inside. Read against the skin, a subject outside is outside the body. Read against the fascial face, it has also left the room the skin and subcutaneous layer take, which is the stricter and anatomically meant condition for bone and muscle. A body alone gives its own faces, open at the neck; a person adds the head's skin, which continues them.
 *
 * @evidence contracts/common.md#principled-implementation Constructed model/reference sheets define the queried relation, with explicit subject identity selection/exclusions and signed metre tolerance.
 * @evidence contracts/common.md#clear-and-simple-design The caller chooses skin versus stricter fascial reference while the reader owns actual emitted vertex comparisons.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Outside layers are excluded by identity rather than silently judged against their own interior references.
 * @evidence contracts/common.md#meaningful-documentation Comments explain body/person continuation, unchanged model, reference role and signed tolerance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Order-reading inputs choose no nearest-sheet or signed-distance query algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference/subject selection establishes dependencies without cached containment readings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Borrowed model/sheets own no additional spatial-query handle or background reader.
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
