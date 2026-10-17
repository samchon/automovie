import { AutoMovieCubicOval64 } from "@automovie/engine";

/** Common neutral-T construction rules, rather than measured population laws.
 *
 * Circumference sizing integrates the authored four-pole cubic, so a circular approximation's diameter is not silently computed from pi instead.
 */
export namespace ArmIdentityRules {
  /** Quarter-circle cubic handle/radius convention, 4/3*tan(pi/8); affine diameter scaling produces the section's oval approximation. */
  export const rounding: number = AutoMovieCubicOval64.rounding;

  /** Declared maximum-girth course at one quarter of the elbow-to-Hand distance, not an independently measured anatomical maximum. */
  export const forearmMaximumFraction: number = 0.25;

  /** Default dorsal/palmar depth divided by radial/ulnar breadth, 0.82.
   *
   * Two closed native-A reference Forearm courses have principal minor/major ratios 0.810 and 0.832. Their rounded mean supplies only this common coarse aspect, not a body-specific section. Assigning the short axis to dorsal/palmar depth in neutral T is a conventional transfer consistent with the flattened forearm form described by Gray, not a measured orientation or a population regression. Independent supplied depth takes precedence.
   */
  export const forearmDepthPerBreadth: number = 0.82;

  /** Derive the default forearm depth in millimetres while preserving the supplied circumference of the actual four-quarter cubic.
   *
   * Scaling the unit-aspect section preserves its perimeter exactly up to the shared quadrature. An equal-axis section would erase the declared depth/breadth shape and make the elbow-to-forearm course appear cylindrical. This fallback neither changes elbow girth nor replaces a caller's measured depth.
   */
  export function defaultForearmDepth(girthMm: number): number {
    if (!(Number.isFinite(girthMm) && girthMm > 0))
      throw new Error("Positive finite relaxed forearm girth required");
    return (
      (girthMm * forearmDepthPerBreadth) / perimeter(1, forearmDepthPerBreadth)
    );
  }

  /** Rounded common elbow-course/forearm-course girth ratio, 0.97, from two reference-mesh closed sections (0.989 and 0.946). Native-A skin-course to neutral-T transfer remains conventional, not a population or epicondylar regression. */
  export const elbowGirthPerForearmGirth: number = 0.97;

  /** Conventional default elbow depth/default breadth of 0.9; an independent breadth override does not silently rescale the depth. */
  export const elbowDepthPerBreadth: number = 0.9;

  /** Conventional neutral-T half-area course at 55% of joint-centre forearm length. Two native reference area courses crossed their endpoint-area mean near .521 and .568 inside [.35,.90]; mapping those observations to maximum-to-wrist is a coarse pose/protocol inference. */
  export const forearmHalfAreaFraction: number = 0.55;

  /** Maximum, half-area and distal taper support fractions. The final support bisects the remaining distance; it is a geometric support, not a tendon insertion. */
  export const stations: readonly number[] = [
    forearmMaximumFraction,
    forearmHalfAreaFraction,
    (forearmHalfAreaFraction + 1) / 2,
  ];

  /** Preserve an area-product and independently changing aspect between maximum and owner wrist.
   *
   * All four-quarter affine sections use the same rounding, so enclosed area is proportional to diameterU*diameterV. The power law reaches half of excess area at the declared half-area distance; it is not a geodesic or muscle-volume model. Caller measurements and the actual owner endpoint remain authoritative.
   */
  export function forearmDiameters(
    maximumUmm: number,
    maximumVmm: number,
    wristUmm: number,
    wristVmm: number,
    fraction: number,
  ): readonly [number, number] {
    if (
      ![maximumUmm, maximumVmm, wristUmm, wristVmm].every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      ) ||
      !Number.isFinite(fraction) ||
      fraction < forearmMaximumFraction ||
      fraction > 1
    )
      throw new Error(
        "Positive finite taper diameters and an admitted forearm course required",
      );
    const t: number =
      (fraction - forearmMaximumFraction) / (1 - forearmMaximumFraction);
    const half: number =
      (forearmHalfAreaFraction - forearmMaximumFraction) /
      (1 - forearmMaximumFraction);
    const power: number = Math.log(0.5) / Math.log(1 - half);
    const excess: number = (1 - t) ** power;
    const product: number = blend(
      wristUmm * wristVmm,
      maximumUmm * maximumVmm,
      excess,
    );
    const aspect: number = Math.exp(
      blend(
        Math.log(maximumUmm / maximumVmm),
        Math.log(wristUmm / wristVmm),
        t,
      ),
    );
    const result: readonly [number, number] = [
      Math.sqrt(product * aspect),
      Math.sqrt(product / aspect),
    ];
    if (
      !result.every(
        (value: number): boolean => Number.isFinite(value) && value > 0,
      )
    )
      throw new Error("Unresolved physical forearm taper");
    return result;
  }

  /** Approximate the four-quarter cubic perimeter in millimetres with eight-point Gauss-Legendre quadrature; nonfinite or negative diameters throw. */
  export const perimeter: typeof AutoMovieCubicOval64.perimeter =
    AutoMovieCubicOval64.perimeter;

  /** Diameter in millimetres of this cubic's equal-axis section with the requested perimeter; callers admit the girth before construction. */
  export function equivalentDiameter(girthMm: number): number {
    return girthMm / perimeter(1, 1);
  }

  /** Solve the other diameter in millimetres by 64 bisections of the cubic perimeter, preserving the independent diameter; incompatible girth and aspect outside [1/4,4] throw. */
  export function otherDiameter(
    girthMm: number,
    fixedDiameterMm: number,
  ): number {
    const result: number = AutoMovieCubicOval64.otherDiameter(
      girthMm,
      fixedDiameterMm,
    );
    if (!(result / fixedDiameterMm >= 0.25 && result / fixedDiameterMm <= 4))
      throw new Error(
        "Section aspect ratio exceeds this numerical construction's declared 1:4 to 4:1 range",
      );
    return result;
  }

  /** Linear interpolation in the input units; callers own whether the dimensionless weight lies in [0,1]. */
  export function blend(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
}
