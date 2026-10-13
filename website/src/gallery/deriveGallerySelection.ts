import type { IGalleryContent } from "./IGalleryContent";

/**
 * Project the selected authored article/view without retaining another
 * building's destination. Exterior is view zero; other labels remain authored.
 * This projection preserves image source strings; active image adoption and
 * anchor assignment own URL resolution.
 */
export function deriveGallerySelection(content: readonly IGalleryContent[], buildingIndex: number, viewIndex: number) {
  const building = content[buildingIndex];
  const image = building.images[viewIndex];
  return {
    title: building.title,
    era: building.era,
    description: building.description,
    source: building.source,
    tour: building.tour,
    count: `${buildingIndex + 1} / ${content.length}`,
    image,
    caption: viewIndex === 0 ? "Exterior" : image.label,
    pressed: building.images.map((_image, index) => index === viewIndex),
  };
}
