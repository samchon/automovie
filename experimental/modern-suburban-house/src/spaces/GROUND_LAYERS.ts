/** Ground floor layers (10 main-ground-floor-base, garage-ground-floor-base), metres. */

export const GROUND_LAYERS = {
  /** Finish bundle below the main finished floor. */
  finish: 0.025,
  /** Support base below the main finish bundle. */
  base: 0.15,
  /** Garage base below the garage finished floor. */
  garageBase: 0.15,
} as const;
