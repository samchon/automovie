import type { IAutoMovieRecoveryDomainLedger } from "../IAutoMovieRecoveryDomainLedger";
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
 * @evidence contracts/performance.md#efficient-algorithms Maps index R actual contour ranges and G reports once; member assembly costs O(G+R+C) for declared groups, ranges and curve references, with O(G+R+C) output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The original engine reports supply observed stages and emitted ranges; no numerical generation or mesh scan is repeated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local indexes expire after returning the ledger; outputs own metadata only and hold no mesh buffers or external resources.
 */
export function describeRecoveryDomains(
  input: realizeAutoMovieRecoveryTensorFamilies.Input,
  result: ReturnType<typeof reconstructRecovery>,
): IAutoMovieRecoveryDomainLedger {
  type Member = IAutoMovieRecoveryDomainLedger["members"][number];
  const members: Member[] = [];
  const owners: Map<string, string> = new Map();
  const ranges: Map<string, Member["emitted"]> = new Map();
  const intervals: Map<string, number[]> = new Map();
  const savedSections: Map<number, (typeof input.loft.sections)[number]> = new Map(
    input.loft.sections.map((section: (typeof input.loft.sections)[number]): [number, typeof section] => [section.coordinateMm, section]),
  );
  const unattributed: IAutoMovieRecoveryDomainLedger["unattributed"] = [];
  for (const [ordinal, interval] of (input.loft.intervals ?? []).entries()) {
    const key: string = JSON.stringify([interval.beforeMm, interval.afterMm]);
    const owners: number[] = intervals.get(key) ?? [];
    owners.push(ordinal);
    intervals.set(key, owners);
  }
  for (const range of result.primitiveRanges) {
    const declared: number[] | undefined = intervals.get(JSON.stringify([range.beforeMm, range.afterMm]));
    const owner: NonNullable<typeof input.loft.intervals>[number] | undefined = declared?.length === 1 ? input.loft.intervals?.[declared[0]!] : undefined;
    if (owner === undefined || owner.groups[range.group] === undefined) {
      unattributed.push({ part: "recovery.curve-loft", firstTriangle: range.firstTriangle, triangleCount: range.triangleCount, beforeMm: range.beforeMm, afterMm: range.afterMm, group: range.group });
      continue;
    }
    const interval: number = declared[0]!;
    const key: string = `${interval}:${range.group}`;
    const list: Member["emitted"] = ranges.get(key) ?? [];
    list.push({ part: "recovery.curve-loft", firstTriangle: range.firstTriangle, triangleCount: range.triangleCount, patch: null });
    ranges.set(key, list);
  }
  for (const [ordinal, report] of result.tensorReports.entries()) {
    const id: string = `tensor-family:${ordinal}:${report.id}`;
    for (const address of report.delegatedGroups) owners.set(`${address.interval}:${address.group}`, id);
    members.push({ id, kind: "tensor-family", address: null, curves: report.endCurves.slice(), attempted: true, admitted: true, delegatedTo: null,
      emitted: report.primitiveRanges.filter((range: (typeof report.primitiveRanges)[number]): boolean => range.triangleCount > 0).map((range: (typeof report.primitiveRanges)[number]): Member["emitted"][number] => ({ part: report.id, firstTriangle: range.firstTriangle, triangleCount: range.triangleCount, patch: range.patch })),
      written: "not-performed", loaded: "not-performed", diagnostics: report.diagnostics.slice() });
  }
  for (const [ordinal, report] of result.analyticReports.entries()) {
    const id: string = `analytic-domain:${ordinal}:${report.id}`;
    const domain: NonNullable<typeof input.analyticDomains>[number] | undefined = input.analyticDomains?.[ordinal];
    if (report.admitted && domain) for (const address of domain.closedGroups) owners.set(`${address.interval}:${address.group}`, id);
    members.push({ id, kind: "analytic-domain", address: null, curves: domain?.ports.map((port: NonNullable<typeof domain>["ports"][number]): string => port.curveName) ?? [], attempted: report.admitted, admitted: report.admitted, delegatedTo: null,
      emitted: report.primitiveRanges.filter((range: (typeof report.primitiveRanges)[number]): boolean => range.triangleCount > 0).map((range: (typeof report.primitiveRanges)[number]): Member["emitted"][number] => ({ part: report.id, firstTriangle: range.firstTriangle, triangleCount: range.triangleCount, patch: range.patch })),
      written: "not-performed", loaded: "not-performed", diagnostics: report.diagnostics.slice() });
  }
  for (const [interval, slab] of (input.loft.intervals ?? []).entries())
    for (const [group, declared] of slab.groups.entries()) {
      const key: string = `${interval}:${group}`;
      const emitted: Member["emitted"] = ranges.get(key) ?? [];
      const delegatedTo: string | null = owners.get(key) ?? null;
      const beforeSection: (typeof input.loft.sections)[number] | undefined = savedSections.get(slab.beforeMm);
      const afterSection: (typeof input.loft.sections)[number] | undefined = savedSections.get(slab.afterMm);
      const curves: string[] = [
        ...declared.before.map((loop: number): string => beforeSection?.loops[loop]?.curve.name ?? `unresolved-before:${loop}`),
        ...declared.after.map((loop: number): string => afterSection?.loops[loop]?.curve.name ?? `unresolved-after:${loop}`),
      ];
      members.push({ id: `closed-group:${interval}:${group}`, kind: "closed-group", address: { interval, group }, curves,
        attempted: delegatedTo !== null ? null : !declared.supported ? false : emitted.length > 0 ? true : null,
        admitted: delegatedTo !== null || emitted.length > 0 ? true : !declared.supported ? false : null,
        delegatedTo, emitted, written: "not-performed", loaded: "not-performed",
        diagnostics: declared.reason === null ? [] : [declared.reason] });
    }
  for (const [section, report] of input.reports.entries())
    for (const [arc, observed] of report.open.entries())
      members.push({ id: `open-course:${section}:${arc}`, kind: "open-course", address: null, curves: [observed.curve.name], attempted: false, admitted: false,
        delegatedTo: null, emitted: [], written: "not-performed", loaded: "not-performed",
        diagnostics: ["This contour-only memory operation does not consume the separate open-continuation graph"] });
  for (let interval: number = 0; interval + 1 < input.loft.sections.length; interval++) {
    const before: (typeof input.loft.sections)[number] = input.loft.sections[interval]!;
    const after: (typeof input.loft.sections)[number] = input.loft.sections[interval + 1]!;
    const declared: number[] | undefined = intervals.get(JSON.stringify([before.coordinateMm, after.coordinateMm]));
    for (const side of [0, 1] as const) {
      const section: typeof before = side === 0 ? before : after;
      const claimed: Set<number> = new Set();
      if (declared?.length === 1)
        for (const group of input.loft.intervals![declared[0]!]!.groups)
          for (const ordinal of side === 0 ? group.before : group.after) claimed.add(ordinal);
      for (const [loop, saved] of section.loops.entries())
        if (!claimed.has(loop)) members.push({ id: `unassigned-boundary:${interval}:${side}:${loop}`, kind: "unassigned-boundary", address: null, curves: [saved.curve.name], attempted: null, admitted: false, delegatedTo: null, emitted: [], written: "not-performed", loaded: "not-performed", diagnostics: ["No unique declared adjacent group owns this saved boundary occurrence"] });
    }
  }
  return { schema: "automovie-recovery-domain-ledger-v1", members, unattributed };
}
