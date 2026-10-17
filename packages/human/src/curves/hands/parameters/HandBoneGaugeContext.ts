import {
  AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

/** Adapt the hand family's measurement gauge to actual model-axis Hand parents before curve construction.
 *
 * The gauge has +X dorsal, -Y distal and +Z radial. Side-specific proper rotations account for the decoder's explicit chirality before delegating to the caller's resolved hierarchy, preserving an already-neutral thumb chain.
 */
export class HandBoneGaugeContext extends AutoMovieCurveParentContext {
  /** Retain the actual parent API; this adapter does not resolve a second skeleton or own published boundaries. */
  public constructor(private readonly actual: HandBoneGaugeContext.Parent) {
    super([], []);
  }

  /** Rotate a gauge vector for the named side; reject every parent except leftHand and rightHand. */
  private local(bone: string, value: C.Vector): C.Vector {
    if (bone === "leftHand") return [-value[1], value[0], value[2]];
    if (bone === "rightHand") return [value[1], -value[0], value[2]];
    throw new Error(
      "Only actual Hand parents admit this internal measurement gauge",
    );
  }

  /** Transform a local millimetre point through its actual resolved parent hierarchy; no post-generation placement is applied. */
  public override point(bone: string, value: C.Vector): C.Vector {
    return this.actual.point(bone, this.local(bone, value));
  }

  /** Rotate a gauge direction through its actual Hand parent without adding translation. */
  public override direction(bone: string, value: C.Vector): C.Vector {
    return this.actual.direction(bone, this.local(bone, value));
  }

  /** Delegate the actual parent-frame snapshot unchanged; it describes the caller's bone frame rather than this adapter's measurement gauge. */
  public override frame(bone: string): C.Frame {
    return this.actual.frame(bone);
  }
}
export namespace HandBoneGaugeContext {
  /** Minimal actual-parent operations used by the family; publication and upstream binding remain with the caller's context. */
  export type Parent = Pick<
    AutoMovieCurveParentContext,
    "point" | "direction" | "frame"
  >;
}
