import type { IAutoMovieDesignDerivationDependency } from "./IAutoMovieDesignDerivationDependency";
import { digestAutoMovieBytes, normalizeAutoMovieSource } from "../contentIdentity";
import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import { AutoMovieDesignDerivationError } from "./AutoMovieDesignDerivationError";
import { canonicalBasis } from "./canonicalBasis";
import { assertRelativePath } from "./assertRelativePath";

/**
 * Record normalized source identities from a caller-supplied source inventory.
 *
 * @evidence contracts/common.md#principled-implementation Checks emitter/source paths, requires the selected source in the supplied inventory and hashes normalized emitter/input text before canonical basis validation.
 * @evidence contracts/common.md#clear-and-simple-design The source reader supplies membership while canonicalBasis owns ordering, duplicate-path and scalar identity rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This owner neither resolves a target-local import graph nor executes the selected export; the callback must supply the correct closure, and normalization intentionally ignores BOM/EOL spelling.
 * @evidence contracts/common.md#meaningful-documentation Defines supplied graph responsibility, normalized source hashing and metadata-only export/selector names.
 * @evidence contracts/performance.md#efficient-algorithms For d supplied inputs and b source bytes, normalization/hash scans b, membership/maps scan d and canonical dependency sorting adds O(d log d) comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work Calls sourceInputs anew for each capture; it retains no file cache and cannot reuse old metadata as current byte authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary normalized bytes and dependency copies live through this call; returned scalar basis data is caller-owned and no file is opened here.
 */
export function captureAutoMovieDesignDerivationBasis(props: {
  /** Production label admitted as a nonblank identity. */
  production: string;

  /** Logical target label carried into candidate matching. */
  target: string;

  /** Project-relative POSIX publication path. */
  recordPath: string;

  /** Declared emitter path and source bytes normalized before hashing. */
  emitter: { path: string; bytes: Uint8Array };

  /** Source path must occur in the supplied inventory; export/selector remain metadata. */
  source: {
    path: string;
    export: string;
    selector: string | null;
  };

  /** Fresh caller-provided inventory; import-graph completeness is not established here. */
  sourceInputs: () => readonly { path: string; bytes: Uint8Array }[];

  /** Declared version labels rather than independently queried runtime versions. */
  tool: IAutoMovieDesignDerivationBasis["tool"];
}): IAutoMovieDesignDerivationBasis {
  assertRelativePath(props.emitter.path);
  assertRelativePath(props.source.path);
  const inputs: readonly { path: string; bytes: Uint8Array }[] = props.sourceInputs();
  if (!inputs.some((input: { path: string; bytes: Uint8Array }): boolean => input.path === props.source.path))
    throw new AutoMovieDesignDerivationError(
      "design-derivation-basis-changed",
      `Source "${props.source.path}" is absent from the current project inputs.`,
    );
  const dependencies: IAutoMovieDesignDerivationDependency[] = inputs.map((input: { path: string; bytes: Uint8Array }): IAutoMovieDesignDerivationDependency => ({
    path: input.path,
    digest: digestAutoMovieBytes(normalizeAutoMovieSource(input.bytes)),
  }));
  return canonicalBasis({
    protocol: AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL,
    production: props.production,
    target: props.target,
    recordPath: props.recordPath,
    emitter: {
      path: props.emitter.path,
      digest: digestAutoMovieBytes(
        normalizeAutoMovieSource(props.emitter.bytes),
      ),
    },
    source: { ...props.source },
    dependencies,
    tool: { ...props.tool },
  });
}
