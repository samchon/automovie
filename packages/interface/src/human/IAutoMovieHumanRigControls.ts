import type { AutoMovieHumanSide } from "./AutoMovieHumanSide";

/**
 * Pose-derived channel paths, degree/millimetre bounds and side-qualified
 * anatomical chain selections. Runtime construction and admission remain with
 * AutoMovieHumanRigControls in Human.
 */
export namespace IAutoMovieHumanRigControls {
  /** Resolve either public side spelling into one canonical row template. */
  export type Template<T extends string> = T extends
    | `${infer Before}.left.${infer After}`
    | `${infer Before}.right.${infer After}`
    ? `${Before}.<side>.${After}`
    : T;

  /** Public numeric leaves remain the sole channel-schema authority. */
  export type NumericPath<T> = {
    [K in keyof T & string]-?: NonNullable<T[K]> extends number
      ? K
      : NonNullable<T[K]> extends object
        ? `${K}.${NumericPath<NonNullable<T[K]>>}`
        : never;
  }[keyof T & string];

  /**
   * Resolve the canonical table's side placeholder to the public own-side
   * union.
   */
  export type Expand<T extends string> =
    T extends `${infer Before}<side>${infer After}`
      ? `${Before}${AutoMovieHumanSide}${After}`
      : T;

  /**
   * Inclusive clinical lower and upper bounds in degrees for an angular pose
   * channel. A supplied current pose lets the runtime owner apply the
   * flexion-dependent tibial interval.
   */
  export type IBoundsResult = {
    /** Inclusive lower clinical bound in degrees. */
    minimum: number;
    /** Inclusive upper clinical bound in degrees. */
    maximum: number;
  };

  /**
   * Inclusive lower and upper bounds in millimetres for a jaw translation or
   * opening channel. This result does not admit a jaw channel into the angular
   * degree API.
   */
  export type IMillimetreBoundsResult = {
    /** Inclusive lower clinical bound in millimetres. */
    minimum: number;
    /** Inclusive upper clinical bound in millimetres. */
    maximum: number;
  };
}
