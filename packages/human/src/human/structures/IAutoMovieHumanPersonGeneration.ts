import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanPersonChannelAlias } from "./IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonEndpointDriver } from "./IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonGenerationBand } from "./IAutoMovieHumanPersonGenerationBand";
import type { IAutoMovieHumanPersonHeadShapeSource } from "./IAutoMovieHumanPersonHeadShapeSource";
import type { IAutoMovieHumanPersonHeadSkin } from "./IAutoMovieHumanPersonHeadSkin";

/**
 * Shared source skin described by complementary head/body partition views. Skin sourcePartition records name generation id, one ordered source tree and canonical sample IDs; shared samples are registered neck correspondence. Each view keeps its own channels/correctives/landmarks/attached parts. HeadSkin supplies head-side rig weights using body joints; body surface skin owns corresponding body-side weights. Complete source/weight/chart admission belongs to compilation and geometry producers, not this erased carrier.
 *
 * Optional band rows continue face fields onto body-side cells; aliases remove duplicate face authorship and drivers carry actual body endpoint gains into head source rows. Nonempty registrations use the gain branch without also invoking legacy linked-population conversion. HeadShapeSource may qualify actual public mm/degree source traits or remain absent. This context stores source data rather than person document values or runtime clipping, and metadata is neither clinical acquisition nor current visual proof.
 *
 * @evidence contracts/common.md#principled-implementation Shared generation/tree/sample identity and explicit partition rig maps describe the actual one-source operands consumed by registered person assembly.
 * @evidence contracts/common.md#clear-and-simple-design Canonical anatomy/source/rig schemas retain separate owners while optional band/alias/driver/trait records express only cross-partition registration.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching IDs or typed weights do not establish complementary geometry, clinical anatomy or source authenticity, and absent optional registrations cannot invent their effects.
 * @evidence contracts/common.md#meaningful-documentation Prose states source metre/sample domains, paired rig ownership, optional registration branches and compiler/runtime boundaries.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This source descriptor runs no chart admission, rig compilation or person evaluation; concrete compiler/geometry owners execute those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Compile-once source reuse is builder behavior rather than caching implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no source fetch or worker; producer/loaded-context owners control actual nested geometry and registration lifetime.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonGeneration {
  /** The source generation id both partition views carry. */
  id: string;

  /** The head partition view: the face basis over the head cells. */
  face: IAutoMovieHumanFaceBasis;

  /** The body partition view: the body basis over the remaining cells. */
  body: IAutoMovieHumanBodyBasis;

  /** The generation's one weight map on the head partition. */
  headSkin: IAutoMovieHumanPersonHeadSkin;

  /**
   * Optional body-side continuation of face targets/attachments; omission supplies no such band-view evaluation and shared boundary fields can still differ.
   */
  band?: IAutoMovieHumanPersonGenerationBand;

  /**
   * Optional source face/body alias identities; explicit face subtree authorship of either aliased ID refuses. Nonempty aliases/drivers follow their actual gain branch rather than linked legacy derivation.
   */
  aliases?: IAutoMovieHumanPersonChannelAlias[];

  /**
   * Face driver channels applying actual body endpoint gains to source head/part/landmark rows; omission supplies no driver projection.
   */
  drivers?: IAutoMovieHumanPersonEndpointDriver[];

  /** Actual source-owned numerical head traits, or absent when no such source was authored. */
  headShapeSource?: IAutoMovieHumanPersonHeadShapeSource;
}
