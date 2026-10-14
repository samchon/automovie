import { IAutoMovieBeatEndState, IAutoMovieConstraintViolation } from "@automovie/interface";
import { isRecord, pushViolation, validateArrayArtifact, validateNonEmptyId, validateObjectArtifact, validateRange, validateTransformArtifact, validateUniqueBy, validateVectorArtifact } from "../validators/primitives";
import { shotIdOf } from "./shotKey";
import { autoMovieProjectAsArray } from "./autoMovieProjectAsArray";

/**
 * Append continuity-end identity and actor-state findings for a record admitted by the keyed reader. Shot identity must match the beat-derived id; actor transforms and facing vectors use shared numeric rules, and localTime is finite non-negative seconds. Actor membership and motion residency remain external checks, and this typed entry dereferences the outer record without a new shape guard.
 *
 * @evidence contracts/common.md#principled-implementation Beat/shot identity correspondence precedes actor id, transform, facing and local-time admission.
 * @evidence contracts/common.md#clear-and-simple-design Owns stored continuity-end shape without inventing starting actor context.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shot matching is checked only after string shape; actor membership/motion registry resolution remain external.
 * @evidence contracts/common.md#meaningful-documentation States seconds, vector/transform shape and beat-to-shot mapping.
 * @evidence contracts/performance.md#efficient-algorithms Scans A actors plus their nested fixed-shape values and uniqueness checks.
 * @evidence contracts/performance.md#reuse-equivalent-work The current actor population shares one collector without cached continuity verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned findings retain original offending values; no resource opens.
 */
export const autoMovieProjectValidateBeatEndSlice: (value: IAutoMovieBeatEndState, violations: IAutoMovieConstraintViolation[]) => void = (value: IAutoMovieBeatEndState, violations: IAutoMovieConstraintViolation[]): void => {
    validateNonEmptyId(value.beat, "$input.beat", "beat id", violations);
    validateNonEmptyId(value.shot, "$input.shot", "shot id", violations);
    if (typeof value.beat === "string" &&
        typeof value.shot === "string" &&
        value.shot !== shotIdOf(value.beat))
        pushViolation(violations, "type", "$input.shot", `beat-end shot must equal "${shotIdOf(value.beat)}"`, value.shot);
    validateArrayArtifact(value.actors, "$input.actors", "beat-end actors", violations);
    validateUniqueBy(autoMovieProjectAsArray(value.actors).map((actor: unknown, index: number): {
        id: unknown;
        path: string;
    } => ({
        id: isRecord(actor) ? actor.node : undefined,
        path: `$input.actors[${index}].node`,
    })), "beat-end actor", violations);
    autoMovieProjectAsArray(value.actors).forEach((actor: unknown, index: number): void => {
        const path: string = `$input.actors[${index}]`;
        if (!validateObjectArtifact(actor, path, "beat-end actor", violations))
            return;
        validateNonEmptyId(actor.node, `${path}.node`, "actor node", violations);
        validateTransformArtifact(actor.transform, `${path}.transform`, "beat-end actor transform", violations);
        validateVectorArtifact(actor.facing, `${path}.facing`, "beat-end actor facing", violations);
        validateRange(actor.localTime, `${path}.localTime`, 0, Infinity, "beat-end actor localTime", violations);
        if (actor.motion !== null && actor.motion !== undefined)
            validateNonEmptyId(actor.motion, `${path}.motion`, "beat-end actor motion", violations);
    });
};
