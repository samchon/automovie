
import type { IAutoMovieProductionProjectStagedFile as IStagedFile } from "./IAutoMovieProductionProjectStagedFile";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { normalizeAutoMovieProductionProjectSlash as normalizeSlash } from "./normalizeAutoMovieProductionProjectSlash";
import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { productionRenderBundleRelativePath } from "./productionRenderBundleRelativePath";
import { type AutoMovieGuidePass, IAutoMovieRenderBundleManifest, IAutoMovieSemanticMask } from "@automovie/interface";
import path from "node:path";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { parseAutoMovieCaptureRuntimeIdentity } from "./parseAutoMovieCaptureRuntimeIdentity";
import { digestAutoMovieBytes } from "./contentIdentity";
import { parseAutoMovieStructuredJson } from "./duplicateAwareJson";
import type { IProductionPayloadSnapshot } from "./IProductionPayloadSnapshot";
import { captureProductionPayloadSnapshot } from "./captureProductionPayloadSnapshot";
import { isProductionPayloadSnapshotCurrent } from "./isProductionPayloadSnapshotCurrent";
import { verifyAutoMovieProductionSemanticMaskReceipt } from "./semanticMaskEvidence";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { IAutoMovieProductionProjectRenderBundleReceipt } from "./IAutoMovieProductionProjectRenderBundleReceipt";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectRenderReceiptPath } from "./productionProjectRenderReceiptPath";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish one content-addressed capture bundle and its tracked manifest receipt.
 *
 * @evidence contracts/common.md#principled-implementation Admits renderer identity and canonical portable bundle paths, copies supplied bytes, checks claimed frame/sidecar identities and semantic receipts, then commits payload/manifest/receipt with retained-input and post-write byte fences in the original sequence.
 * @evidence contracts/common.md#clear-and-simple-design Bundle ownership stays here, semantic receipt admission stays with its verifier, and commitFiles owns revision locking and rollback accounting; captured frames are not decoded or rendered by this publisher.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects duplicate portable paths, foreign/duplicate semantic receipts and unclaimed bytes; retained snapshot read failures become null only to make currentness fail, and endpoint checks do not prove absence of an intervening ABA change.
 * @evidence contracts/common.md#meaningful-documentation Supplied frames must match their manifest digests, absent supplied frames must be resident, and each shot mask frame requires its semantic sidecar; post-publication refusal can invoke mutation rollback and incomplete cleanup must remain visible.
 * @evidence contracts/performance.md#efficient-algorithms Supplied-map construction and digest checks touch payload bytes; S semantic receipts each search F frame records, so that linkage can cost O(S*F), in addition to path maps/sets, sidecar JSON parsing, repeated resident reads/hashes, serialization and commit staging/rollback costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Owns copies of supplied bytes and one retained snapshot within this attempt, while callbacks reacquire resident payloads before and after publication; matching bundle addresses never replace byte/currentness checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Supplied buffers, payload snapshots and serialized records live through synchronous commit and are released on return/refusal; commitFiles additionally owns staged previous/current bytes, locks and temporary cleanup, so peak residency is not asserted as a fixed multiple of input bytes.
 */
export function productionProjectCommitRenderBundle(state: AutoMovieProductionProjectState, relativeBundle: string, files: ReadonlyMap<string, Uint8Array>, manifest: IAutoMovieRenderBundleManifest, inputCurrent?: () => boolean): number {
    parseAutoMovieCaptureRuntimeIdentity(manifest.rendererIdentity);
    const normalizedBundle: string = normalizeSlash(relativeBundle);
    const expectedBundle: string = productionRenderBundleRelativePath(manifest);
    if (normalizedBundle !== expectedBundle)
        throw new Error(`Render bundle "${relativeBundle}" is not the content-addressed path "${expectedBundle}". Use the current target-local fingerprint and render spec.`);
    const bundleRoot: string = resolveInside(productionProjectRenderRoot(state), relativeBundle);
    const bundleEntry: (relativePath: string) => { key: string; relative: string; target: string; } = (relativePath: string): { key: string; relative: string; target: string; } => {
        const normalized: string = normalizeSlash(relativePath);
        const target: string = resolveInside(bundleRoot, relativePath);
        const relative: string = normalizeSlash(path.relative(bundleRoot, target));
        if (relative.length === 0 || normalized !== relative)
            throw new Error(`Render bundle path "${relativePath}" is not one canonical bundle-relative identity.`);
        return { key: relative.toLowerCase(), relative, target };
    };
    const supplied: Map<string, { bytes: Buffer; relative: string; target: string; }> = new Map<string, {
        bytes: Buffer;
        relative: string;
        target: string;
    }>();
    for (const [relativePath, bytes] of files) {
        const entry: { key: string; relative: string; target: string; } = bundleEntry(relativePath);
        if (supplied.has(entry.key))
            throw new Error(`Render bundle repeats portable path "${relativePath}".`);
        supplied.set(entry.key, { ...entry, bytes: Buffer.from(bytes) });
    }
    const payloadPaths: Set<string> = new Set<string>();
    const retainedPaths: string[] = [];
    const expectedPayload: IProductionPayloadSnapshot = { entries: [] };
    for (const frame of manifest.frames) {
        const entry: { key: string; relative: string; target: string; } = bundleEntry(frame.path);
        if (payloadPaths.has(entry.key))
            throw new Error(`Render bundle repeats frame path "${frame.path}".`);
        payloadPaths.add(entry.key);
        const relative: string = normalizeSlash(path.relative(productionProjectRenderRoot(state), entry.target));
        const staged: Buffer<ArrayBufferLike> | undefined = supplied.get(entry.key)?.bytes;
        if (staged !== undefined) {
            if (digestAutoMovieBytes(staged) !== frame.digest)
                throw new Error(`Supplied render frame "${frame.path}" differs from its manifest digest.`);
        }
        else
            retainedPaths.push(relative);
        expectedPayload.entries.push({
            path: relative,
            digest: frame.digest,
            bytes: staged?.length ?? productionProjectReadRenderFile(state, relative).length,
        });
    }
    const semanticKeys: Set<string> = new Set<string>();
    for (const semantic of manifest.semanticMasks) {
        const semanticKey: string = `${semantic.frame}\0${semantic.pass}`;
        if (semanticKeys.has(semanticKey) ||
            manifest.target.kind !== "shot" ||
            semantic.shot !== manifest.target.id ||
            manifest.frames.some((frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.index === semantic.frame && frame.pass === semantic.pass) === false)
            throw new Error(`Render bundle semantic receipt for frame ${semantic.frame} is duplicate, foreign, or has no mask frame.`);
        semanticKeys.add(semanticKey);
        const entry: { key: string; relative: string; target: string; } = bundleEntry(semantic.sidecar.path);
        if (payloadPaths.has(entry.key))
            throw new Error(`Render bundle repeats semantic sidecar path "${semantic.sidecar.path}".`);
        payloadPaths.add(entry.key);
        const relative: string = normalizeSlash(path.relative(productionProjectRenderRoot(state), entry.target));
        const staged: Buffer<ArrayBufferLike> | undefined = supplied.get(entry.key)?.bytes;
        const bytes: Buffer<ArrayBufferLike> = staged ?? Buffer.from(productionProjectReadRenderFile(state, relative));
        verifyAutoMovieProductionSemanticMaskReceipt({
            receipt: semantic,
            expectedFrame: semantic.frame,
            expectedShot: semantic.shot,
            evidence: {
                version: 1,
                shot: semantic.shot,
                mask: parseAutoMovieStructuredJson({
                    record: "semantic-mask-sidecar",
                    bytes,
                }) as IAutoMovieSemanticMask,
                coverage: semantic.coverage,
            },
            resident: { path: semantic.sidecar.path, bytes },
        });
        if (staged === undefined)
            retainedPaths.push(relative);
        expectedPayload.entries.push({
            path: relative,
            digest: semantic.sidecar.digest,
            bytes: semantic.sidecar.bytes,
        });
    }
    if (manifest.target.kind === "shot" &&
        manifest.frames.some((frame: { index: number; time: number; pass: AutoMovieGuidePass; path: string; digest: string; width: number; height: number; }): boolean => frame.pass === "mask" &&
            semanticKeys.has(`${frame.index}\0${frame.pass}`) === false))
        throw new Error("Render bundle mask frames require one current semantic sidecar each.");
    if ([...supplied.keys()].some((relative: string): boolean => payloadPaths.has(relative) === false))
        throw new Error("Render bundle supplied a payload that its manifest does not claim.");
    const retainedSnapshot: IProductionPayloadSnapshot = captureProductionPayloadSnapshot({
        paths: retainedPaths,
        read: (relative: string): Uint8Array<ArrayBufferLike> | null => {
            try {
                return productionProjectReadRenderFile(state, relative);
            }
            catch {
                return null;
            }
        },
    });
    const payloadCurrent: (snapshot: IProductionPayloadSnapshot) => boolean = (snapshot: IProductionPayloadSnapshot): boolean => isProductionPayloadSnapshotCurrent({
        snapshot,
        read: (relative: string): Uint8Array<ArrayBufferLike> | null => {
            try {
                return productionProjectReadRenderFile(state, relative);
            }
            catch {
                return null;
            }
        },
    });
    const writes: IStagedFile[] = [...supplied.values()].map((entry: { bytes: Buffer; relative: string; target: string; }): { path: string; content: Buffer<ArrayBufferLike>; } => ({
        path: entry.target,
        content: entry.bytes,
    }));
    const serializedManifest: string = productionProjectSerializeJson(manifest);
    writes.push({
        path: path.join(bundleRoot, "manifest.json"),
        content: serializedManifest,
    });
    const serializedReceipt: string = productionProjectSerializeJson({
        version: 1,
        bundle: normalizedBundle,
        manifestDigest: digestAutoMovieBytes(Buffer.from(serializedManifest, "utf8")),
    } satisfies IAutoMovieProductionProjectRenderBundleReceipt);
    writes.push({
        path: productionProjectRenderReceiptPath(state, normalizedBundle),
        content: serializedReceipt,
    });
    return productionProjectCommitFiles(state, writes, (): boolean => payloadCurrent(retainedSnapshot) && inputCurrent?.() !== false, state.lastReadRevision_, (): void => {
        if (payloadCurrent(expectedPayload) === false)
            throw new AutoMovieProductionInputRaceError("Render bundle payload changed while its manifest and receipt were committed.");
        const residentManifest: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, `${normalizedBundle}/manifest.json`);
        const residentReceipt: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, relativeToRoot(state.productionStateRoot, productionProjectRenderReceiptPath(state, normalizedBundle)));
        if (Buffer.from(residentManifest).equals(Buffer.from(serializedManifest, "utf8")) === false ||
            residentReceipt === null ||
            Buffer.from(residentReceipt).equals(Buffer.from(serializedReceipt, "utf8")) === false)
            throw new AutoMovieProductionInputRaceError("Render bundle manifest or receipt changed before revision commit.");
    });
}
