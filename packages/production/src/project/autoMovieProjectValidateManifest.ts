import { isRecord } from "../validators/primitives";
import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import { checkAssetPath } from "./checkAssetPath";
import { AutoMovieProjectShapeError } from "./AutoMovieProjectShapeError";

/**
 * Admit a version-one record with string asset paths, normalize each path through the historical asset rule, and refuse repeated normalized paths. The returned outer record and asset array are new while extra fields remain shared. Registration claims no binary existence, and this path rule proves neither full native filename validity nor physical confinement; direct host arrays also receive no density check.
 *
 * @evidence contracts/common.md#principled-implementation Record/version admission and string/path/duplicate checks return copied normalized assets while preserving extra fields.
 * @evidence contracts/common.md#clear-and-simple-design One runtime gate protects resident manifest reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence is not binary existence; the historical path rule is narrower than complete Windows/physical admission.
 * @evidence contracts/common.md#meaningful-documentation States version-one domain, extra-field preservation and asset refusal locations.
 * @evidence contracts/performance.md#efficient-algorithms Scans A entries and path text with an A-key set and copied output array.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted parsed record supplies preserved extra fields without a second JSON parse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller retains the returned record; temporary set expires and no file is opened.
 */
export const autoMovieProjectValidateManifest: (file: string, value: unknown) => IAutoMovieProjectManifest = (file: string, value: unknown): IAutoMovieProjectManifest => {
    if (!isRecord(value))
        throw new AutoMovieProjectShapeError(file, "manifest must be a JSON object");
    if (value.version !== 1)
        throw new AutoMovieProjectShapeError(file, `manifest version must be 1, but was ${String(value.version)}`);
    if (!Array.isArray(value.assets) ||
        value.assets.some((asset: unknown): boolean => typeof asset !== "string"))
        throw new AutoMovieProjectShapeError(file, "manifest assets must be an array of strings");
    const seenAssets: Set<string> = new Set<string>();
    const assets: string[] = value.assets.map((asset: string, index: number): string => {
        const checked: {
            path: string;
        } | {
            fault: string;
        } = checkAssetPath(asset);
        if ("fault" in checked)
            throw new AutoMovieProjectShapeError(file, `manifest assets[${index}] invalid: ${checked.fault}`);
        if (seenAssets.has(checked.path))
            throw new AutoMovieProjectShapeError(file, `manifest assets[${index}] duplicates "${checked.path}"`);
        seenAssets.add(checked.path);
        return checked.path;
    });
    return { ...value, assets } as unknown as IAutoMovieProjectManifest;
};
