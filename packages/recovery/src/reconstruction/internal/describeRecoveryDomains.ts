import type {
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryDomainsDescriptionOperation,
  IAutoMovieRecoveryNamedDomainsDescriptionOperation,
} from "@automovie/interface";

import { describeRecoveryNamedDomains } from "./describeRecoveryNamedDomains";

/*
 * Bind declared saved-domain identities to actual returned ownership records.
 * The legacy explicit planner retains original group order and appends
 * diagnostics. Exact unique scalar brackets map its ranges to original declared
 * interval ordinals. Missing admission observations and ambiguous per-group
 * analytic ranges stay unknown. No mesh position, normal or triangle is changed
 * by this record assembly.
 */
export function describeRecoveryDomains(
  input: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[0],
  result: Parameters<IAutoMovieRecoveryDomainsDescriptionOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryDomainsDescriptionOperation.Operation> {
  type Member = IAutoMovieRecoveryDomainLedger["members"][number];
  const named: ReturnType<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation> =
    describeRecoveryNamedDomains(input, result);
  const members: Member[] = named.members;
  const owners: Map<string, string> = named.owners;
  const diagnostics: string[] = named.diagnostics;
  const ranges: Map<string, Member["emitted"]> = new Map();
  const intervals: Map<string, number[]> = new Map();
  const savedSections: Map<number, (typeof input.loft.sections)[number]> =
    new Map(
      input.loft.sections.map(
        (
          section: (typeof input.loft.sections)[number],
        ): [number, typeof section] => [section.coordinateMm, section],
      ),
    );
  const unattributed: IAutoMovieRecoveryDomainLedger["unattributed"] = [];
  for (const [ordinal, interval] of (input.loft.intervals ?? []).entries()) {
    const key: string = JSON.stringify([interval.beforeMm, interval.afterMm]);
    const owners: number[] = intervals.get(key) ?? [];
    owners.push(ordinal);
    intervals.set(key, owners);
  }
  for (const range of result.primitiveRanges) {
    const declared: number[] | undefined = intervals.get(
      JSON.stringify([range.beforeMm, range.afterMm]),
    );
    const interval: number | undefined =
      declared?.length === 1 ? declared[0] : undefined;
    const owner: NonNullable<typeof input.loft.intervals>[number] | undefined =
      interval === undefined ? undefined : input.loft.intervals?.[interval];
    if (
      interval === undefined ||
      owner === undefined ||
      owner.groups[range.group] === undefined
    ) {
      unattributed.push({
        part: "recovery.curve-loft",
        firstTriangle: range.firstTriangle,
        triangleCount: range.triangleCount,
        beforeMm: range.beforeMm,
        afterMm: range.afterMm,
        group: range.group,
      });
      continue;
    }
    const key: string = `${interval}:${range.group}`;
    const list: Member["emitted"] = ranges.get(key) ?? [];
    list.push({
      part: "recovery.curve-loft",
      firstTriangle: range.firstTriangle,
      triangleCount: range.triangleCount,
      patch: null,
    });
    ranges.set(key, list);
  }
  for (const [interval, slab] of (input.loft.intervals ?? []).entries()) {
    for (const [group, declared] of slab.groups.entries()) {
      const key: string = `${interval}:${group}`;
      const emitted: Member["emitted"] = ranges.get(key) ?? [];
      const delegatedTo: string | null = owners.get(key) ?? null;
      const beforeSection: (typeof input.loft.sections)[number] | undefined =
        savedSections.get(slab.beforeMm);
      const afterSection: (typeof input.loft.sections)[number] | undefined =
        savedSections.get(slab.afterMm);
      const curves: string[] = [];
      const local: string[] = declared.reason === null ? [] : [declared.reason];
      for (const side of [0, 1] as const) {
        const ids: readonly number[] =
          side === 0 ? declared.before : declared.after;
        const section: typeof beforeSection =
          side === 0 ? beforeSection : afterSection;
        for (const loop of ids) {
          const name: string | undefined = section?.loops[loop]?.curve.name;
          if (name !== undefined) curves.push(name);
          else {
            local.push(
              `Declared side ${side} has a loop without a saved coefficient identity`,
            );
            diagnostics.push(
              `Closed group ${interval}:${group} side ${side} has an unknown coefficient identity`,
            );
          }
        }
      }
      members.push({
        id: `closed-group:${interval}:${group}`,
        kind: "closed-group",
        address: { interval, group },
        curves,
        attempted:
          delegatedTo !== null
            ? null
            : declared.supported === false
              ? false
              : emitted.length > 0
                ? true
                : null,
        admitted:
          delegatedTo !== null || emitted.length > 0
            ? true
            : declared.supported === false
              ? false
              : null,
        delegatedTo,
        emitted,
        diagnostics: local,
      });
    }
  }
  for (const [section, report] of input.reports.entries()) {
    for (const [arc, observed] of report.open.entries()) {
      const name: string = observed.curve.name;
      members.push({
        id: `open-course:${section}:${arc}`,
        kind: "open-course",
        address: null,
        curves: [name],
        attempted: false,
        admitted: false,
        delegatedTo: null,
        emitted: [],
        diagnostics: [
          "This contour-only memory operation does not consume the separate open-continuation graph",
        ],
      });
    }
  }
  for (
    let interval: number = 0;
    interval + 1 < input.loft.sections.length;
    interval++
  ) {
    const before: (typeof input.loft.sections)[number] =
      input.loft.sections[interval]!;
    const after: (typeof input.loft.sections)[number] =
      input.loft.sections[interval + 1]!;
    const declared: number[] | undefined = intervals.get(
      JSON.stringify([before.coordinateMm, after.coordinateMm]),
    );
    for (const side of [0, 1] as const) {
      const section: typeof before = side === 0 ? before : after;
      const claimed: Set<number> = new Set();
      const groups:
        | NonNullable<typeof input.loft.intervals>[number]["groups"]
        | undefined =
        declared?.length === 1
          ? input.loft.intervals?.[declared[0]!]?.groups
          : undefined;
      for (const group of groups ?? [])
        for (const ordinal of side === 0 ? group.before : group.after)
          claimed.add(ordinal);
      for (const [loop, saved] of section.loops.entries()) {
        const name: string = saved.curve.name;
        if (!claimed.has(loop))
          members.push({
            id: `unassigned-boundary:${interval}:${side}:${loop}`,
            kind: "unassigned-boundary",
            address: null,
            curves: [name],
            attempted: null,
            admitted: false,
            delegatedTo: null,
            emitted: [],
            diagnostics: [
              "No unique declared adjacent group owns this saved boundary occurrence",
            ],
          });
      }
    }
  }
  return {
    members,
    unattributed,
    diagnostics,
  };
}
