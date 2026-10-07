import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";
import type { IAutoMovieHumanPersonHeadShapeSource } from "./IAutoMovieHumanPersonHeadShapeSource";

/**
 * The head file of a published person generation: the head partition view of
 * one source generation, as the offline producer writes it.
 *
 * `face` is an ordinary face basis over the head cells (skin, bound parts,
 * face landmarks), already carrying the driver channels and the face
 * correctives rewired to them; `headSkin` is the generation's one weight map
 * on those cells; `aliases` and `drivers` name the face channels the generation
 * defines once through the body and the body endpoints that drive head rows.
 * `id` is the generation id and is the file's first field. The body file of
 * the same generation completes it (`joinHumanPersonGeneration`).
 *
 * @evidence contracts/common.md#principled-implementation The producer re-addresses the generation offline; the file is the head half of that output, so the runtime only admits and joins it.
 * @evidence contracts/common.md#clear-and-simple-design Existing partition, weight, alias and driver records remain separate from optional source-owned numerical trait registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing here is derived at runtime; a mismatched body file refuses at the join.
 * @evidence contracts/common.md#meaningful-documentation States what each field holds and how the file pairs with its body file.
 * @evidence contracts/modeling.md#shared-boundaries The head view's source partition shares the registered neck samples with the body view of the same id.
 * @evidence contracts/modeling.md#spatial-conventions The face basis states the shared metre, Y-up, +Z-forward frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The face basis owns its parts' identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels The file adds no user channel; driver channels are derived inputs.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The file emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The file is observed through the evaluated person.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Individual numerical source-field records own their authored support/protocol qualifications; this partition wrapper derives no clinical anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range The face and body owners admit document values.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The file is compiled data, not a caller input.
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
