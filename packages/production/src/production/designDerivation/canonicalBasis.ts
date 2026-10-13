import type { IAutoMovieDesignDerivationDependency } from "./IAutoMovieDesignDerivationDependency";
import { compareCodeUnits } from "../contentIdentity";
import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import { assertRelativePath } from "./assertRelativePath";
import { assertIdentity } from "./assertIdentity";
import { assertDigest } from "./assertDigest";

/**
 * Validate declared basis scalars and sort copied dependency records by path.
 *
 * @evidence contracts/common.md#principled-implementation Requires protocol equality, nonblank identities, project-relative POSIX paths and SHA-256 spelling, then rejects duplicate dependency paths after code-unit sorting.
 * @evidence contracts/common.md#clear-and-simple-design One basis validator serves acquisition, digesting, candidate staging and manifest inspection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Checks declared values only, not actual module resolution, tool execution or bytes; shallow spreads preserve extra fields and no deep immutability or complete ingress schema is certified.
 * @evidence contracts/common.md#meaningful-documentation Documents lexical path/scalar admission, copied nested metadata and the source reader's separate authority.
 * @evidence contracts/performance.md#efficient-algorithms Copies d dependencies, sorts in O(d log d) comparisons and scans identity/path/digest text; temporary storage is proportional to supplied metadata.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-call memo exists; every basis receives current validation even when it resembles an earlier object.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Copied declared metadata belongs to the caller's returned basis. Shallow spreads also preserve runtime extra fields, which can retain opaque caller values; no handle is acquired or independently retired here.
 */
export function canonicalBasis(
  basis: IAutoMovieDesignDerivationBasis,
): IAutoMovieDesignDerivationBasis {
  if (basis.protocol !== AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL)
    throw new Error(`Unsupported design basis protocol "${basis.protocol}".`);
  assertIdentity("production", basis.production);
  assertIdentity("target", basis.target);
  assertRelativePath(basis.recordPath);
  assertRelativePath(basis.emitter.path);
  assertDigest("emitter", basis.emitter.digest);
  assertRelativePath(basis.source.path);
  assertIdentity("source export", basis.source.export);
  if (basis.source.selector !== null)
    assertIdentity("source selector", basis.source.selector);
  assertIdentity("production tool version", basis.tool.production);
  assertIdentity("TypeScript tool version", basis.tool.typescript);
  assertIdentity("Node.js tool version", basis.tool.node);
  const dependencies: IAutoMovieDesignDerivationDependency[] = [...basis.dependencies]
    .map((dependency: IAutoMovieDesignDerivationDependency): IAutoMovieDesignDerivationDependency => ({ ...dependency }))
    .sort((left: IAutoMovieDesignDerivationDependency, right: IAutoMovieDesignDerivationDependency): number => compareCodeUnits(left.path, right.path));
  if (
    new Set(dependencies.map((entry: IAutoMovieDesignDerivationDependency): string => entry.path)).size !==
    dependencies.length
  )
    throw new Error(
      `Design target "${basis.target}" repeats a dependency path.`,
    );
  for (const dependency of dependencies) {
    assertRelativePath(dependency.path);
    assertDigest("dependency", dependency.digest);
  }
  return {
    ...basis,
    emitter: { ...basis.emitter },
    source: { ...basis.source },
    dependencies,
    tool: { ...basis.tool },
  };
}
