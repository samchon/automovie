import type { IHumanFaceHairRootReference } from "./IHumanFaceHairRootReference";

/**
 * Original root-feature support and proximity on one owned current collider snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Source-seat metadata selects original incident support and the same current surface supplies unsigned face proximity.
 * @evidence contracts/common.md#clear-and-simple-design The two existing boundary consumers share one named result contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Proximity remains to named original faces rather than an exemption radius.
 * @evidence contracts/common.md#meaningful-documentation States original ordinals and unsigned current-frame distance.
 * @evidence contracts/modeling.md#spatial-conventions Face ordinals are dimensionless and distances are current head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Source producers own parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels The result defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Boundary lookup emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The compiler implements support admission.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair consumer observes output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Numerical support is not biological registration.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical range is admitted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived support exposes no personal patch control.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRootBoundary {
  /** Resolve original resident face ordinals incident on the root's actual support. */
  resolve: (root: IHumanFaceHairRootReference) => number[];

  /** Unsigned distance to one named original face, in current head-frame metres. */
  distance: (triangle: number, point: readonly number[]) => number;
}
