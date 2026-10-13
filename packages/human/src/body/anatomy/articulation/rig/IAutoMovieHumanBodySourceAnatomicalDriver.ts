import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";

/**
 * A named anatomical coordinate drives one source-owned joint axis.
 *
 * @evidence contracts/common.md#principled-implementation A bone identity, named axis and explicit unit select an anatomicalMotion goal; omitted input uses the registered source neutral.
 * @evidence contracts/common.md#clear-and-simple-design The anatomical discriminator separates internal named-coordinate requests from existing public pose, shoulder and toe drivers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The driver's closed bone and axis fields prevent source-local geometry addresses from becoming public performance controls.
 * @evidence contracts/common.md#meaningful-documentation Member comments state sole authority, source direction/support ownership, omission neutral and unit matching with a mapping profile.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The anatomical driver schema specifies coordinate lookup inputs without performing the lookup or interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A driver record carries no admission result to reuse across changed anatomical goals.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Bone and axis descriptors do not acquire source meshes or retain any solver handles.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceAnatomicalDriver {
  /** A canonical anatomicalMotion coordinate is the source axis's sole authored driver. */
  kind: "anatomical";

  /** Actual closed anatomical bone owning the named driver coordinate. */
  bone: AutoMovieHumanBodyBoneId;

  /** Source-defined physiological coordinate; its source axis owns direction, neutral and support. */
  axis: AutoMovieHumanBodySourceAxis;

  /** Source neutral retained when no goal for this coordinate is authored. */
  neutral: number;

  /** Source unit matched by the public goal and any mapping profile. */
  unit: "degrees" | "metres";
}
