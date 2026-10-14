import type { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";

import { relativeAutoMovieProductionProjectPath as relativeToRoot } from "./relativeAutoMovieProductionProjectPath";
import { type IAutoMovieGeneratedFile, IAutoMovieDesignMutationOutput, IAutoMovieProductionDesign } from "@automovie/interface";
import type { AutoMovieProductionProjectState } from "./AutoMovieProductionProjectState";
import { productionProjectValidateProductionDesign } from "./productionProjectValidateProductionDesign";
import { productionProjectConsequencesOf } from "./productionProjectConsequencesOf";
import { productionProjectLoadGraph } from "./productionProjectLoadGraph";
import { productionProjectLoadGeneratedManifest } from "./productionProjectLoadGeneratedManifest";
import { productionProjectLoadScreenplayIndex } from "./productionProjectLoadScreenplayIndex";
import { productionProjectSetDesign } from "./productionProjectSetDesign";
import { productionProjectDesignPath } from "./productionProjectDesignPath";

/**
 * Set the active production's design, refusing a different production ID.
 *
 * @evidence contracts/common.md#principled-implementation Exact ID equality precedes schema/setter processing; a mismatch reports current graph consequences under the active namespace.
 * @evidence contracts/common.md#clear-and-simple-design This address guard delegates admitted same-ID changes to the common setter and exact production schema validator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A foreign design ID never registers or switches the handle's active production.
 * @evidence contracts/common.md#meaningful-documentation Mismatch returns a structured refusal and diagnostic path; same-ID success/failure keeps the common setter's mutation effects.
 * @evidence contracts/performance.md#efficient-algorithms Mismatch still reads the complete graph, generated manifest and screenplay and computes consequences; the admitted branch includes schema validation and the full setter transaction.
 * @evidence contracts/performance.md#reuse-equivalent-work One mismatch graph is used for its report; no cross-call design result is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned diagnostics/consequences; delegated readers and setter own descriptors, locks and staged bytes.
 */
export function productionProjectSetProductionDesign(state: AutoMovieProductionProjectState, design: IAutoMovieProductionDesign): IAutoMovieDesignMutationOutput {
    if (design.id !== state.productionId) {
        const graph: IAutoMovieProductionDesignGraph = productionProjectLoadGraph(state);
        return {
            accepted: false,
            revision: state.lastReadRevision_,
            target: { kind: "production" },
            fingerprint: null,
            consequences: productionProjectConsequencesOf(graph, { kind: "production" }, productionProjectLoadGeneratedManifest(state)?.files.map((file: IAutoMovieGeneratedFile): string => file.path) ?? [], productionProjectLoadScreenplayIndex(state)),
            diagnostics: [
                {
                    code: "production-address-mismatch",
                    category: "error",
                    phase: "design",
                    target: "production",
                    path: relativeToRoot(state.root, productionProjectDesignPath(state, { kind: "production" })),
                    message: `Active production "${state.productionId}" cannot store design "${design.id}". Reopen the project with productionId "${design.id}" or correct the design id.`,
                },
            ],
        };
    }
    return productionProjectSetDesign(state, { kind: "production" }, design, productionProjectValidateProductionDesign(design));
}
