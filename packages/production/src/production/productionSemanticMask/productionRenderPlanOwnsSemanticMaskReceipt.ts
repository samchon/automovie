import { productionRenderLayersForPass } from "@automovie/engine";
import type { IAutoMovieProductionRenderJobPlan } from "@automovie/render";
import { IAutoMovieProductionSemanticMaskReceipt } from "./IAutoMovieProductionSemanticMaskReceipt";

/**
 * Return whether a typed current render plan schedules the receipt's exact frame and shot as the selected mask layer of the named deliverable. Valid frame layers are required; the delegated pass selector throws on an empty layer list.
 *
 * @evidence contracts/common.md#principled-implementation Scans matching mask chunks and frame identities, then uses the engine's maximum-weight/later-tie guide-layer rule before comparing shot identity.
 * @evidence contracts/common.md#clear-and-simple-design The plan is the authority for current mask scheduling; this predicate delegates layer selection instead of duplicating transition tie-breaking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A receipt's claimed frame or shot never substitutes for actual plan membership, and no palette or pixel claim is inferred from scheduled identity alone.
 * @evidence contracts/common.md#meaningful-documentation Documents current typed-plan premise, exact deliverable/frame/shot comparison, guide-layer selection and propagated empty-layer failure.
 * @evidence contracts/performance.md#efficient-algorithms Scans C chunks and visited F frames until a match, then scans L candidate frame layers at each matching frame. productionRenderLayersForPass also structured-clones the selected layer payload, so clone size and copied graph allocation are part of cost; no strict bound by chunk count alone is claimed.
 * @evidence contracts/performance.md#reuse-equivalent-work No request or persistent cache is coordinated. The engine's existing guide-layer selection is reused as an algorithm, while each current plan occurrence is inspected independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cloned selected layers and search callbacks are invocation-local; the plan and receipt remain borrowed and no handle/task is acquired. Returned boolean retains no plan graph and uncapped layer payload size remains a caller admission concern.
 */
export const productionRenderPlanOwnsSemanticMaskReceipt: (props: {

    /** Current render job plan whose mask layer determines receipt ownership. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Exact deliverable identifier used to select current mask chunks. */
    deliverable: string;

    /** Claimed frame and shot only; byte and coverage admission occur at the receipt verifier. */
    receipt: Pick<IAutoMovieProductionSemanticMaskReceipt, "frame" | "shot">;
}) => boolean = (props: {

    /** Current render job plan whose mask layer determines receipt ownership. */
    plan: IAutoMovieProductionRenderJobPlan;

    /** Exact deliverable identifier used to select current mask chunks. */
    deliverable: string;

    /** Claimed frame and shot only; byte and coverage admission occur at the receipt verifier. */
    receipt: Pick<IAutoMovieProductionSemanticMaskReceipt, "frame" | "shot">;
}): boolean => props.plan.chunks.some((chunk: IAutoMovieProductionRenderJobPlan["chunks"][number]): boolean => chunk.deliverable === props.deliverable &&
    chunk.pass === "mask" &&
    chunk.frames.some((frame: IAutoMovieProductionRenderJobPlan["chunks"][number]["frames"][number]): boolean => frame.globalFrame === props.receipt.frame &&
        productionRenderLayersForPass(frame, "mask").some((layer: {
            shot: string;
        }): boolean => layer.shot === props.receipt.shot)));
