import type { HumanCurve } from "./HumanCurve";

/** One generated neutral hand frame is shared by palm and finger authorities. */
export namespace HumanHandFrame {
  /** The original pooled orthonormal frame, reflected once for the right side. */
  export interface Result {
    /** Generated side, independent of anatomical source-side qualification. */
    side: "l" | "r";
    /** Caller-owned common wrist support, world millimetres. */
    originMm: HumanCurve.Vector;
    /** Wrist toward middle_01, preserving the existing neutral support law. */
    longitudinal: HumanCurve.Vector;
    /** Original finger root breadth direction. */
    across: HumanCurve.Vector;
    /** Original hand support-plane normal direction. */
    normal: HumanCurve.Vector;
  }

  /**
   * Retain the existing pooled neutral support frame without a second fit.
   * Reflection reverses handedness; consumers retain that declared parity.
   * Palm recovery uses N=longitudinal, U=-across and V=-normal. Those are
   * coordinate changes of this same frame, rather than another skeleton or
   * an independently placed hand. No dimension or source mesh is inferred.
   */
  export function build(originMm: HumanCurve.Vector, side: "l" | "r"): Result {
    if (originMm.length !== 3 || !originMm.every(Number.isFinite) || (side !== "l" && side !== "r"))
      throw new Error("A common hand frame requires a finite wrist and declared side");
    return { side, originMm: [...originMm],
      longitudinal: reflect([0.6491855388825822,-0.5525156562718259,-0.522766282080477]),
      across: reflect([0.7335375923110833,0.6365630320708591,0.23813883947649833]),
      normal: reflect([0.20119825240839,-0.538065010733153,0.8185385192234643]),
    };
    function reflect(axis: HumanCurve.Vector): HumanCurve.Vector {
      return [axis[0],axis[1],side === "l" ? axis[2] : -axis[2]];
    }
  }
}
