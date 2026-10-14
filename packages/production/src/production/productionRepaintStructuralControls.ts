import { IAutoMovieRenderBundleManifest, IAutoMovieRepaintReceipt } from "@automovie/interface";
import { compareCodeUnits } from "./contentIdentity";

/**
 * Canonical structural-control inventory for one verified source bundle.
 *
 * Beauty is excluded. Mask is retained only when every mask frame has a matching semantic record with zero unresolved and unaddressed coverage. Other passes retain manifest frame order; pass groups use UTF-16 code-unit order. These stored coverage assertions are not newly observed spatial or visual evidence.
 *
 * @evidence contracts/common.md#principled-implementation Distinct non-beauty passes form receipt controls, with explicit complete semantic-mask receipts required for each mask frame before sorted pass groups retain their ordered digests.
 * @evidence contracts/common.md#clear-and-simple-design This inventory composer reads an already verified source manifest; semantic coverage production and resident frame verification stay with their owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An incomplete mask pass is omitted rather than certified, while stored zero-coverage metadata alone does not prove fresh scene or pixel correctness.
 * @evidence contracts/common.md#meaningful-documentation Prose states beauty omission, mask admission, pass ordering and preserved per-pass frame order.
 * @evidence contracts/performance.md#efficient-algorithms For F frames, P distinct passes and M semantic records, grouping scans O(P*F), mask matching costs O(F*M) in the worst case and pass sorting O(P log P); output grows with retained frame digests.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing manifest digests/coverage are consumed directly and one distinct-pass set bounds repeated grouping; no cache assumes future manifest equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns group and digest arrays while borrowing immutable strings; set/filter temporaries are local and no media buffers or inspection task are retained.
 */
export const productionRepaintStructuralControls: (manifest: IAutoMovieRenderBundleManifest) => IAutoMovieRepaintReceipt["controls"] = (
  manifest: IAutoMovieRenderBundleManifest,
): IAutoMovieRepaintReceipt["controls"] =>
  [...new Set(manifest.frames.map((frame: IAutoMovieRenderBundleManifest["frames"][number]): IAutoMovieRenderBundleManifest["frames"][number]["pass"] => frame.pass))]
    .filter(
      (
        pass: IAutoMovieRenderBundleManifest["frames"][number]["pass"],
      ): pass is Exclude<
        IAutoMovieRenderBundleManifest["frames"][number]["pass"],
        "beauty"
      > => pass !== "beauty",
    )
    .filter(
      (pass: IAutoMovieRepaintReceipt["controls"][number]["pass"]): boolean =>
        pass !== "mask" ||
        manifest.frames
          .filter((frame: IAutoMovieRenderBundleManifest["frames"][number]): boolean => frame.pass === "mask")
          .every((frame: IAutoMovieRenderBundleManifest["frames"][number]): boolean =>
            manifest.semanticMasks.some(
              (semantic: IAutoMovieRenderBundleManifest["semanticMasks"][number]): boolean =>
                semantic.frame === frame.index &&
                semantic.pass === frame.pass &&
                semantic.coverage.unresolved.length === 0 &&
                semantic.coverage.unaddressed === 0,
            ),
          ),
    )
    .sort(compareCodeUnits)
    .map((pass: IAutoMovieRepaintReceipt["controls"][number]["pass"]): IAutoMovieRepaintReceipt["controls"][number] => ({
      pass,
      frameDigests: manifest.frames
        .filter((frame: IAutoMovieRenderBundleManifest["frames"][number]): boolean => frame.pass === pass)
        .map((frame: IAutoMovieRenderBundleManifest["frames"][number]): string => frame.digest),
    }));
