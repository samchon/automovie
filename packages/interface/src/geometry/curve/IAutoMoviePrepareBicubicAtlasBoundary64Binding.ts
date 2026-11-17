import type { IAutoMovieBicubicAtlasTessellation64 } from "./IAutoMovieBicubicAtlasTessellation64";

/**
 * Admitted explicit binding or transported restriction for an otherwise unbound
 * complete-edge peer. Explicit records are borrowed; transported records are new.
 *
 * @evidence contracts/development/design.md#principled-representation The canonical input owns side, authority, normalized directed endpoints and fan identity; legacy marks a transported complete-edge fan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface prepareAutoMovieBicubicAtlasBoundary64 adds only the legacy ownership distinction used by atlas vertex fan keys.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absence of legacy selects the explicit normalFan; its presence keeps inherited legacy sharing separate from explicit normal-fan identity.
 * @evidence contracts/development/common.md#meaningful-documentation States borrowed versus new records and the exact optional marker semantics.
 */
export type IAutoMoviePrepareBicubicAtlasBoundary64Binding = NonNullable<
  IAutoMovieBicubicAtlasTessellation64.Input["boundaryBindings"]
>[number] & {
  /** Canonically oriented comma-separated four-control-ID tuple for a transported legacy fan; absent for explicitly authored bindings. */
  legacy?: string;
};
