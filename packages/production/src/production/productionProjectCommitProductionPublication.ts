
import { lstatAutoMovieProductionProjectEntry as lstatOrNull } from "./lstatAutoMovieProductionProjectEntry";
import type { IAutoMovieProductionProjectStagedFile as IStagedFile } from "./IAutoMovieProductionProjectStagedFile";
import { resolveAutoMovieProductionProjectPath as resolveInside } from "./resolveAutoMovieProductionProjectPath";
import { type IAutoMovieProductionDeliverableFile, type IAutoMovieProductionMediaProbe, type IAutoMovieProductionPublicationIdentity, type IAutoMovieProductionRenderReceiptFile, type IAutoMovieProductionRenderedDeliverable, IAutoMovieProductionRenderManifest, IAutoMovieProductionRenderReceipt } from "@automovie/interface";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import path from "node:path";
import typia from "typia";
import { AutoMovieProductionInputRaceError } from "./AutoMovieProductionInputRaceError";
import { compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { probeProductionMedia } from "./probeProductionMedia";
import { assertProductionRenderPublicationCurrent } from "./productionRenderPublicationIdentity";
import { assertAutoMovieProductionDeliverableSemanticMask } from "./semanticMaskEvidence";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectSerializeJson } from "./productionProjectSerializeJson";
import { productionProjectCanonicalProductionRenderPath } from "./productionProjectCanonicalProductionRenderPath";
import { productionProjectGeneratedManifest } from "./productionProjectGeneratedManifest";
import { productionProjectReadTrackedStateFile } from "./productionProjectReadTrackedStateFile";
import { productionProjectRenderRoot } from "./productionProjectRenderRoot";
import { productionProjectReadRenderFile } from "./productionProjectReadRenderFile";
import { productionProjectCommitFiles } from "./productionProjectCommitFiles";

/**
 * Publish immutable deliverable payloads and the terminal render manifest/receipt.
 *
 * @evidence contracts/common.md#principled-implementation Structurally validates and clones the manifest, binds it to the current plan/publication identity and builder fingerprint, verifies unique claimed bytes and media/semantic facts, then uses guarded revision commit with byte/ledger checks on both sides of the final publication gate.
 * @evidence contracts/common.md#clear-and-simple-design Owns terminal payload and receipt correspondence while media probes, semantic mask admission, publication identity and mutation accounting retain their respective responsibilities; it creates no encoder or render host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, duplicate, unclaimed or digest-mismatched files refuse; resident immutable paths are reused only after exact byte comparison, and currentness callbacks are observations rather than a guarantee against every between-check ABA race.
 * @evidence contracts/common.md#meaningful-documentation Documents the terminal ledger and immutable payload policy, with malformed media or stale plan/input refusing before final revision publication; delegated rollback can report incomplete cleanup after partial filesystem effects.
 * @evidence contracts/performance.md#efficient-algorithms Includes full manifest schema walk/clone, O(P log P) receipt sorting for P files, payload copies and hashing, per-format probe costs, serialization, commit staging and two post-write payload read/hash passes; MP4 probing also parses boxes/sample tables and performs media-range residency lookup, not merely O(1) metadata comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work One owned supplied-byte map serves hashing/probing/staging and one cloned manifest serves all checks; existing immutable files are compared before reuse, while plan/input callbacks and resident bytes are deliberately reobserved at commit boundaries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Attempt-owned payload copies, cloned manifest, media probe records and receipt/ledger strings remain until synchronous commit finishes; parsed MP4 copies/sample metadata and commit previous/current buffers contribute additional residency, so no unmeasured fixed peak factor is promised; commitFiles owns locks/temporary cleanup.
 */
export function productionProjectCommitProductionPublication(state: AutoMovieProductionProjectState, props: {
    files: ReadonlyMap<string, Uint8Array>;
    manifest: IAutoMovieProductionRenderManifest;
    plan: IAutoMovieProductionRenderJobPlan;
    planCurrent: () => boolean;
    inputCurrent: () => boolean;
    publicationCurrent: () => void;
    expectedRevision: number;
}): number {
    const validation: typia.IValidation<IAutoMovieProductionRenderManifest> = typia.validateEquals<IAutoMovieProductionRenderManifest>(props.manifest);
    if (validation.success === false)
        throw new Error(`Invalid aggregate render manifest: ${validation.errors
            .map((error: typia.IValidation.IError): string => `${error.path} expects ${error.expected}`)
            .join("; ")}.`);
    const candidate: IAutoMovieProductionRenderManifest = structuredClone(validation.data);
    const publication: IAutoMovieProductionPublicationIdentity = assertProductionRenderPublicationCurrent({
        identity: candidate.publication,
        plan: props.plan,
    });
    if (candidate.compileFingerprint !== publication.compileFingerprint)
        throw new Error("The terminal render manifest compile fingerprint differs from its publication identity.");
    if (props.inputCurrent() !== true || props.planCurrent() !== true)
        throw new AutoMovieProductionInputRaceError("Production inputs or the render plan changed before terminal publication began.");
    if (productionProjectGeneratedManifest(state)?.inputFingerprint !==
        candidate.compileFingerprint)
        throw new AutoMovieProductionInputRaceError("The terminal publication does not target the current builder input. Replan and rerender before finalizing.");
    const renderRoot: string = productionProjectRenderRoot(state);
    const files: Map<string, { bytes: Buffer; relative: string; target: string; }> = new Map<string, {
        bytes: Buffer;
        relative: string;
        target: string;
    }>();
    for (const [relativePath, content] of props.files) {
        const relative: string = productionProjectCanonicalProductionRenderPath(relativePath);
        const target: string = resolveInside(renderRoot, relative);
        const key: string = relative.toLowerCase();
        if (files.has(key))
            throw new Error(`Terminal publication maps more than one byte source to "${relative}". Keep one canonical render path.`);
        files.set(key, { bytes: Buffer.from(content), relative, target });
    }
    const receiptFiles: IAutoMovieProductionRenderReceipt["files"] = [];
    const claimed: Set<string> = new Set<string>();
    for (const deliverable of candidate.deliverables)
        for (const file of deliverable.files) {
            const relative: string = productionProjectCanonicalProductionRenderPath(file.path);
            const key: string = relative.toLowerCase();
            if (claimed.has(key))
                throw new Error(`Render file "${file.path}" is claimed more than once. Give it one deliverable owner.`);
            claimed.add(key);
            const supplied: { bytes: Buffer; relative: string; target: string; } | undefined = files.get(key);
            if (supplied === undefined)
                throw new Error(`Terminal publication is missing claimed file "${file.path}".`);
            const bytes: Buffer<ArrayBufferLike> = supplied.bytes;
            const digest: string = digestAutoMovieBytes(bytes);
            if (bytes.length !== file.bytes || digest !== file.digest)
                throw new Error(`Terminal publication file "${file.path}" differs from its manifest byte facts.`);
            const probe: IAutoMovieProductionMediaProbe = probeProductionMedia({
                kind: deliverable.kind,
                mediaType: file.mediaType,
                bytes,
            });
            // The same classifier the final gate and the proxy preflight consult,
            // so a receipt recording incomplete runtime coverage cannot enter the
            // terminal ledger through this commit either.
            assertAutoMovieProductionDeliverableSemanticMask({
                deliverable,
                file,
                probe,
                bytes,
                plan: props.plan,
            });
            receiptFiles.push({
                deliverable: deliverable.id,
                ...file,
                probe,
            });
        }
    if (files.size !== claimed.size)
        throw new Error(`Terminal publication supplied ${files.size} files but the manifest claims ${claimed.size}. Remove unclaimed bytes.`);
    receiptFiles.sort((left: IAutoMovieProductionRenderReceiptFile, right: IAutoMovieProductionRenderReceiptFile): number => compareCodeUnits(left.path, right.path));
    const manifestContent: string = productionProjectSerializeJson(candidate);
    const receiptContent: string = productionProjectSerializeJson({
        version: 4,
        manifestDigest: digestAutoMovieBytes(Buffer.from(manifestContent, "utf8")),
        publicationFingerprint: publication.fingerprint,
        files: receiptFiles,
    } satisfies IAutoMovieProductionRenderReceipt);
    const payload: { bytes: Buffer; relative: string; target: string; }[] = candidate.deliverables.flatMap((deliverable: IAutoMovieProductionRenderedDeliverable): { bytes: Buffer; relative: string; target: string; }[] => deliverable.files.map((file: IAutoMovieProductionDeliverableFile): { bytes: Buffer; relative: string; target: string; } => {
        const key: string = productionProjectCanonicalProductionRenderPath(file.path).toLowerCase();
        return files.get(key)!;
    }));
    const writes: () => IStagedFile[] = (): IStagedFile[] => [
        ...payload.flatMap((entry: { bytes: Buffer; relative: string; target: string; }): IStagedFile[] => {
            if (lstatOrNull(entry.target) === null)
                return [
                    {
                        path: entry.target,
                        content: entry.bytes,
                        immutable: true,
                    },
                ];
            const resident: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, entry.relative);
            if (Buffer.from(resident).equals(entry.bytes) === false)
                throw new AutoMovieProductionInputRaceError(`Immutable terminal publication path "${entry.relative}" already contains another payload generation. Replan before publishing different bytes.`);
            return [];
        }),
        {
            path: path.join(state.productionStateRoot, "render-manifest.json"),
            content: manifestContent,
        },
        {
            path: path.join(state.productionStateRoot, "render-manifest-receipt.json"),
            content: receiptContent,
        },
    ];
    return productionProjectCommitFiles(state, writes, (): boolean => props.inputCurrent() === true && props.planCurrent() === true, props.expectedRevision, (): void => {
        const assertLedgerCurrent: () => void = (): void => {
            const residentManifest: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, "render-manifest.json");
            const residentReceipt: Uint8Array<ArrayBufferLike> | null = productionProjectReadTrackedStateFile(state, "render-manifest-receipt.json");
            if (residentManifest === null ||
                residentReceipt === null ||
                Buffer.from(residentManifest).equals(Buffer.from(manifestContent, "utf8")) === false ||
                Buffer.from(residentReceipt).equals(Buffer.from(receiptContent, "utf8")) === false)
                throw new AutoMovieProductionInputRaceError("Terminal render manifest or receipt changed after publication.");
        };
        for (const deliverable of candidate.deliverables)
            for (const file of deliverable.files) {
                const bytes: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, file.path);
                if (bytes.length !== file.bytes ||
                    digestAutoMovieBytes(bytes) !== file.digest)
                    throw new AutoMovieProductionInputRaceError(`Committed terminal file "${file.path}" failed its post-publication byte check.`);
            }
        assertLedgerCurrent();
        props.publicationCurrent();
        for (const deliverable of candidate.deliverables)
            for (const file of deliverable.files) {
                const bytes: Uint8Array<ArrayBufferLike> = productionProjectReadRenderFile(state, file.path);
                if (bytes.length !== file.bytes ||
                    digestAutoMovieBytes(bytes) !== file.digest)
                    throw new AutoMovieProductionInputRaceError(`Committed terminal file "${file.path}" changed during the final builder gate.`);
            }
        assertLedgerCurrent();
        if (props.inputCurrent() !== true || props.planCurrent() !== true)
            throw new AutoMovieProductionInputRaceError("Production inputs or the render-plan generation changed during the staged terminal publication final gate.");
    });
}
