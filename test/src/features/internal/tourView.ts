import type { TourView } from "@automovie/website/tour-data";

/** Supplies a fixed camera in world units for CPU tour selection and framing cases. The caller may change its identifier without changing camera values. */
export function tourView(id: string = "outside"): TourView {
  return {
    id,
    label: id,
    group: "Outside",
    position: [0, 2, 10],
    target: [0, 2, 0],
    fov: 45,
    near: 0.1,
    far: 100,
  };
}
