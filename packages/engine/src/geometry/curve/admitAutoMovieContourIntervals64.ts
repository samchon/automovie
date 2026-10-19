import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";
import type { planAutoMovieContourSlabs64 } from "./planAutoMovieContourSlabs64";

type Props = Parameters<typeof planAutoMovieContourSlabs64>[0];
type Ring = Props["rings"][number][number];
type Slice = Props["slices"][number];

/**
 * Admit explicit adjacent intervals while retaining independent usable groups.
 *
 * @evidence contracts/common.md#principled-implementation The original exact saved-pair lookup, incidence ownership maps and local defect quarantine retain every unsupported reason; no continuation is inferred.
 * @evidence contracts/common.md#clear-and-simple-design This owner separates one admission or record responsibility from its existing caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The extraction preserves the original decisions, failure messages and iteration order without adding geometry, defaults or fallback authority.
 * @evidence contracts/common.md#meaningful-documentation States the owned inputs, output responsibility and retained qualification limits.
 * @evidence contracts/performance.md#efficient-algorithms Saved section lookup and each interval incidence traversal retain their original populations and order.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller consumes this one prepared result without repeating the extracted work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Maps, sets and returned interval records belong to one contour plan; no handles or cross-call state exist.
 */
export function admitAutoMovieContourIntervals64(
  props: Props,
): Map<number, IAutoMovieContourLoft64.IInterval> | undefined {
  if (props.intervals === undefined) return undefined;
  if (!Array.isArray(props.intervals))
    throw new Error(
      "Explicit contour intervals require a saved adjacency array",
    );
  type Interval = IAutoMovieContourLoft64.IInterval;
  type Item = Interval["groups"][number];
  const result: Map<number, Interval> = new Map();
  const duplicated: Set<number> = new Set();
  const unprocessed: (k: number, reason: string) => Interval = (
    k: number,
    reason: string,
  ): Interval => ({
    beforeMm: props.slices[k - 1].y,
    afterMm: props.slices[k].y,
    groups: [
      {
        before: props.rings[k - 1].map((_: Ring, i: number): number => i),
        after: props.rings[k].map((_: Ring, i: number): number => i),
        supported: false,
        reason,
      },
    ],
  });
  for (const interval of props.intervals) {
    const k: number = !interval
      ? -1
      : props.slices.findIndex(
          (section: Slice): boolean => section.y === interval.afterMm,
        );
    if (k < 1 || props.slices[k - 1].y !== interval.beforeMm)
      throw new Error(
        "Explicit contour interval addresses must select an adjacent saved pair",
      );
    if (result.has(k)) {
      duplicated.add(k);
      result.set(
        k,
        unprocessed(k, "Explicit contour interval is declared more than once"),
      );
      continue;
    }
    if (!Array.isArray(interval.groups)) {
      result.set(
        k,
        unprocessed(k, "Explicit contour interval has no usable group array"),
      );
      continue;
    }
    const groups: {
      before: number[];
      after: number[];
      supported: boolean;
      reason: string | null;
    }[] = [];
    const reasons: Set<string>[] = [];
    const owners: [Map<number, Set<number>>, Map<number, Set<number>>] = [
      new Map(),
      new Map(),
    ];
    for (let ordinal: number = 0; ordinal < interval.groups.length; ordinal++) {
      const group: Item | undefined = interval.groups[ordinal];
      const why: Set<string> = new Set();
      reasons.push(why);
      const ids: [number[], number[]] = [[], []];
      const seen: [Set<number>, Set<number>] = [new Set(), new Set()];
      if (
        !group ||
        typeof group.supported !== "boolean" ||
        (group.reason !== null && typeof group.reason !== "string") ||
        (group.supported === false && !group.reason?.trim())
      )
        why.add(
          `Explicit contour group ${ordinal} needs a support declaration and reason`,
        );
      for (const side of [0, 1] as const) {
        const raw: readonly number[] | undefined =
          side === 0 ? group?.before : group?.after;
        if (!Array.isArray(raw)) {
          why.add(
            `Explicit contour group ${ordinal} has no usable side ${side} incidence`,
          );
          continue;
        }
        for (let slot: number = 0; slot < raw.length; slot++) {
          const id: number = raw[slot];
          if (
            !Number.isSafeInteger(id) ||
            id < 0 ||
            id >= props.rings[k - 1 + side].length
          ) {
            why.add(
              `Explicit contour group ${ordinal} has an invalid local loop at side ${side} slot ${slot}`,
            );
            continue;
          }
          if (seen[side].has(id))
            why.add(
              `Explicit contour group ${ordinal} repeats local loop ${side}:${id}`,
            );
          else {
            seen[side].add(id);
            ids[side].push(id);
          }
          const uses: Set<number> = owners[side].get(id) ?? new Set();
          uses.add(ordinal);
          owners[side].set(id, uses);
        }
      }
      if (group?.supported && ids[0].length + ids[1].length === 0)
        why.add(`Explicit contour group ${ordinal} has no usable incidence`);
      groups.push({
        before: ids[0],
        after: ids[1],
        supported: group?.supported === true,
        reason: typeof group?.reason === "string" ? group.reason : null,
      });
    }
    for (const side of [0, 1] as const)
      for (const [id, uses] of owners[side])
        if (uses.size > 1)
          for (const ordinal of uses)
            reasons[ordinal].add(
              `Explicit contour local loop ${side}:${id} belongs to conflicting groups`,
            );
    for (let ordinal: number = 0; ordinal < groups.length; ordinal++)
      if (reasons[ordinal].size) {
        groups[ordinal].supported = false;
        groups[ordinal].reason = [...reasons[ordinal]].join("; ");
      }
    const missing: [number[], number[]] = [[], []];
    for (const side of [0, 1] as const)
      for (let id: number = 0; id < props.rings[k - 1 + side].length; id++)
        if (!owners[side].has(id)) missing[side].push(id);
    if (missing[0].length || missing[1].length)
      groups.push({
        before: missing[0],
        after: missing[1],
        supported: false,
        reason:
          "Explicit contour incidence omits saved loops; no continuation is inferred",
      });
    result.set(k, {
      beforeMm: interval.beforeMm,
      afterMm: interval.afterMm,
      groups,
    });
  }
  for (let k: number = 1; k < props.slices.length; k++)
    if (!result.has(k))
      result.set(
        k,
        unprocessed(
          k,
          "Explicit contour interval is missing; no continuation is inferred",
        ),
      );
  for (const k of duplicated)
    result.set(
      k,
      unprocessed(k, "Explicit contour interval is declared more than once"),
    );
  for (const event of props.declaredEvents) {
    const k: number = props.slices.findIndex(
      (section: Slice): boolean => section.y === event.afterMm,
    );
    if (k < 1 || props.slices[k - 1].y !== event.beforeMm)
      throw new Error(
        "Explicit contour events require adjacent saved brackets",
      );
  }
  return result;
}
