import type { Building } from "./Building";

/** Reject unknown addresses instead of quietly presenting another building. */
export const buildingFromQuery: (query: string) => Building = (query: string): Building => {
  const building: string | null = new URLSearchParams(query).get("building");
  if (building !== "ancient" && building !== "modern" && building !== "future")
    throw new Error(
      "Choose a building from the collection to open its 3D tour.",
    );
  return building;
};
