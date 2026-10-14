import path from "node:path";
import { productionFileSystem as fileSystem } from "./productionFileSystem";
import type { IAutoMovieProjectManifest } from "./IAutoMovieProjectManifest";
import { autoMovieProjectNormalizeAssetPath } from "./autoMovieProjectNormalizeAssetPath";
import { autoMovieProjectWriteAtomic } from "./autoMovieProjectWriteAtomic";
import { autoMovieProjectSerializeJson } from "./autoMovieProjectSerializeJson";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Register one normalized relative path and optionally publish supplied bytes when the destination is absent. Duplicate registration refuses; without supplied bytes no file-existence check occurs. Asset and manifest writes are separate guarded leaves, so bytes may survive later failure; success returns the normalized registered path.
 *
 * @evidence contracts/common.md#principled-implementation Normalized path/current manifest admission precede optional no-existing-file publication, then manifest replacement and mirror assignment.
 * @evidence contracts/common.md#clear-and-simple-design One cycle coordinates asset registration and optional supplied bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No-byte registration verifies no existence; two writes are not a pair transaction and published bytes can survive manifest failure.
 * @evidence contracts/common.md#meaningful-documentation States duplicate refusal, host-written bytes, preserved extra fields and partial effects.
 * @evidence contracts/performance.md#efficient-algorithms Scans A keys, copies/serializes their manifest and optionally writes B bytes plus concurrency work.
 * @evidence contracts/performance.md#reuse-equivalent-work Fresh resident manifest supplies duplicate admission and update; stale mirrors are not authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains the successful manifest; safe token/temporary cleanup is attempted but can retain fences/temporaries, while published bytes remain.
 */
export function autoMovieProjectRegisterAsset(_project: IAutoMovieProjectState, relativePath: string, bytes?: Uint8Array): string {
    const normalized: string = autoMovieProjectNormalizeAssetPath(relativePath);
    const absolute: string = path.join(_project.root, ...normalized.split("/"));
    _project.commitCycle((assertNamespace: () => void): void => {
        const resident: IAutoMovieProjectManifest = _project.readManifest();
        if (resident.assets.includes(normalized))
            throw new Error(`asset "${normalized}" is already registered; assets are never silently replaced`);
        const next: {
            assets: string[];
            version: number;
        } = {
            ...resident,
            assets: [...resident.assets, normalized],
        };
        const manifestContent: string = autoMovieProjectSerializeJson(next);
        if (bytes !== undefined) {
            assertNamespace();
            if (fileSystem.existsSync(absolute))
                throw new Error(`asset file "${normalized}" already exists; refusing to overwrite it`);
            autoMovieProjectWriteAtomic(absolute, bytes, assertNamespace);
        }
        autoMovieProjectWriteAtomic(_project.manifestPath, manifestContent, assertNamespace);
        assertNamespace();
        _project.manifest = next;
    });
    return normalized;
}
