import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalPointBound as PointBound,
} from "@automovie/interface";

import type { FilmPlan } from "../shots/kickboxing/ring-bout/FilmPlan";

/** Existing references consumed by the current scene's producer ordering. */
type Relations = {
  /** Collider references with the authored activation weight. */
  bindings: readonly Binding[];
  /** Relative witnesses, including any external actual body. */
  pointBounds?: readonly PointBound[];
};

/** Order the current scene's real relationship dependencies. Mutual references stay one simultaneous group, rather than becoming a false mount hierarchy or an arbitrary actor order. */
export function boutContactGroups(
  inputs: Readonly<Record<FilmPlan.ActorId, Relations>>,
): FilmPlan.ActorId[][] {
  const ids: FilmPlan.ActorId[] = Object.keys(inputs) as FilmPlan.ActorId[];
  const dependencies: Map<FilmPlan.ActorId, Set<FilmPlan.ActorId>> = new Map(
    ids.map(
      (id: FilmPlan.ActorId): [FilmPlan.ActorId, Set<FilmPlan.ActorId>] => [
        id,
        new Set([
          ...inputs[id].bindings
            .filter((binding: Binding): boolean => binding.weight > 0)
            .map((binding: Binding): string => binding.target.body),
          ...(inputs[id].pointBounds ?? []).map(
            (bound: PointBound): string => bound.reference.body,
          ),
        ].filter(
          (other: string): other is FilmPlan.ActorId =>
            other !== id && ids.includes(other as FilmPlan.ActorId),
        )),
      ],
    ),
  );
  const reachable: Map<FilmPlan.ActorId, Set<FilmPlan.ActorId>> = new Map();
  for (const id of ids) {
    const visited: Set<FilmPlan.ActorId> = new Set();
    visit(id);
    reachable.set(id, visited);
    /** Traverse actual body references once for this bounded three-actor scene. */
    function visit(current: FilmPlan.ActorId): void {
      if (visited.has(current)) return;
      visited.add(current);
      for (const other of dependencies.get(current)!) visit(other);
    }
  }
  const groups: FilmPlan.ActorId[][] = [];
  const remaining: Set<FilmPlan.ActorId> = new Set(ids);
  while (remaining.size) {
    const first: FilmPlan.ActorId = [...remaining][0]!;
    const group: FilmPlan.ActorId[] = ids.filter(
      (id: FilmPlan.ActorId): boolean =>
        remaining.has(id) &&
        reachable.get(first)!.has(id) &&
        reachable.get(id)!.has(first),
    );
    groups.push(group);
    for (const id of group) remaining.delete(id);
  }
  const ordered: FilmPlan.ActorId[][] = [];
  const emitted: Set<FilmPlan.ActorId[]> = new Set();
  for (const group of groups) emit(group);
  return ordered;

  /** A receiver's self/support fit is finalized before its dependent source. */
  function emit(group: FilmPlan.ActorId[]): void {
    if (emitted.has(group)) return;
    emitted.add(group);
    for (const id of group)
      for (const dependency of dependencies.get(id)!) {
        const other: FilmPlan.ActorId[] = groups.find(
          (candidate: FilmPlan.ActorId[]): boolean => candidate.includes(dependency),
        )!;
        if (other !== group) emit(other);
      }
    ordered.push(group);
  }
}
