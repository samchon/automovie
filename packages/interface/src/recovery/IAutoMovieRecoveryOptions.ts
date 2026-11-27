import type {
  AutoMovieRecoveryCurveFormat,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Cooperative synchronous cancellation and progress; a blocked event loop
 * cannot deliver a new event-loop cancellation.
 */
export interface IAutoMovieRecoveryOptions {
  /**
   * Saved cubic basis for observation; omitted preserves Bernstein
   * coefficients.
   */
  curveFormat?: AutoMovieRecoveryCurveFormat;

  /**
   * Synchronous cooperative cancellation query; absent means continue. Return
   * true to stop at the next existing checkpoint without publishing a value;
   * false continues. Throwing or returning a nonboolean value fails the
   * operation. The caller owns callback cost and captured state; it must not
   * return a Promise. No listener or background task is registered, and a
   * blocked event loop cannot change caller state until control returns.
   * Observation and fitting check their documented progress boundaries. The
   * recovery caller implements the synchronous query; observation and fitting
   * invoke it at their existing cooperative checkpoints and own terminal
   * cancellation.
   */
  cancelled?: () => boolean;

  /**
   * Observe an existing synchronous progress point; a thrown error fails the
   * operation. The caller owns callback work and must return before computation
   * continues.
   */
  onProgress?: (phase: string, completed: number, total: number) => void;

  /**
   * Receive copied source incidence once per observed section contour, outside
   * the coefficient result. The callback runs synchronously after fitting or
   * local rejection; throwing fails observation, and records already delivered
   * remain provisional until a successful terminal result. Cancellation can
   * stop delivery before the next contour. The caller owns callback cost and
   * any retained records.
   */
  onSourceLineage?: (observation: IAutoMovieRecoverySourceLineage) => void;

  /**
   * Receive acquisition-only incidence for every requested source slab after
   * section processing. Delivery is synchronous and provisional until the
   * operation succeeds; throwing fails the operation, and callback-triggered
   * cancellation stops later delivery. Copied source addresses stay outside the
   * coefficient value. Slab-only observation binds saved publications without
   * fitting and delivers independent metadata copies.
   */
  onSourceSlab?: (observation: IAutoMovieRecoverySlabObservation) => void;

  /**
   * Explicit incomplete observation prefix; omitted for the full planned
   * station set.
   */
  sectionLimit?: number;

  /** Collect operation timing observations without changing geometry. */
  observeWork?: boolean;
}
