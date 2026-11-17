/**
 * Contact evidence read by auditAutoMovieOutcome without changing or retaining the input. Callers supply finite impulses and consistently based times; the auditor compares values without admitting their ranges.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Contact expectations and measurements use one seconds clock, subject/region identities and newton-second impulses; the auditor matches either side order and tests peak individual impulse, without admitting numeric ranges.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This namespace groups the IAutoMovieAuditOutcome contracts used by packages/engine/src/composition/auditAutoMovieOutcome.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.
 * @evidence contracts/development/design.md#principled-representation Contact expectations and measurements use one seconds clock, subject/region identities and newton-second impulses; the auditor matches either side order and tests peak individual impulse, without admitting numeric ranges. The namespace groups these type contracts without implementing the operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The canonical IAutoMovieAuditOutcome contract belongs to interface; packages/engine/src/composition/auditAutoMovieOutcome.ts uses its nested records and callbacks. Runtime computation remains with those consumers.
 */
export namespace IAutoMovieAuditOutcome {
  /**
   * One side of a contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes an exact subject match from an optional region filter.
   * @evidence contracts/development/design.md#principled-representation Subject ids are exact strings; an absent expectation region is a wildcard, while a missing measured region is not an invented match.
   * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieOutcome uses the same contact-side identity for measurements and expectations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A region is independent refinement of subject identity, not a second alternative contact kind.
   */
  export interface ISide {
    /** Subject id. */
    subject: string;

    /** Region id. Omission on an expectation matches any region; omission on a measurement matches only an expectation without a region. */
    region?: string;
  }

  /**
   * A measured contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States contact time on the expectation clock and impulse in newton-seconds.
   * @evidence contracts/development/design.md#principled-representation Two unordered sides, a timestamp and one measured impulse support window matching; the caller admits numeric values.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The auditor borrows these measurements and considers both side orders without altering them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A zero impulse can represent geometric touch; existence of a contact is not inferred from force alone.
   */
  export interface IContact {
    /** One side. */
    a: IAutoMovieAuditOutcome.ISide;

    /** The other side. */
    b: IAutoMovieAuditOutcome.ISide;

    /** Measurement time in seconds on the same clock as the expectation window, normally film time. */
    seconds: number;

    /** Measured impulse, N s; zero for a geometric touch. */
    impulse: number;
  }

  /**
   * An expected or forbidden contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains inclusive windows, region matching and the peak-impulse threshold.
   * @evidence contracts/development/design.md#principled-representation Window endpoints share the measurement clock; a reversed interval matches nothing. Required impulse defaults to zero and forbidden checks ignore it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface auditAutoMovieOutcome owns matching and failure findings; the producer owns finite ordered time and impulse premises.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The threshold refines a contact expectation and does not encode a second competing contact variant.
   */
  export interface IExpectation {
    /** One side. */
    a: IAutoMovieAuditOutcome.ISide;

    /** The other side. */
    b: IAutoMovieAuditOutcome.ISide;

    /** Inclusive measurement interval; a reversed interval matches nothing. */
    window: {
      /** Earliest accepted measurement time, seconds on the contacts' clock. */
      start: number;
      /** Latest accepted measurement time, seconds on the contacts' clock. */
      end: number;
    };

    /** Minimum peak individual impulse, N s, across matching required contacts; defaults to zero. Impulses are not summed. Ignored for forbidden contacts. */
    minimumImpulse?: number;
  }

  /**
   * An outcome's contact expectations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Describes required and forbidden contact evidence, including empty and absent lists.
   * @evidence contracts/development/design.md#principled-representation An outcome id labels findings, with independent lists of positive and negative contact expectations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Production outcome declarations supply these lists to auditAutoMovieOutcome; the auditor does not rewrite them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty required list and an absent forbidden list impose no conditions rather than manufacturing a contact.
   */
  export interface IOutcome {
    /** Outcome id in findings. */
    id: string;

    /** Contacts that must each have a matching measurement, in either side order; an empty array imposes no required contacts. */
    required: readonly IAutoMovieAuditOutcome.IExpectation[];

    /** Contacts that must have no matching measurement, regardless of impulse; absent and empty both impose no forbidden contacts. */
    forbidden?: readonly IAutoMovieAuditOutcome.IExpectation[];
  }
}
