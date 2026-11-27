/**
 * Contact evidence read by auditAutoMovieOutcome without changing or retaining
 * the input. Callers supply finite impulses and consistently based times; the
 * auditor compares values without admitting their ranges.
 */
export namespace IAutoMovieAuditOutcome {
  /** One side of a contact. */
  export interface ISide {
    /** Subject id. */
    subject: string;

    /**
     * Region id. Omission on an expectation matches any region; omission on a
     * measurement matches only an expectation without a region.
     */
    region?: string;
  }

  /** A measured contact. */
  export interface IContact {
    /** One side. */
    a: IAutoMovieAuditOutcome.ISide;

    /** The other side. */
    b: IAutoMovieAuditOutcome.ISide;

    /**
     * Measurement time in seconds on the same clock as the expectation window,
     * normally film time.
     */
    seconds: number;

    /** Measured impulse, N s; zero for a geometric touch. */
    impulse: number;
  }

  /** An expected or forbidden contact. */
  export interface IExpectation {
    /** One side. */
    a: IAutoMovieAuditOutcome.ISide;

    /** The other side. */
    b: IAutoMovieAuditOutcome.ISide;

    /** Inclusive measurement interval; a reversed interval matches nothing. */
    window: IExpectationWindow;

    /**
     * Minimum peak individual impulse, N s, across matching required contacts;
     * defaults to zero. Impulses are not summed. Ignored for forbidden
     * contacts.
     */
    minimumImpulse?: number;
  }

  /** The window object of {@link IExpectation}. */
  export type IExpectationWindow = {
    /** Earliest accepted measurement time, seconds on the contacts' clock. */
    start: number;
    /** Latest accepted measurement time, seconds on the contacts' clock. */
    end: number;
  };

  /** An outcome's contact expectations. */
  export interface IOutcome {
    /** Outcome id in findings. */
    id: string;

    /**
     * Contacts that must each have a matching measurement, in either side
     * order; an empty array imposes no required contacts.
     */
    required: readonly IAutoMovieAuditOutcome.IExpectation[];

    /**
     * Contacts that must have no matching measurement, regardless of impulse;
     * absent and empty both impose no forbidden contacts.
     */
    forbidden?: readonly IAutoMovieAuditOutcome.IExpectation[];
  }
}
