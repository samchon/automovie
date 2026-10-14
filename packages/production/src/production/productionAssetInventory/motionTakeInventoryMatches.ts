import { type IAutoMovieExternalMotionTake, type IAutoMovieClip, IAutoMovieAssetProvenance } from "@automovie/interface";
import { inspectAutoMovieExternalModelBytes } from "@automovie/ingest";

/**
 * Compare the declared take ledger with byte-inspected takes in source order.
 *
 * @evidence contracts/common.md#principled-implementation Requires equal population, exact id/name/duration values and animationIndex equal to the aligned index; durations use exact parsed numeric equality for provenance rather than a motion-error tolerance.
 * @evidence contracts/common.md#clear-and-simple-design One comparison decides whether the manifest's take facts match the inspection before adoption chooses a take.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A matching inventory does not prove arbitrary future playback or authorize an undeclared take; no source-order repair or approximate duration substitution occurs.
 * @evidence contracts/common.md#meaningful-documentation Documents source-order/index identity and exact duration comparison, with false for any discrepancy.
 * @evidence contracts/performance.md#efficient-algorithms Visits aligned takes once until mismatch, with string comparisons and fixed numeric equality per take and constant auxiliary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses inspected facts but not a prior equality verdict over later metadata or bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the boolean escapes and no input array or external resource is retained.
 *
 * @author Samchon
 */
export function motionTakeInventoryMatches(
  declared: Readonly<NonNullable<IAutoMovieAssetProvenance["motion"]>["takes"]>,
  inspected: Readonly<
    NonNullable<
      ReturnType<typeof inspectAutoMovieExternalModelBytes>["motion"]
    >["takes"]
  >,
): boolean { return declared.length === inspected.length &&
  declared.every((take: IAutoMovieExternalMotionTake, index: number) : boolean => {
    const observed: IAutoMovieClip = inspected[index]!;
    return (
      take.id === observed.id &&
      take.animationIndex === index &&
      take.sourceName === observed.name &&
      take.durationSeconds === observed.duration
    );
  }); }
