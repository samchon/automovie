import type { IAutoMovieDesignMutationOutput, IAutoMovieModelRecipe } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateModelRecipe } from "./productionProjectValidateModelRecipe";
import { productionProjectInputDesignId } from "./productionProjectInputDesignId";
import { productionProjectSetDesign } from "./productionProjectSetDesign";

/**
 * Upsert one shared model recipe through the existing schema, graph and revision admission path.
 *
 * @evidence contracts/common.md#principled-implementation The supplied object's ID is projected before exact model schema validation, then setDesign loads current graph/generated/screenplay context, refuses schema/case/target semantic errors and commits the shared model path under its revision/shared-mutation fence.
 * @evidence contracts/common.md#clear-and-simple-design This model-specific entry chooses target and schema only; setDesign owns consequences, downstream warnings, content fingerprint and atomic mutation without another recipe store.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid IDs retain the existing diagnostic placeholder and are not repaired into admitted recipes; newly invalid downstream artifacts become explicit warnings and still block compilation instead of preventing every staged author edit.
 * @evidence contracts/common.md#meaningful-documentation States project-shared recipe ownership, accepted/refused mutation output and delegated race/native errors; acceptance updates one recipe without compiling source or certifying all dependent artifacts.
 * @evidence contracts/performance.md#efficient-algorithms Includes exact recipe traversal, full graph load with keyed case scans, before/after graph validation and model-dependency consequence walks, copied/sorted model map, generated/screenplay observations and commit serialization/hash/staging; recipe size alone does not bound the operation.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied schema result and loaded graph feed mutation admission, while prior diagnostic identities distinguish new downstream failures; unchanged IDs do not permit sharing effectful commits or skipping resident observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input recipe remains borrowed; old/new graph and copied model maps, consequence/diagnostic populations and staged prior/new bytes coexist locally, with no fixed population cap. Reader/transaction owners release descriptors and locks, and only mutation output escapes.
 */
export function productionProjectSetModelRecipe(state: AutoMovieProductionProjectState, design: IAutoMovieModelRecipe): IAutoMovieDesignMutationOutput {
    return productionProjectSetDesign(state, { kind: "model", id: productionProjectInputDesignId(design) }, design, productionProjectValidateModelRecipe(design));
}
