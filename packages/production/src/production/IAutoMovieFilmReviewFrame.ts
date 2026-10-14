import { AutoMovieGuidePass } from "@automovie/interface";

/**
 * One authored or fallback review sample selected on a segment's shot-local frame grid.
 *
 * @evidence contracts/common.md#principled-implementation Stores review id, shot-local seconds/index and required passes; the selector rounds authored times under its admitted positive fps and half-open trim premises.
 * @evidence contracts/common.md#clear-and-simple-design One result shape represents both authored review requirements and the selector's deterministic source-in beauty fallback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type certifies no rendered evidence or valid frame clock; current repository use is limited to its exported selector rather than a live application read.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes seconds from frame index and authored identity from fallback identity without claiming actual capture.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape executes no sampling, filtering or rendering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration defines no completed review result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The selector caller owns result arrays and borrowed passes; the type acquires no native resource.
 * @author Samchon
 */
export interface IAutoMovieFilmReviewFrame {
    /**
     * Authored review id or deterministic segment fallback id.
     */
    id: string;

    /**
     * Original authored shot-local seconds; fallback uses sourceInFrame/fps.
     */
    time: number;

    /**
     * Shot-local frame index.
     */
    index: number;

    /**
     * Required render passes.
     */
    passes: AutoMovieGuidePass[];
}
