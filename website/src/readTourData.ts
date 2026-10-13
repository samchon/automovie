import type { Building } from "./Building";
import type { TourData } from "./internal/TourData";
import type { TourView } from "./TourView";

/** Preserve build-time identity at the network boundary. */
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
