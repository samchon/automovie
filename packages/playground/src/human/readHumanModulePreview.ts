import { AutoMovieHumanBodyRegions } from "../../../human/src/generation/AutoMovieHumanBodyRegions";
import type { IAutoMovieHumanBodyCalibration } from "../../../human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanBodyRegion } from "../../../human/src/generation/IAutoMovieHumanBodyRegion";
import type { IAutoMovieHumanHermiteCurve } from "../../../human/src/lofting/IAutoMovieHumanHermiteCurve";

/** Preview files `exportModules.ts --preview` writes, loaded on demand. */
const FILES: Record<string, () => Promise<unknown>> = import.meta.glob(
  "../human-preview/*.json",
  { import: "default" },
);

/**
 * Read one module-fit preview and merge its regions into the calibration it renders.
 *
 * `exportModules.ts --preview <name>` writes `src/human-preview/<name>.json`,
 * an ignored file holding the module regions built from the fits that exist so
 * far and the lips in the world. The files are found by `import.meta.glob`, so
 * no tracked module imports a file that may be absent, and the regions are
 * merged by the generator's own `AutoMovieHumanBodyRegions.merge`; the
 * generator's default calibration is not touched.
 *
 * @param name Preview name, `[a-z][a-z0-9-]{0,31}`.
 * @returns The merged calibration and the lips, null when the preview has none.
 *
 * @evidence contracts/common.md#principled-implementation Loads the exporter's JSON through Vite's module graph and merges it with the same AutoMovieHumanBodyRegions.merge the generator uses, so the preview shows the regions the full export would write.
 * @evidence contracts/common.md#clear-and-simple-design One reader owns the preview files; the page and the curve diagram both call it and pass the result to the generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A malformed name, a missing file or a merge refusal throws with the available names; no other calibration stands in.
 * @evidence contracts/common.md#meaningful-documentation States the file's writer, location, contents, lookup and merge.
 * @evidence contracts/performance.md#efficient-algorithms One dynamic import of the named file and one merge, linear in its regions' keys.
 * @evidence contracts/performance.md#reuse-equivalent-work Vite caches the imported module until the file changes; each call merges anew so the result follows the file.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains only Vite's module record of the imported file; the merged calibration belongs to the caller.
 */
export async function readHumanModulePreview(
  name: string,
): Promise<readHumanModulePreview.IPreview> {
  if (!/^[a-z][a-z0-9-]{0,31}$/.test(name))
    throw new Error("Human module preview name is not [a-z][a-z0-9-]{0,31}");
  const load: (() => Promise<unknown>) | undefined =
    FILES["../human-preview/" + name + ".json"];
  if (load === undefined)
    throw new Error(
      "Human module preview " +
        name +
        " is not exported; run exportModules.ts --preview " +
        name +
        " (available: " +
        (Object.keys(FILES)
          .map((file: string): string => file.replace(/^.*\/(.+)\.json$/, "$1"))
          .join(", ") || "none") +
        ")",
    );
  const file: readHumanModulePreview.IFile =
    (await load()) as readHumanModulePreview.IFile;
  return {
    name,
    calibration: AutoMovieHumanBodyRegions.merge(file.regions),
    lips: file.lips,
  };
}

/**
 * Types of a module-fit preview.
 *
 * @evidence contracts/common.md#principled-implementation The file type mirrors what exportModules.ts --preview writes; the preview type is what the page hands the generator.
 * @evidence contracts/common.md#clear-and-simple-design Groups the two shapes under their reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record is kept as the exporter wrote it; nothing is inferred.
 * @evidence contracts/common.md#meaningful-documentation Each member states its meaning.
 * @evidence contracts/performance.md#efficient-algorithms Types only; no runtime cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Types only.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Types only.
 */
export namespace readHumanModulePreview {
  /** A preview file. */
  export interface IFile {
    /** Module regions in their anchors' coordinates, the trunk region declaring the stature. */
    regions: IAutoMovieHumanBodyRegion[];

    /** The lips' colour boundary in the world, or null before the head's openings are fitted. */
    lips: IAutoMovieHumanHermiteCurve | null;

    /** The exporter's record: fits read, modules written, modules and ends left out with reasons. */
    record: unknown;
  }

  /** A read preview. */
  export interface IPreview {
    /** Preview name. */
    name: string;

    /** The merged calibration of the preview's regions. */
    calibration: IAutoMovieHumanBodyCalibration;

    /** The lips in the world, or null. */
    lips: IAutoMovieHumanHermiteCurve | null;
  }
}
