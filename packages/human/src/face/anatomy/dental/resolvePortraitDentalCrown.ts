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
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Omitted cervical ratio and edge rise resolve to 0.78 and 0.035 times the supplied height while explicit values retain their exact meaning.
 * @evidence contracts/common.md#clear-and-simple-design One small default resolver supplies complete profiles to the separate crown admission/construction owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is admitted or clipped here and the contour object remains borrowed from the caller rather than falsely described as an owned deep copy.
 * @evidence contracts/common.md#meaningful-documentation The prose states defaults, shared contour mutation effects and the separate assertPortraitDentalCrown boundary.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of property reads and one result record use constant time/space independent of crown geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Consumers share these same omission defaults; no profile cache assumes borrowed contour data remains unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned scalar record and retains ownership of the shared contour object, with no mesh buffers or resources acquired.
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
