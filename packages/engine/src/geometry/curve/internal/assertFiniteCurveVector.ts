import { isDenseFinite } from "./isDenseFinite";

/** Refuse incomplete or nonfinite Cartesian vectors in a curve chart. */
export function assertFiniteCurveVector(vector: readonly number[]): void {
  if (vector.length !== 3 || !isDenseFinite(vector))
    throw new Error("Three finite curve coordinates required");
}
