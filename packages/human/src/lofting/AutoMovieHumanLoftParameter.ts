/**
 * Correspondence rules that assign a phase to each point of a closed section.
 *
 * Both rules expect the polygon ordered from the front (+X) toward +Z, the
 * orientation every chain uses. The same rule serves two consumers:
 *
 * - the observation fitter, which resamples a recovered section at uniform
 *   phases before projecting it onto harmonics;
 * - the generator, which assigns phases to the vertices a child chain
 *   inherits from its parent ring at a branch event.
 *
 * Using one function for both keeps fitted coefficients and inherited
 * vertices in one correspondence, so the band between an inherited ring and
 * the next generated ring connects corresponding points.
 *
 * Rules:
 *
 * - `polar`: phase is the polar angle about the chain axis, unwrapped to
 *   increase monotonically. It requires a section that is star-shaped about
 *   the axis point, which holds for limb shafts.
 * - `sagittal`: phase 0 is the front crossing of the plane `z = axis z`,
 *   phase pi is the back crossing, and each half is parameterized by its
 *   arclength. It accepts non-star sections such as the shoulder girdle,
 *   where an arm lobe leaves the torso, provided the most forward and most
 *   rearward crossings of that plane are the anatomical front and back.
 */
export namespace AutoMovieHumanLoftParameter {
  /** Name of a correspondence rule. */
  export type Rule = "polar" | "sagittal";

  /**
   * Phase of every polygon vertex under a rule.
   *
   * Polar phases are unwrapped and monotone. Sagittal phases lie in
   * `[0, 2pi)` and wrap once at the front anchor. Evaluation of a harmonic
   * curve is periodic, so both forms address the same points.
   *
   * The rule's reference point is the polygon's area centroid, computed
   * here rather than supplied. A vertex mean would depend on how densely
   * each stretch of the outline happens to be sampled, so recovered spans of
   * uneven length would jitter the phase origin from section to section and
   * twist the correspondence; the area centroid depends only on the outline.
   *
   * @param rule Correspondence rule of the owning chain.
   * @param polygon Closed polygon `[x, z]` in mm, front-to-+Z orientation, without a repeated last point.
   * @returns Phase in radians of every polygon vertex.
   */
  export function phases(
    rule: Rule,
    polygon: readonly (readonly [number, number])[],
  ): number[] {
    const axis: [number, number] = centroid(polygon);
    return rule === "polar" ? polar(polygon, axis) : sagittal(polygon, axis);
  }

  /**
   * Area centroid `[x, z]` of a simple closed polygon in mm.
   *
   * Uses the shoelace decomposition into origin triangles. A degenerate
   * polygon of zero area falls back to the vertex mean.
   */
  export function centroid(
    polygon: readonly (readonly [number, number])[],
  ): [number, number] {
    const n: number = polygon.length;
    let twiceArea: number = 0;
    let cx: number = 0;
    let cz: number = 0;

    for (let i: number = 0; i < n; i++) {
      const a: readonly [number, number] = polygon[i]!;
      const b: readonly [number, number] = polygon[(i + 1) % n]!;
      const cross: number = a[0] * b[1] - b[0] * a[1];

      twiceArea += cross;
      cx += (a[0] + b[0]) * cross;
      cz += (a[1] + b[1]) * cross;
    }

    if (Math.abs(twiceArea) < 1e-9) {
      const mean: [number, number] = [0, 0];
      for (const p of polygon) {
        mean[0] += p[0] / n;
        mean[1] += p[1] / n;
      }
      return mean;
    }
    return [cx / (3 * twiceArea), cz / (3 * twiceArea)];
  }

  /** Unwrapped polar angles about the axis point. */
  function polar(
    polygon: readonly (readonly [number, number])[],
    axis: readonly [number, number],
  ): number[] {
    const out: number[] = [];
    let previous: number = NaN;

    for (const p of polygon) {
      let angle: number = Math.atan2(p[1] - axis[1], p[0] - axis[0]);

      // The first vertex starts in [0, 2pi); each later vertex is unwrapped
      // to the branch nearest its predecessor, so the sequence is continuous.
      if (Number.isNaN(previous)) {
        if (angle < 0) angle += 2 * Math.PI;
      } else {
        while (angle < previous - Math.PI) angle += 2 * Math.PI;
        while (angle > previous + Math.PI) angle -= 2 * Math.PI;
      }

      out.push(angle);
      previous = angle;
    }
    return out;
  }

  /** Half-arclength phases between the front and back sagittal crossings. */
  function sagittal(
    polygon: readonly (readonly [number, number])[],
    axis: readonly [number, number],
  ): number[] {
    const n: number = polygon.length;

    // Crossings of the plane z = axis z, as fractional edge positions
    // `i + f` on edge (i, i+1), with the crossing's x coordinate.
    const crossings: { at: number; x: number }[] = [];
    for (let i: number = 0; i < n; i++) {
      const a: readonly [number, number] = polygon[i]!;
      const b: readonly [number, number] = polygon[(i + 1) % n]!;
      const da: number = a[1] - axis[1];
      const db: number = b[1] - axis[1];

      if (da === 0) crossings.push({ at: i, x: a[0] });
      else if (da * db < 0) {
        const f: number = da / (da - db);
        crossings.push({ at: i + f, x: a[0] + f * (b[0] - a[0]) });
      }
    }
    if (crossings.length < 2)
      throw new Error("Sagittal phase needs a section crossing its axis plane");

    // The front anchor is the most forward crossing, the back anchor the
    // most rearward one; inner crossings of a recess are ignored.
    const front: number = crossings.reduce(
      (best: { at: number; x: number }, c: { at: number; x: number }) =>
        c.x > best.x ? c : best,
    ).at;
    const back: number = crossings.reduce(
      (best: { at: number; x: number }, c: { at: number; x: number }) =>
        c.x < best.x ? c : best,
    ).at;

    // Cumulative arclength from vertex 0; a fractional edge position maps
    // linearly onto its edge.
    const cumulative: number[] = [0];
    for (let i: number = 0; i < n; i++) {
      const a: readonly [number, number] = polygon[i]!;
      const b: readonly [number, number] = polygon[(i + 1) % n]!;
      cumulative.push(cumulative[i]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    const perimeter: number = cumulative[n]!;
    const arc = (at: number): number => {
      const i: number = Math.floor(at);
      return (
        cumulative[i]! + (at - i) * (cumulative[i + 1]! - cumulative[i]!)
      );
    };

    // Length travelled from `from` to `to` along the orientation, wrapping once.
    const lengthBetween = (from: number, to: number): number => {
      const d: number = arc(to) - arc(from);
      return d >= 0 ? d : d + perimeter;
    };

    // Front-to-back is the +Z half, back-to-front the -Z half. Each half is
    // mapped linearly by arclength onto a phase interval of width pi.
    const firstHalf: number = lengthBetween(front, back);
    const secondHalf: number = perimeter - firstHalf;

    const out: number[] = [];
    for (let i: number = 0; i < n; i++) {
      const fromFront: number = lengthBetween(front, i);
      out.push(
        fromFront <= firstHalf
          ? (Math.PI * fromFront) / Math.max(firstHalf, 1e-12)
          : Math.PI +
              (Math.PI * (fromFront - firstHalf)) /
                Math.max(secondHalf, 1e-12),
      );
    }
    return out;
  }
}
