import type { HumanCurve } from "../internal/HumanCurve";
import type { HumanSkeleton } from "../internal/HumanSkeleton";
import type { IAutoMovieHumanHeadIdentity } from "../structures/head/IAutoMovieHumanHeadIdentity";

/** Shared geometric head axes; no surface shape or clinical registration is inferred. */
export namespace HumanHeadFrame {
  /** Physical dimensions and vertical feature stations shared by head regions. */
  export interface Result {
    /** The common skeleton owner's head support, in registered world millimetres. */
    supportMm: HumanCurve.Vector;

    /** Independent forward cranial scale, mm. */
    lengthMm: number;

    /** Length times cephalic index divided by 100, mm. */
    breadthMm: number;

    /** Input head height, mm. */
    heightMm: number;

    /** Vertical leg of the generated eye-to-chin chord, mm. */
    eyeHeightMm: number;

    /** Generated chin datum, world Y mm. */
    chinY: number;

    /** Generated inner-eye datum, world Y mm. */
    eyeY: number;

    /** Common inner-eye forward coordinate, world X mm. */
    innerEyeForwardMm: number;

    /** Generated chin forward coordinate satisfying the same face chord, world X mm. */
    chinForwardMm: number;

    /** Generated crown datum, world Y mm. */
    crownY: number;
  }

  /**
   * Solve the vertical eye/chin chord after the observed common forward offset.
   * Four achieved source feature chords identify a pooled forward magnitude of
   * 0.07138945147563247 head lengths. The remaining leg follows Pythagoras. This
   * is a source-geometric frame law, not a clinical landmark equivalence claim.
   */
  export function build(parameters: IAutoMovieHumanHeadIdentity, skeleton: HumanSkeleton.Result): Result {
    const length: number = positive(parameters.length, "head length");
    const breadth: number = length * positive(parameters.cephalicIndex, "cephalic index") / 100;
    const height: number = positive(parameters.height, "head height");
    const face: number = positive(parameters.faceHeight, "face height");
    const support: HumanCurve.Vector | undefined = skeleton.supports.get("head");
    if (support === undefined || !support.every(Number.isFinite) || !Number.isFinite(skeleton.heightMm))
      throw new Error("A finite common head support and crown height are required");
    const forward: number = 0.07138945147563247 * length;
    const eyeHeight: number = Math.sqrt(face * face - forward * forward);
    if (!(eyeHeight > 0 && eyeHeight < height))
      throw new Error("Face chord and head height have no supported cranial interval");
    const chinY: number = skeleton.heightMm - height;
    return { supportMm: [...support], lengthMm: length, breadthMm: breadth, heightMm: height,
      eyeHeightMm: eyeHeight, chinY, eyeY: chinY + eyeHeight,
      innerEyeForwardMm: support[0] + 0.550602768371337 * length,
      chinForwardMm: support[0] + (0.550602768371337 + 0.07138945147563247) * length,
      crownY: skeleton.heightMm };
  }

  /** Physical dimension admission precedes all metric frame construction. */
  function positive(value: number, name: string): number {
    if (!(value > 0 && Number.isFinite(value))) throw new Error("A positive physical " + name + " is required");
    return value;
  }
}
