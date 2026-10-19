import type { IAutoMovieRecoveryDomainLedger } from "../IAutoMovieRecoveryDomainLedger";
import { describeRecoveryNamedDomains } from "./describeRecoveryNamedDomains";
import { readRecoveryMetadata as read } from "./readRecoveryMetadata";
import type { realizeAutoMovieRecoveryTensorFamilies } from "./realizeAutoMovieRecoveryTensorFamilies";
import type { reconstructRecovery } from "./reconstructRecovery";

/**
 * Bind declared saved-domain identities to actual returned ownership records.
 * The legacy explicit planner retains original group order and appends diagnostics.
 * Exact unique scalar brackets map its ranges to original declared interval ordinals.
 * Missing admission observations and ambiguous per-group analytic ranges stay unknown.
 * No mesh position, normal or triangle is changed by this record assembly.
 *
 * @evidence contracts/common.md#principled-implementation Exact interval/group ordinals bind retained contour ranges; named tensor and analytic reports bind their own parts and declared delegations without positional inference.
 * @evidence contracts/common.md#clear-and-simple-design One metadata producer exposes lifecycle observations while each numerical owner keeps its existing output and qualification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreported admission remains null, delegated groups do not borrow their owner's whole triangle range, and legacy unresolved reasons are not guessed onto equally sized groups.
 * @evidence contracts/common.md#meaningful-documentation States exact unique interval addressing, unknown stages, delegation and absence of geometric changes.
 * @evidence contracts/performance.md#efficient-algorithms Maps index S saved sections, R actual contour ranges and G reports once; member assembly costs O(S+G+R+C) for saved sections, declared groups, ranges and curve references, with O(S+G+R+C) storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The original operator reports supply observed stages and emitted ranges; no numerical generation or mesh scan is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local indexes expire after returning the ledger; outputs own metadata only and hold no mesh buffers or external resources.
 */
export function describeRecoveryDomains(
  input: realizeAutoMovieRecoveryTensorFamilies.Input,
  result: ReturnType<typeof reconstructRecovery>,
): IAutoMovieRecoveryDomainLedger {
  type Member = IAutoMovieRecoveryDomainLedger["members"][number];
  const named: ReturnType<typeof describeRecoveryNamedDomains> =
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
      !Array.isArray(owner.groups) ||
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
    if (!Array.isArray(slab.groups)) {
      diagnostics.push(
        `Interval ${interval} group inventory is unavailable; no membership is inferred`,
      );
      continue;
    }
    for (const [group, declared] of slab.groups.entries()) {
      const key: string = `${interval}:${group}`;
      const emitted: Member["emitted"] = ranges.get(key) ?? [];
      const delegatedTo: string | null = owners.get(key) ?? null;
      const beforeSection: (typeof input.loft.sections)[number] | undefined =
        savedSections.get(slab.beforeMm);
      const afterSection: (typeof input.loft.sections)[number] | undefined =
        savedSections.get(slab.afterMm);
      const curves: string[] = [];
      const reason: unknown = read(declared, ["reason"]);
      const local: string[] = typeof reason === "string" ? [reason] : [];
      for (const side of [0, 1] as const) {
        const ids: unknown = read(declared, [side === 0 ? "before" : "after"]);
        const section: typeof beforeSection =
          side === 0 ? beforeSection : afterSection;
        if (!Array.isArray(ids)) {
          local.push(
            `Declared side ${side} incidence is unavailable; no coefficient identity is inferred`,
          );
          diagnostics.push(
            `Closed group ${interval}:${group} side ${side} has unknown incidence metadata`,
          );
          continue;
        }
        for (const loop of ids) {
          const name: unknown =
            typeof loop === "number" && Number.isSafeInteger(loop) && loop >= 0
              ? read(section?.loops[loop], ["curve", "name"])
              : undefined;
          if (typeof name === "string" && name.length > 0) curves.push(name);
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
            : read(declared, ["supported"]) === false
              ? false
              : emitted.length > 0
                ? true
                : null,
        admitted:
          delegatedTo !== null || emitted.length > 0
            ? true
            : read(declared, ["supported"]) === false
              ? false
              : null,
        delegatedTo,
        emitted,
        written: "not-performed",
        loaded: "not-performed",
        diagnostics: local,
      });
    }
  }
  for (const [section, report] of input.reports.entries()) {
    const open: unknown = read(report, ["open"]);
    if (!Array.isArray(open)) {
      diagnostics.push(
        `Section ${section} open-course inventory is unavailable`,
      );
      continue;
    }
    for (const [arc, observed] of open.entries()) {
      const name: unknown = read(observed, ["curve", "name"]);
      members.push({
        id: `open-course:${section}:${arc}`,
        kind: "open-course",
        address: null,
        curves: typeof name === "string" && name.length > 0 ? [name] : [],
        attempted: false,
        admitted: false,
        delegatedTo: null,
        emitted: [],
        written: "not-performed",
        loaded: "not-performed",
        diagnostics: [
          "This contour-only memory operation does not consume the separate open-continuation graph",
          ...(typeof name === "string" && name.length > 0
            ? []
            : ["The observed open course has no saved coefficient identity"]),
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
      if (Array.isArray(groups))
        for (const group of groups) {
          const ids: unknown = read(group, [side === 0 ? "before" : "after"]);
          if (Array.isArray(ids))
            for (const ordinal of ids)
              if (
                typeof ordinal === "number" &&
                Number.isSafeInteger(ordinal) &&
                ordinal >= 0
              )
                claimed.add(ordinal);
        }
      for (const [loop, saved] of section.loops.entries()) {
        const name: unknown = read(saved, ["curve", "name"]);
        if (!claimed.has(loop))
          members.push({
            id: `unassigned-boundary:${interval}:${side}:${loop}`,
            kind: "unassigned-boundary",
            address: null,
            curves: typeof name === "string" && name.length > 0 ? [name] : [],
            attempted: null,
            admitted: false,
            delegatedTo: null,
            emitted: [],
            written: "not-performed",
            loaded: "not-performed",
            diagnostics: [
              "No unique declared adjacent group owns this saved boundary occurrence",
              ...(typeof name === "string" && name.length > 0
                ? []
                : ["The saved boundary has no coefficient identity"]),
            ],
          });
      }
    }
  }
  return {
    schema: "automovie-recovery-domain-ledger-v1",
    members,
    unattributed,
    diagnostics,
  };
}
