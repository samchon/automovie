import type { AutoMovieHumanFootToeSpan } from "./AutoMovieHumanFootToeSpan";

/**
 * The lengths along a toe's line at which its chain has sections: a fixed
 * count of evenly spaced shaft sections from the first own section to where
 * the tip starts to round, then the tip's three, close together where the tip
 * rounds.
 *
 * The count is the toe's own (`AutoMovieHumanFootPrior`, `sections`), never
 * stepped from a spacing: a count stepped by a fixed spacing flips with the
 * inputs and moves the tip's shape between one side's toe and the other's
 * reflection. The reference's bone-normal sections of f1's toes (every 2 mm)
 * are 29 for the hallux and the second toe, 25 for the third, 21 for the
 * fourth and 19 for the fifth, and a toe keeps at least that many.
 */
export namespace AutoMovieHumanFootToeStations {
  /**
   * The section lengths of a toe, increasing, from its first section to its cap.
   *
   * @param toe The toe's span.
   * @param sections The toe's section count, at least 5.
   */
  export function of(toe: AutoMovieHumanFootToeSpan.IToe, sections: number): number[] {
    const shaft: number = Math.max(1, sections - TIP_SECTIONS.length - 1);
    const shaftEnd: number = Math.max(toe.first + 0.5, toe.cap - TIP);
    const stations: number[] = [
      ...Array.from({ length: shaft + 1 }, (_: unknown, i: number): number => toe.first + ((shaftEnd - toe.first) * i) / shaft),
      ...TIP_SECTIONS.map((d: number): number => toe.cap - d),
    ];

    // A section closer than 0.1 mm to the one before adds nothing.
    return stations.filter((s: number, i: number): boolean => i === 0 || s > stations[i - 1]! + MIN_GAP);
  }
}

/** Length short of the cap where the shaft's sections end, mm. */
const TIP: number = 2.5;

/** The tip's sections, mm short of the cap where it closes. */
const TIP_SECTIONS: readonly number[] = [1.2, 0.3, 0];

/** Least spacing between kept sections, mm. */
const MIN_GAP: number = 0.1;
