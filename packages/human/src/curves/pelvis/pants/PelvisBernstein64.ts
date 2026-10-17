import {
  AutoMovieBernstein64 as B,
  AutoMovieCurveMath64 as V,
} from "@automovie/engine";

/** Human-specific bounded XZ first-variation convention with an independently polynomial Y chart; general coefficient algebra is owned by the engine.
 *
 * @evidence contracts/common.md#principled-implementation XZ handle weights use the mean endpoint radius while Y is an independent cubic polynomial multiplied by that denominator.
 * @evidence contracts/common.md#clear-and-simple-design This Human chart policy delegates all coefficient elevation and multiplication to the engine algebra.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The XZ bound is a declared construction convention, not a clinical norm or a certificate of regularity.
 * @evidence contracts/common.md#meaningful-documentation States the independently polynomial Y rule and the zero-radius rejection.
 * @evidence contracts/performance.md#efficient-algorithms Fixed cubic and degree-six coefficient arrays require constant work per jet.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A jet depends on its four current endpoint values and derivatives; no cross-call state is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned homogeneous coefficient arrays are owned by the caller, with no scene or global cache.
 */
export namespace PelvisBernstein64 {
  /** Construct the bounded XZ first variation and its independently polynomial Y field; zero XZ scale rejects.
   *
   * @evidence contracts/common.md#principled-implementation XZ handle weights use the mean endpoint radius while Y is an independent cubic polynomial multiplied by that denominator.
   * @evidence contracts/common.md#clear-and-simple-design This Human chart policy delegates all coefficient elevation and multiplication to the engine algebra.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The XZ bound is a declared construction convention, not a clinical norm or a certificate of regularity.
   * @evidence contracts/common.md#meaningful-documentation States the independently polynomial Y rule and the zero-radius rejection.
   * @evidence contracts/performance.md#efficient-algorithms Fixed cubic and degree-six coefficient arrays require constant work per jet.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A jet depends on its four current endpoint values and derivatives; no cross-call state is retained.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned homogeneous coefficient arrays are owned by the caller, with no scene or global cache.
   */
  export function boundedSpatialJet(
    a: B.Vec,
    b: B.Vec,
    da: B.Vec,
    db: B.Vec,
  ): B.RecordV {
    const radius: number =
      (Math.hypot(a[0], a[2]) + Math.hypot(b[0], b[2])) / 2;
    if (!(radius > 0))
      throw new Error(
        "Zero spatial first-variation scale requires another chart",
      );
    const va: number = Math.hypot(da[0], da[2]),
      vb: number = Math.hypot(db[0], db[2]);
    const w: number[] = [
      1,
      va ? va / (3 * radius) : 1,
      vb ? vb / (3 * radius) : 1,
      1,
    ];
    const points: B.Poly = [
      a,
      [
        a[0] + (va ? (da[0] / va) * radius : 0),
        0,
        a[2] + (va ? (da[2] / va) * radius : 0),
      ],
      [
        b[0] - (vb ? (db[0] / vb) * radius : 0),
        0,
        b[2] - (vb ? (db[2] / vb) * radius : 0),
      ],
      b,
    ];
    const xz: B.Poly = B.elevate(
      points.map((p: B.Vec, i: number): B.Vec => V.scale(p, w[i]!)),
      6,
    );
    const y: number[] = B.product(w, [
      a[1],
      a[1] + da[1] / 3,
      b[1] - db[1] / 3,
      b[1],
    ]);
    xz.forEach((p: B.Vec, i: number): void => {
      p[1] = y[i]!;
    });
    return { numerator: xz, denominator: w };
  }
}
