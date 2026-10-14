import type { IAutoMovieHumanPersonHeadShapeSource } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadShapeSource";

import type { IConnectedPersonEyeControlsProps } from "./IConnectedPersonEyeControlsProps";

/**
 * Source registration and the existing whole-person transaction for head traits. Omitted registration declares unavailable controls, never inferred endpoints. Fields are authored source-relative differences with the registration's units and signed envelopes, not clinical measurements. Inherited hooks use the same complete-person draft, intent and transaction authority as the other sections.
 *
 * @evidence contracts/common.md#principled-implementation Exact generation head-trait registration supplies fields and envelopes while inherited person hooks preserve shared current draft and action authority.
 * @evidence contracts/common.md#clear-and-simple-design The extension adds registration data to the existing section transaction contract without introducing a second admission owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing registration stays unavailable, source differences are not labelled clinical measures and raw body-channel duplication remains an explicit refusal.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes source-relative authored traits from clinical measurements and identifies inherited whole-person authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This input extension selects no field grouping, numerical construction or registration validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Registration references specify current authority rather than a reusable geometry result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Registration and inherited DOM are borrowed references with no independently acquired listener or worker.
 *
 * @author Samchon
 */
export interface IConnectedPersonHeadShapeControlsProps extends IConnectedPersonEyeControlsProps {
  /** Exact head-view source registration; omission supplies no trait support. */
  source?: IAutoMovieHumanPersonHeadShapeSource;
}
