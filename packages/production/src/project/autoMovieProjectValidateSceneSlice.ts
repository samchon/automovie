import { IAutoMovieConstraintViolation, IAutoMovieScene } from "@automovie/interface";
import { validateSceneArtifact } from "../validators/artifacts";
import { appendValidation } from "../validators/primitives";
import { autoMovieProjectResidentSceneModels } from "./autoMovieProjectResidentSceneModels";

/**
 * Append portable scene findings using model-id placeholders derived from this scene's own nodes. This checks scene structure and delegated spatial/light/environment rules; it does not authenticate model existence in an external catalogue or admit skeleton contents.
 *
 * @evidence contracts/common.md#principled-implementation Observed model ids form skeleton-null registry placeholders for portable scene validation.
 * @evidence contracts/common.md#clear-and-simple-design Admits stored scene shape while actual model/skeleton context remains external.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The registry derives from this scene rather than authenticating a foreign catalogue; skeletal and cross-record semantics are not proved here.
 * @evidence contracts/common.md#meaningful-documentation States self-derived model registry and delegated scene semantics.
 * @evidence contracts/performance.md#efficient-algorithms Scans nodes for ids and includes complete scene/light/space validation, including quadratic footprint relations.
 * @evidence contracts/performance.md#reuse-equivalent-work One deduplicated model-id list feeds scene admission; no stored scene cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary registry expires and caller findings retain offending values.
 */
export const autoMovieProjectValidateSceneSlice: (value: unknown, violations: IAutoMovieConstraintViolation[]) => void = (value: unknown, violations: IAutoMovieConstraintViolation[]): void => {
    appendValidation(violations, validateSceneArtifact(value as IAutoMovieScene, autoMovieProjectResidentSceneModels(value).map((id: string): {
        id: string;
        skeleton: null;
    } => ({ id, skeleton: null }))));
};
