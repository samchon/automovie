/**
 * The website transport wraps each production's opaque native renderer payload
 * with portable, authored camera choices. Build-time producers keep ownership
 * of geometry, finishes and placement. The browser reads only this envelope
 * before handing `native` back to that production's scene uploader.
 * Coordinates are world metres, right-handed Y-up; lens angles are degrees.
 * Views without a usable pose and specialised diagnostic sections stay in the
 * production's own inspector. This public showcase never invents those poses.
 */
export type Building = "ancient" | "modern" | "future";
export type Point = [number, number, number];
export interface TourView {
  id: string;
  label: string;
  group: string;
  position: Point;
  target: Point;
  fov: number;
  near: number;
  far: number;
}
export interface TourData {
  building: Building;
  title: string;
  era: string;
  source: string;
  initial: string;
  views: TourView[];
  native: unknown;
}

/** Reject unknown addresses instead of quietly presenting another building. */
export const buildingFromQuery = (query: string): Building => {
  const building = new URLSearchParams(query).get("building");
  if (building !== "ancient" && building !== "modern" && building !== "future")
    throw new Error(
      "Choose a building from the collection to open its 3D tour.",
    );
  return building;
};

/** Preserve build-time identity at the network boundary. */
export const readTourData = (value: unknown, building: Building): TourData => {
  const data = value as TourData | null;
  if (
    data === null ||
    typeof data !== "object" ||
    data.building !== building ||
    !Array.isArray(data.views) ||
    data.views.length === 0 ||
    !data.views.some((view) => view.id === data.initial)
  )
    throw new Error(
      "The building's 3D data is incomplete. Please reload the page.",
    );
  return data;
};

/** Source ids remain stable; this label only makes the navigator readable. */
export const viewLabel = (id: string): string =>
  id.replace(/[-_.]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
