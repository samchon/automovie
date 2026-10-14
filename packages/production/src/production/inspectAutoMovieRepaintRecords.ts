import { IAutoMovieRepaintRecordTarget } from "./IAutoMovieRepaintRecordTarget";
import { IAutoMovieRepaintRecordInspection } from "./IAutoMovieRepaintRecordInspection";
import { productionRepaintRecordValidateTarget } from "./productionRepaintRecordValidateTarget";
import { productionRepaintRecordCompareTargets } from "./productionRepaintRecordCompareTargets";
import { IAutoMovieRepaintRecordFinding } from "./IAutoMovieRepaintRecordFinding";
import { productionRepaintRecordSafeClassifiedError } from "./productionRepaintRecordSafeClassifiedError";

/**
 * Inspect every supplied target synchronously in shot/kind/record code-unit order, preserving valid siblings when another reader returns null or throws.
 *
 * All target validation and detached copying precede any callback; malformed target/clone/sort errors can therefore abort the whole collection. Duplicate targets remain and invoke the reader repeatedly. Each callback receives another detached target, and its nonnull value transfers directly. Classified errors are re-admitted with built-in recovery; unknown/hostile errors fall back to enumeration/unavailable without copied error text. Earlier external reader effects are not rolled back.
 *
 * @evidence contracts/common.md#principled-implementation Prevalidated sorted target copies drive independent readers, separating null absence, re-admitted nominal classification and safe unknown-error fallback from successfully returned values.
 * @evidence contracts/common.md#clear-and-simple-design The collector owns order, sibling results and diagnostic conversion while actual schema/identity/currentness/media observation remains each reader's responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arbitrary error messages and tampered recovery text are not copied, duplicate effectful reads are not assumed equivalent, and safe recovery does not certify caller-supplied target text.
 * @evidence contracts/common.md#meaningful-documentation Prose states validation-before-callback, duplicate behavior, direct value ownership, callback exceptions and absence/classification/external-effect meaning.
 * @evidence contracts/performance.md#efficient-algorithms N target clones and O(N log N) code-unit sorting precede N reader calls plus another clone per call; dominant I/O/validation and returned-value retention belong to those actual readers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reader callbacks can have effects and duplicate targets remain separate supplied requests, so this collector caches neither completed nor in-flight reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Target/result/finding arrays scale with supplied population and retained callback values without an independent cap; temporaries expire after the synchronous call and reader-owned handles remain their responsibility.
 */
export const inspectAutoMovieRepaintRecords: <T>(props: {
    targets: readonly IAutoMovieRepaintRecordTarget[];
    inspect: (target: IAutoMovieRepaintRecordTarget) => T | null;
}) => IAutoMovieRepaintRecordInspection<T> = <T>(props: {
  targets: readonly IAutoMovieRepaintRecordTarget[];
  inspect: (target: IAutoMovieRepaintRecordTarget) => T | null;
}): IAutoMovieRepaintRecordInspection<T> => {
  const targets: IAutoMovieRepaintRecordTarget[] = props.targets.map(productionRepaintRecordValidateTarget).sort(productionRepaintRecordCompareTargets);
  const records: IAutoMovieRepaintRecordInspection<T>["records"] = [];
  const findings: IAutoMovieRepaintRecordFinding[] = [];
  for (const target of targets)
    try {
      const value: T | null = props.inspect(structuredClone(target));
      if (value === null)
        findings.push({
          target,
          stage: target.kind === "candidate" ? "receipt" : "pointer",
          failure: "absent",
          recovery: `Create or restore the requested ${target.kind} record, then inspect it again.`,
        });
      else records.push({ target, value });
    } catch (error) {
      const classified: ReturnType<typeof productionRepaintRecordSafeClassifiedError> = productionRepaintRecordSafeClassifiedError(error);
      findings.push({
        target,
        stage: classified?.stage ?? "enumeration",
        failure: classified?.failure ?? "unavailable",
        recovery:
          classified?.recovery ??
          "Restore access to the tracked repaint state, then inspect it again.",
      });
    }
  return { records, findings };
};
