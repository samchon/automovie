import { IAutoMovieConstraintViolation } from "@automovie/interface";
import { pushViolation, validateArrayArtifact, validateNonEmptyId, validateNonEmptyText, validateObjectArtifact, validateRange } from "../validators/primitives";

/**
 *
 * @evidence contracts/common.md#principled-implementation Closed node-kind dispatch validates its exact historical payload fields and dialogue entries.
 * @evidence contracts/common.md#clear-and-simple-design Keeps kind-dependent payload admission with tree shape validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown kinds are reported by the outer node gate; this switch invents no fallback payload.
 * @evidence contracts/common.md#meaningful-documentation States each variant's text/id/range and nullable fields.
 * @evidence contracts/performance.md#efficient-algorithms Visits payload fields and D dialogue rows with text/range gate costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One dispatch/collector serves the current node; no prior-kind verdict is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Findings transfer through the supplied collector without resource acquisition.
 */
export const autoMovieProjectValidateScriptTreePayload: (kind: unknown, payload: Record<string, unknown>, path: string, violations: IAutoMovieConstraintViolation[]) => void = (kind: unknown, payload: Record<string, unknown>, path: string, violations: IAutoMovieConstraintViolation[]): void => {
    switch (kind) {
        case "intent":
            validateNonEmptyText(payload.logline, `${path}.payload.logline`, "intent logline", violations);
            validateNonEmptyText(payload.theme, `${path}.payload.theme`, "intent theme", violations);
            break;
        case "act":
            validateNonEmptyText(payload.purpose, `${path}.payload.purpose`, "act purpose", violations);
            break;
        case "scene":
            if (payload.interiorExterior !== "INT" &&
                payload.interiorExterior !== "EXT")
                pushViolation(violations, "type", `${path}.payload.interiorExterior`, 'scene interiorExterior must be "INT" or "EXT"', payload.interiorExterior);
            validateNonEmptyText(payload.location, `${path}.payload.location`, "scene location", violations);
            validateNonEmptyText(payload.timeOfDay, `${path}.payload.timeOfDay`, "scene timeOfDay", violations);
            if (payload.description !== null)
                validateNonEmptyText(payload.description, `${path}.payload.description`, "scene description", violations);
            break;
        case "group":
            validateNonEmptyText(payload.rationale, `${path}.payload.rationale`, "group rationale", violations);
            break;
        case "beat":
            validateNonEmptyId(payload.beat, `${path}.payload.beat`, "tree beat id", violations);
            validateNonEmptyText(payload.direction, `${path}.payload.direction`, "beat direction", violations);
            if (validateArrayArtifact(payload.dialogue, `${path}.payload.dialogue`, "beat dialogue", violations))
                payload.dialogue.forEach((line: unknown, index: number): void => {
                    const linePath: string = `${path}.payload.dialogue[${index}]`;
                    if (!validateObjectArtifact(line, linePath, "beat dialogue line", violations))
                        return;
                    validateNonEmptyText(line.speaker, `${linePath}.speaker`, "dialogue speaker", violations);
                    validateNonEmptyText(line.text, `${linePath}.text`, "dialogue text", violations);
                    if (line.anchor !== null)
                        validateRange(line.anchor, `${linePath}.anchor`, 0, Infinity, "dialogue anchor", violations);
                });
            if (payload.caption !== null)
                validateNonEmptyText(payload.caption, `${path}.payload.caption`, "beat caption", violations);
            break;
    }
};
