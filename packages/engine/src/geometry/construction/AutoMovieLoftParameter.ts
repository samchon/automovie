/**
 * Correspondence rules that assign a phase to each point of a closed section.
 *
 * Every rule expects the polygon ordered from the front (+X) toward +Z, the
 * orientation every chain uses. One rule serves two consumers:
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
 * - `arclength`: phase 0 is the same front crossing and the whole outline
 *   is parameterized by its arclength. It is the rule of chains whose bottom
 *   section is a contact of several children, such as a palm whose fingers
 *   touch: the contact point is passed twice, and a polar angle would give
 *   both passes the same phase while arclength separates them.
 *
 * @evidence contracts/common.md#principled-implementation Phase correspondence between sections follows the declared rule (polar angle, arclength or anchored halves), so the same phase names corresponding points along the chain.
 * @evidence contracts/common.md#clear-and-simple-design One rule union and one mapping per rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Near-zero projected area uses a vertex-mean reference; anchored rules reject fewer than two crossings and floor half-length divisors at 1e-12. These are explicit numerical fallbacks, not complete outline admission.
 * @evidence contracts/common.md#meaningful-documentation States each rule and what it keeps fixed.
 * @evidence contracts/performance.md#efficient-algorithms Each mapping is linear in the outline's points.
 * @evidence contracts/performance.md#reuse-equivalent-work Anchored rules construct one cumulative edge-length table and reuse direct/fractional edge reads for anchors and vertex phases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds one cumulative array per mapped outline for the call.
 */
export namespace AutoMovieLoftParameter {
  /**
   * Correspondence selected for the polygon's geometric premises described above.
   *
   * @evidence contracts/common.md#principled-implementation The closed union distinguishes polar angles, front-anchored whole arclength and separately anchored front/back half arclength.
   * @evidence contracts/common.md#clear-and-simple-design One literal choice drives phases without independent mode flags that could disagree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The type selects a rule without proving star shape or anchor suitability; those remain caller geometry premises.
   * @evidence contracts/common.md#meaningful-documentation The namespace explains each rule's phase origin, orientation and admissible section shape.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The union contains no runtime mapping algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A rule name owns no shared outline computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A string literal acquires no resource or retained collection.
   */
  export type Rule = "polar" | "sagittal" | "arclength";

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
   *
   * @evidence contracts/common.md#principled-implementation Uses an area-centroid reference and dispatches to polar unwrapping or oriented edge arclength; simple oriented polygons with the selected rule's anchors/star shape are caller premises.
   * @evidence contracts/common.md#clear-and-simple-design One entry point keeps the rule and reference-point calculation common to fitted and inherited section correspondences.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains centroid's near-zero-area mean fallback, anchored crossing failure and 1e-12 length divisors; it does not independently validate a simple or nondegenerate polygon.
   * @evidence contracts/common.md#meaningful-documentation Gives input orientation, no repeated endpoint, returned phase convention and the reference point's sampling-density rationale.
   * @evidence contracts/performance.md#efficient-algorithms On the stated simple section workload, centroid and rule mapping traverse N vertices in O(N) time with O(N) phase/crossing/length storage.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes one reference point; anchored mapping shares its crossing list and cumulative arclength table across all returned phases.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Only the N-entry phase array escapes; polygon references and intermediate crossings/lengths are call-local, with no module cache.
   */
  export function phases(
    rule: Rule,
    polygon: readonly (readonly [number, number])[],
  ): number[] {
    const axis: [number, number] = centroid(polygon);
    return rule === "polar"
      ? polar(polygon, axis)
      : anchored(polygon, axis, rule === "sagittal");
  }

  /**
   * Area centroid `[x, z]` of a simple closed polygon in mm.
   *
   * Uses the shoelace decomposition into origin triangles. A twice-area
   * magnitude below 1e-9 squared input units falls back to the vertex mean;
   * an empty polygon returns the zero pair.
   *
   * @evidence contracts/common.md#principled-implementation The polygon shoelace first moment divided by signed area gives its centroid for a simple nonzero-area outline, assuming representable coordinate products.
   * @evidence contracts/common.md#clear-and-simple-design One edge loop accumulates area and both first moments, with a separate mean fallback.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absolute twice-area magnitude below 1e-9 in squared input units uses the vertex mean; this sampling-dependent fallback and empty-input zero result are not geometric centroid certificates.
   * @evidence contracts/common.md#meaningful-documentation States X/Z coordinates, area method and fallback; the evidence identifies the actual numerical threshold and its units.
   * @evidence contracts/performance.md#efficient-algorithms O(N) time and constant accumulator storage; the fallback makes one additional linear pass only for the near-zero-area branch.
   * @evidence contracts/performance.md#reuse-equivalent-work Area and both first moments share each edge's signed cross product.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a fresh pair and retains no polygon or auxiliary table.
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

  /**
   * Arclength phases from the front crossing of the sagittal axis plane.
   *
   * With `halves`, the back crossing is pinned to phase pi and each half is
   * mapped separately (the `sagittal` rule); otherwise the whole outline is
   * mapped at once (the `arclength` rule).
   */
  function anchored(
    polygon: readonly (readonly [number, number])[],
    axis: readonly [number, number],
    halves: boolean,
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
    /** Read a cumulative knot directly, or interpolate inside its edge. */
    const arc: (at: number) => number = (at: number): number => {
      const i: number = Math.floor(at);

      // A last-edge crossing can round to the closing knot n. Its arclength
      // is cumulative[n]; interpolating would read the nonexistent next edge
      // and turn the otherwise exact zero fraction into 0 * NaN.
      if (at === i) return cumulative[i]!;
      return cumulative[i]! + (at - i) * (cumulative[i + 1]! - cumulative[i]!);
    };

    /** Length travelled from `from` to `to` along the orientation, wrapping once. */
    const lengthBetween: (from: number, to: number) => number = (
      from: number,
      to: number,
    ): number => {
      const d: number = arc(to) - arc(from);
      return d >= 0 ? d : d + perimeter;
    };

    // Front-to-back is the +Z half, back-to-front the -Z half. Each half is
    // mapped linearly by arclength onto a phase interval of width pi.
    const firstHalf: number = halves
      ? lengthBetween(front, back)
      : perimeter / 2;
    const secondHalf: number = perimeter - firstHalf;

    const out: number[] = [];
    for (let i: number = 0; i < n; i++) {
      const fromFront: number = lengthBetween(front, i);
      out.push(
        fromFront <= firstHalf
          ? (Math.PI * fromFront) / Math.max(firstHalf, 1e-12)
          : Math.PI +
              (Math.PI * (fromFront - firstHalf)) / Math.max(secondHalf, 1e-12),
      );
    }
    return out;
  }
}
