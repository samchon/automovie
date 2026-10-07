/**
 * How one endpoint that only one partition defines crosses the cut.
 *
 * `body-band`: a body endpoint without head rows; on the band its row becomes
 * `B(v) - w(v)·(B(c(v)) - Δanchor)`, its cut-sample rows become `Δanchor`, so
 * the body value meets the rigid head carry at the cut and returns below the
 * band. `face-band`: a face endpoint that moves the cut gains `w(v)·F(c(v))`
 * on the band. `unavailable`: the endpoint's cut-sample rows have no source
 * value, so no band row exists and the endpoint is refused by name. `rows`
 * counts the band rows written.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationBandTarget {
  target: string;
  origin: "face" | "body";
  rule: "body-band" | "face-band" | "unavailable";
  rows: number;
}
