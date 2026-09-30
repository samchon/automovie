import type { IPortraitDentalCrown } from "./structures/IPortraitDentalCrown";

/**
 * Complete a crown profile whose optional shape members were omitted, so the
 * defaults live in one place instead of in every consumer that places crowns.
 *
 * An omitted cervical width ratio is 0.78 and an omitted cutting-edge rise is
 * 3.5 percent of the crown height, the basic profile a crown has before its
 * silhouette is authored. The result copies the members it resolves and shares
 * the contour object with the input, so a caller that edits the contour after
 * resolving is editing the input's. Nothing is validated here;
 * `assertPortraitDentalCrown` admits the completed profile.
 *
 * @evidence contracts/common.md#principled-implementation It fills only the omitted members with the basic profile, a 0.78 cervical ratio and an edge rise of 3.5 percent of the height, and keeps every authored member, including an explicit zero, because it tests for omission and not for falsity.
 * @evidence contracts/common.md#clear-and-simple-design It is the one owner of the crown defaults, replacing copies in the mouth component and the legacy crown placement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named; the two defaults are the crown profile the type documents.
 * @evidence contracts/common.md#meaningful-documentation The comment states the two defaults, what is copied and shared and that validation belongs to `assertPortraitDentalCrown`.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the crown's local frame; the cervical ratio is unitless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function completes a profile and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The defaults are construction defaults of the basic profile and cite no measured tooth.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function beyond the crown type's named dimensions.
 * @author Samchon
 */
export function resolvePortraitDentalCrown(
  crown: Pick<IPortraitDentalCrown, "width" | "height" | "contour"> &
    Partial<Pick<IPortraitDentalCrown, "cervicalWidth" | "edgeRise">>,
  depth: number,
): IPortraitDentalCrown {
  return {
    width: crown.width,
    height: crown.height,
    depth,
    cervicalWidth: crown.cervicalWidth ?? 0.78,
    edgeRise: crown.edgeRise ?? 0.035 * crown.height,
    contour: crown.contour,
  };
}
