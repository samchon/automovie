import {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";

/**
 * The world-space support contacts of a `"stack-top"` affordance: its extent
 * corners carried through the affordance frame and the parent's world
 * transform, in exactly the shape {@link detectSupportToppling} and
 * {@link supportContactsFor} consume.
 *
 * A placed crate is stable when its center of mass projects inside these
 * contacts' hull and topples when it overhangs. The object supplies its own
 * authored support face for the same judgment as a floor or table surface.
 *
 * Each extent corner is a point in the affordance frame's XZ plane (`y`
 * ignored, per {@link IAutoMovieAffordance.extent}): it is lifted into the model
 * frame through the affordance `frame`, then into world through `parentWorld`
 * Scale in either transform is ignored by this helper. Non-unit scales
 * therefore do not describe the same contacts as full affine placement.
 *
 * Throws on a non-`stack-top` kind or a missing extent: feeding a handle to the
 * support judgment is a mis-wired pipeline, not a skippable frame
 * ({@link validateModel} rejects such data before it gets here).
 *
 * @evidence contracts/common.md#principled-implementation Each extent's XZ point is rotated/translated by the affordance frame, then rotated/translated by the model root using canonical quaternion/vector owners; unit rotations and unit scale are the geometric equivalence premises.
 * @evidence contracts/common.md#clear-and-simple-design This helper owns only contact-point derivation; support hull/toppling judgment remains a separate operation, and no repository product caller currently invokes this exported producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-stack-top or absent extents throw rather than invent a face. Extent Y is ignored by contract, but ignored transform scale remains a limitation for full affine contacts.
 * @evidence contracts/common.md#meaningful-documentation Documents model-local XZ, two rigid transforms, scale limitation, misuse exceptions and fresh output ownership; test-only reach does not establish a wired support pipeline.
 * @evidence contracts/performance.md#efficient-algorithms E extent corners require O(E) fixed quaternion/vector operations and fresh point storage; no hull or model traversal is performed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical Quaternion.rotateVector and Vector3.add own the arithmetic; each call reads its current frames without retaining pose-dependent contacts across changed placement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh contact array and points; intermediate points leave scope and neither model, extent nor host handle is retained by the helper.
 */
export const affordanceSupportContacts: (props: {
  affordance: IAutoMovieAffordance;
  parentWorld: IAutoMovieTransform;
}) => IAutoMovieVector3[] = (props: {
  /** The declared contact face. Must be a `"stack-top"` with an extent. */
  affordance: IAutoMovieAffordance;

  /** The owning model's root in world space. */
  parentWorld: IAutoMovieTransform;
}): IAutoMovieVector3[] => {
  const { affordance, parentWorld }: typeof props = props;
  if (affordance.kind !== "stack-top")
    throw new Error(
      `affordanceSupportContacts: "${affordance.id}" is a "${affordance.kind}", not a "stack-top"`,
    );
  if (affordance.extent === null)
    throw new Error(
      `affordanceSupportContacts: stack-top "${affordance.id}" has no extent`,
    );

  const frame: IAutoMovieTransform = affordance.frame;
  return affordance.extent.map(
    (corner: IAutoMovieVector3): IAutoMovieVector3 => {
      const inModel: IAutoMovieVector3 = Vector3.add(
        frame.translation,
        Quaternion.rotateVector(frame.rotation, {
          x: corner.x,
          y: 0,
          z: corner.z,
        }),
      );
      return Vector3.add(
        parentWorld.translation,
        Quaternion.rotateVector(parentWorld.rotation, inModel),
      );
    },
  );
};
