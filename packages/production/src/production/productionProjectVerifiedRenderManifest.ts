import type { AutoMovieGuidePass, IAutoMovieProductionPngPicture, IAutoMovieRenderBundleManifest, IAutoMovieSemanticMask } from "@automovie/interface";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { productionRenderBundleRelativePath } from "./productionRenderBundleRelativePath";

import path from "node:path";
import typia from "typia";
import { parseAutoMovieCaptureRuntimeIdentity } from "./parseAutoMovieCaptureRuntimeIdentity";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import { probeProductionMedia } from "./probeProductionMedia";
import { verifyAutoMovieProductionSemanticMaskReceipt } from "./semanticMaskEvidence";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import type { IAutoMovieProductionProjectRenderBundleReceipt } from "./IAutoMovieProductionProjectRenderBundleReceipt";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectRenderReceiptPath } from "./productionProjectRenderReceiptPath";

/**
 * Return a resident render bundle only when its address, ownership receipt, frame bytes and semantic sidecars all agree.
 *
 * @evidence contracts/common.md#principled-implementation Guarded manifest parse/exact schema and capture runtime identity precede canonical bundle path and receipt digest agreement; case-folded frame paths and semantic keys must be unique, frame PNG digests/dimensions admitted, and every mask frame must have a verified semantic sidecar.
 * @evidence contracts/common.md#clear-and-simple-design This resident verifier composes project byte fencing, bundle identity, media probing and semantic receipt admission; capture/publication and compile-currentness decisions remain with its callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A receipt or digest alone cannot hide corrupt frames or missing mask evidence; all failures inside this verifier yield null, which deliberately merges absence, unsafe paths, invalid data and native errors without repairing them.
 * @evidence contracts/common.md#meaningful-documentation Defines full resident verification and nullable refusal, uniqueness rules and shot-mask sidecar requirement; the tracked bundle receipt uses its existing field checks rather than a new strict receipt schema, and current generated compile equality is not independently checked here.
 * @evidence contracts/performance.md#efficient-algorithms Reads/parses manifest and receipt, hashes/probes all F frame byte populations and parses/verifies K semantic sidecars; each sidecar performs a linear frame match and final mask coverage scans frames, alongside PNG/semantic parser work and repeated namespace guards.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted manifest supplies path, receipt and frame/semantic checks, with Sets reused for duplicate/coverage membership; mutable resident bytes are freshly read rather than trusting an earlier bundle verdict.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Manifest records, uniqueness Sets and original manifest bytes remain local while frame/sidecar/parser buffers are processed; admitted metadata escapes, guarded readers release descriptors and no pixel buffer, parser object or inspection task is retained.
 */
export function productionProjectVerifiedRenderManifest(state: AutoMovieProductionProjectState, manifestPath: string): IAutoMovieRenderBundleManifest | null {
    try {
        const root: string = productionProjectRenderRoot(state);
        const relativeManifest: string = normalizeSlash(path.relative(root, manifestPath));
        const bytes: Buffer<ArrayBuffer> = Buffer.from(productionProjectReadRenderFile(state, relativeManifest));
        const validation: typia.IValidation<IAutoMovieRenderBundleManifest> = typia.validateEquals<IAutoMovieRenderBundleManifest>(parseAutoMovieStructuredJson({
            record: "render-bundle-manifest",
            bytes,
        }));
        if (validation.success === false)
            return null;
        try {
            parseAutoMovieCaptureRuntimeIdentity(validation.data.rendererIdentity);
        }
        catch {
            return null;
        }
        const relativeBundle: string = normalizeSlash(path.relative(root, path.dirname(manifestPath)));
        if (relativeBundle !== productionRenderBundleRelativePath(validation.data))
            return null;
        const receiptBytes: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, relativeToRoot(state.productionStateRoot, productionProjectRenderReceiptPath(state, relativeBundle)));
        if (receiptBytes === null)
            return null;
        const receipt: Partial<IAutoMovieProductionProjectRenderBundleReceipt> = parseAutoMovieStructuredJson({
            record: "render-bundle-receipt",
            bytes: receiptBytes,
        }) as Partial<IAutoMovieProductionProjectRenderBundleReceipt>;
        if (receipt.version !== 1 ||
            receipt.bundle !== relativeBundle ||
            receipt.manifestDigest !== digestAutoMovieBytes(bytes))
            return null;
        const framePaths: Set<string> = new Set<string>();
        for (const frame of validation.data.frames) {
            const normalizedFrame: string = normalizeSlash(frame.path).toLowerCase();
            if (framePaths.has(normalizedFrame))
                return null;
            framePaths.add(normalizedFrame);
            const absoluteFrame: string = resolveInside(path.dirname(manifestPath), frame.path);
            const frameBytes: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, normalizeSlash(path.relative(root, absoluteFrame)));
            if (digestAutoMovieBytes(frameBytes) !== frame.digest)
                return null;
            const probe: { kind: "png"; width: number; height: number; picture: IAutoMovieProductionPngPicture; } = probeProductionMedia({
                kind: "preview",
                mediaType: "image/png",
                bytes: frameBytes,
            }) as Extract<ReturnType<typeof probeProductionMedia>, {
                kind: "png";
            }>;
            if (probe.width !== frame.width || probe.height !== frame.height)
                return null;
        }
        const semanticKeys: Set<string> = new Set<string>();
        for (const semantic of validation.data.semanticMasks) {
            const key: string = `${semantic.frame}\u0000${semantic.pass}`;
            if (semanticKeys.has(key))
                return null;
            semanticKeys.add(key);
            if (validation.data.target.kind !== "shot" ||
                semantic.shot !== validation.data.target.id ||
                validation.data.frames.some((frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.index === semantic.frame && frame.pass === semantic.pass) === false)
                return null;
            const absoluteSidecar: string = resolveInside(path.dirname(manifestPath), semantic.sidecar.path);
            const sidecarBytes: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, normalizeSlash(path.relative(root, absoluteSidecar)));
            const mask: IAutoMovieSemanticMask = parseAutoMovieStructuredJson({
                record: "semantic-mask-sidecar",
                bytes: sidecarBytes,
            }) as IAutoMovieSemanticMask;
            verifyAutoMovieProductionSemanticMaskReceipt({
                receipt: semantic,
                expectedFrame: semantic.frame,
                expectedShot: semantic.shot,
                evidence: {
                    version: 1,
                    shot: semantic.shot,
                    mask,
                    coverage: semantic.coverage,
                },
                resident: { path: semantic.sidecar.path, bytes: sidecarBytes },
            });
        }
        if (validation.data.target.kind === "shot" &&
            validation.data.frames.some((frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.pass === "mask" &&
                semanticKeys.has(`${frame.index}\u0000${frame.pass}`) === false))
            return null;
        return validation.data;
    }
    catch {
        return null;
    }
}
