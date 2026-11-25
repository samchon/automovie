import type {
  IAutoMovieLoftSectionConnect,
  IAutoMovieLoftSectionJet,
  IAutoMovieLoftViewSource,
} from "@automovie/interface";

import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";

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
    if (original.interior === true)
      return original.regular !== true && original.domain[0] > first && original.domain[1] < last
        ? null
        : "the interior original section needs both retained native tails";
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

  /** Admit the owned interval and exact native local jets at every retained join. */
  export function compatibility(
    original: IAutoMovieLoftSectionConnect.IOriginal,
    direct: IAutoMovieLoftViewSource.ISource,
    read: ReturnType<typeof AutoMovieLoftViewRead.prepare>,
    order: number,
  ): string | null {
    if (original.regular === true) return null;
    const [start, end] = original.domain;
    const inside = original.interior === true;
    if (direct.caps.some(({ pole, near, span }): boolean =>
      inside ? near === null || (pole === direct.domain[0] ? start < near : end > near) : span === null || end > pole - span,
    )) return "the original section overlaps an original cap";
    for (const station of inside ? [start, end] : [end]) {
      const retained = read.jets(station);
      if (typeof retained === "string") return retained;
      const native = AutoMovieLoftSectionNative.jet(retained);
      const supplied = original.jetAt?.(station) ?? ((phase: number) => original.jet(station, phase));
      for (let k = 0; k < 2 * order; ++k) {
        const phase = Math.PI * k / order;
        if (!sameJet(supplied(phase), native(phase)))
          return `the original section does not preserve its protected local 0/1/2 jets at ${station} mm`;
      }
    }
    return null;
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

/** The protected native continuation's existing scale-aware roundoff bound. */
function sameJet(a: IAutoMovieLoftSectionJet, b: IAutoMovieLoftSectionJet): boolean {
  return (["p", "s", "t", "ss", "st", "tt"] as const).every((key): boolean =>
    a[key].length === 2 && a[key].every((x, i): boolean =>
      Number.isFinite(x) && Math.abs(x - b[key][i]!) <= 32 * Number.EPSILON * Math.max(1, Math.abs(x), Math.abs(b[key][i]!))));
}
