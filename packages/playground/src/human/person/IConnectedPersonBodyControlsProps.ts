import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";
import type { IAutoMovieHumanPersonBodyReach } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyReach";

import type { IConnectedBodyMeasurement } from "../body/IConnectedBodyMeasurement";

/**
 * What the person panel's body control section renders into and calls: its section root, the body partition view, the current body, the panel's intent tickets, the off-thread measured solve and the panel's transaction, status and refusal owners.
 *
 * Paired generation reach limits the available source channels. The measured solve takes shape weights only and returns a solver reading before full person admission; authored anatomy can be reapplied by that admission, so reporting must distinguish this reading from an independent final-body measurement.
 *
 * @evidence contracts/common.md#principled-implementation Paired evaluable reach bounds supported controls, latest body draft preserves pending fields, and shared intent tickets authorize complete person-document transactions after shape-level numerical inverses.
 * @evidence contracts/common.md#clear-and-simple-design The body section owns UI selections and text drafts while the person panel owns full document admission/history and resident workers own inverses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing source reach remains named, and a shape-only solver reading does not masquerade as a new measurement after final anatomy reapplication.
 * @evidence contracts/common.md#meaningful-documentation The comment assigns paired reach and transaction ownership and identifies shape-only solve inputs and their reading limitation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This control input schema selects no source reach, numerical inverse or DOM algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The properties carry current state and solver hooks without implementing cached result identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources DOM and basis references are parent-owned and the type acquires no listener, worker or GPU frame.
 *
 * @author Samchon
 */
export interface IConnectedPersonBodyControlsProps {
  /** The document that creates the controls. */
  dom: Document;

  /** The body section root holding the `control-kind` and `basis-controls` roles. */
  section: HTMLElement;

  /** The body partition view of the person generation. */
  body: IAutoMovieHumanBodyBasis;

  /** Whole-person solve support shown by these body controls, from the same generation as body. */
  reach: IAutoMovieHumanPersonBodyReach;

  /**
   * Read latest authored body fields, including edits still awaiting whole-person admission.
   *
   * @evidence contracts/common.md#principled-implementation Latest body access preserves other pending authored fields while one control composes a candidate.
   * @evidence contracts/common.md#clear-and-simple-design The section borrows body state while the panel retains complete person draft/history ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Events do not replace newer body fields with their earlier painted snapshot.
   * @evidence contracts/common.md#meaningful-documentation The member identifies pending body state and event-time preservation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This getter signature chooses no document copying or resolution algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current draft access declares no numerical geometry cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned body data is borrowed without acquired native resources.
   */
  current: () => IAutoMovieHumanBodyBasisDocument;

  /**
   * Reserve the next whole-person intent before asynchronous solve or candidate submission.
   *
   * @evidence contracts/common.md#principled-implementation Pre-await reservation orders body edits with face, history and other person actions.
   * @evidence contracts/common.md#clear-and-simple-design One panel gate coordinates all person actions without a body-local competing revision owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Similar shape or faster completion does not reuse an older action's authority.
   * @evidence contracts/common.md#meaningful-documentation The callback specifies whole-person action order and pre-await timing.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This reservation type chooses no generation representation or exhaustion handling.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New intent is an authored effect rather than reusable numerical work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scalar tickets acquire no worker request or model handle.
   */
  reserve: () => number;

  /**
   * Whether the reserved whole-person intent still authorizes candidate and status effects.
   *
   * @evidence contracts/common.md#principled-implementation Current authority gates late solve success and refusal alongside other person actions.
   * @evidence contracts/common.md#clear-and-simple-design A predicate exposes the panel's gate without transferring its mutable state.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching body values alone do not prove that no newer face or history intent exists.
   * @evidence contracts/common.md#meaningful-documentation The member identifies whole-person candidate/status authorization.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This predicate type implements no intent comparison algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Intent validity is not numerical result cache equivalence.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Validity observation acquires no running task or external handle.
   */
  isCurrent: (ticket: number) => boolean;

  /**
   * Solve one body-view measurement in metres from authored shape weights off the page; the achieved reading precedes full-document anatomy reapplication.
   *
   * @evidence contracts/common.md#principled-implementation The bounded own-channel inverse uses paired evaluable body reach and holds the supplied other weights fixed.
   * @evidence contracts/common.md#clear-and-simple-design Returning shape and achieved reading keeps numerical inversion separate from person candidate composition and admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Source reach is not extrapolated and the shape-only result does not claim independent final-person readback.
   * @evidence contracts/common.md#meaningful-documentation The callback specifies metre units, off-page work, shape-only input and pre-admission reading provenance.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The solver implementation owns geometry evaluation and bracket cost.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This signature declares no cached inverse result across different shape or target inputs.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Request and worker lifetime belong to the supplied numerical transport.
   */
  solve: (
    shape: Record<string, number>,
    channel: string,
    targetMetres: number,
  ) => Promise<IConnectedBodyMeasurement>;

  /**
   * Submit body fields through the complete person transaction; an omitted ticket lets the parent reserve intent. True means current publication of either an accepted person or a labelled construction draft, with accepted history identified by panel state. False includes closed, superseded, refused or failed settlement and does not prove that no earlier publication occurred.
   *
   * @evidence contracts/common.md#principled-implementation Complete person admission combines candidate body fields with current face/context under shared intent authority.
   * @evidence contracts/common.md#clear-and-simple-design One body handoff keeps whole-person history and document/model agreement in the panel.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Solved weights still pass complete-person evaluation; true publication may be a labelled refused draft, so report text cannot independently certify accepted history.
   * @evidence contracts/common.md#meaningful-documentation The member explains optional ticket ownership and refusal/supersession false outcomes.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The transaction implementation owns person construction and history algorithms.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Effectful admissions retain distinct user intent rather than merging equal-looking bodies.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prepared person frames and stale retirement remain transaction-owned.
   */
  change: (
    body: IAutoMovieHumanBodyBasisDocument,
    ticket?: number,
  ) => Promise<boolean>;

  /**
   * Name an in-progress body solve without claiming accepted geometry.
   *
   * @evidence contracts/common.md#principled-implementation Busy status describes requested numerical work separately from admission outcome.
   * @evidence contracts/common.md#clear-and-simple-design The section supplies text while the panel owns status presentation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Building telemetry does not establish reached target or accepted person.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies in-progress work and its lack of success verdict.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This status type chooses no DOM update or formatting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Busy publication is an effect without numerical result sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The panel owns status DOM and the callback acquires no external handle.
   */
  busy: (text: string) => void;

  /**
   * Append current completed-transaction information, identifying solver reading separately from final-body measurement and labelled construction drafts separately from accepted history.
   *
   * @evidence contracts/common.md#principled-implementation Reports follow current successful transaction authority and preserve the numerical reading's actual provenance.
   * @evidence contracts/common.md#clear-and-simple-design The section composes a line while parent status owns presentation and history.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Report text does not promote a shape-only inverse reading into an unperformed final-person measurement.
   * @evidence contracts/common.md#meaningful-documentation The member identifies current accepted-or-draft publication and the solver reading's separate provenance, with history classification left to the panel.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This report signature chooses no string accumulation algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Report publication is an effect rather than cached numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The parent owns retained report text and this callback acquires no running task.
   */
  report: (text: string) => void;

  /**
   * Report invalid input or current numerical refusal while preserving the last-valid person state.
   *
   * @evidence contracts/common.md#principled-implementation One parent refusal owner coordinates invalid body entry with complete person draft/history state.
   * @evidence contracts/common.md#clear-and-simple-design The body section delegates recovery instead of maintaining a second committed document.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed body targets receive no guessed accepted weight or hidden person rollback.
   * @evidence contracts/common.md#meaningful-documentation The callback identifies input/numerical refusal and preservation of last-valid state.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This refusal type chooses no recovery or status formatting algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Refusal reporting is a current effect without shared numerical result.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Pending frame and worker retirement belong to the parent transaction.
   */
  refuse: (error: unknown) => void;
}
