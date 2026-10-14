import { AutoMovieProductionShotRepaint, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorAdoption, IAutoMovieRepaintRequestEvidence } from "@automovie/interface";

/**
 * Provides class-owned getter access to the original optional private configuration and synchronous adapter invocation on the same service receiver.
 *
 * @evidence contracts/common.md#principled-implementation Provides class-owned getter access to the original optional private configuration and synchronous adapter invocation on the same service receiver.
 * @evidence contracts/common.md#clear-and-simple-design Class-owned getters retain private lexical reads and invokeAdapter retains the actual receiver; the per-call view avoids public field promotion or an unchecked private-layout cast.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation The view/closures live through one repaint call, retain the service, and create no new persistent state or provider host.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; one per-call view preserves field-read positions and direct Promise forwarding; it does not promote private fields into the public class API.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The view/closures live through one repaint call, retain the service, and create no new persistent state or provider host.
 */
export interface IAutoMovieProductionRepaintServiceView {
  /** Reads the service's original optional provider reference; absence is refused before source/provider work. */
  readonly adapter: AutoMovieProductionShotRepaint | undefined;

  /** Reads the original optional reviewed generator adoption rather than inferring provider provenance. */
  readonly generator: IAutoMovieRepaintGeneratorAdoption | undefined;

  /** Reads the original optional policy/evidence/retry identity/signal/clock configuration with compatibility defaults in the operation. */
  readonly execution: {
    /** Supplies attempt counts, millisecond time/backoff bounds, cost ceiling and closed retry classes validated before dispatch. */
    policy: IAutoMovieRepaintExecutionPolicy;

    /** Supplies stable authored request evidence addresses checked as trimmed nonblank text, with nullable continuity preserved. */
    evidence: IAutoMovieRepaintRequestEvidence;

    /** Keeps one immutable request identity stable across admitted retry attempts. */
    requestId?: string;

    /** Optionally communicates cancellation; absence preserves the existing uncancelled request behavior. */
    signal?: AbortSignal;

    /** Returns valid monotonic Date observations admitted by the executor; caller-owned Dates are cloned before bookkeeping. */
    now?: () => Date;
  } | undefined;

  /** Synchronously forwards to the original provider on the actual service receiver and returns its exact Promise. */
  invokeAdapter: AutoMovieProductionShotRepaint;
}
