import type { IAutoMovieHumanF1NativeLaw } from "./IAutoMovieHumanF1NativeLaw";

/**
 * Fields exchanged by the F1 engineering control and capture paths.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Fields exchanged by the F1 engineering control and capture paths.
 * @evidence contracts/development/design.md#principled-representation Driver ratios are dimensionless, girths and support breadth use millimetres, and resolution status accompanies the exact fields.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1Engineering produces these data for preflight and capture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The records describe qualified input resolution and do not claim population or surface validity.
 */
export namespace IAutoMovieHumanF1Engineering {
  /**
   * Five qualified source-tape driver ratios, in declared order rather than a joint population percentile.
   *
   * @evidence contracts/development/design.md#principled-representation A closed record keeps hip/omphalion/underbust/bust/neck proxies distinct; one means F1's own tape definition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface All five ratios drive the declared wall policy or the recorded conditional limb response.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A named ratio is not substituted for an unavailable clinical identity field.
   * @evidence contracts/development/common.md#meaningful-documentation Names dimensionless ratios and the non-percentile combined interpretation.
   */
  export type IRatios = Record<
    "hip" | "omphalion" | "underbust" | "bust" | "neck",
    number
  >;

  /**
   * Original bare-source tape readings, physical mm; skin features and final bands are separate checks.
   *
   * @evidence contracts/development/design.md#principled-representation The same five tape scopes accompany the bare wall at the current bust level; that candidate-local bare tape is not a global bound for another projection's plane.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Actual girths and the matching candidate-local bare tape enter the shared projection policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unavailable source readings throw at their producer rather than becoming zero or population means.
   * @evidence contracts/development/common.md#meaningful-documentation Units and bare original-source scope are explicit.
   */
  export interface IReading {
    /** Material-plane source tapes except bust's current anterior-apex horizontal plane. */
    girths: IRatios;
    /** Bare trunk tape at that same current bust plane, excluding both breast caps. */
    bareBust: number;
  }

  /**
   * A resolved field handoff; capture consumes fields without solving or applying ratios again.
   * A resolved status concerns input/constraint resolution, not geometric acceptance.
   *
   * @evidence contracts/development/design.md#principled-representation Carries the exact forward fields, raw drivers, numerical resolution and qualifications separately; infeasible/unavailable cases retain their candidate fields but must not be captured as successful cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This is the common output consumed by preflight and the real Figure/Deviation case paths.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing/failed constraints remain explicit; capture cannot silently substitute F1 or solve another case.
   * @evidence contracts/development/common.md#meaningful-documentation Members name source scope, numerical residual units and the boundary between resolved inputs and accepted shape.
   */
  export interface IResolvedCase {
    /** Stable engineering identifier. */
    id: string;
    /** Complete same-invocation full fields for assembleNative. */
    fields: IAutoMovieHumanF1NativeLaw.IFields;
    /** Original hypothesis inputs, with explicit support breadth in mm. */
    rawDrivers: {
      mode: "f1" | "bust-only" | "all-site" | "support" | "full-field";
      ratios: IRatios;
      hipJointCentreBreadth: number;
    };
    /** Numerical resolution; null means the quantity was not requested/available. */
    resolution: {
      status: "resolved" | "infeasible" | "unavailable";
      target: number | null;
      actual: number | null;
      residual: number | null;
      reason: string | null;
    };
    /** Actual signed residual of every requested tape, mm; null for direct full fields. */
    girthResiduals: IRatios | null;
    /** Protocol/response/scope limits that stay with every artifact and capture. */
    qualification: string[];
  }
}
