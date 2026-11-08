/** Optional numeric observations of the existing sampler, without source or geometry references. */
export namespace HumanInspectionClock {
  /** One sampler phase; shared preparation has no curve id, and inclusive intervals are marked. */
  export interface IEvent {
    /** Exact production part name whose borrowed source the sampler is reading. */
    readonly part: string;

    /** Full existing display curve id; null identifies preparation shared by several curves. */
    readonly curve: string | null;

    /** Measured operation boundary, such as outline preparation, source evaluation or point creation. */
    readonly phase: string;

    /** Elapsed milliseconds in this call; null means unavailable evaluation or borrowed preparation paid in its shared producer phase, never a zero-cost preparation claim. */
    readonly milliseconds: number | null;

    /** Phase-specific number of prepared sources, attempted readings or materialized points; failure can leave a partial count. */
    readonly samples: number;

    /** Completion of this display phase only; failed, unavailable and omitted pole rings do not assert geometric acceptance. */
    readonly status: "ok" | "failed" | "unavailable" | "pole";

    /** True for a containing interval, which must not be summed with its measured child operations. */
    readonly inclusive: boolean;

    /** Monotonic process-clock interval start in ms when known; null for an aggregate of separated readings. */
    readonly startedPerformanceMilliseconds: number | null;
  }

  /** Caller-owned facts sink. Observer failures are separate from source failures. */
  export type Observer = (event: Readonly<IEvent>) => void;

  /** A session exists only when the caller explicitly requests observations. */
  export interface ISession {
    /** Observer exception messages retained for this call, independently of the original source diagnostics and exceptions. */
    readonly errors: string[];

    /** Monotonic process-clock reading in milliseconds for an explicitly observed phase. */
    now(): number;

    /** Elapsed milliseconds since start; undefined returns zero bookkeeping only and never establishes successful source work. */
    delta(start: number | undefined): number;

    /** Sends only immutable numeric/id facts; catches an observer exception into errors without replacing or suppressing a source failure. */
    emit(part: string, curve: string | null, phase: string, milliseconds: number | null, samples: number, status: IEvent["status"]): void;

    /** Records one inclusive curve interval for matching the same-run CPU profile; undefined start remains unobserved. */
    span(part: string, curve: string, start: number | undefined, samples: number, status: IEvent["status"]): void;
  }

  /** No observer means no clock calls, metric payloads or timing error array. */
  export function create(observer?: Observer): ISession | undefined {
    if (observer === undefined) return undefined;
    const errors: string[] = [];
    return {
      errors,
      now: (): number => performance.now(),
      delta: (start: number | undefined): number => start === undefined ? 0 : performance.now() - start,
      emit: (part: string, curve: string | null, phase: string, milliseconds: number | null, samples: number, status: IEvent["status"]): void => {
        try { observer({ part, curve, phase, milliseconds, samples, status, inclusive: false, startedPerformanceMilliseconds: null }); }
        catch (error: unknown) { errors.push(error instanceof Error ? error.stack ?? error.message : String(error)); }
      },
      span: (part: string, curve: string, start: number | undefined, samples: number, status: IEvent["status"]): void => {
        try { observer({ part, curve, phase: "curve-interval", milliseconds: start === undefined ? null : performance.now() - start, samples, status, inclusive: true, startedPerformanceMilliseconds: start ?? null }); }
        catch (error: unknown) { errors.push(error instanceof Error ? error.stack ?? error.message : String(error)); }
      },
    };
  }
}
