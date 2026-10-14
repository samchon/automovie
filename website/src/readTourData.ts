import type { Building } from "./Building";
import type { TourData } from "./internal/TourData";
import type { TourView } from "./TourView";

/**
 * Check the requested production identity, nonempty view list and initial-view membership before handing a first-party transport to the browser. This is envelope admission, not deep validation of numeric camera fields, unique ids or the native payload; malformed view entries can throw during membership inspection.
 *
 * @evidence contracts/common.md#principled-implementation Object and array checks establish the envelope before a linear initial-id lookup; the build-time producer remains responsible for the native scene and camera schema.
 * @evidence contracts/common.md#clear-and-simple-design The same admission function serves exportTourData and the fetch consumer, keeping their route and initial-view requirements together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mismatched or empty transport is refused instead of selecting another building or inventing a default camera; no deep numeric validation is claimed.
 * @evidence contracts/common.md#meaningful-documentation The comment states checked facts, unchanged return identity, producer premises and remaining malformed-entry failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Membership scanning costs O(V) time for V views and O(1) auxiliary storage; locating the initial id requires observing the supplied view list.
 * @evidence contracts/performance.md#reuse-equivalent-work Admission returns the original object without cloning or caching; each caller's current transport identity and view membership are inspected anew.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No resources are acquired; the returned object and its native bytes remain retained only by the caller.
 */
export const readTourData: (value: unknown, building: Building) => TourData = (value: unknown, building: Building): TourData => {
  const data: TourData | null = value as TourData | null;
  if (
    data === null ||
    typeof data !== "object" ||
    data.building !== building ||
    !Array.isArray(data.views) ||
    data.views.length === 0 ||
    !data.views.some((view: TourView) : boolean => view.id === data.initial)
  )
    throw new Error(
      "The building's 3D data is incomplete. Please reload the page.",
    );
  return data;
};
