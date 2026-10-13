import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanPersonGenerationBand } from "./IAutoMovieHumanPersonGenerationBand";

/**
 * Body member of a published source person generation: ordinary body basis over body cells, body-side face target/attachment band rows and shared generation identity. The producer serializes id first, but this TypeScript carrier enforces no object property order. Matching head-member composition checks identity/registered-surface presence; complete source tree/weights/band admission belongs to compilation. Metadata alone supplies no observed current anatomy or viewer health.
 *
 * @evidence contracts/common.md#principled-implementation Shared generation id and explicit body/band owners form the body half of the published one-skin source descriptor.
 * @evidence contracts/common.md#clear-and-simple-design Canonical body basis and band row schema remain separate nested owners; the head member supplies its own face/weights/drivers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generation identity is not a full compatibility or anatomical proof, and producer field order is not falsely claimed enforced by an erased interface.
 * @evidence contracts/common.md#meaningful-documentation Prose states producer serialization, source-cell ownership, cross-partition band and composition/compilation boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This published member schema performs no source parsing, joining or geometry compilation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Sharing loaded member data is compiler/runtime behavior; the body view record implements no source cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no source stream or worker; loaded body/band buffers remain owned by their actual source context.
 *
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
