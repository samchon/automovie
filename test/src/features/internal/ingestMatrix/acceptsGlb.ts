import { inspectGlb } from "./inspectGlb";

/**
 * Run a GLB inspection whose successful completion is the case outcome.
 */
export const acceptsGlb: (document: unknown, bin: Buffer | null) => boolean = (document: unknown, bin: Buffer | null): boolean => {
  inspectGlb(document, bin);
  return true;
};
