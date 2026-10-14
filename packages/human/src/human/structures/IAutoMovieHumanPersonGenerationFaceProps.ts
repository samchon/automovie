import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonDocument } from "./IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";

/**
 * Inputs of `deriveHumanPersonGenerationFace`: the person, the body's endpoint gains under its state, and the generation's aliases and drivers.
 *
 * @evidence contracts/common.md#principled-implementation Endpoint gains and generation aliases keep each shared trait authored once through its body owner while deriving the face producer's driver state.
 * @evidence contracts/common.md#clear-and-simple-design The person document and invariant generation mappings are explicit operands; endpoint gain evaluation remains with the body owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aliased and driver channels come from generation metadata rather than a person-specific face workaround or copied deformation equation.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish body endpoint gains, face aliases and endpoint-to-driver mappings used for derived face authorship.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The body-to-face alias and endpoint gain operands specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the body-to-face alias and endpoint gain operands; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The body-to-face alias and endpoint gain operands acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGenerationFaceProps {
  /** The person document. */
  document: IAutoMovieHumanPersonDocument;

  /** Each body endpoint's gain under the body's endpoint state. */
  gains: ReadonlyMap<string, number>;

  /** Face channels the generation defines once through a body channel. */
  aliases: readonly IAutoMovieHumanPersonChannelAlias[];

  /** Body endpoints whose rows the face view holds, by driver channel. */
  drivers: readonly IAutoMovieHumanPersonEndpointDriver[];
}
