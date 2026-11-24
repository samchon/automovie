import type { IAutoMovieLoftSectionConnect } from "@automovie/interface";

/** Admission and interval selection shared by direct source and chain geometry. */
export namespace AutoMovieLoftSectionOriginal {
  /**
   * Check the finite original prefix and its capability owners.
   */
  export function fault(
    original: IAutoMovieLoftSectionConnect.IOriginal,
    first: number,
    last: number,
  ): string | null {
    if (!original.name || !Array.isArray(original.domain) || original.domain.length !== 2 ||
        !original.domain.every(Number.isFinite) ||
        !(original.domain[0] >= first && original.domain[0] < original.domain[1] && original.domain[1] < last) ||
        typeof original.point !== "function" || typeof original.phase !== "function" || typeof original.jet !== "function")
      return "the original section needs finite regular bounds, an original distal field and all three local capabilities";
    return null;
  }

  /** The protected station belongs to the retained distal law. */
  export function active(
    original: IAutoMovieLoftSectionConnect.IOriginal | undefined,
    station: number,
  ): boolean {
    return original !== undefined && station >= original.domain[0] && station < original.domain[1];
  }
}
