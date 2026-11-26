import {
  type IAutoMovieAffordanceSupportContacts,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";

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
 */
export const affordanceSupportContacts: (
  props: IAutoMovieAffordanceSupportContacts.IProps,
) => IAutoMovieVector3[] = (
  props: IAutoMovieAffordanceSupportContacts.IProps,
): IAutoMovieVector3[] => {
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
