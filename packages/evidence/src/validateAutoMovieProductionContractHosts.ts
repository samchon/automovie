import type { AutoMovieProductionContractLayer } from "./AutoMovieProductionContractLayer";
import type { AutoMovieProductionContractPass } from "./AutoMovieProductionContractPass";
import { requirePositivePopulation } from "./requirePositivePopulation";

/**
 * Admit native host selectors against their declared local authored pass.
 *
 * Constructors and binding admission share this boundary so an edited native claim cannot retain final metadata while selecting construction hosts.
 *
 * @evidence contracts/common.md#principled-implementation Require the docs root and a positive normalized population confined to the declared construction or final screenplay pass.
 * @evidence contracts/common.md#clear-and-simple-design Constructors and later binding admission share the same host-selector boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative selectors are permitted with positive ownership, while absolute paths, traversal and wrong-layer prefixes are rejected.
 * @evidence contracts/common.md#meaningful-documentation The pass selects final/screenplays only for naturalness; this validates selector form rather than resident content.
 * @evidence contracts/performance.md#efficient-algorithms Admission scans every selector and its path components, with linear string work and temporary duplicate tracking.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared positive-population validator supplies consistent duplicate and emptiness rules.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains input selectors; component arrays and sets are released on return or throw.
 */
export function validateAutoMovieProductionContractHosts(props: {
  /** Required docs host root, with undefined rejected at this boundary. */
  root: string | undefined;
  /** Ordered positive or negative host glob selectors. */
  files: readonly string[];
  /** Authored branch allowed to own these selectors. */
  layer: AutoMovieProductionContractLayer;
  /** Construction or final screenplay naturalness host population. */
  pass: AutoMovieProductionContractPass;
}): void {
  if (props.root !== "docs")
    throw new Error(
      "An AutoMovie-bound local principle requires the docs host root.",
    );
  requirePositivePopulation(props.files, "host");
  for (const file of props.files)
    validateHostPattern(props.layer, props.pass, file);
}

/** Keep one host glob normalized and confined to its declared authored layer. */
function validateHostPattern(
  layer: AutoMovieProductionContractLayer,
  pass: AutoMovieProductionContractPass,
  pattern: string,
): void {
  const file: string = pattern.replace(/^!/u, "");
  const prefix: string = pass === "naturalness" ? "final/screenplays/" : `${layer}/`;
  if (
    file.includes("\\") ||
    file.startsWith("/") ||
    /^[A-Za-z]:/u.test(file) ||
    file
      .split("/")
      .some((part: string): boolean => part === "" || part === "." || part === "..") ||
    !file.startsWith(prefix)
  )
    throw new Error(
      `A production-local contract claim for ${pass} ${layer} contains a host outside ${prefix}.`,
    );
}
