import type {
  IAutoMovieRecoveryAtlasPrimitiveRange,
  IAutoMovieRecoveryDomainAddress,
  IAutoMovieRecoveryDomainLedger,
  IAutoMovieRecoveryNamedDomainsDescriptionOperation,
} from "@automovie/interface";

/*
 * Bind planned named domains only to unique actual reports with the same
 * identity. Repeated or missing names keep admission and generation unknown,
 * even if an operator report exists at the same array ordinal. All original
 * reports and geometry stay in the reconstruction result, including unbound
 * observations.
 */
export function describeRecoveryNamedDomains(
  input: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[0],
  result: Parameters<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation>[1],
): ReturnType<IAutoMovieRecoveryNamedDomainsDescriptionOperation.Operation> {
  type Member = IAutoMovieRecoveryDomainLedger["members"][number];
  const members: Member[] = [];
  const owners: Map<string, string> = new Map();
  const diagnostics: string[] = [];
  const conflicting: Set<string> = new Set();
  const inventories: readonly {
    kind: "tensor-family" | "analytic-domain";
    declarations: readonly IDeclared[];
    reports: readonly IReported[];
  }[] = [
    {
      kind: "tensor-family",
      declarations: (input.tensorFamilies ?? []).map(
        (family): IDeclared => ({
          id: family.id,
          curves: family.boundaries.map(
            (boundary): string => boundary.curveName,
          ),
          closedGroups: null,
        }),
      ),
      reports: result.tensorReports.map(
        (report): IReported => ({
          id: report.id,
          admitted: true,
          delegatedGroups: report.delegatedGroups,
          diagnostics: report.diagnostics,
          primitiveRanges: report.primitiveRanges,
        }),
      ),
    },
    {
      kind: "analytic-domain",
      declarations: (input.analyticDomains ?? []).map(
        (domain): IDeclared => ({
          id: domain.id,
          curves: domain.ports.map((port): string => port.curveName),
          closedGroups: domain.closedGroups,
        }),
      ),
      reports: result.analyticReports.map(
        (report): IReported => ({
          id: report.id,
          admitted: report.admitted,
          delegatedGroups: null,
          diagnostics: report.diagnostics,
          primitiveRanges: report.primitiveRanges,
        }),
      ),
    },
  ];
  for (const { kind, declarations, reports } of inventories) {
    const declaredNames: Map<string, number[]> = new Map();
    const reportedNames: Map<string, number[]> = new Map();
    for (const [inventory, names] of [
      [declarations, declaredNames],
      [reports, reportedNames],
    ] as const)
      for (const [ordinal, item] of inventory.entries()) {
        const ordinals: number[] = names.get(item.id) ?? [];
        ordinals.push(ordinal);
        names.set(item.id, ordinals);
      }
    const bound: Set<number> = new Set();
    for (const [ordinal, domain] of declarations.entries()) {
      const matches: number[] | undefined = reportedNames.get(domain.id);
      const reportOrdinal: number | undefined =
        declaredNames.get(domain.id)?.length === 1 && matches?.length === 1
          ? matches[0]
          : undefined;
      const report: IReported | undefined =
        reportOrdinal === undefined ? undefined : reports[reportOrdinal];
      const id: string = `${kind}:${ordinal}:${domain.id}`;
      const local: string[] = [];
      if (reportOrdinal === undefined)
        local.push(
          "No unique declared name and actual report identity bind this occurrence; stages remain unknown",
        );
      else bound.add(reportOrdinal);
      const admitted: boolean | null = report?.admitted ?? null;
      if (report !== undefined) local.push(...report.diagnostics);
      const emitted: Member["emitted"] = (report?.primitiveRanges ?? [])
        .filter(
          (range: IAutoMovieRecoveryAtlasPrimitiveRange): boolean =>
            range.firstTriangle >= 0 && range.triangleCount > 0,
        )
        .map(
          (
            range: IAutoMovieRecoveryAtlasPrimitiveRange,
          ): Member["emitted"][number] => ({
            part: domain.id,
            firstTriangle: range.firstTriangle,
            triangleCount: range.triangleCount,
            patch: range.patch,
          }),
        );
      if (admitted === true)
        for (const address of report?.delegatedGroups ??
          domain.closedGroups ??
          []) {
          if (address.interval < 0 || address.group < 0) {
            local.push("A delegated closed-group address is unavailable");
            continue;
          }
          const key: string = `${address.interval}:${address.group}`;
          if (owners.has(key) || conflicting.has(key)) {
            owners.delete(key);
            conflicting.add(key);
            diagnostics.push(
              `Multiple reported owners claim closed group ${key}; delegation remains unknown`,
            );
          } else owners.set(key, id);
        }
      members.push({
        id,
        kind,
        address: null,
        curves: [...domain.curves],
        attempted: admitted === true ? true : null,
        admitted,
        delegatedTo: null,
        emitted,
        diagnostics: local,
      });
    }
    for (const [ordinal, report] of reports.entries())
      if (!bound.has(ordinal))
        diagnostics.push(
          `${kind} report ${ordinal} (${report.id}) has no unique declared owner; the original report and geometry remain retained`,
        );
  }
  return { members, owners, diagnostics };
}

/*
 * One planned named domain, read from either declaration kind.
 */
interface IDeclared {
  id: string;
  curves: readonly string[];
  closedGroups: readonly IAutoMovieRecoveryDomainAddress[] | null;
}

/*
 * One actual report, read from either report kind.
 */
interface IReported {
  id: string;
  admitted: boolean;
  delegatedGroups: readonly IAutoMovieRecoveryDomainAddress[] | null;
  diagnostics: readonly string[];
  primitiveRanges: readonly IAutoMovieRecoveryAtlasPrimitiveRange[];
}
