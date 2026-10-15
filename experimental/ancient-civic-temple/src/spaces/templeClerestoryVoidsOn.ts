import type { WallVoid } from "../geometry/WallVoid";
import { templeClerestories } from "./templeClerestories";

/**
 * Actual gable-clerestory voids, matching profile ranges including frame thickness.
 */

export const templeClerestoryVoidsOn = (boundary: string): WallVoid[] => templeClerestories().filter((window) => window.boundary === boundary).map((window) => {
  const xs = window.profile.outline.map((point) => point.x);
  const ys = window.profile.outline.map((point) => point.y);
  return {
    id: window.id,
    from: Math.min(...xs), to: Math.max(...xs),
    bottom: Math.min(...ys), top: Math.max(...ys),
  };
});
