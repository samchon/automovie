import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * A constructed person whose owner refused admission: the exact document, the model built from it and the unchanged admission report. It is shown and can be edited further, saved or encoded with its report beside it, and it never enters the accepted history.
 *
 * Document, model and report refer to the same evaluation. The session stores this displayed construction separately from accepted snapshots, and replacing or closing it must retire its viewport-owned model through the same owner that prepared it.
 *
 * @evidence contracts/common.md#principled-implementation The exact evaluated document, prepared model and unchanged admission report preserve refused construction provenance outside accepted transactional history.
 * @evidence contracts/common.md#clear-and-simple-design One draft value groups display/evaluation data while the session owns current draft selection and the viewport owns frame resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Successful static encoding or inspection does not promote an owner-refused draft into accepted history or replace its failed checks.
 * @evidence contracts/common.md#meaningful-documentation The comment states same-evaluation provenance, accepted-history separation and viewport retirement on replacement or close.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This draft record implements no construction, editing or encoding algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type declares no shared refused frame or numerical evaluation cache across drafts.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The draft carries a viewport-owned model, and actual resource retirement belongs to the session/panel's replacement and close operations.
 *
 * @author Samchon
 */
export interface IConnectedPersonDraft<Model> {
  /** The numerical document this construction was evaluated from. */
  document: IAutoMovieHumanPersonDocument;

  /** The prepared model of that document; the viewport draws it. */
  model: Model;

  /** The owner's report of this exact model, carried without reinterpretation. */
  admission: IAutoMovieHumanConstructionAdmission;
}
