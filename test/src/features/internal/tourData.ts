import type { TourData } from "@automovie/website/tour-data";

import { tourView } from "./tourView";

/** Supplies two independently specified camera records and an empty native payload for website logic cases; it is not a production scene artifact. */
export function tourData(): TourData {
  return {
    building: "ancient",
    title: "Place",
    era: "Era",
    initial: "outside",
    source: "https://example.org/source",
    native: {},
    views: [
      tourView(),
      { ...tourView("room"), label: "Reading room", group: "Inside" },
    ],
  };
}
