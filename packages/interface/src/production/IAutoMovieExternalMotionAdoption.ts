import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import { IAutoMovieExternalMotionAdoptionMode } from "./IAutoMovieExternalMotionAdoptionMode";
import { IAutoMovieExternalMotionMappingEntry } from "./IAutoMovieExternalMotionMappingEntry";

/**
 * User-owned decision to adopt one external motion take in one shot.
 *
 * The engine validates and applies this record. It does not select the asset, take, target actor, adoption mode, or retarget mapping.
 *
 * @evidence contracts/common.md#principled-implementation The authored decision pins manifest bytes, an inspected take, one shot actor, clip identity, byte-reconciled source rig and explicit mapping before native compatibility or humanoid retargeting can produce an executable motion.
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
