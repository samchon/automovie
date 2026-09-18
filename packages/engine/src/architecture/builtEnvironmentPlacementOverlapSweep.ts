import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltPlacementOverlapPair, IAutoMovieBuiltPlacementOverlapReport } from "@automovie/interface";
import { propBoundsOverlap } from "../film/propBoundsOverlap";
import { builtEnvironmentPartBoxes } from "./builtEnvironmentPartBoxes";

/**
 * Find every pair of placed bodies in a building whose volumes intersect.
 *
 * Sorting by the lower x corner and sweeping an active list is what keeps this
 * usable on a building rather than on a room. A naive pass over one measured
 * production's 3,474 placings is six million pair tests; pruning on one axis
 * leaves the comparisons the geometry actually forces, and `compared` states how
 * many that was, so the cost of the check is part of its answer instead of a
 * number somebody measures once and writes in a document.
 *
 * Exact face contact is excluded by {@link propBoundsOverlap} itself, so a slab
 * bearing on a wall head and a tenon meeting its mortise produce nothing here.
 * What is reported is interpenetration, graded by the share of the smaller body
 * inside the larger and deepest first, because a quoin toothed a centimetre into
 * its wall and a column standing wholly inside one are not one finding.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Answers the neighbour-overlap question across a whole building rather than one named pair at a time.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Reports each intersecting pair's shared volume, its share of the smaller body, both bases, and the comparisons performed.
 * @author Samchon
 */
export const builtEnvironmentPlacementOverlapSweep = (props: {
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieBuiltPlacementOverlapReport => {
  const { resolved, unresolved } = builtEnvironmentBodies(props.environment);
  const order = resolved
    .map((entry, index) => ({ ...entry, index }))
    .sort((left, right) =>
      left.bounds.min.x === right.bounds.min.x
        ? left.index - right.index
        : left.bounds.min.x - right.bounds.min.x,
    );
  const pairs: IAutoMovieBuiltPlacementOverlapPair[] = [];
  const active: typeof order = [];
  let compared = 0;
  // One pass over the record for every body's parts. Resolving them one body at
  // a time re-walks the element tree per body, which on the three-thousand-body
  // production this sweep is sized for is the whole cost of the check again.
  const boxes = builtEnvironmentPartBoxes(props.environment);
  const partsById = (id: string) => boxes.get(id);
  for (const subject of order) {
    // Anything whose right edge is behind this body's left edge can meet neither
    // it nor anything after it, because the sweep only ever moves right.
    for (let index = active.length - 1; index >= 0; --index)
      if (active[index]!.bounds.max.x <= subject.bounds.min.x)
        active.splice(index, 1);
    for (const candidate of active) {
      ++compared;
      if (propBoundsOverlap(candidate.bounds, subject.bounds) === false)
        continue;
      const first = candidate.index < subject.index ? candidate : subject;
      const second = candidate.index < subject.index ? subject : candidate;
      // The union boxes met; the bodies may not have. A shelf's union swallows
      // everything standing on it, so the pair is confirmed part against part
      // and withdrawn when nothing solid actually met. The union stays the
      // prune, because it contains every part and can only over-admit.
      const firstParts = solidBoxes(first.body, first.bounds, partsById);
      const secondParts = solidBoxes(second.body, second.bounds, partsById);
      let volume = 0;
      for (const left of firstParts)
        for (const right of secondParts) volume += sharedVolume(left, right);
      if (volume <= 0) continue;
      // Measured against the solid the parts occupy rather than the union, so a
      // column standing inside a mostly-air body is not graded as a sliver of
      // the air. Clamped because two parts of one body may themselves meet, and
      // a share of more than the whole is a number nobody can read.
      const smaller = Math.min(
        solidVolume(firstParts),
        solidVolume(secondParts),
      );
      pairs.push({
        left: first.body,
        right: second.body,
        leftBasis: first.bounds.basis,
        rightBasis: second.bounds.basis,
        volume,
        fraction: smaller === 0 ? 0 : Math.min(1, volume / smaller),
      });
    }
    active.push(subject);
  }
  return {
    measured: resolved.length,
    compared,
    pairs: pairs.sort((left, right) =>
      right.fraction === left.fraction
        ? right.volume - left.volume
        : right.fraction - left.fraction,
    ),
    unresolved,
  };
};
