import { AutoMovieLoftRelief, AutoMovieViewSection, type IAutoMovieLoftRelief } from "@automovie/engine";

/**
 * The conic shoulder of a leg girth site: the fullness whose section on the
 * site's box (lateral, medial, anterior, posterior half extents) closes the
 * site's tape. Over a relief (the patella over mid-patella) the knee tape runs
 * over the relief, so the shoulder closes the taut tape, the convex hull of
 * the conic plus the relief's height along the relief's phase.
 */
export namespace AutoMovieHumanLegSiteShoulder {
  /** Conic shoulder of a box (lateral, medial, anterior, posterior) whose section closes the tape; a refusal is recorded and the null shoulder kept visibly. */
  export function solve(name: string, box: [number, number, number, number], girth: number, diagnostics: string[]): number {
    const solved: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(`leg ${name}`, { extents: [box[0], box[3], box[1], box[2]] }, girth);
    if (solved.section === null || solved.diagnostics.length !== 0) {
      diagnostics.push(`leg ${name}: no conic closes the tape ${girth.toFixed(2)} on the box [${box.map((x: number): string => x.toFixed(2)).join(", ")}]: ${solved.diagnostics.map((x: { detail: string }): string => x.detail).join("; ")}; the null shoulder stands unresolved`);
      return AutoMovieViewSection.ELLIPSE;
    }
    return solved.section.shoulders[0];
  }

  /**
   * The shoulder whose conic plus the relief closes the taut tape, when the
   * site stands inside the relief's station window; {@link solve} otherwise,
   * or when no shoulder in (0.05, 0.95) closes it (recorded).
   *
   * @param relief The relief, its stations relative to the relief's centre station.
   * @param offset The site's station from the relief's centre station.
   * @param phase The relief's phase, along which its height adds.
   * @param medial +1 when medial is +Z (left leg), -1 otherwise.
   */
  export function relieved(name: string, box: [number, number, number, number], girth: number, diagnostics: string[], relief: IAutoMovieLoftRelief | null, offset: number, phase: number, medial: 1 | -1): number {
    if (relief === null || !(offset > relief.stations[0] && offset < relief.stations[1])) return solve(name, box, girth, diagnostics);
    const taut: (rho: number) => number = (rho: number): number => {
      const section: AutoMovieViewSection.ISection = AutoMovieViewSection.of({ extents: medial > 0 ? [box[0], box[3], box[1], box[2]] : [box[0], box[2], box[1], box[3]] }, [rho, rho, rho, rho]);
      const points: [number, number][] = Array.from({ length: 1440 }, (_: unknown, k: number): [number, number] => {
        const phi: number = (2 * Math.PI * k) / 1440;
        const r: number = AutoMovieViewSection.radius(section, phi)[0];
        const h: number = AutoMovieLoftRelief.jet(relief, offset, phi)[0]!;
        return [r * Math.cos(phi) + h * Math.cos(phase), r * Math.sin(phi) + h * Math.sin(phase)];
      });
      return hullPerimeter(points);
    };
    let lo: number = 0.05;
    let hi: number = 0.95;
    if (!(taut(lo) < girth && taut(hi) > girth)) {
      diagnostics.push(`leg ${name}: no conic with the relief closes the tape ${girth.toFixed(2)}; the plain conic stands unresolved`);
      return solve(name, box, girth, diagnostics);
    }
    for (let k: number = 0; k < 60; ++k) {
      const mid: number = (lo + hi) / 2;
      if (taut(mid) < girth) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }
}

/** Perimeter of the convex hull of planar points (Andrew's monotone chain): the taut tape around them. */
function hullPerimeter(points: [number, number][]): number {
  const p: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
  const turn: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  const hull: [number, number][] = [...half(p), ...half([...p].reverse())];
  let sum: number = 0;
  for (let k: number = 0; k < hull.length; ++k) sum += Math.hypot(hull[(k + 1) % hull.length]![0] - hull[k]![0], hull[(k + 1) % hull.length]![1] - hull[k]![1]);
  return sum;
}
