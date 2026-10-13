import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonHeadShapeSource } from "./IAutoMovieHumanPersonHeadShapeSource";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";

/**
 * The head file of a published person generation: the head partition view of one source generation, as the offline producer writes it.
 *
 * `face` is an ordinary face basis over the head cells (skin, bound parts, face landmarks), already carrying the driver channels and the face correctives rewired to them; `headSkin` is the generation's one weight map on those cells; `aliases` and `drivers` name the face channels the generation defines once through the body and the body endpoints that drive head rows. `id` is the generation id and is the file's first field. The body file of the same generation completes it (`joinHumanPersonGeneration`).
 *
 * @evidence contracts/common.md#principled-implementation The published head view carries one generation's face cells, common weights and rewired endpoint drivers; matching body generation completes the connected source.
 * @evidence contracts/common.md#clear-and-simple-design The head partition remains an ordinary face basis with explicit generation-level aliases, drivers and optional numerical trait registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generation identity and actual source registration determine compatibility rather than a file name or guessed neighboring geometry.
 * @evidence contracts/common.md#meaningful-documentation Comments document generation ID, head skin weights, body-owned face aliases, endpoint drivers and optional authored trait availability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The published head partition and generation metadata specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the published head partition and generation metadata; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The published head partition and generation metadata acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonHeadView {
  /** The source generation id; the file's first field. */
  id: string;

  /** The head partition view as a face basis. */
  face: IAutoMovieHumanFaceBasis;

  /** The generation's one weight map on the head cells. */
  headSkin: IAutoMovieHumanPersonHeadSkin;

  /** Face channels defined once through a body channel. */
  aliases: IAutoMovieHumanPersonChannelAlias[];

  /** Driver channels of the body endpoints that shape the head. */
  drivers: IAutoMovieHumanPersonEndpointDriver[];

  /** Sampled numerical source-trait registration, when authored by this generation. */
  headShapeSource?: IAutoMovieHumanPersonHeadShapeSource;
}
