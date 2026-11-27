import type { IAutoMovieConstructionLocalScaleMinorant } from "@automovie/interface";

/**
 * IAutoMovieConstructionLocalScaleMinorant.Certify one uniform attenuation of a
 * positive nonuniform scale field.
 */
export namespace AutoMovieEngineConstructionLocalScaleMinorant {
  /**
   * Apply at most one constant attenuation and certify its literal result.
   *
   * The exact-real maximum multiplier is min(1, min(F_k/v_k)). Only violated
   * caps form a ratio. Its predecessor supplies one guarded Float64 candidate;
   * direct bound, log and delegated geometry checks remain the authority.
   * Positive subnormal values are allowed only if every postcondition holds; a
   * zero from predecessor or multiplication is an explicit refusal.
   *
   * This certifies the discrete columns. The returned factor is f=alpha*v; the
   * caller scales raw first jets by f and raw second jets by f squared.
   * Relative to the last v-field's jets, these changes are alpha and alpha
   * squared, with no phase-dependent derivative terms and the same existing
   * interpolation. It proves no continuous-phase minorant or embedded band and
   * does not repair a backward ribbon.
   *
   * @param lastField Last positive field, with one value per original column.
   * @param forwardCaps Nonempty original admitted forward constraints.
   * @param certifyColumn Original owner's literal scaled-vector and geometry
   *   certificate.
   * @returns A new certified field or a named refusal; never retries or mutates
   *   inputs.
   */
  export function create(
    lastField: readonly number[],
    forwardCaps: readonly IAutoMovieConstructionLocalScaleMinorant.ICap[],
    certifyColumn: IAutoMovieConstructionLocalScaleMinorant.Certify,
  ): IAutoMovieConstructionLocalScaleMinorant.Result {
    if (lastField.length === 0)
      return refuse("input-field", null, "the field has no columns");
    for (let index: number = 0; index < lastField.length; ++index)
      if (!(lastField[index]! > 0 && lastField[index]! <= 1))
        return refuse(
          "input-field",
          index,
          "the field value must be finite and in (0, 1]",
        );
    if (forwardCaps.length === 0)
      return refuse(
        "input-cap",
        null,
        "the field has no admitted forward constraints",
      );
    const caps: Map<number, IAutoMovieConstructionLocalScaleMinorant.ICap> =
      new Map<number, IAutoMovieConstructionLocalScaleMinorant.ICap>();
    for (const cap of forwardCaps) {
      if (!(cap.index >= 0 && cap.index < lastField.length))
        return refuse(
          "input-cap",
          null,
          "a forward index is not an integer in the field",
        );
      if (caps.has(cap.index))
        return refuse(
          "input-cap",
          cap.index,
          "the forward index is duplicated",
        );
      if (!(cap.factor > 0 && cap.factor <= 1))
        return refuse(
          "input-cap",
          cap.index,
          "the admitted factor must be finite and in (0, 1]",
        );
      if (!(cap.logarithm <= 0))
        return refuse(
          "input-cap",
          cap.index,
          "the logarithmic upper bound must be finite and nonpositive",
        );
      caps.set(cap.index, cap);
    }

    // F is the original admitted binary factor, not exp(log(F)). Recheck its
    // actual geometry before using its numeric constraint as a certificate.
    for (const cap of forwardCaps) {
      const reason: string | null = certifyColumn(cap.index, cap.factor, true);
      if (reason !== null) return refuse("held-certificate", cap.index, reason);
    }
    let ratio: number = 1;
    let violated: boolean = false;
    let limitingIndices: number[] = [];
    for (const cap of forwardCaps) {
      if (lastField[cap.index]! <= cap.factor) continue;
      violated = true;
      const quotient: number = cap.factor / lastField[cap.index]!;
      if (!(quotient > 0 && quotient <= 1))
        return refuse(
          "ratio",
          cap.index,
          "the violated-cap ratio is not finite and in (0, 1]",
        );
      if (quotient < ratio) {
        ratio = quotient;
        limitingIndices = [cap.index];
      } else if (quotient === ratio) limitingIndices.push(cap.index);
    }
    const alpha: number = violated ? previous(ratio) : 1;
    if (!(alpha > 0 && alpha <= 1))
      return refuse(
        "alpha",
        null,
        "the single attenuation candidate is not finite and in (0, 1]",
      );
    const field: number[] = [];
    for (let index: number = 0; index < lastField.length; ++index) {
      const factor: number = alpha * lastField[index]!;
      if (!(factor > 0 && factor <= 1))
        return refuse(
          "candidate-field",
          index,
          "the attenuated factor is not finite and in (0, 1]",
        );
      const cap: IAutoMovieConstructionLocalScaleMinorant.ICap | undefined =
        caps.get(index);
      if (cap !== undefined) {
        if (!(factor <= cap.factor))
          return refuse(
            "candidate-cap",
            index,
            "the attenuated factor exceeds its admitted factor",
          );
        if (!(Math.log(factor) <= cap.logarithm))
          return refuse(
            "candidate-log",
            index,
            "the attenuated logarithm exceeds its existing upper bound",
          );
      }
      field.push(factor);
    }

    // This second certificate is independent of held admission: even a
    // smaller Float64 factor must pass the owner's actual literal predicate.
    for (let index: number = 0; index < field.length; ++index) {
      const reason: string | null = certifyColumn(
        index,
        field[index]!,
        caps.has(index),
      );
      if (reason !== null)
        return refuse("candidate-certificate", index, reason);
    }
    return { kind: "accepted", field, alpha, limitingIndices };
  }

  /*
   * Adjacent smaller nonnegative binary64 value, for a finite positive input.
   */
  function previous(value: number): number {
    const view: DataView = new DataView(new ArrayBuffer(8));
    view.setFloat64(0, value, false);
    view.setBigUint64(0, view.getBigUint64(0, false) - 1n, false);
    return view.getFloat64(0, false);
  }

  /*
   * Preserve the failing numerical stage and the geometry owner's reason.
   */
  function refuse(
    stage: Extract<
      IAutoMovieConstructionLocalScaleMinorant.Result,
      { kind: "refused" }
    >["stage"],
    index: number | null,
    reason: string,
  ): IAutoMovieConstructionLocalScaleMinorant.Result {
    return { kind: "refused", stage, index, reason };
  }
}
