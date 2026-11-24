import type {
  IAutoMovieSource,
  IAutoMovieViewSection,
  IAutoMovieViewSectionRange,
} from "@automovie/interface";

import { AutoMovieViewSection } from "./AutoMovieViewSection";
import { AutoMovieViewSectionConic } from "./AutoMovieViewSectionConic";

/**
 * Existing finite native shoulder reach and its numerical source preparation.
 * The public ViewSection range and target solver share this calculation owner.
 */
export namespace AutoMovieViewSectionRange {
  /**
   * Original accepted native girth residual and reach search scale, in source
   * length units.
   */
  export const TOLERANCE: number = 1e-6;

  /**
   * Accept the existing ellipse when its measured residual passes; otherwise
   * try one interior shoulder before requesting distant reach endpoints.
   */
  export function nearby(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"],
    girth: number,
  ): IAutoMovieViewSectionRange.IFamily {
    const trials: Map<number, IAutoMovieViewSectionRange.ITrial> = new Map();

    /** Public generic algebra callbacks never enter this numeric preparation. */
    const at: IAutoMovieViewSectionRange.IFamily["at"] = (
      shoulder: number,
    ): IAutoMovieViewSectionRange.ITrial => {
      const previous: IAutoMovieViewSectionRange.ITrial | undefined =
        trials.get(shoulder);
      if (previous !== undefined) return previous;
      const source: IAutoMovieSource = measure(
        box,
        departures.map(
          (d: number): number => shoulder + d,
        ) as IAutoMovieViewSection.ISection["shoulders"],
      );
      const result: IAutoMovieViewSectionRange.ITrial = {
        source,
        fault: AutoMovieViewSectionConic.fault(source),
      };
      trials.set(shoulder, result);
      return result;
    };
    const allowed: (shoulder: number) => boolean = (
      shoulder: number,
    ): boolean =>
      departures.every(
        (d: number): boolean => shoulder + d > 0 && shoulder + d < 1,
      );
    let range: IAutoMovieViewSectionRange.IFamily["range"] = null;
    const ellipse: number = AutoMovieViewSection.ELLIPSE;
    // A girth without a finite target has no range to search.
    if (Math.abs(girth) <= Number.MAX_VALUE && allowed(ellipse)) {
      const anchor: IAutoMovieViewSectionRange.ITrial = at(ellipse);
      if (anchor.fault === null) {
        if (Math.abs(anchor.source.girth - girth) <= TOLERANCE)
          return { range: null, accepted: anchor, at };
        const probe: number =
          girth < anchor.source.girth ? ellipse / 2 : (ellipse + 1) / 2;
        if (allowed(probe)) {
          const other: IAutoMovieViewSectionRange.ITrial = at(probe);
          const low: IAutoMovieViewSectionRange.ITrial =
            probe < ellipse ? other : anchor;
          const high: IAutoMovieViewSectionRange.ITrial =
            probe < ellipse ? anchor : other;
          if (
            other.fault === null &&
            low.source.girth <= girth &&
            girth <= high.source.girth
          )
            range = {
              shoulder: probe < ellipse ? [probe, ellipse] : [ellipse, probe],
              girth: [low.source.girth, high.source.girth],
            };
        }
      }
    }
    return { range, at };
  }

  /** Finite admitted common-shoulder reach with original quarter departures. */
  export function create(
    box: IAutoMovieViewSection.IBox,
    departures: IAutoMovieViewSection.ISection["shoulders"] = [0, 0, 0, 0],
  ): IAutoMovieViewSection.IRange | null {
    const at: (r: number) => IAutoMovieSource | null = (
      r: number,
    ): IAutoMovieSource | null => {
      const s: IAutoMovieViewSection.ISection["shoulders"] = departures.map(
        (d: number): number => r + d,
      ) as IAutoMovieViewSection.ISection["shoulders"];
      if (!s.every((x: number): boolean => x > 0 && x < 1)) return null;
      const section: IAutoMovieSource = measure(box, s);
      return AutoMovieViewSectionConic.fault(section) === null ? section : null;
    };
    if (at(AutoMovieViewSection.ELLIPSE) === null) return null;

    // Scale the finite shoulder bracket's bisection count by the box's
    // perimeter. This is a numerical reach search, not a derivative or
    // girth-error certificate; solve checks its actual final residual.
    const e: IAutoMovieViewSection.ISection["shoulders"] = box.extents;
    const steps: number = Math.min(
      64,
      Math.max(
        0,
        Math.ceil(Math.log2((2 * (e[0] + e[1] + e[2] + e[3])) / TOLERANCE)),
      ),
    );
    const edge: (inside: number, outside: number) => number = (
      inside: number,
      outside: number,
    ): number => {
      let a: number = inside;
      let b: number = outside;
      for (let i: number = 0; i < steps; i++) {
        const m: number = (a + b) / 2;
        if (m === a || m === b) break;
        if (at(m) !== null) a = m;
        else b = m;
      }
      return a;
    };
    const lo: number = edge(AutoMovieViewSection.ELLIPSE, 0);
    const hi: number = edge(AutoMovieViewSection.ELLIPSE, 1);
    const shaped: (r: number) => IAutoMovieSource = (
      r: number,
    ): IAutoMovieSource =>
      measure(
        box,
        departures.map(
          (d: number): number => r + d,
        ) as IAutoMovieViewSection.ISection["shoulders"],
      );
    const girths: [number, number] = [shaped(lo).girth, shaped(hi).girth];
    return girths[0] < girths[1] ? { shoulder: [lo, hi], girth: girths } : null;
  }

  /** Prepare and measure the identical numeric candidate before admission. */
  export function measure(
    box: IAutoMovieViewSection.IBox,
    shoulders: IAutoMovieViewSection.ISection["shoulders"],
  ): IAutoMovieSource {
    const value: IAutoMovieSource = AutoMovieViewSectionConic.prepare(
      box,
      shoulders,
    );
    value.girth = AutoMovieViewSectionConic.length(value);
    return value;
  }
}
