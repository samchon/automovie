import type { IAutoMovieCurve64 } from "@automovie/engine";

import type { IAutoMovieRecoveryTerminalSeed } from "./IAutoMovieRecoveryTerminalSeed";

/**
 * Source-only distal topology observed above one existing closed-loop seed. The maximum and PL critical positions are measurements in the registered millimetre frame, not source mesh payloads. Multiple extrema, open incidence, plateaus and unqualified links remain explicit; they never authorize a single fabricated cap.
 *
 * @evidence contracts/development/design.md#principled-representation Clipped indexed-source connectivity associates the seed with private vertex-incidence probes; actual projection extrema and existing lower/upper-link classification determine terminal observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One source-free record carries the seed, observed critical relations and additional physical stations separately from generated skin.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source topology, normals, copied specimen surface, nearest-point identity, clamped coordinate or invented terminal is returned.
 * @evidence contracts/development/common.md#meaningful-documentation States measurement units, one-tip qualification, multiple-branch limits, critical brackets and additional-station meaning.
 */
export interface IAutoMovieRecoverySourceTerminal {
  /** Published source loop followed toward increasing scalar coordinates. */
  seed: IAutoMovieRecoveryTerminalSeed & { curveName: string };

  /** True only for one closed manifold distal component with one regular nonflat maximum and no branch or unresolved critical event. */
  singleTipQualified: boolean;

  /** Actual largest source projection in the seeded component and every tied physical position; null when the seed has no unique distal component. */
  maximum: {
    coordinateMm: number;
    pointsMm: IAutoMovieCurve64.Vector[];
  } | null;

  /** Source-observed critical relations inside the distal component; loop continuation at their cuts remains a separate observation. */
  events: Array<{
    name: string;
    coordinateMm: number;
    pointMm: IAutoMovieCurve64.Vector;
    lowerComponents: number;
    upperComponents: number;
    manifold: boolean;
    flat: boolean;
    regular: boolean;
    beforeMm: number | null;
    afterMm: number | null;
  }>;

  /** Distinct observed event coordinates and qualified physical brackets to append as all-component section observations. */
  coordinatesMm: number[];

  /** Explicit failures or limits of this component's observed topology. */
  diagnostics: string[];
}
