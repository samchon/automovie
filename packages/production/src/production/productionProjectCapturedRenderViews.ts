import type { IAutoMovieSemanticMaskReceipt, AutoMovieGuidePass, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import type { Stats } from "node:fs";
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";

import path from "node:path";
import { productionFileSystem as fileSystem } from "../project/productionFileSystem";
import { encodeAutoMoviePathSegment } from "./contentIdentity";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectVerifiedRenderManifest } from "./productionProjectVerifiedRenderManifest";
import { productionProjectAssertIncarnation } from "./productionProjectAssertIncarnation";

/**
 * Collect frame view facts from resident verified bundles under the requested target and fingerprint address.
 *
 * Current review callers supply the canonical sha256-prefixed target digest. This operation slices off that prefix length without independently validating the digest, then performs preliminary directory observations; callers must not treat arbitrary fingerprint text as an admitted filesystem address.
 *
 * @evidence contracts/common.md#principled-implementation Incarnation and render-root admission precede target/fingerprint directory discovery; only subdirectories whose manifest verifier returns an admitted bundle contribute frames, with matching semantic coverage cloned into each view.
 * @evidence contracts/common.md#clear-and-simple-design View projection delegates byte/receipt/media/semantic verification to the bundle owner; callers retain interpretation of requested target/current compile because this function constructs the discovery address without adding separate manifest target/fingerprint equality checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid bundles are omitted according to the verifier's nullable contract, without inventing frame facts; absent or non-directory discovery yields empty output and native enumeration failures are not fabricated as valid captures.
 * @evidence contracts/common.md#meaningful-documentation Defines address-driven discovery, nullable bundle filtering, native entry/frame order and optional coverage copies; returned facts do not independently certify all expected views or a current compile snapshot.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes directory discovery and every selected bundle's full frame/mask byte and parser verification; projecting F frames searches up to K semantic records per frame and clones admitted coverage populations, preserving the existing O(F times K) matching work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each admitted manifest supplies both frame values and corresponding coverage lookup; current bundle verification is performed once per discovered directory without a persistent captured-view cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Manifest/verification byte data is temporary per bundle, while projected views and cloned unresolved coverage grow with captured population and transfer to the caller; readers own descriptors and no renderer task is started.
 */
export function productionProjectCapturedRenderViews(state: AutoMovieProductionProjectState, target: IAutoMovieRenderBundleManifest["target"], fingerprint: string): Array<{
    /** Captured frame time in seconds, copied from the admitted manifest. */
    time: number;

    /** Actual guide pass recorded for this resident frame. */
    pass: AutoMovieGuidePass;

    /** Detached coverage metadata when a matching semantic receipt exists. */
    semanticCoverage?: {
        /** Drawable-claim or instance-set semantic entry ids without a resolved object root. */
        unresolved: string[];

        /** Built Mesh objects without a nearest claimed ancestor, including hidden meshes. */
        unaddressed: number;
    };
}> {
    productionProjectAssertIncarnation(state);
    const root: string = productionProjectRenderRoot(state);
    const directory: string = path.join(root, `${target.kind}-${encodeAutoMoviePathSegment(target.id)}`, fingerprint.slice("sha256:".length));
    const linked: Stats | null = lstatOrNull(directory);
    if (linked === null || linked.isDirectory() === false)
        return [];
    const views: Array<{
        time: number;
        pass: AutoMovieGuidePass;
        semanticCoverage?: {
            unresolved: string[];
            unaddressed: number;
        };
    }> = [];
    for (const entry of fileSystem.readdirSync(directory, {
        withFileTypes: true,
    })) {
        if (entry.isDirectory() === false)
            continue;
        const manifest: IAutoMovieRenderBundleManifest | null = productionProjectVerifiedRenderManifest(state, path.join(directory, entry.name, "manifest.json"));
        if (manifest === null)
            continue;
        for (const frame of manifest.frames) {
            const semantic: IAutoMovieSemanticMaskReceipt | undefined = manifest.semanticMasks.find((record: IAutoMovieSemanticMaskReceipt): boolean => record.frame === frame.index && record.pass === frame.pass);
            views.push({
                pass: frame.pass,
                time: frame.time,
                ...(semantic === undefined
                    ? {}
                    : { semanticCoverage: structuredClone(semantic.coverage) }),
            });
        }
    }
    return views;
}
