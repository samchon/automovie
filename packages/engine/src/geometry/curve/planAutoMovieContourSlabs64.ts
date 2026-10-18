import { AutoMovieContourLoftCurves64 as curves } from "./AutoMovieContourLoftCurves64";
import { AutoMovieCurveMath64 as M } from "./AutoMovieCurveMath64";
import { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/** Shared physical millimetre vector layout. */
type V3 = M.V;
/** Retained saved-section coordinate. */
interface Slice {
  y: number;
}
/** Local declared incident curve. */
interface Incident {
  loop: number;
  winding: number;
}
interface Ring {
  points: M.V[];
  winding: number;
  unsupported?: string;
}
interface Critical {
  y: number;
  y0: number;
  y1: number;
  point: M.V | null;
  below: { loop: number; winding: number }[];
  above: { loop: number; winding: number }[];
  lowerLinkComponents: number;
  upperLinkComponents: number;
  manifoldLink: boolean;
  equalHeightNeighbour: boolean;
}
interface Group {
  a: number[];
  b: number[];
  critical: Critical[];
  unsupported?: string;
}
interface Slab {
  k: number;
  groups: Group[];
}
interface Props {
  slices: readonly { y: number }[];
  rings: Ring[][];
  events: Critical[];
  declaredEvents: readonly IAutoMovieContourLoft64.IEvent[];
  intervals?: readonly IAutoMovieContourLoft64.IInterval[];
}

/**
 * Plan contour slabs from explicit incidence or the existing nearest legacy policy.
 * Explicit mode admits a complete partition, uses exact event brackets and
 * local loop ordinals, and isolates unsupported groups without rematching them.
 * It supports ordinary one-to-one strips and isolated regular simple events;
 * sector order, handles, critical clusters and injectivity are not inferred.
 *
 * @evidence contracts/common.md#principled-implementation Explicit incidence replaces nearest correspondence when supplied. Legacy union-find and geometric separation apply to representable boundaries; unresolved curve representations cannot steal ordinary matches, and untraceable event incidence remains a local unsupported group.
 * @evidence contracts/common.md#clear-and-simple-design One planner owns correspondence, keeping shared-boundary subdivision and mesh emission with the tessellator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source face, source vertex, tolerance weld or count-based invented critical event is admitted. Unsupported explicit groups remain local gaps.
 * @evidence contracts/common.md#meaningful-documentation States complete adjacency coverage, exact event addressing, ordinary and simple-event support, local unrepresentable boundaries, and unclaimed embedding and sector topology.
 * @evidence contracts/performance.md#efficient-algorithms Explicit mode checks each loop once plus event incidence per group. Legacy mode retains pairwise sampled separation and sorted greedy correspondence; no geometric nearest query runs in explicit mode.
 * @evidence contracts/performance.md#reuse-equivalent-work The completed plan is reused for common slit preparation and subsequent emission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-call partition maps, union-find arrays and plan records retain no input mesh or external resource; plans transfer to one tessellation.
 */
export function planAutoMovieContourSlabs64(props: Props): Slab[] {
  const separation = (a: Ring, b: Ring): number => {
    if (a.unsupported !== undefined || b.unsupported !== undefined)
      return Infinity;
    if (a === b) return 0;
    const ap: V3[] = curves.sample(curves.curve(a.points), 16),
      bp: V3[] = curves.sample(curves.curve(b.points), 16);
    const directed = (p: V3[], q: V3[]): number =>
      p.reduce(
        (sum: number, v: V3): number =>
          sum +
          Math.min(
            ...q.map(
              (w: V3, i: number): number =>
                curves.closest(v, w, q[(i + 1) % q.length]).distance,
            ),
          ),
        0,
      ) / p.length;
    return (directed(ap, b.points) + directed(bp, a.points)) / 2;
  };
  const referenceSlice: Map<number, number> = new Map(
    props.slices.map((s: Slice, i: number): [number, number] => [s.y, i]),
  );
  const plans: Slab[] = [];
  const explicit: Map<number, IAutoMovieContourLoft64.IInterval> | undefined =
    admitIntervals(props);
  for (let k: number = 1; k < props.slices.length; k++) {
    const below: Slice = props.slices[k - 1],
      above: Slice = props.slices[k];
    const a: Ring[] = props.rings[k - 1],
      b: Ring[] = props.rings[k];
    if (explicit !== undefined) {
      plans.push({
        k,
        groups: explicitGroups(
          explicit.get(k)!,
          a,
          b,
          props.events,
          props.declaredEvents,
        ),
      });
      continue;
    }
    const parent: number[] = Array.from(
      { length: a.length + b.length },
      (_: unknown, i: number): number => i,
    );
    const root = (i: number): number => {
      while (parent[i] !== i) i = parent[i];
      return i;
    };
    const connect = (i: number, j: number): void => {
      parent[root(j)] = root(i);
    };
    const reserved: Set<number> = new Set();
    const critical: Critical[] = (props.events ?? []).filter(
      (e: Critical): boolean => e.y > below.y && e.y <= above.y,
    );
    const eventNodes: Map<Critical, number[]> = new Map();
    const invalidEvents: Set<Critical> = new Set();
    for (const event of critical) {
      const nodes: number[] = [];
      for (const [incidents, refY, current, offset] of [
        [event.below, event.y0, a, 0],
        [event.above, event.y1, b, a.length],
      ] as [Incident[], number, Ring[], number][]) {
        const ref: Ring[] = props.rings[referenceSlice.get(refY)!];
        const assigned: Set<number> = new Set();
        for (const incident of incidents) {
          const original: Ring = ref[incident.loop];
          const candidates: { i: number; error: number }[] = current
            .map((r: Ring, i: number): { i: number; error: number } => ({
              i,
              error:
                !assigned.has(i) && r.winding === incident.winding
                  ? separation(original, r)
                  : Infinity,
            }))
            .sort(
              (
                x: { i: number; error: number },
                y: { i: number; error: number },
              ): number => x.error - y.error,
            );
          if (!candidates.length || !Number.isFinite(candidates[0].error)) {
            invalidEvents.add(event);
            continue;
          }
          assigned.add(candidates[0].i);
          const node: number = candidates[0].i + offset;
          if (!nodes.includes(node)) nodes.push(node);
        }
      }
      for (const n of nodes) {
        reserved.add(n);
        connect(nodes[0], n);
      }
      eventNodes.set(event, nodes);
    }
    const candidates: { i: number; j: number; error: number }[] = [];
    for (let i: number = 0; i < a.length; i++)
      for (let j: number = 0; j < b.length; j++)
        if (
          !reserved.has(i) &&
          !reserved.has(a.length + j) &&
          a[i].unsupported === undefined &&
          b[j].unsupported === undefined &&
          a[i].winding === b[j].winding
        )
          candidates.push({ i, j, error: separation(a[i], b[j]) });
    candidates.sort(
      (
        x: { i: number; j: number; error: number },
        y: { i: number; j: number; error: number },
      ): number => x.error - y.error,
    );
    const usedA: Set<number> = new Set(),
      usedB: Set<number> = new Set();
    for (const pair of candidates)
      if (!usedA.has(pair.i) && !usedB.has(pair.j)) {
        connect(pair.i, a.length + pair.j);
        usedA.add(pair.i);
        usedB.add(pair.j);
      }
    const groups: Map<number, Group> = new Map();
    for (let i: number = 0; i < parent.length; i++) {
      const key: number = root(i);
      if (!groups.has(key)) groups.set(key, { a: [], b: [], critical: [] });
      if (i < a.length) groups.get(key)!.a.push(i);
      else groups.get(key)!.b.push(i - a.length);
    }
    for (const [event, nodes] of eventNodes)
      if (nodes.length) {
        const group: Group = groups.get(root(nodes[0]))!;
        group.critical.push(event);
        if (invalidEvents.has(event))
          group.unsupported =
            "Critical-event incident curve representation cannot be traced";
      } else if (invalidEvents.has(event))
        groups.set(-(groups.size + 1), {
          a: [],
          b: [],
          critical: [event],
          unsupported:
            "Critical-event incident curve representation cannot be traced",
        });
    plans.push({ k, groups: [...groups.values()] });
  }

  return plans;
}

/** Admit exact adjacent addresses and preserve complete loop partitions. */
function admitIntervals(
  props: Props,
): Map<number, IAutoMovieContourLoft64.IInterval> | undefined {
  if (props.intervals === undefined) return undefined;
  const result: Map<number, IAutoMovieContourLoft64.IInterval> = new Map();
  for (const interval of props.intervals) {
    const k: number = props.slices.findIndex(
      (s: { y: number }): boolean => s.y === interval.afterMm,
    );
    if (k < 1 || props.slices[k - 1]!.y !== interval.beforeMm || result.has(k))
      throw new Error(
        "Explicit contour intervals must name each adjacent saved pair once",
      );
    const used: [Set<number>, Set<number>] = [new Set(), new Set()];
    for (const group of interval.groups) {
      if (
        typeof group.supported !== "boolean" ||
        (group.reason !== null && typeof group.reason !== "string") ||
        (!group.supported && !group.reason?.trim()) ||
        (group.supported && group.before.length + group.after.length === 0)
      )
        throw new Error(
          "Explicit contour groups need incidence and an unsupported reason",
        );
      for (const side of [0, 1] as const) {
        const ids: readonly number[] = side === 0 ? group.before : group.after;
        const size: number = props.rings[k - 1 + side]!.length;
        for (const id of ids) {
          if (
            !Number.isSafeInteger(id) ||
            id < 0 ||
            id >= size ||
            used[side].has(id)
          )
            throw new Error(
              "Explicit contour group has an invalid or repeated local loop",
            );
          used[side].add(id);
        }
      }
    }
    if (
      used[0].size !== props.rings[k - 1]!.length ||
      used[1].size !== props.rings[k]!.length
    )
      throw new Error("Explicit contour groups must cover every saved loop");
    result.set(k, interval);
  }
  if (result.size !== Math.max(0, props.slices.length - 1))
    throw new Error(
      "Explicit contour intervals must cover every adjacent saved pair",
    );
  for (const event of props.declaredEvents) {
    const k: number = props.slices.findIndex(
      (s: { y: number }): boolean => s.y === event.afterMm,
    );
    if (k < 1 || props.slices[k - 1]!.y !== event.beforeMm)
      throw new Error(
        "Explicit contour events require adjacent saved brackets",
      );
  }
  return result;
}

/** Map events by exact local incidence; unsupported groups are never repaired. */
function explicitGroups(
  interval: IAutoMovieContourLoft64.IInterval,
  a: Ring[],
  b: Ring[],
  critical: Critical[],
  events: readonly IAutoMovieContourLoft64.IEvent[],
): Group[] {
  return interval.groups.map(
    (group: IAutoMovieContourLoft64.IInterval["groups"][number]): Group => {
      const selected: number[] = [];
      events.forEach(
        (event: IAutoMovieContourLoft64.IEvent, i: number): void => {
          if (
            event.beforeMm === interval.beforeMm &&
            event.afterMm === interval.afterMm &&
            (event.before.some((id: number): boolean =>
              group.before.includes(id),
            ) ||
              event.after.some((id: number): boolean =>
                group.after.includes(id),
              ))
          )
            selected.push(i);
        },
      );
      let reason: string | undefined = group.supported
        ? undefined
        : group.reason!;
      if (reason === undefined) {
        if (selected.length === 0) {
          if (
            group.before.length !== 1 ||
            group.after.length !== 1 ||
            a[group.before[0]!]!.winding !== b[group.after[0]!]!.winding
          )
            reason =
              "Ordinary continuation requires one same-winding loop on each side";
        } else if (selected.length !== 1)
          reason = "Critical clusters require explicit sector topology";
        else {
          const event: IAutoMovieContourLoft64.IEvent = events[selected[0]!]!;
          const same: (
            x: readonly number[],
            y: readonly number[],
          ) => boolean = (
            x: readonly number[],
            y: readonly number[],
          ): boolean =>
            x.length === y.length &&
            x.every((id: number): boolean => y.includes(id)) &&
            y.every((id: number): boolean => x.includes(id));
          if (
            !event.regular ||
            !same(event.before, group.before) ||
            !same(event.after, group.after)
          )
            reason =
              "Critical incidence is nonregular or differs from the declared group";
          else if (
            event.kind === "saddle"
              ? group.before.length + group.after.length !== 3 ||
                group.before.length === 0 ||
                group.after.length === 0
              : event.terminal === null ||
                group.before.length + group.after.length !== 1 ||
                (event.kind === "minimum"
                  ? group.before.length !== 0
                  : group.after.length !== 0)
          )
            reason =
              "Critical event requires unsupported sector or terminal topology";
        }
      }
      return {
        a: [...group.before],
        b: [...group.after],
        critical: selected.map((i: number): Critical => critical[i]!),
        ...(reason === undefined ? {} : { unsupported: reason }),
      };
    },
  );
}
