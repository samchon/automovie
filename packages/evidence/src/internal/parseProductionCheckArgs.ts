import type { AuthoredLayer } from "../narrative/AuthoredLayer";
import type { IProductionGateKey } from "../narrative/IProductionGateKey";
import type { ProductionGatePass } from "../narrative/ProductionGatePass";

/**
 * Parses the two required narrative pass flags without reading process globals.
 *
 * @evidence contracts/common.md#principled-implementation Exactly one layer and pass flag must each be followed by a supported closed-union value; malformed and extra arguments throw before graph evaluation.
 * @evidence contracts/common.md#clear-and-simple-design Argument validation is separate from the command's native evaluation and reporting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only the documented layer/pass values and optional argument separator are accepted; no host or fixture exception changes parsing.
 * @evidence contracts/common.md#meaningful-documentation The comment states the required flags, lack of process access and error boundary; the returned gate type names the supported values.
 * @evidence contracts/performance.md#efficient-algorithms Scans the argument vector a fixed number of times in linear time, retaining one filtered vector and one two-field result.
 * @evidence contracts/performance.md#reuse-equivalent-work Arguments are supplied once per invocation and cheap to validate; no prior process state or cached parse is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned key survives the call; no handles, tasks, or global arguments are retained.
 */
export function parseProductionCheckArgs(args: string[]): IProductionGateKey {
  const values: string[] = args.filter(
    (value: string): boolean => value !== "--",
  );
  const layer: string | undefined = values[values.indexOf("--layer") + 1];
  const pass: string | undefined = values[values.indexOf("--pass") + 1];
  if (
    values.length !== 4 ||
    values.filter((value: string): boolean => value === "--layer").length !==
      1 ||
    values.filter((value: string): boolean => value === "--pass").length !==
      1 ||
    !["settings", "treatments", "scripts", "screenplay"].includes(
      layer ?? "",
    ) ||
    !["construction", "naturalness"].includes(pass ?? "")
  )
    throw new Error(
      "Usage: npm run production:check -- --layer <settings|treatments|scripts|screenplay> --pass <construction|naturalness>",
    );
  return { layer: layer as AuthoredLayer, pass: pass as ProductionGatePass };
}
