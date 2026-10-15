import { createSectionPayload } from "./createSectionPayload";

/**
 * Vertical section payload for the viewer. Envelope solids from the current
 * source environment produce exact section pieces and site ground lines outside
 * the building footprint. The browser draws these values on the cutting plane.
 */
export type SectionPayload = ReturnType<typeof createSectionPayload>;
