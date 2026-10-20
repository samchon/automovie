import type { IAutoMovieRecoveryTensorFamiliesInput } from "../structures/domain/IAutoMovieRecoveryTensorFamiliesInput";
import type { IAutoMovieRecoveryDomainLedger } from "../structures/domain/IAutoMovieRecoveryDomainLedger";
import { readRecoveryMetadata as read } from "./readRecoveryMetadata";
import type { reconstructRecovery } from "./reconstructRecovery";

/**
 * Bind planned named domains only to unique actual reports with the same identity.
 * Repeated or missing names keep admission and generation unknown, even if an
 * operator report exists at the same array ordinal. All original reports and
 * geometry stay in the reconstruction result, including unbound observations.
 *
 * @evidence contracts/common.md#principled-implementation Exact unique declared and reported IDs bind lifecycle stages; original ordinals identify planned occurrences without positional report matching.
 * @evidence contracts/common.md#clear-and-simple-design One assembly pass handles tensor and analytic metadata while their operators retain all numerical and admission authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ambiguous reports never delegate a group or lend emitted ranges to another declaration; missing names and malformed ports remain diagnostic unknowns.
 * @evidence contracts/common.md#meaningful-documentation Documents exact identity binding, retained original reports and unknown observations.
 * @evidence contracts/performance.md#efficient-algorithms Name maps cost O(D+R), and port, address and range traversal costs O(P+A+T); retained maps and metadata use the same linear bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Published reports supply actual emitted ranges once; no geometry is evaluated or regenerated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local name and binding maps expire on return; returned metadata owns strings and ranges without retaining mesh buffers.
 */
export function describeRecoveryNamedDomains(
  input: IAutoMovieRecoveryTensorFamiliesInput,
  result: ReturnType<typeof reconstructRecovery>,
): {
  members: IAutoMovieRecoveryDomainLedger["members"];
  owners: Map<string, string>;
  diagnostics: string[];
} {
  type Member = IAutoMovieRecoveryDomainLedger["members"][number];
  const members: Member[] = [];
  const owners: Map<string, string> = new Map();
  const diagnostics: string[] = [];
  const conflicting: Set<string> = new Set();
  for (const kind of ["tensor-family", "analytic-domain"] as const) {
    const source: unknown =
      kind === "tensor-family" ? input.tensorFamilies : input.analyticDomains;
    const declarations: readonly unknown[] = Array.isArray(source)
      ? source
      : [];
    const reports: readonly unknown[] =
      kind === "tensor-family" ? result.tensorReports : result.analyticReports;
    if (source !== undefined && !Array.isArray(source))
      diagnostics.push(`${kind}: declared inventory is unavailable`);
    const declaredNames: Map<string, number[]> = new Map();
    const reportedNames: Map<string, number[]> = new Map();
    for (const [inventory, names] of [
      [declarations, declaredNames],
      [reports, reportedNames],
    ] as const)
      for (const [ordinal, item] of inventory.entries()) {
        const name: unknown = read(item, ["id"]);
        if (typeof name !== "string" || name.length === 0) continue;
        const ordinals: number[] = names.get(name) ?? [];
        ordinals.push(ordinal);
        names.set(name, ordinals);
      }
    const bound: Set<number> = new Set();
    for (const [ordinal, domain] of declarations.entries()) {
      const name: unknown = read(domain, ["id"]);
      const matches: number[] | undefined =
        typeof name === "string" ? reportedNames.get(name) : undefined;
      const reportOrdinal: number | undefined =
        typeof name === "string" &&
        declaredNames.get(name)?.length === 1 &&
        matches?.length === 1
          ? matches[0]
          : undefined;
      const report: unknown =
        reportOrdinal === undefined ? undefined : reports[reportOrdinal];
      const id: string = `${kind}:${ordinal}${typeof name === "string" && name.length > 0 ? `:${name}` : ""}`;
      const local: string[] = [];
      if (reportOrdinal === undefined)
        local.push(
          "No unique declared name and actual report identity bind this occurrence; stages remain unknown",
        );
      else bound.add(reportOrdinal);
      const admittedValue: unknown =
        kind === "tensor-family" && report !== undefined
          ? true
          : read(report, ["admitted"]);
      const admitted: boolean | null =
        typeof admittedValue === "boolean" ? admittedValue : null;
      const curves: string[] = [];
      const ports: unknown = read(domain, [
        kind === "tensor-family" ? "boundaries" : "ports",
      ]);
      if (!Array.isArray(ports))
        local.push("Declared curve port inventory is unavailable");
      else
        for (const port of ports) {
          const curve: unknown = read(port, ["curveName"]);
          if (typeof curve === "string" && curve.length > 0) curves.push(curve);
          else local.push("A declared port has no saved coefficient identity");
        }
      const messages: unknown = read(report, ["diagnostics"]);
      if (Array.isArray(messages))
        for (const message of messages)
          if (typeof message === "string") local.push(message);
      const emitted: Member["emitted"] = [];
      const actualRanges: unknown = read(report, ["primitiveRanges"]);
      if (typeof name === "string" && Array.isArray(actualRanges))
        for (const range of actualRanges) {
          const firstTriangle: unknown = read(range, ["firstTriangle"]);
          const triangleCount: unknown = read(range, ["triangleCount"]);
          const patch: unknown = read(range, ["patch"]);
          if (
            typeof firstTriangle === "number" &&
            Number.isSafeInteger(firstTriangle) &&
            firstTriangle >= 0 &&
            typeof triangleCount === "number" &&
            Number.isSafeInteger(triangleCount) &&
            triangleCount > 0
          )
            emitted.push({
              part: name,
              firstTriangle,
              triangleCount,
              patch: typeof patch === "string" ? patch : null,
            });
        }
      if (admitted === true) {
        const addresses: unknown =
          kind === "tensor-family"
            ? read(report, ["delegatedGroups"])
            : read(domain, ["closedGroups"]);
        if (!Array.isArray(addresses))
          local.push(
            "Admitted closed-group ownership inventory is unavailable",
          );
        else
          for (const address of addresses) {
            const interval: unknown = read(address, ["interval"]);
            const group: unknown = read(address, ["group"]);
            if (
              typeof interval !== "number" ||
              !Number.isSafeInteger(interval) ||
              interval < 0 ||
              typeof group !== "number" ||
              !Number.isSafeInteger(group) ||
              group < 0
            ) {
              local.push("A delegated closed-group address is unavailable");
              continue;
            }
            const key: string = `${interval}:${group}`;
            if (owners.has(key) || conflicting.has(key)) {
              owners.delete(key);
              conflicting.add(key);
              diagnostics.push(
                `Multiple reported owners claim closed group ${key}; delegation remains unknown`,
              );
            } else owners.set(key, id);
          }
      }
      members.push({
        id,
        kind,
        address: null,
        curves,
        attempted: admitted === true ? true : null,
        admitted,
        delegatedTo: null,
        emitted,
        diagnostics: local,
      });
    }
    for (const [ordinal, report] of reports.entries())
      if (!bound.has(ordinal)) {
        const name: unknown = read(report, ["id"]);
        diagnostics.push(
          `${kind} report ${ordinal} (${typeof name === "string" ? name : "unknown identity"}) has no unique declared owner; the original report and geometry remain retained`,
        );
      }
  }
  return { members, owners, diagnostics };
}
