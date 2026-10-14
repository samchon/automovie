import { SHA256_DIGEST_PATTERN } from "@automovie/engine";
import { canonicalAutoMovieJsonBytes, compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import type { IAutoMovieProductionRenderChunk, IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import type { IAutoMovieProductionRenderGcCandidate } from "./IAutoMovieProductionRenderGcCandidate";
import type { AutoMovieProductionRenderArtifactState } from "./AutoMovieProductionRenderArtifactState";
import type { AutoMovieProductionRenderCleanupAuthority } from "./AutoMovieProductionRenderCleanupAuthority";
import type { AutoMovieProductionRenderArtifactStage } from "./AutoMovieProductionRenderArtifactStage";
import type { IAutoMovieProductionRenderCleanupObservation } from "./IAutoMovieProductionRenderCleanupObservation";
import type { IAutoMovieProductionRenderCleanupDecision } from "./IAutoMovieProductionRenderCleanupDecision";
import type { IAutoMovieProductionRenderCleanupReceipt } from "./IAutoMovieProductionRenderCleanupReceipt";
import type { IUnreceiptedRenderCleanupDecision } from "./IUnreceiptedRenderCleanupDecision";
import type { IAutoMovieProductionRenderGcPlan } from "./IAutoMovieProductionRenderGcPlan";
import { isProductionRenderCleanupState } from "./isProductionRenderCleanupState";
import { isProductionRenderCleanupAuthority } from "./isProductionRenderCleanupAuthority";
import { isProductionRenderCleanupStage } from "./isProductionRenderCleanupStage";
import { productionRenderGcRelativePath } from "./productionRenderGcRelativePath";

/**
 * Partition supplied render inventory into retained, removable, quarantined and manual decisions.
 *
 * @evidence contracts/common.md#principled-implementation Canonical paths and candidate claims are validated, current plan/publication/pair/cache references mark exact targets, and observation state/authority plus captured generation facts choose disposition. Host-supplied physical claims and admitted plan/candidate families are required premises.
 * @evidence contracts/common.md#clear-and-simple-design One pure planner binds decisions/receipts to a canonical basis; it performs no mutation and has no live application caller identified.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uncertain/foreign/corrupt states do not become stale, pointer/tree retention requires one current pair, and a schema-valid claimed generation is not independent physical proof. The implementation trusts the typed kind union and does not separately reject an unknown runtime kind.
 * @evidence contracts/common.md#meaningful-documentation States host authority premises, deterministic ordering, exact-generation requirement, safe reclaim sum and returned dry-run ownership, without promising physical apply.
 * @evidence contracts/performance.md#efficient-algorithms For N candidates/P plans and total serialized plan/basis bytes B, includes candidate sorting O(N log N), reference sets/pair validation, complete plan canonicalization/sorting and complete basis serialization/hash; path/text lengths and duplicated receipt records contribute to space.
 * @evidence contracts/performance.md#reuse-equivalent-work Reference populations are indexed once, each normalized candidate feeds one decision, and one basis supplies every receipt; no previous inventory result substitutes for host currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Complete candidate/decision arrays, sets, serialized plan keys/basis and receipts can coexist without a byte cap. Returned decisions retain normalized candidate objects and borrowed nested observations; no native handle or task is owned.
 */
export function planProductionRenderGc(props: {
    /** Current plans from every retained tier. */
    plans: readonly IAutoMovieProductionRenderJobPlan[];

    /** Paths claimed by the current aggregate publication manifest. */
    publicationPaths: readonly string[];

    /** Exact pointer/tree paths authenticated as current by the renderer host. */
    retainedChunkPaths: readonly string[];

    /** Exact dialogue/model generations authenticated as current by the sound host. */
    retainedCachePaths: readonly string[];

    /** Physical inventory collected without following links. */
    candidates: readonly IAutoMovieProductionRenderGcCandidate[];
}): IAutoMovieProductionRenderGcPlan {
    const activeChunks: Set<string> = new Set(props.plans.flatMap((plan: IAutoMovieProductionRenderJobPlan): string[] => plan.chunks.map((chunk: IAutoMovieProductionRenderChunk): string => `${plan.tier.kind}\0${chunk.id.slice("sha256:".length)}`)));
    const activePublication: Set<string> = new Set(props.publicationPaths.map(productionRenderGcRelativePath));
    const retainedChunkPaths: Set<string> = new Set<string>();
    for (const value of props.retainedChunkPaths) {
        const path: string = productionRenderGcRelativePath(value);
        if (retainedChunkPaths.has(path))
            throw new Error(`Render GC retained chunk path "${path}" is duplicate.`);
        retainedChunkPaths.add(path);
    }
    const retainedCachePaths: Set<string> = new Set<string>();
    for (const value of props.retainedCachePaths) {
        const path: string = productionRenderGcRelativePath(value);
        if (retainedCachePaths.has(path))
            throw new Error(`Render GC retained cache path "${path}" is duplicate.`);
        retainedCachePaths.add(path);
    }
    const paths: Set<string> = new Set<string>();
    const chunkPublicationCandidates: Set<string> = new Set<string>();
    const retain: IUnreceiptedRenderCleanupDecision[] = [];
    const remove: IUnreceiptedRenderCleanupDecision[] = [];
    const quarantine: IUnreceiptedRenderCleanupDecision[] = [];
    const manualAdjudication: IUnreceiptedRenderCleanupDecision[] = [];
    for (const candidate of [...props.candidates].sort((left: IAutoMovieProductionRenderGcCandidate, right: IAutoMovieProductionRenderGcCandidate): 1 | -1 | 0 => left.path < right.path ? -1 : left.path > right.path ? 1 : 0)) {
        const path: string = productionRenderGcRelativePath(candidate.path);
        const chunkPath: RegExpExecArray | null = /^(proxy|final)\/chunks\/([0-9a-f]{64})$/u.exec(path);
        const pointerPath: RegExpExecArray | null = /^(proxy|final)\/pointers\/([0-9a-f]{64})$/u.exec(path);
        const treePath: RegExpExecArray | null = /^(proxy|final)\/tmp\/([0-9a-f]{64})\.[^/]+$/u.exec(path);
        const ownedDigest: string | undefined = candidate.kind === "chunk"
            ? chunkPath?.[2]
            : candidate.kind === "chunk-pointer"
                ? pointerPath?.[2]
                : candidate.kind === "chunk-tree"
                    ? treePath?.[2]
                    : undefined;
        const cachePath: RegExpExecArray | null = candidate.kind === "dialogue-cache"
            ? /^audio-cache\/kokoro\/([^/]+)$/u.exec(path)
            : candidate.kind === "model-cache"
                ? /^model-cache\/kokoro\/([^/]+)$/u.exec(path)
                : null;
        if (paths.has(path) ||
            (candidate.bytes !== null &&
                (Number.isSafeInteger(candidate.bytes) === false ||
                    candidate.bytes < 0)) ||
            (candidate.generation !== null &&
                (candidate.generation.trim().length === 0 ||
                    /[\r\n\0]/u.test(candidate.generation))) ||
            (candidate.fingerprint !== null &&
                SHA256_DIGEST_PATTERN.test(candidate.fingerprint) === false) ||
            (candidate.observation !== null &&
                (isProductionRenderCleanupState(candidate.observation.state) === false ||
                    isProductionRenderCleanupAuthority(candidate.observation.authority) === false ||
                    isProductionRenderCleanupStage(candidate.observation.stage) === false ||
                    candidate.observation.reason.trim().length === 0 ||
                    /[\r\n\0]/u.test(candidate.observation.reason))) ||
            ((candidate.kind === "chunk" ||
                candidate.kind === "chunk-pointer" ||
                candidate.kind === "chunk-tree") &&
                (candidate.digest === null ||
                    SHA256_DIGEST_PATTERN.test(candidate.digest) === false ||
                    ownedDigest === undefined ||
                    candidate.digest !== `sha256:${ownedDigest}`)) ||
            (candidate.kind === "quarantine" &&
                /^(?:(?:proxy|final)\/quarantine|quarantine\/(?:project|production|render-job|publication))\/[^/]+$/u.test(path) === false) ||
            (candidate.kind === "publication" &&
                path.startsWith("publication/") === false) ||
            ((candidate.kind === "dialogue-cache" ||
                candidate.kind === "model-cache") &&
                (cachePath === null ||
                    candidate.digest === null ||
                    SHA256_DIGEST_PATTERN.test(candidate.digest) === false)) ||
            (candidate.kind !== "chunk" &&
                candidate.kind !== "chunk-pointer" &&
                candidate.kind !== "chunk-tree" &&
                candidate.kind !== "dialogue-cache" &&
                candidate.kind !== "model-cache" &&
                candidate.digest !== null))
            throw new Error(`Render GC candidate "${candidate.path}" has duplicate or invalid ownership facts.`);
        paths.add(path);
        if (candidate.kind === "chunk-pointer" || candidate.kind === "chunk-tree")
            chunkPublicationCandidates.add(path);
        const normalized: IAutoMovieProductionRenderGcCandidate = { ...candidate, path };
        const marked: boolean = (candidate.kind === "chunk" &&
            chunkPath !== null &&
            activeChunks.has(`${chunkPath[1]}\0${chunkPath[2]}`)) ||
            ((candidate.kind === "chunk-pointer" ||
                candidate.kind === "chunk-tree") &&
                retainedChunkPaths.has(path)) ||
            ((candidate.kind === "dialogue-cache" ||
                candidate.kind === "model-cache") &&
                retainedCachePaths.has(path)) ||
            (candidate.kind === "publication" && activePublication.has(path));
        const observation: IAutoMovieProductionRenderCleanupObservation = normalized.observation ??
            (marked
                ? {
                    state: "current" as const,
                    authority: "none" as const,
                    stage: "reference" as const,
                    reason: "the current plan or aggregate publication marks this exact target",
                }
                : {
                    state: "verified-stale" as const,
                    authority: "exact-remove" as const,
                    stage: "reference" as const,
                    reason: "no current plan, authenticated chunk pair, cache generation, or publication references this exact target",
                });
        const decision: IUnreceiptedRenderCleanupDecision = {
            candidate: normalized,
            state: observation.state,
            authority: observation.authority,
            stage: observation.stage,
            reason: observation.reason,
        };
        const exactGeneration: boolean = normalized.bytes !== null &&
            normalized.generation !== null &&
            normalized.fingerprint !== null;
        if (observation.state === "current" &&
            observation.authority === "none" &&
            marked)
            retain.push(decision);
        else if (observation.state === "absent" && observation.authority === "none")
            retain.push(decision);
        else if (observation.state === "verified-stale" &&
            observation.authority === "exact-remove" &&
            exactGeneration)
            remove.push(decision);
        else if (observation.state === "integrity-failed" &&
            observation.authority === "exact-quarantine" &&
            exactGeneration)
            quarantine.push(decision);
        else
            manualAdjudication.push(decision);
    }
    for (const path of retainedChunkPaths)
        if (chunkPublicationCandidates.has(path) === false)
            throw new Error(`Render GC retained chunk path "${path}" has no exact pointer/tree candidate.`);
    const cacheCandidates: Set<string> = new Set(props.candidates
        .filter((candidate: IAutoMovieProductionRenderGcCandidate): boolean => candidate.kind === "dialogue-cache" ||
        candidate.kind === "model-cache")
        .map((candidate: IAutoMovieProductionRenderGcCandidate): string => productionRenderGcRelativePath(candidate.path)));
    for (const path of retainedCachePaths)
        if (cacheCandidates.has(path) === false)
            throw new Error(`Render GC retained cache path "${path}" has no exact cache candidate.`);
    const retainedPairs: Map<string, {
        pointers: number;
        trees: number;
    }> = new Map<string, {
        pointers: number;
        trees: number;
    }>();
    for (const path of retainedChunkPaths) {
        const pointer: RegExpExecArray | null = /^(proxy|final)\/pointers\/([0-9a-f]{64})$/u.exec(path);
        const tree: RegExpExecArray | null = /^(proxy|final)\/tmp\/([0-9a-f]{64})\.[^/]+$/u.exec(path);
        // Retained paths already proved an exact pointer/tree candidate above.
        const match: RegExpExecArray = (pointer ?? tree)!;
        const key: string = `${match[1]}\0${match[2]}`;
        const pair: {
            pointers: number;
            trees: number;
        } = retainedPairs.get(key) ?? { pointers: 0, trees: 0 };
        if (pointer === null)
            pair.trees++;
        else
            pair.pointers++;
        retainedPairs.set(key, pair);
    }
    for (const [key, pair] of retainedPairs)
        if (pair.pointers !== 1 ||
            pair.trees !== 1 ||
            activeChunks.has(key) === false)
            throw new Error(`Render GC retained chunk publication "${key.replace("\0", "/")}" is not one exact current pointer/tree pair.`);
    const reclaimableBytes: number = remove.reduce((total: number, decision: IUnreceiptedRenderCleanupDecision): number => total + decision.candidate.bytes!, 0);
    if (Number.isSafeInteger(reclaimableBytes) === false)
        throw new Error("Render GC reclaimable byte total exceeds safe integer range.");
    const dispositionEntries: {
        disposition: IAutoMovieProductionRenderCleanupReceipt['disposition'];
        decision: IUnreceiptedRenderCleanupDecision;
    }[] = [
        ...retain.map((decision: IUnreceiptedRenderCleanupDecision): {
            disposition: "retain";
            decision: IUnreceiptedRenderCleanupDecision;
        } => ({ disposition: "retain" as const, decision })),
        ...remove.map((decision: IUnreceiptedRenderCleanupDecision): {
            disposition: "remove";
            decision: IUnreceiptedRenderCleanupDecision;
        } => ({ disposition: "remove" as const, decision })),
        ...quarantine.map((decision: IUnreceiptedRenderCleanupDecision): {
            disposition: "quarantine";
            decision: IUnreceiptedRenderCleanupDecision;
        } => ({
            disposition: "quarantine" as const,
            decision,
        })),
        ...manualAdjudication.map((decision: IUnreceiptedRenderCleanupDecision): {
            disposition: "manual-adjudication";
            decision: IUnreceiptedRenderCleanupDecision;
        } => ({
            disposition: "manual-adjudication" as const,
            decision,
        })),
    ].sort((left: {
        disposition: "retain";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "remove";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "quarantine";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "manual-adjudication";
        decision: IUnreceiptedRenderCleanupDecision;
    }, right: {
        disposition: "retain";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "remove";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "quarantine";
        decision: IUnreceiptedRenderCleanupDecision;
    } | {
        disposition: "manual-adjudication";
        decision: IUnreceiptedRenderCleanupDecision;
    }): number =>
    // Candidate paths were proved unique above, so the path alone orders the
    // partition.
    compareCodeUnits(left.decision.candidate.path, right.decision.candidate.path));
    const planKeys: string[] = props.plans
        .map((plan: IAutoMovieProductionRenderJobPlan): string => Buffer.from(canonicalAutoMovieJsonBytes(plan)).toString())
        .sort(compareCodeUnits);
    const basis: string = digestAutoMovieBytes(canonicalAutoMovieJsonBytes({
        version: 1,
        plans: planKeys,
        publicationPaths: [...activePublication].sort(compareCodeUnits),
        retainedChunkPaths: [...retainedChunkPaths].sort(compareCodeUnits),
        retainedCachePaths: [...retainedCachePaths].sort(compareCodeUnits),
        decisions: dispositionEntries,
    }));
    const bind: (disposition: IAutoMovieProductionRenderCleanupReceipt["disposition"], decisions: readonly IUnreceiptedRenderCleanupDecision[]) => IAutoMovieProductionRenderCleanupDecision[] = (disposition: IAutoMovieProductionRenderCleanupReceipt["disposition"], decisions: readonly IUnreceiptedRenderCleanupDecision[]): IAutoMovieProductionRenderCleanupDecision[] => decisions.map((decision: IUnreceiptedRenderCleanupDecision): {
        receipt: {
            version: 1;
            basis: string;
            disposition: "quarantine" | "retain" | "remove" | "manual-adjudication";
            kind: "chunk" | "chunk-pointer" | "chunk-tree" | "dialogue-cache" | "model-cache" | "quarantine" | "publication";
            path: string;
            generation: string | null;
            fingerprint: string | null;
            state: AutoMovieProductionRenderArtifactState;
            authority: AutoMovieProductionRenderCleanupAuthority;
            stage: AutoMovieProductionRenderArtifactStage;
            reason: string;
        };
        state: AutoMovieProductionRenderArtifactState;
        reason: string;
        candidate: IAutoMovieProductionRenderGcCandidate;
        authority: AutoMovieProductionRenderCleanupAuthority;
        stage: AutoMovieProductionRenderArtifactStage;
    } => ({
        ...decision,
        receipt: {
            version: 1,
            basis,
            disposition,
            kind: decision.candidate.kind,
            path: decision.candidate.path,
            generation: decision.candidate.generation,
            fingerprint: decision.candidate.fingerprint,
            state: decision.state,
            authority: decision.authority,
            stage: decision.stage,
            reason: decision.reason,
        },
    }));
    return {
        version: 4,
        basis,
        retain: bind("retain", retain),
        remove: bind("remove", remove),
        quarantine: bind("quarantine", quarantine),
        manualAdjudication: bind("manual-adjudication", manualAdjudication),
        reclaimableBytes,
    };
}
