import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanBinary64Arithmetic } from "../../../common/measure/HumanBinary64Arithmetic";
import { HumanExactFraction as Fraction } from "../../../common/measure/HumanExactFraction";
import { HumanFaceOcularCapMetric } from "./HumanFaceOcularCapMetric";
import { integrateHumanFaceOcularMeridian } from "./integrateHumanFaceOcularMeridian";
import type { resolveHumanFaceOpticalProfile } from "./resolveHumanFaceOpticalProfile";
import type { IHumanFaceOcularSurface } from "./structures/IHumanFaceOcularSurface";

/**
 * Define the analytic exterior of one eye from its admitted optical profile.
 *
 * The exterior is a surface of revolution about the optical axis. Behind the
 * limbus it is the globe sphere of radius `profile.radius`; in front it is the
 * corneal cap `z = profile.height(r)` for `r <= profile.limbus`, which meets
 * the sphere at the limbus ring. The cap replaces the front sphere within
 * the limbal disk; it is not unioned with the ball. The solid lies above the
 * posterior sphere and below this piecewise front boundary. This definition
 * supports both convex and inflected admitted caps, including Rc > R.
 *
 * A query reduces to the meridian plane, with `rho` the distance from the
 * axis and `zeta` the coordinate along it. The nearest sphere point is radial.
 * The cap metric isolates every stationary root of its exact degree-seven
 * distance polynomial, alongside both endpoints. Feasible candidate upper
 * costs and complete lower bounds select a foot and expose numerical distance
 * uncertainty. A front sphere candidate is excluded; its restricted endpoint
 * is already the shared cap limbus. On the axis a ring of equally near feet
 * uses the qualified radial frame for one deterministic actual point/normal.
 *
 * The emitted triangles have a separate actual-cell deviation certificate.
 * Inflection does not imply hull inscription or apex-maximum curvature.
 * That representation error never becomes an automatic seating clearance;
 * physical contact remains measured against the actual emitted closed hull.
 *
 * The factory captures profile scalars and evaluator references together with
 * a private frame. Evaluators must preserve their own resolved profile, as
 * the normal profile owner does through local scalar closures. Returned
 * centre and axis vectors are independent descriptors: mutating them does
 * not move the compiled query, which requires a new factory call to change.
 *
 * @evidence contracts/common.md#principled-implementation The cap-replaced solid, complete stationary-root search, restricted sphere and axis-frame tie share one profile; exact meridian distance enclosures distinguish represented feet from real minima.
 * @evidence contracts/common.md#clear-and-simple-design One factory returns the surface; the profile owner keeps every dimension and formula of the cap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No radius, protrusion or clearance is adjusted here, and no eye or side is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the two pieces, the solid, the relation to the emitted hull and the search method with its premise.
 * @evidence contracts/modeling.md#shared-boundaries Supplies the one definition of the ocular exterior that seating, tissue construction and visible ocular sheets consume.
 * @evidence contracts/modeling.md#spatial-conventions Centre and axis are head-frame metres and a unit vector; the profile is metres.
 * @evidence contracts/anatomy.md#anatomical-source The seven optical dimensions and their sources belong to the optical profile owner; this owner derives geometry from them and adds no value.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines a reference surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes the resolved profile, not a channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation Not displayed; the optical parts are.
 * @evidenceExclude contracts/anatomy.md#permitted-range The profile owner admits the dimensions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no input.
 */
export function createHumanFaceOcularSurface(
  inputProfile: ReturnType<typeof resolveHumanFaceOpticalProfile>,
  inputCenter: IAutoMovieVector3,
  axisDirection: IAutoMovieVector3,
  radialReference: IAutoMovieVector3,
  hullDeviationMetres: number,
): IHumanFaceOcularSurface {
  const profile: ReturnType<typeof resolveHumanFaceOpticalProfile> = {
    radius: inputProfile.radius,
    limbus: inputProfile.limbus,
    curvature: inputProfile.curvature,
    thickness: inputProfile.thickness,
    iris: inputProfile.iris,
    aperture: inputProfile.aperture,
    depth: inputProfile.depth,
    rim: inputProfile.rim,
    apex: inputProfile.apex,
    irisZ: inputProfile.irisZ,
    height: inputProfile.height,
    slope: inputProfile.slope,
  };
  const center: IAutoMovieVector3 = {
    x: inputCenter.x,
    y: inputCenter.y,
    z: inputCenter.z,
  };
  const axis = Vector3.normalize(axisDirection);
  const lateral = Vector3.normalize(
    Vector3.subtract(
      radialReference,
      Vector3.scale(axis, Vector3.dot(radialReference, axis)),
    ),
  );
  if (
    ![axis.x, axis.y, axis.z, lateral.x, lateral.y, lateral.z].every(
      Number.isFinite,
    ) ||
    Vector3.length(axis) === 0 ||
    Vector3.length(lateral) === 0
  )
    throw new Error(
      "An ocular surface needs its qualified optical axis and radial frame.",
    );
  const { radius, limbus } = profile;
  const capArc = integrateHumanFaceOcularMeridian(profile, limbus);
  const limbusAngle = Math.atan2(limbus, profile.rim);
  const underCap = (rho: number, zeta: number): boolean =>
    rho < limbus && zeta > 0;
  const capMetric = new HumanFaceOcularCapMetric(profile);
  const radiusFraction = Fraction.from(radius);
  const radiusSquare = Fraction.multiply(radiusFraction, radiusFraction);
  const limbusSquare = Fraction.multiply(
    Fraction.from(limbus),
    Fraction.from(limbus),
  );
  const rimBounds = Fraction.sqrtBounds(
    Fraction.add(radiusSquare, Fraction.negate(limbusSquare)),
  );
  const interfaceError = HumanBinary64Arithmetic.nextUp(
    Math.max(
      Math.abs(profile.rim - rimBounds[0]),
      Math.abs(profile.rim - rimBounds[1]),
    ),
  );
  return {
    center: { ...center },
    axis: { ...axis },
    hullDeviationMetres,
    meridianArc: (point) => {
      const offset = Vector3.subtract(point, center);
      const zeta = Vector3.dot(offset, axis);
      const rho = Vector3.length(
        Vector3.subtract(offset, Vector3.scale(axis, zeta)),
      );
      return underCap(rho, zeta)
        ? integrateHumanFaceOcularMeridian(profile, rho)
        : capArc + radius * (Math.atan2(rho, zeta) - limbusAngle);
    },
    project: (point) => {
      const offset = Vector3.subtract(point, center);
      const zeta = Vector3.dot(offset, axis);
      const radial = Vector3.subtract(offset, Vector3.scale(axis, zeta));
      const rho = Vector3.length(radial);
      const outward: IAutoMovieVector3 =
        rho === 0 ? lateral : Vector3.normalize(radial);
      const place = (r: number, z: number): IAutoMovieVector3 =>
        Vector3.add(
          center,
          Vector3.add(Vector3.scale(outward, r), Vector3.scale(axis, z)),
        );
      const direction = (r: number, z: number): IAutoMovieVector3 =>
        Vector3.normalize(
          Vector3.add(Vector3.scale(outward, r), Vector3.scale(axis, z)),
        );
      const length = Math.hypot(rho, zeta);
      const meridianDirection = Vector3.normalize(Vector3.create(rho, 0, zeta));
      const majorInput = Math.max(rho, Math.abs(zeta));
      const majorDirection =
        rho >= Math.abs(zeta)
          ? meridianDirection.x
          : Math.abs(meridianDirection.z);
      // The scaled normalization owner supplies its safely represented major
      // direction. Apply that common factor as exact rational arithmetic so
      // a tiny minor direction is not lost before multiplication by R.
      const sphereFactor =
        majorInput === 0
          ? Fraction.create(0n)
          : Fraction.divide(
              Fraction.multiply(radiusFraction, Fraction.from(majorDirection)),
              Fraction.from(majorInput),
            );
      const sphereComponent = (component: number): number =>
        Fraction.number(
          Fraction.multiply(sphereFactor, Fraction.from(component)),
        );
      const sphereRho = length === 0 ? 0 : sphereComponent(rho);
      const sphereZeta = length === 0 ? -radius : sphereComponent(zeta);
      const capFoot = capMetric.foot(rho, zeta);
      const capR = capFoot.radiusMetres;
      const capZ = profile.height(capR);
      const sphereDistance = underCap(sphereRho, sphereZeta)
        ? Infinity
        : Math.abs(length - radius);
      const radialSquared = Fraction.multiply(
        Fraction.from(rho),
        Fraction.from(rho),
      );
      const axialSquared = Fraction.multiply(
        Fraction.from(zeta),
        Fraction.from(zeta),
      );
      const normBounds = Fraction.sqrtBounds(
        Fraction.add(radialSquared, axialSquared),
      );
      const sphereLower =
        sphereDistance === Infinity
          ? Infinity
          : normBounds[0] <= radius && radius <= normBounds[1]
            ? 0
            : Math.max(
                0,
                HumanBinary64Arithmetic.nextDown(
                  Math.min(
                    Math.abs(normBounds[0] - radius),
                    Math.abs(normBounds[1] - radius),
                  ),
                ),
              );
      const sphereUpper =
        sphereDistance === Infinity
          ? Infinity
          : HumanBinary64Arithmetic.nextUp(
              Math.max(
                Math.abs(normBounds[0] - radius),
                Math.abs(normBounds[1] - radius),
              ),
            );
      const sr = Fraction.add(
        Fraction.from(sphereRho),
        Fraction.negate(Fraction.from(rho)),
      );
      const sz = Fraction.add(
        Fraction.from(sphereZeta),
        Fraction.negate(Fraction.from(zeta)),
      );
      const sphereOutputUpper =
        sphereDistance === Infinity
          ? Infinity
          : Fraction.sqrtBounds(
              Fraction.add(
                Fraction.multiply(sr, sr),
                Fraction.multiply(sz, sz),
              ),
            )[1];
      const sphereHeight =
        rho < radius ? Math.sqrt((radius - rho) * (radius + rho)) : 0;
      const upperHeight = rho < limbus ? profile.height(rho) : sphereHeight;
      const inside = rho < radius && zeta > -sphereHeight && zeta < upperHeight;
      // Compare feasible upper distances; overlapping enclosures retain the
      // selected feasible point and expose the complete global uncertainty.
      const useCap = capFoot.upperDistanceMetres < sphereUpper;
      const foot = useCap ? place(capR, capZ) : place(sphereRho, sphereZeta);
      const distance = Vector3.length(Vector3.subtract(point, foot));
      // Retain derived rim roundoff at the exact circle/cap interface.
      const lowerDistance = Math.max(
        0,
        HumanBinary64Arithmetic.nextDown(
          Math.min(capFoot.lowerDistanceMetres, sphereLower) - interfaceError,
        ),
      );
      const upperDistance = useCap
        ? HumanBinary64Arithmetic.nextUp(
            capFoot.upperDistanceMetres + capFoot.representationErrorMetres,
          )
        : Math.max(sphereUpper, sphereOutputUpper);
      const error = Fraction.add(
        Fraction.from(upperDistance),
        Fraction.negate(Fraction.from(lowerDistance)),
      );
      return {
        point: foot,
        normal: useCap
          ? direction(-profile.slope(capR), 1)
          : direction(sphereRho, sphereZeta),
        signedDistance: (inside ? -1 : 1) * distance,
        distanceErrorMetres:
          error.numerator <= 0n
            ? 0
            : Fraction.sqrtBounds(Fraction.multiply(error, error))[1],
      };
    },
  };
}
