import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";
import { IAutoMovieGeneratedManifest, IAutoMovieRenderBundleManifest } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { AUTOMOVIE_RENDER_TARGET_FINGERPRINT_PROTOCOL } from "./AUTOMOVIE_RENDER_TARGET_FINGERPRINT_PROTOCOL";

/**
 * Hash the selected generated target and explicitly declared render content under the target identity protocol.
 *
 * @evidence contracts/common.md#principled-implementation Protocol, target, namespace and builder precede selected generated digests and render-content bytes in supplied order; synchronous stable payloads and an admitted complete manifest/content population are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design Preview, build review and inspection share this target-local identity without another render cache or capture host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unrelated generated targets are excluded only for shot/asset targets; film/sequence use every generated file. The captured dependency declaration must be complete, and digest equality alone cannot establish actual rendered bytes.
 * @evidence contracts/common.md#meaningful-documentation Defines default live content acquisition, target-local selection, caller ordering and borrowed payload ownership; source text is included only when explicitly declared render content.
 * @evidence contracts/performance.md#efficient-algorithms Scans G generated entries and C content records, serializes target/builder metadata and hashes selected digest/label/payload bytes; serialization and label allocation add to retained borrowed media inputs.
 * @evidence contracts/performance.md#reuse-equivalent-work Already acquired generated digests and content buffers feed the synchronous hash directly; no prior target verdict substitutes for current input acquisition.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Field records and metadata buffers expire after hashing; borrowed content remains caller-owned, and only the digest transfers. No capture task or descriptor is acquired.
 */
export const productionRenderTargetFingerprint: (project: AutoMovieProductionProject, generated: IAutoMovieGeneratedManifest, target: IAutoMovieRenderBundleManifest["target"], contentInputs?: ReturnType<AutoMovieProductionProject["contentInputs"]>) => string = (project: AutoMovieProductionProject, generated: IAutoMovieGeneratedManifest, target: IAutoMovieRenderBundleManifest["target"], contentInputs: ReturnType<AutoMovieProductionProject["contentInputs"]> = project.contentInputs()): string => {
    const fields: IAutoMovieFingerprintField[] = [
        {
            role: "protocol",
            kind: "render-target",
            payload: Buffer.from(AUTOMOVIE_RENDER_TARGET_FINGERPRINT_PROTOCOL, "utf8"),
        },
        {
            role: "target",
            kind: target.kind,
            payload: canonicalAutoMovieJsonBytes(target),
        },
        {
            role: "production",
            kind: "namespace",
            payload: Buffer.from(project.productionId, "utf8"),
        },
        {
            role: "builder",
            kind: "identity",
            payload: canonicalAutoMovieJsonBytes(generated.builder),
        },
    ];
    const targetPath: string | null = target.kind === "shot"
        ? `shots/${encodeAutoMoviePathSegment(target.id)}.json`
        : target.kind === "asset"
            ? `models/${encodeAutoMoviePathSegment(target.id)}.json`
            : null;
    for (const file of generated.files)
        if (targetPath === null || file.path === targetPath)
            fields.push({
                role: `generated:${file.path}`,
                kind: "digest",
                payload: Buffer.from(file.digest, "utf8"),
            });
    for (const content of contentInputs)
        if (content.render)
            fields.push({
                role: `content:${content.path}`,
                kind: content.bytes === null ? "absent" : "file",
                payload: content.bytes ?? new Uint8Array(),
            });
    return fingerprintAutoMovieFields(fields);
};
