import type { IAutoMovieDesignDerivationRecord } from "./IAutoMovieDesignDerivationRecord";
import { compareCodeUnits, digestAutoMovieBytes } from "../contentIdentity";
import { AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL } from "./AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL";
import type { IAutoMovieDesignDerivationBasis } from "./IAutoMovieDesignDerivationBasis";
import type { IAutoMovieDesignDerivationManifest } from "./IAutoMovieDesignDerivationManifest";
import type { IAutoMovieDesignDerivationProblem } from "./IAutoMovieDesignDerivationProblem";
import { autoMovieDesignDerivationBasisDigest } from "./autoMovieDesignDerivationBasisDigest";
import { canonicalBases } from "./canonicalBases";
import { canonicalRecords } from "./canonicalRecords";
import { errorMessage } from "./errorMessage";

/**
 * Compare recorded lineage and output digests against caller-supplied current bases.
 *
 * @evidence contracts/common.md#principled-implementation Validates/sorts bases and records, matches target/path/basis hashes, checks current output byte hashes and optionally reports resident paths absent from the manifest.
 * @evidence contracts/common.md#clear-and-simple-design Uses the same canonical basis digest as candidate staging while returning named problems instead of publishing repairs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current bases and complete resident paths are caller premises; omitted residentRecordPaths cannot detect unknown resident files. Source digests are metadata identity rather than execution or authenticity proof.
 * @evidence contracts/common.md#meaningful-documentation Documents malformed-manifest results, stale basis/output problems, optional orphan coverage and propagation of readOutput failures.
 * @evidence contracts/performance.md#efficient-algorithms Sorting and repeated basis canonicalization add comparison/serialization costs; readOutput and hashing scan each selected output's actual bytes, with expected map lookup costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Stateless inspection refreshes supplied reads; prior matching digests cannot replace current source or output observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Expected/owned maps and problem arrays scale with supplied inventories and leave with the result/call; readOutput owns any IO resources and this owner opens none.
 */
export function inspectAutoMovieDesignDerivation(props: {
  /** Recorded lineage, or null to report the missing manifest. */
  manifest: IAutoMovieDesignDerivationManifest | null;

  /** Caller-supplied current metadata used for target/path/digest matching. */
  bases: readonly IAutoMovieDesignDerivationBasis[];

  /** Current output bytes or null for absence; thrown IO failures propagate. */
  readOutput: (path: string) => Uint8Array | null;

  /** Every resident design record path, so an unowned record is reported. */
  residentRecordPaths?: readonly string[];
}): IAutoMovieDesignDerivationProblem[] {
  if (
    props.manifest === null ||
    props.manifest.version !== 1 ||
    props.manifest.protocol !== AUTOMOVIE_DESIGN_DERIVATION_PROTOCOL
  )
    return [
      {
        code: "design-derivation-manifest-malformed",
        target: "design-derivation-manifest",
        path: null,
        message:
          "The design-derivation manifest is missing or unsupported. Run the explicit design command before compiling.",
      },
    ];
  let bases: readonly IAutoMovieDesignDerivationBasis[];
  try {
    bases = canonicalBases(props.bases);
    canonicalRecords(props.manifest.records);
  } catch (error) {
    return [
      {
        code: "design-derivation-manifest-malformed",
        target: "design-derivation-manifest",
        path: null,
        message: `${errorMessage(error)} Regenerate the canonical design-derivation manifest.`,
      },
    ];
  }
  const expected: Map<string, IAutoMovieDesignDerivationBasis> = new Map(bases.map((basis: IAutoMovieDesignDerivationBasis): [string, IAutoMovieDesignDerivationBasis] => [basis.target, basis]));
  const problems: IAutoMovieDesignDerivationProblem[] = [];
  for (const record of canonicalRecords(props.manifest.records)) {
    const basis: IAutoMovieDesignDerivationBasis | undefined = expected.get(record.target);
    if (
      basis === undefined ||
      basis.recordPath !== record.recordPath ||
      record.basis.target !== record.target ||
      record.basis.recordPath !== record.recordPath ||
      autoMovieDesignDerivationBasisDigest(record.basis) !==
        record.basisDigest ||
      autoMovieDesignDerivationBasisDigest(basis) !== record.basisDigest
    ) {
      problems.push({
        code: "design-derivation-stale",
        target: record.target,
        path: record.recordPath,
        message: `Design target "${record.target}" was emitted from a different producer basis. Run the explicit design command again.`,
      });
      continue;
    }
    expected.delete(record.target);
    const bytes: Uint8Array | null = props.readOutput(record.recordPath);
    if (bytes === null || digestAutoMovieBytes(bytes) !== record.outputDigest)
      problems.push({
        code: "design-derivation-output-stale",
        target: record.target,
        path: record.recordPath,
        message: `Design record "${record.recordPath}" is missing or differs from its recorded canonical output. Run the explicit design command again.`,
      });
  }
  for (const basis of [...expected.values()].sort((left: IAutoMovieDesignDerivationBasis, right: IAutoMovieDesignDerivationBasis): number =>
    compareCodeUnits(left.target, right.target),
  ))
    problems.push({
      code: "design-derivation-stale",
      target: basis.target,
      path: basis.recordPath,
      message: `Design target "${basis.target}" has no current derivation record. Run the explicit design command before compiling.`,
    });
  const owned: Set<string> = new Set(
    props.manifest.records.map((record: IAutoMovieDesignDerivationRecord): string => record.recordPath),
  );
  for (const recordPath of [...(props.residentRecordPaths ?? [])].sort(
    compareCodeUnits,
  ))
    if (owned.has(recordPath) === false)
      problems.push({
        code: "design-derivation-stale",
        target: recordPath,
        path: recordPath,
        message: `Design record "${recordPath}" is resident but no current producer derives it. Run the explicit design command or delete the file before compiling.`,
      });
  return problems;
}
