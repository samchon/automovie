import type { IAutoMovieDesignTarget } from "@automovie/interface";
import path from "node:path";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectEncodeId } from "./productionProjectEncodeId";

/**
 * Resolve one admitted design target to its project-owned record location, whether or not the record exists.
 *
 * @evidence contracts/common.md#principled-implementation The closed design-kind union selects production-local production, acceptance and shot records or shared world, formation and model records; identifier-bearing filenames use the existing portable ID encoder.
 * @evidence contracts/common.md#clear-and-simple-design This function owns layout routing only, so design reads, mutations and public diagnostic addresses consume one mapping without duplicating directory choices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture path or consumer selects another layout; the typed kind premise is required and this path calculation does not claim to validate a resident file or unknown runtime kind.
 * @evidence contracts/common.md#meaningful-documentation States shared versus production-local ownership and existence independence; blank-ID refusal belongs to the encoder and physical admission belongs to consumers.
 * @evidence contracts/performance.md#efficient-algorithms One kind branch, optional ID encoding and native path joining scale with target/path text length and require no directory or file scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Layout is calculated from the supplied state and target; no path cache replaces the physical observations its consumers require.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the result pathname transfers to the caller; state is borrowed and no descriptor, byte payload or task is acquired.
 */
export function productionProjectDesignPath(state: AutoMovieProductionProjectState, target: IAutoMovieDesignTarget): string {
    switch (target.kind) {
        case "production":
            return path.join(state.productionDesignRoot, "production.json");
        case "world":
            return path.join(state.sharedDesignRoot, "world.json");
        case "acceptance":
            return path.join(state.productionDesignRoot, "acceptance", `${productionProjectEncodeId(target.id)}.json`);
        case "formation":
        case "model":
            return path.join(state.sharedDesignRoot, `${target.kind}s`, `${productionProjectEncodeId(target.id)}.json`);
        case "shot":
            return path.join(state.productionDesignRoot, "shots", `${productionProjectEncodeId(target.id)}.json`);
    }
}
