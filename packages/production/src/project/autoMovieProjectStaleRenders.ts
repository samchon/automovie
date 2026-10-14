import { compareCodeUnits } from "@automovie/engine";
import { IAutoMovieShot } from "@automovie/interface";
import { renderPathStem } from "@automovie/render";
import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import { IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 *
 * @evidence contracts/common.md#principled-implementation A committed film enables sorted-name filtering against film/shot stem families and registered descendant assets.
 * @evidence contracts/common.md#clear-and-simple-design Produces advisory paths without deleting rendered work.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No film gives no deletion advice; stem membership is policy rather than byte provenance.
 * @evidence contracts/common.md#meaningful-documentation States top-level names, stem matching and asset exemptions.
 * @evidence contracts/performance.md#efficient-algorithms For R names/S stems/A assets, candidates scan stems/assets plus text costs and R-name sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Stems are built once but recopied per original predicate invocation; no persistent cache is added.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Stray strings transfer; temporary names/sets expire and no deletion task starts.
 */
export function autoMovieProjectStaleRenders(_project: IAutoMovieProjectState, slate: IAutoMovieLegacyWritableSlate): string[] {
    if (slate.film === null)
        return [];
    const stems: Set<string> = new Set<string>([
        renderPathStem(slate.film.id),
        ...slate.shots.map((shot: IAutoMovieShot): string => renderPathStem(shot.id)),
    ]);
    const owned: (name: string) => boolean = (name: string): boolean => [...stems].some((stem: string): boolean => name === stem || name.startsWith(`${stem}.`)) ||
        _project.manifest.assets.some((asset: string): boolean => asset === `renders/${name}` || asset.startsWith(`renders/${name}/`));
    return fileSystem
        .readdirSync(path.join(_project.root, "renders"))
        .sort(compareCodeUnits)
        .filter((name: string): boolean => !owned(name))
        .map((name: string): string => `renders/${name}`);
}
