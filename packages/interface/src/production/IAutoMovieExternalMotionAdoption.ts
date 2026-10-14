import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * User-owned decision to adopt one external motion take in one shot.
 *
 * The engine validates and applies this record. It does not select the asset, take, target actor, adoption mode, or retarget mapping.
 *
 * @evidence contracts/common.md#principled-implementation Inventory binds source bytes/take/basis and validates explicit mapping; adoption reconciles mapped parent/rest records with fixed helper-TRS composition, without a complete unmapped-rest/constraint check or general shear preservation. Source conversion requires mapped rotations and a common step/linear law, then lowers the union of key times into clinical poses; linear clinical interpolation need not preserve the original quaternion curve between keys. Native or retarget resolution separately binds the declared actor and enact actions.
 * @evidence contracts/common.md#clear-and-simple-design Asset and take selection, actor ownership, exposed clip and mapping are declared once, with retarget-only translation scale confined to the mode union.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine cannot select a take or infer bone mapping from names, and another actor with the same rig cannot consume this actor-bound adoption; final performance must enact its exact clip.
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
