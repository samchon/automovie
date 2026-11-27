import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryTerminalSeed,
} from "..";

/**
 * Source-only distal topology observed above one existing closed-loop seed. The
 * maximum and PL critical positions are measurements in the registered
 * millimetre frame, not source mesh payloads. Multiple extrema, open incidence,
 * plateaus and unqualified links remain explicit; they never authorize a single
 * fabricated cap.
 */
export interface IAutoMovieRecoverySourceTerminal {
  /** Published source loop followed toward increasing scalar coordinates. */
  seed: IAutoMovieRecoveryTerminalSeed & {
    /**
     * Stable saved coefficient identity, retained without inferring anatomical
     * or material correspondence.
     */
    curveName: string;
  };

  /**
   * True only for one closed manifold distal component with one regular nonflat
   * maximum and no branch or unresolved critical event.
   */
  singleTipQualified: boolean;

  /**
   * Actual largest source projection in the seeded component and every tied
   * physical position; null when the seed has no unique distal component.
   */
  maximum: {
    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;

    /**
     * Ordered physical observations in registered millimetres; ordering and
     * closure remain caller supplied.
     */
    pointsMm: Readonly<AutoMovieVector3Tuple>[];
  } | null;

  /**
   * Source-observed critical relations inside the distal component; loop
   * continuation at their cuts remains a separate observation.
   */
  events: Array<{
    /**
     * Caller-assigned stable semantic identity retained in generated
     * coefficient and observation records.
     */
    name: string;

    /**
     * Signed section-plane coordinate along the registered unit sweep axis, in
     * millimetres.
     */
    coordinateMm: number;

    /**
     * Physical position in the registered millimetre frame; no coordinate
     * matching or source repair is implied.
     */
    pointMm: Readonly<AutoMovieVector3Tuple>;

    /**
     * Connected-component count in the lower link of the critical source
     * vertex.
     */
    lowerComponents: number;

    /**
     * Connected-component count in the upper link of the critical source
     * vertex.
     */
    upperComponents: number;

    /**
     * Whether the observed local incidence meets the owning operation's
     * manifold checks; no embedding claim follows.
     */
    manifold: boolean;

    /** Whether exact scalar ties occur in the critical vertex neighbourhood. */
    flat: boolean;

    /**
     * Whether the observed local source event has the declared regular
     * continuation qualification.
     */
    regular: boolean;

    /**
     * Lower physical sweep coordinate in registered millimetres; paired with
     * the strictly greater afterMm.
     */
    beforeMm: number | null;

    /**
     * Upper physical sweep coordinate in registered millimetres; paired with
     * the strictly smaller beforeMm.
     */
    afterMm: number | null;
  }>;

  /**
   * Distinct observed event coordinates and qualified physical brackets to
   * append as all-component section observations.
   */
  coordinatesMm: number[];

  /** Explicit failures or limits of this component's observed topology. */
  diagnostics: string[];
}
