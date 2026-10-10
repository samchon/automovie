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
