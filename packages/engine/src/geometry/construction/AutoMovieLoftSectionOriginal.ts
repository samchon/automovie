import type { IAutoMovieLoftSectionConnect } from "@automovie/interface";

/** Admission and interval selection shared by direct source and chain geometry. */
export namespace AutoMovieLoftSectionOriginal {
  /**
   * Check the exact regular scope or the finite original prefix and its capabilities.
   */
  export function fault(
    original: IAutoMovieLoftSectionConnect.IOriginal,
    first: number,
    last: number,
    capped: boolean = false,
  ): string | null {
    if (
      !original.name ||
      !Array.isArray(original.domain) ||
      original.domain.length !== 2 ||
      !original.domain.every(Number.isFinite) ||
      !(original.domain[0] < original.domain[1]) ||
      typeof original.point !== "function" ||
      typeof original.phase !== "function" ||
      typeof original.jet !== "function" ||
      (original.pointAt !== undefined && typeof original.pointAt !== "function") ||
      (original.jetAt !== undefined && typeof original.jetAt !== "function")
    )
      return "the original section needs finite regular bounds and all three local capabilities";
    if (original.regular === true)
      return !capped &&
        original.domain[0] === first &&
        original.domain[1] === last
        ? null
        : "the complete original section needs both exact uncapped original bounds";
    return original.domain[0] >= first && original.domain[1] < last
      ? null
      : "the original section prefix needs a protected original distal field";
  }

  /** Include both complete regular ends. A prefix leaves the protected station to the retained distal law. */
  export function active(
    original: IAutoMovieLoftSectionConnect.IOriginal | undefined,
    station: number,
  ): boolean {
    return (
      original !== undefined &&
      station >= original.domain[0] &&
      (original.regular === true
        ? station <= original.domain[1]
        : station < original.domain[1])
    );
  }
}
