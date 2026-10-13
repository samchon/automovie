import { instanceSlot, type IAutoMovieInstanceSetPlacement } from "@automovie/engine";

/** Regenerate the complete authored population through the actual member owner. */
export const sampleInstanceVariationSlots = (placement: IAutoMovieInstanceSetPlacement) =>
  Array.from({ length: placement.count }, (_, slot) => instanceSlot(placement, slot));
