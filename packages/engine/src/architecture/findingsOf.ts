/**
 * Measure every occurrence and every neighbouring pair against the declaration.
 *
 * Per-occurrence findings come first so a defect that belongs to one piece is
 * never buried under the pair findings its neighbours produced. The partner
 * list is then sorted, so a bucket map's insertion order can never reach the
 * output.
 *
 * Pairs are gathered through a uniform bucket grid rather than an all-pairs
 * sweep, and the grid is sized so the screen provably loses nothing. A piece
 * lies inside its own module rectangle, so it is never further than half that
 * rectangle's diagonal from the centre the grid buckets by. Two pieces whose
 * true separation is within the adjacency gap therefore have centres no further
 * apart than the largest module diagonal plus that gap, which is exactly the
 * cell size, so they always share a bucket or an adjacent one.
 *
 * What is then reported is the edge-normal joint, which is how a joint is read
 * and which never exceeds the true separation. A pair whose projections read
 * close while the pieces themselves sit diagonally further apart than the
 * adjacency gap is not scanned, and should not be: those two are not neighbours
 * on the surface.
 *
 * Neighbours are measured between the pieces as laid, not between the modules
 * as designed. Two zones that each cut their modules at the border they share
 * would otherwise be judged on rectangles that overlap across it and reported
 * as colliding when nothing on the surface does.
  * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const findingsOf = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
): IAutoMoviePatternFinding[] => {
  const findings: IAutoMoviePatternFinding[] = [];
  for (const placement of placements) {
    if (placement.coverage < pattern.minimumPiece - COVERAGE_EPSILON)
      findings.push({
        kind: "sliver",
        occurrences: [placement.id],
        measured: placement.coverage,
        limit: pattern.minimumPiece,
        detail: `occurrence "${placement.id}" survives at ${placement.coverage} of a module, below the ${pattern.minimumPiece} minimum piece`,
      });
    if (placement.punchedArea > 0)
      findings.push({
        kind: "unsupported-piece",
        occurrences: [placement.id],
        measured: placement.punchedArea,
        limit: 0,
        detail: `occurrence "${placement.id}" is cut by an exclusion, so its true piece is the outline minus that area; the convex procedural kernel has no boolean difference and cannot build it`,
      });
  }
  if (placements.length === 0) return findings;

  const cellSize =
    placements.reduce(
      (largest, one) =>
        Math.max(
          largest,
          Math.sqrt(one.size.u * one.size.u + one.size.v * one.size.v),
        ),
      0,
    ) + pattern.adjacency;
  const buckets = new Map<string, number[]>();
  placements.forEach((placement, index) => {
    const key = bucketKey(placement, cellSize, 0, 0);
    const bucket = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [index]);
    else bucket.push(index);
  });
  placements.forEach((placement, index) => {
    const partners = new Set<number>();
    for (let du = -1; du <= 1; ++du)
      for (let dv = -1; dv <= 1; ++dv)
        for (const candidate of buckets.get(
          bucketKey(placement, cellSize, du, dv),
        ) ?? [])
          if (candidate > index) partners.add(candidate);
    for (const partner of [...partners].sort((left, right) => left - right)) {
      const other = placements[partner]!;
      const gap = separation(placement.outline, other.outline);
      if (gap < -LENGTH_EPSILON) {
        findings.push({
          kind: "module-overlap",
          occurrences: [placement.id, other.id],
          measured: gap,
          limit: 0,
          detail: `occurrences "${placement.id}" and "${other.id}" overlap by ${-gap} m instead of leaving a joint`,
        });
        continue;
      }
      if (gap > pattern.adjacency + LENGTH_EPSILON) continue;
      if (
        Math.abs(gap - pattern.joint) >
        pattern.jointTolerance + LENGTH_EPSILON
      )
        findings.push({
          kind: "joint-deviation",
          occurrences: [placement.id, other.id],
          measured: gap,
          limit: pattern.joint,
          detail: `occurrences "${placement.id}" and "${other.id}" are ${gap} m apart, off the ${pattern.joint} m joint by more than the ${pattern.jointTolerance} m tolerance`,
        });
      if (pattern.grainToleranceDeg === null) continue;
      const deviation = grainDeviation(placement.grainDeg, other.grainDeg);
      if (deviation > pattern.grainToleranceDeg + LENGTH_EPSILON)
        findings.push({
          kind: "grain-break",
          occurrences: [placement.id, other.id],
          measured: deviation,
          limit: pattern.grainToleranceDeg,
          detail: `neighbouring occurrences "${placement.id}" and "${other.id}" run their grain ${deviation}° apart, above the ${pattern.grainToleranceDeg}° tolerance`,
        });
    }
  });
  return findings;
};
