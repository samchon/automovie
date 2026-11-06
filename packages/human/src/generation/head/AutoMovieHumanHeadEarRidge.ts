import { AutoMovieViewAxis, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

/**
 * An ear ridge swept on its own anatomical course. A curved helix or crural
 * branch is not represented by a straight long dome. Source points and
 * section widths remain the modeler's inputs; the engine carries the
 * rotation-minimizing planes and performs all lofting.
 *
 * @evidence contracts/common.md#principled-implementation Sweeps ellipse sections along a named anatomical course with engine-owned minimally rotating frames.
 * @evidence contracts/common.md#clear-and-simple-design One view builder serves helix, antihelix and the two separate crura.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses source landmarks only, with no mesh/ray observation, parent-foot move or individual fit.
 * @evidence contracts/common.md#meaningful-documentation Separates course, section dimensions, frame ownership and the unverified joins.
 * @evidence contracts/performance.md#efficient-algorithms One cumulative chord pass and one bounded axis preparation.
 * @evidence contracts/performance.md#reuse-equivalent-work Both supporting outline pairs share stations and the same engine axis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the view and prepared axis; no figure survives globally.
 */
export namespace AutoMovieHumanHeadEarRidge {
  /**
   * Draw one closed ridge, calibration mm, capped at both course ends.
   *
   * @evidence contracts/common.md#principled-implementation Each named source point is an axis knot, and every cross section has the declared elliptical half extents.
   * @evidence contracts/common.md#clear-and-simple-design Returns only a view, leaving merge and diff to the head tree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not turn a failed join into a relocation or a compensating width.
   * @evidence contracts/common.md#meaningful-documentation States units, cap behavior and engine ownership of the loft.
   * @evidence contracts/performance.md#efficient-algorithms Linear work in the bounded course points.
   * @evidence contracts/performance.md#reuse-equivalent-work One station list supplies all source curves.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only the returned source view and its axis knots.
   */
  export function of(name: string, course: readonly [number, number, number][], normal: [number, number, number], height: number, width: number, ports: { start?: string; end?: string } = {}): IAutoMovieViewPart {
    const points: [number, number, number][] = course.map((point: [number, number, number]): [number, number, number] => [...point]);
    const extend: (endpoint: [number, number, number], neighbour: [number, number, number]) => [number, number, number] = (endpoint: [number, number, number], neighbour: [number, number, number]): [number, number, number] => {
      const distance: number = Math.hypot(...endpoint.map((value: number, i: number): number => value - neighbour[i]!));
      if (!(distance > 0)) throw new Error(`Ear ridge ${name} has a degenerate junction course`);
      return endpoint.map((value: number, i: number): number => value + (value - neighbour[i]!) * Math.max(height, width) / distance) as [number, number, number];
    };
    // A named fork is a regular, nonzero section. The existing section's
    // largest half extent supplies overlap past it before the hidden pole;
    // this geometric port convention is not a new anatomical radius.
    if (ports.start !== undefined) points.unshift(extend(course[0]!, course[1]!));
    if (ports.end !== undefined) points.push(extend(course.at(-1)!, course.at(-2)!));
    const source: number[] = [0];
    for (let i: number = 1; i < points.length; i++) source.push(source[i - 1]! + Math.hypot(...points[i]!.map((v: number, k: number): number => v - points[i - 1]![k]!)));
    // These are evaluation sites, not new shape knots. Three original
    // course sites with two poles still need two regular loft sections.
    const stations: number[] = [...source, ...source.slice(1).map((s: number, i: number): number => (s + source[i]!) / 2)].sort((a: number, b: number): number => a - b);
    const site: (i: number) => string = (i: number): string => ports.start !== undefined && i === 1 ? ports.start : ports.end !== undefined && i === points.length - 2 ? ports.end : `${name}.${i}`;
    const outline: (value: number) => IAutoMovieViewPart.IOutline = (value: number): IAutoMovieViewPart.IOutline => ({ knots: source.map((station: number, i: number): IAutoMovieViewPart.IKnot => ({ site: site(i), station, value: i === 0 || i === source.length - 1 ? 0 : value })), range: { minimum: Math.min(0, value), maximum: Math.max(0, value) } });
    return {
      name,
      axis: AutoMovieViewAxis.minimal(source.map((station: number, i: number): AutoMovieViewAxis.IAxisKnot => ({ station, point: points[i]! })), normal, 1),
      stations,
      front: { positive: outline(height), negative: outline(-height) },
      side: { positive: outline(width), negative: outline(-width) },
      fullness: { kind: "shoulder", shoulder: { knots: [0, stations[stations.length - 1]!].map((station: number): IAutoMovieViewPart.IKnot => ({ site: `${name}.ellipse`, station, value: AutoMovieViewSection.ELLIPSE })) } },
      pole: "both", order: 16, samples: 64,
    };
  }
}
