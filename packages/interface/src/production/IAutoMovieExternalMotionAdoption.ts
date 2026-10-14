import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * User-owned decision to adopt one external motion take in one shot.
 *
 * This retains production intent; the production conversion host is retired. Ingest's executable adoption API uses its own separate local contract and does not automatically consume this record.
 *
 * @evidence contracts/common.md#principled-implementation Asset, take, shot, actor, exposed clip, source rig and mapping explicitly describe one intended conversion. This pure declaration has no surviving production inventory/conversion reader; byte identity, rig compatibility, conversion precision and actor binding require an explicit host rather than following from these fields.
 * @evidence contracts/common.md#clear-and-simple-design Asset and take selection, actor ownership, exposed clip and mapping are declared once, with retarget-only translation scale confined to the mode union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No automatic asset/take selection or name-derived mapping is declared. Actor/clip exclusivity and actual enactment are intended obligations without a surviving production enforcement gate; retaining this metadata does not create a converted clip.
 * @evidence contracts/common.md#meaningful-documentation Identifies user ownership of every adoption choice, manifest and inspected take addressing, shot and actor scope, exposed clip identity and byte-grounded source characterization.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionAdoption {
  /** Stable adoption identity. */
  id: string;

  /** Manifest-owned external motion asset path. */
  asset: string;

  /** Take id from the asset's inspected motion record. */
  take: string;

  /** Shot contract in which the adoption is available. */
  shot: string;

  /** Actor participant that performs the adopted take. */
  actor: string;

  /** Stable clip id exposed to the shot source after successful adoption. */
  clip: string;

  /** Authored semantic source rig reconciled with the byte-inspected basis. */
  sourceRig: IAutoMovieSkeleton;

  /** Explicit source-node to target-semantic-bone mappings. */
  mapping: IAutoMovieExternalMotionMappingEntry[];

  /** Explicit native or humanoid-retarget adoption decision. */
  mode: IAutoMovieExternalMotionAdoptionMode;
}
