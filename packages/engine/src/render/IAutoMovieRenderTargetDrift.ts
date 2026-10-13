/** Why a report no longer describes the target in front of a consumer. */
export interface IAutoMovieRenderTargetDrift {
  /** What changed: the renderer, one setting, or one asset's bytes. */
  field: string;
  /** The value the report was measured against. */
  reported: string;
  /** The value the current target carries. */
  current: string;
}
