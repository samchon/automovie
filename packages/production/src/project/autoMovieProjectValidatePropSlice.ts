import { forgeProp, validateModel as validateEngineModel } from "@automovie/engine";
import { IAutoMovieConstraintViolation, IAutoMovieModel } from "@automovie/interface";
import { appendValidation, pushViolation, validateNonEmptyId, validateObjectArtifact } from "../validators/primitives";
import { IAutoMovieLegacyPropSpec, toEnginePropSpec } from "./legacyRecords";

/**
 * Append preliminary stored-prop findings, then lower and forge only when this pass added none, including no warnings. The typed outer record is borrowed; lowering omits modelRef and selects generated-model admission. Any lowering/forge exception becomes the existing articulation-shape finding rather than preserving its original cause.
 *
 * @evidence contracts/common.md#principled-implementation Node/model/articulation shape and engine model admission precede legacy lowering and forgeProp validation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps historical range lowering with the compatibility owner and active prop semantics with the engine; that lowering omits modelRef and therefore selects generated-model forging.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Forging runs only after new preliminary findings are absent; conversion throws become located articulation refusal rather than recovered content.
 * @evidence contracts/common.md#meaningful-documentation States preliminary gate, engine refusal propagation and conversion-error location.
 * @evidence contracts/performance.md#efficient-algorithms Includes preliminary model validation and, after its success, a second model pass, D-driver lowering, profile/part/mapping checks and up to O(J^2) joint parent walks; model checks include the model's nested populations, while lowering omits modelRef so forge's imported-appearance branch is not reached.
 * @evidence contracts/performance.md#reuse-equivalent-work The same supplied model/record feeds both passes; no successful-forge result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary conversion/forge outputs expire; caller findings retain offending data.
 */
export const autoMovieProjectValidatePropSlice: (value: IAutoMovieLegacyPropSpec, violations: IAutoMovieConstraintViolation[]) => void = (value: IAutoMovieLegacyPropSpec, violations: IAutoMovieConstraintViolation[]): void => {
    const before: number = violations.length;
    validateNonEmptyId(value.node, "$input.node", "prop node", violations);
    if (validateObjectArtifact(value.model, "$input.model", "prop model", violations))
        appendValidation(violations, validateEngineModel({ model: value.model as unknown as IAutoMovieModel }));
    if (value.articulation !== null && value.articulation !== undefined)
        validateObjectArtifact(value.articulation, "$input.articulation", "prop articulation", violations);
    else if (value.articulation === undefined)
        pushViolation(violations, "type", "$input.articulation", "prop articulation must be null or a JSON object", value.articulation);
    if (violations.length !== before)
        return;
    try {
        const forged: ReturnType<typeof forgeProp> = forgeProp(toEnginePropSpec(value as unknown as IAutoMovieLegacyPropSpec));
        if (forged.success === false)
            violations.push(...forged.violations);
    }
    catch {
        pushViolation(violations, "type", "$input.articulation", "prop articulation must match the forgeProp schema", value.articulation);
    }
};
