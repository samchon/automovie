
import { type IAutoMovieAcceptanceScenario, type IAutoMovieFormationDesign, type IAutoMovieModelRecipe, type IAutoMovieShotContract, IAutoMovieDesignTarget } from "@automovie/interface";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

/**
 * Find the first distinct ID with the same lowercase spelling in one design family.
 *
 * @evidence contracts/common.md#principled-implementation The setter supplies a closed design target; singleton production/world have no competing key and exact existing spelling is permitted. JavaScript lowercase is the existing portability policy, not a proof of every filesystem Unicode equivalence.
 * @evidence contracts/common.md#clear-and-simple-design One family lookup keeps collision refusal separate from candidate schema and graph validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No selected ID bypasses the comparison and no filesystem state is fabricated.
 * @evidence contracts/common.md#meaningful-documentation Null means no distinct lowercase collision; returned strings preserve their original spellings.
 * @evidence contracts/performance.md#efficient-algorithms K keys are copied before find, then compared with lowercase string work until a match; worst-case time follows total key text and temporary storage is K references.
 * @evidence contracts/performance.md#reuse-equivalent-work Each attempt reads current graph keys; no retained lowercase index survives graph mutation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The local key array and lowercase strings release after return; only the two-string result escapes.
 */
export function productionProjectCaseCollidingDesignId(graph: IAutoMovieProductionDesignGraph, target: IAutoMovieDesignTarget): {
    requested: string;
    existing: string;
} | null {
    if (target.kind === "production" || target.kind === "world")
        return null;
    const records: ReadonlyMap<string, IAutoMovieShotContract> | ReadonlyMap<string, IAutoMovieModelRecipe> | ReadonlyMap<string, IAutoMovieFormationDesign> | ReadonlyMap<string, IAutoMovieAcceptanceScenario> = target.kind === "model"
        ? graph.models
        : target.kind === "formation"
            ? graph.formations
            : target.kind === "shot"
                ? graph.shots
                : graph.acceptance;
    const folded: string = target.id.toLowerCase();
    const existing: string | undefined = [...records.keys()].find((id: string): boolean => id !== target.id && id.toLowerCase() === folded);
    return existing === undefined ? null : { requested: target.id, existing };
}
