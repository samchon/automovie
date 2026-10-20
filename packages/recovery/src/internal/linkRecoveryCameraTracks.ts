import type { IAutoMovieRecoveryCameraMapBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryMapObservation } from "../structures/image/IAutoMovieRecoveryMapObservation";
import type { extractRecoveryImageFeatures } from "./extractRecoveryImageFeatures";
import type { matchRecoveryImageFeatures } from "./matchRecoveryImageFeatures";

/**
 * Link bidirectionally ratio-qualified feature identities across fixed images.
 * A component containing two feature indices from one image is explicitly
 * conflicting and is withheld; even a conflict-free component is tentative
 * appearance linkage rather than material truth or a geometric landmark.
 *
 * @evidence contracts/common.md#principled-implementation Exact index-pair intersection applies both query-direction ratio criteria. Union-find builds transitive feature components, with a unique-view invariant checked independently before any geometry.
 * @evidence contracts/common.md#clear-and-simple-design This owner handles appearance identity only; seed support, depth, reprojection and 3D registration belong to geometry coordinators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No filename order, expected pose, descriptor change, arbitrary conflict split or missing-view observation supplies a track.
 * @evidence contracts/common.md#meaningful-documentation States stronger bidirectional appearance filter, linked-only populations, duplicate-view conflict handling and absence of physical truth.
 * @evidence contracts/performance.md#efficient-algorithms With F selected features and M matches, path-compressed union/find costs O(F+M*alpha(F)) plus deterministic O(F log F) linked-node ordering; no all-feature distance matrix is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing forward/reverse matches and original feature coordinates supply links without a second descriptor comparison or detector pass.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Bounded owned components and scalar counts return. Parent/link maps and borrowed descriptors expire without global cache or external handles.
 */
export function linkRecoveryCameraTracks(
  features: readonly ReturnType<typeof extractRecoveryImageFeatures>[],
  pairs: readonly {
    first: number;
    second: number;
    forward: ReturnType<typeof matchRecoveryImageFeatures>;
    reverse: ReturnType<typeof matchRecoveryImageFeatures>;
  }[],
  budget: IAutoMovieRecoveryCameraMapBudget,
): {
  tracks: { id: number; observations: IAutoMovieRecoveryMapObservation[] }[];
  linkedObservations: number;
  components: number;
  conflictingComponents: number;
  intersectionMatches: number;
} {
  const offsets: number[] = [0];
  for (const feature of features)
    offsets.push(offsets[offsets.length - 1]! + feature.points.length);
  const parent: number[] = Array.from(
    { length: offsets[offsets.length - 1]! },
    (_: unknown, at: number): number => at,
  );
  const linked: Set<number> = new Set<number>();
  const find: (at: number) => number = (at: number): number => {
    let root: number = at;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[at] !== at) {
      const next: number = parent[at]!;
      parent[at] = root;
      at = next;
    }
    return root;
  };
  let intersectionMatches: number = 0;
  for (const pair of pairs) {
    const reverse: Set<string> = new Set(
      pair.reverse.map(
        (match: (typeof pair.reverse)[number]): string =>
          `${match.secondIndex}:${match.firstIndex}`,
      ),
    );
    for (const match of pair.forward)
      if (reverse.has(`${match.firstIndex}:${match.secondIndex}`)) {
        const a: number = offsets[pair.first]! + match.firstIndex,
          b: number = offsets[pair.second]! + match.secondIndex;
        const first: number = find(a),
          second: number = find(b);
        parent[Math.max(first, second)] = Math.min(first, second);
        linked.add(a);
        linked.add(b);
        intersectionMatches++;
        if (linked.size > budget.maxObservations)
          throw new Error("camera-map: linked observation budget exhausted");
      }
  }
  const grouped: Map<number, IAutoMovieRecoveryMapObservation[]> = new Map();
  for (const node of [...linked].sort(
    (a: number, b: number): number => a - b,
  )) {
    const root: number = find(node);
    let view: number = 0;
    while (node >= offsets[view + 1]!) view++;
    const featureIndex: number = node - offsets[view]!;
    const observations: IAutoMovieRecoveryMapObservation[] =
      grouped.get(root) ?? [];
    observations.push({
      viewIndex: view,
      featureIndex,
      pixel: [...features[view]!.points[featureIndex]!.point],
    });
    grouped.set(root, observations);
    if (grouped.size > budget.maxTracks)
      throw new Error("camera-map: linked track budget exhausted");
  }
  const tracks: ReturnType<typeof linkRecoveryCameraTracks>["tracks"] = [];
  let conflictingComponents: number = 0;
  for (const [id, observations] of grouped) {
    if (
      new Set(
        observations.map(
          (observation: IAutoMovieRecoveryMapObservation): number =>
            observation.viewIndex,
        ),
      ).size !== observations.length
    )
      conflictingComponents++;
    else tracks.push({ id, observations });
  }
  return {
    tracks,
    linkedObservations: linked.size,
    components: grouped.size,
    conflictingComponents,
    intersectionMatches,
  };
}
