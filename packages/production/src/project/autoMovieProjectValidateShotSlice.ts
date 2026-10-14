import { appendLightMotionsArtifact, appendShotMetadataArtifact, validateClipArtifact } from "@automovie/engine";
import { IAutoMovieConstraintViolation, IAutoMovieShot } from "@automovie/interface";
import { isRecord, pushViolation, validateArrayArtifact, validateNonEmptyId, validateObjectArtifact, validateRange, validateUniqueBy, validateUniqueIds } from "../validators/primitives";
import { autoMovieProjectAsArray } from "./autoMovieProjectAsArray";

/**
 *
 * @evidence contracts/common.md#principled-implementation Shot identity/duration, hero/object clips, performances, metadata and light motions are admitted with their real field paths.
 * @evidence contracts/common.md#clear-and-simple-design Joins resident shot gates while scene-dependent camera/light references stay separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null scene context intentionally defers registry references; malformed clips and duplicate motion ids still refuse.
 * @evidence contracts/common.md#meaningful-documentation States clip timing, metadata/light-time admission and absent scene-context limits.
 * @evidence contracts/performance.md#efficient-algorithms Visits performance/motion/keyframe/metadata populations and includes each shared engine gate's full cost.
 * @evidence contracts/performance.md#reuse-equivalent-work One violation array combines delegated current-shot checks without reparsing or caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns findings and offending values; temporary collections expire.
 */
export const autoMovieProjectValidateShotSlice: (value: IAutoMovieShot, violations: IAutoMovieConstraintViolation[]) => void = (value: IAutoMovieShot, violations: IAutoMovieConstraintViolation[]): void => {
    validateNonEmptyId(value.id, "$input.id", "shot id", violations);
    validateNonEmptyId(value.scene, "$input.scene", "shot scene", violations);
    validateNonEmptyId(value.camera, "$input.camera", "shot camera", violations);
    validateRange(value.duration, "$input.duration", 0, Infinity, "shot duration", violations, false);
    if (value.cameraMotion !== null && value.cameraMotion !== undefined)
        validateClipArtifact(value.cameraMotion, "$input.cameraMotion", violations);
    else if (value.cameraMotion === undefined)
        pushViolation(violations, "type", "$input.cameraMotion", "shot cameraMotion must be null or a clip", value.cameraMotion);
    validateArrayArtifact(value.performances, "$input.performances", "shot performances", violations);
    validateUniqueBy(autoMovieProjectAsArray(value.performances).map((performance: unknown, index: number): {
        id: unknown;
        path: string;
    } => ({
        id: isRecord(performance) ? performance.node : undefined,
        path: `$input.performances[${index}].node`,
    })), "shot performance node", violations);
    autoMovieProjectAsArray(value.performances).forEach((performance: unknown, index: number): void => {
        const path: string = `$input.performances[${index}]`;
        if (!validateObjectArtifact(performance, path, "shot performance", violations))
            return;
        validateNonEmptyId(performance.node, `${path}.node`, "performance node", violations);
        validateRange(performance.startOffset, `${path}.startOffset`, 0, typeof value.duration === "number" ? value.duration : Infinity, "performance startOffset", violations);
        if (performance.motion !== null && performance.motion !== undefined)
            validateNonEmptyId(performance.motion, `${path}.motion`, "performance motion", violations);
    });
    if (validateArrayArtifact(value.objectMotions, "$input.objectMotions", "shot objectMotions", violations)) {
        validateUniqueIds(value.objectMotions, "$input.objectMotions", "object motion clip id", violations);
        value.objectMotions.forEach((clip: IAutoMovieShot["objectMotions"][number], index: number): void => validateClipArtifact(clip, `$input.objectMotions[${index}]`, violations));
    }
    appendShotMetadataArtifact(value, "$input", null, violations);
    appendLightMotionsArtifact(value.lightMotions, "$input.lightMotions", null, violations);
};
