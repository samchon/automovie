/** Unfold the fans of one surface that have flipped over at a seam vertex.
 *
 * A lip triangle through a skin triangle is not two bodies meeting: lips and
 * skin are one connected surface, and every such crossing this basis makes
 * turned out, when measured, to be between two triangles that share a vertex,
 * the apex of a fan at the lip seam, with the deeper corner 0.03 to 1.2 mm
 * past the other's plane. That is a fan folded over its own apex where two
 * channels both drag the seam, not one surface passing through another.
 * Pushing one part out of the other carried the fold along with the shared
 * boundary; relaxing the crease toward its neighbours collapsed the lip's two
 * thin layers into each other; taking back the pose's pull left the crossing
 * untouched, because the source seam already crosses on four such fans at
 * rest. All three were measured, and all three grew the count.
 *
 * A flipped fan is unflipped by its apex. Each shared vertex of a crossing
 * pair is drawn toward the centroid of its ring, its umbrella, a step at a
 * time, and the fans are measured again, until none crosses beyond what the
 * rest pose crosses or the budget is spent. Nothing else on the surface
 * moves, because nothing else is folded.
 *
 * Inputs are the surface at the pose and at rest over its shared vertices,
 * the two parts' triangle lists over those vertices, and the budget; the
 * result is keyed by the surface's vertex ordinals. Nothing here mutates its
 * inputs. Consumers: `solve-combination.ts`.
 */
import { measureAutoMovieMeshCrossings } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { type IPushOut, RELAX, ROUNDS, neighboursOf } from "./push-out";

/** The triangle pairs crossing between two parts, as "first/second" keys. */
const crossingPairs = (
  positions: number[],
  first: number[],
  second: number[],
): Set<string> => {
  const a: IAutoMovieMesh = {
    positions,
    normals: null,
    uvs: null,
    indices: first,
    skin: null,
  };
  const b: IAutoMovieMesh = {
    positions,
    normals: null,
    uvs: null,
    indices: second,
    skin: null,
  };
  return new Set(
    measureAutoMovieMeshCrossings(a, b).map(
      (one) => `${one.triangle}/${one.other}`,
    ),
  );
};

/**
 * The apexes of the crossing fans: vertices the two crossing triangles share,
 * beyond the pairs the rest pose already crosses. A crossing pair that shares
 * no vertex is not a fan and is counted apart, for the caller to report.
 */
const apexes = (
  positions: number[],
  first: number[],
  second: number[],
  exempt: ReadonlySet<string>,
): { apex: Set<number>; apart: number } => {
  const apex = new Set<number>();
  let apart = 0;
  for (const key of crossingPairs(positions, first, second)) {
    if (exempt.has(key)) continue;
    const [triangle, other] = key.split("/").map(Number);
    const mine = [0, 1, 2].map((k) => first[triangle * 3 + k]);
    const theirs = [0, 1, 2].map((k) => second[other * 3 + k]);
    const shared = mine.filter((v) => theirs.includes(v));
    if (shared.length === 0) apart++;
    for (const v of shared) apex.add(v);
  }
  return { apex, apart };
};

/**
 * Unflip the fans between two parts of one surface, and report what it took.
 * `crossings` counts apexes and apart pairs per round; the last entry is what
 * remains, and a pair sharing no vertex leaves the fold unsolved because this
 * cannot answer it.
 */
export const unfold = (
  surface: IAutoMovieMesh,
  rest: IAutoMovieMesh,
  first: number[],
  second: number[],
  limit: number,
): IPushOut => {
  const near = neighboursOf(surface);
  const exempt = crossingPairs(rest.positions, first, second);
  const working: IAutoMovieMesh = {
    ...surface,
    positions: [...surface.positions],
  };
  const crossings: number[] = [];
  let solved = false;
  for (let round = 0; round < ROUNDS; round++) {
    const { apex, apart } = apexes(working.positions, first, second, exempt);
    crossings.push(apex.size + apart);
    if (apex.size === 0 && apart === 0) {
      solved = true;
      break;
    }
    if (apex.size === 0) break;
    for (const row of apex) {
      const around = near[row];
      if (around.size === 0) continue;
      const middle = [0, 0, 0];
      for (const neighbour of around)
        for (let k = 0; k < 3; k++)
          middle[k] += working.positions[neighbour * 3 + k];
      const blended = [0, 1, 2].map(
        (k) =>
          working.positions[row * 3 + k] * (1 - RELAX) +
          (middle[k] / around.size) * RELAX,
      );
      const drift = [0, 1, 2].map(
        (k) => blended[k] - surface.positions[row * 3 + k],
      );
      const far = Math.hypot(drift[0], drift[1], drift[2]);
      for (let k = 0; k < 3; k++)
        working.positions[row * 3 + k] =
          far > limit
            ? surface.positions[row * 3 + k] + (drift[k] / far) * limit
            : blended[k];
    }
  }
  const moved = new Map<number, number[]>();
  for (let row = 0; row < surface.positions.length / 3; row++) {
    const delta = [0, 1, 2].map(
      (k) => working.positions[row * 3 + k] - surface.positions[row * 3 + k],
    );
    if (Math.hypot(delta[0], delta[1], delta[2]) > 1e-9) moved.set(row, delta);
  }
  return { moved, crossings, solved };
};
