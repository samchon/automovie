/**
 * One sampled MPFB state of a sampling run. `rowOffset`/`rowCount` address
 * `rows.i32` and `rows.f64` in elements (vertices); `landmarkOffset` addresses
 * `landmarks.f64` in landmarks. `recipe` is the source convention that
 * produced the state (a target path, macro overrides, or pair endpoints).
 */
export interface IHumanSourceSampleState {
  name: string;
  kind: "body-target" | "body-macro" | "body-macro-pair" | "face-target" | "face-macro" | "extra-target";
  recipe: Record<string, unknown>;
  rowOffset: number;
  rowCount: number;
  landmarkOffset: number;
}
