import type { IHumanExactFraction } from "../../../common/measure/IHumanExactFraction";
import type { IHumanFaceOcularCapFoot } from "./structures/IHumanFaceOcularCapFoot";

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
 * The cap metric isolates every stationary root of its exact degree-at-most-seven
 * distance polynomial, alongside both endpoints. Feasible candidate upper
 * costs and complete lower bounds select a foot and expose uncertainty for the
 * represented meridian inputs and profile evaluation. World-to-meridian
 * reduction, frame placement and the returned Euclidean distance also round in
 * binary64; that separate arithmetic is not enclosed by distanceErrorMetres.
 * A front sphere candidate is excluded; its restricted endpoint
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
 * @evidence contracts/common.md#principled-implementation The piecewise cap/sphere solid reduces each query to a meridian plane and compares every stationary cap candidate with the restricted sphere foot.
 * @evidence contracts/common.md#clear-and-simple-design A copied frame/profile and canonical exact cap metric report represented meridian/profile uncertainty separately from frame reduction and placement roundoff outside that enclosure, emitted-hull deviation and physical contact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inflection and ambiguous radial-axis feet retain deterministic qualified-frame handling; feasible represented feet are not relabelled exact real-surface minima.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre distance/error, captured evaluator premises, independent descriptors and separate emitted-cell certificate meaning.
 * @evidence contracts/performance.md#efficient-algorithms Each project query pays exact fixed-degree root isolation/fraction bounds; meridianArc uses the canonical numerical integration owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured profile coefficients, frame, rim error and cap arc are shared across queries; query-dependent roots and distances are recomputed.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned exterior retains profile evaluators/frame/metric until release; query temporaries expire and no task or global cache is acquired.
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
  const axis: IAutoMovieVector3 = Vector3.normalize(axisDirection);
  const lateral: IAutoMovieVector3 = Vector3.normalize(
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
  const { radius, limbus }: { radius: number; limbus: number; curvature: number; thickness: number; iris: number; aperture: number; depth: number; rim: number; apex: number; irisZ: number; height: (r: number) => number; slope: (r: number) => number; } = profile;
  const capArc: number = integrateHumanFaceOcularMeridian(profile, limbus);
  const limbusAngle: number = Math.atan2(limbus, profile.rim);
  const underCap: (rho: number, zeta: number) => boolean = (rho: number, zeta: number): boolean =>
    rho < limbus && zeta > 0;
  const capMetric: HumanFaceOcularCapMetric = new HumanFaceOcularCapMetric(profile);
  const radiusFraction: IHumanExactFraction = Fraction.from(radius);
  const radiusSquare: IHumanExactFraction = Fraction.multiply(radiusFraction, radiusFraction);
  const limbusSquare: IHumanExactFraction = Fraction.multiply(
    Fraction.from(limbus),
    Fraction.from(limbus),
  );
  const rimBounds: [number, number] = Fraction.sqrtBounds(
    Fraction.add(radiusSquare, Fraction.negate(limbusSquare)),
  );
  const interfaceError: number = HumanBinary64Arithmetic.nextUp(
    Math.max(
      Math.abs(profile.rim - rimBounds[0]),
      Math.abs(profile.rim - rimBounds[1]),
    ),
  );
  return {
    center: { ...center },
    axis: { ...axis },
    hullDeviationMetres,
    meridianArc: (point: IAutoMovieVector3): number  => {
      const offset: IAutoMovieVector3 = Vector3.subtract(point, center);
      const zeta: number = Vector3.dot(offset, axis);
      const rho: number = Vector3.length(
        Vector3.subtract(offset, Vector3.scale(axis, zeta)),
      );
      return underCap(rho, zeta)
        ? integrateHumanFaceOcularMeridian(profile, rho)
        : capArc + radius * (Math.atan2(rho, zeta) - limbusAngle);
    },
    project: (point: IAutoMovieVector3): { point: IAutoMovieVector3; normal: IAutoMovieVector3; signedDistance: number; distanceErrorMetres: number; }  => {
      const offset: IAutoMovieVector3 = Vector3.subtract(point, center);
      const zeta: number = Vector3.dot(offset, axis);
      const radial: IAutoMovieVector3 = Vector3.subtract(offset, Vector3.scale(axis, zeta));
      const rho: number = Vector3.length(radial);
      const outward: IAutoMovieVector3 =
        rho === 0 ? lateral : Vector3.normalize(radial);
      const place: (r: number, z: number) => IAutoMovieVector3 = (r: number, z: number): IAutoMovieVector3 =>
        Vector3.add(
          center,
          Vector3.add(Vector3.scale(outward, r), Vector3.scale(axis, z)),
        );
      const direction: (r: number, z: number) => IAutoMovieVector3 = (r: number, z: number): IAutoMovieVector3 =>
        Vector3.normalize(
          Vector3.add(Vector3.scale(outward, r), Vector3.scale(axis, z)),
        );
      const length: number = Math.hypot(rho, zeta);
      const meridianDirection: IAutoMovieVector3 = Vector3.normalize(Vector3.create(rho, 0, zeta));
      const majorInput: number = Math.max(rho, Math.abs(zeta));
      const majorDirection: number =
        rho >= Math.abs(zeta)
          ? meridianDirection.x
          : Math.abs(meridianDirection.z);
      // The scaled normalization owner supplies its safely represented major
      // direction. Apply that common factor as exact rational arithmetic so
      // a tiny minor direction is not lost before multiplication by R.
      const sphereFactor: IHumanExactFraction =
        majorInput === 0
          ? Fraction.create(0n)
          : Fraction.divide(
              Fraction.multiply(radiusFraction, Fraction.from(majorDirection)),
              Fraction.from(majorInput),
            );
      const sphereComponent: (component: number) => number = (component: number): number =>
        Fraction.number(
          Fraction.multiply(sphereFactor, Fraction.from(component)),
        );
      const sphereRho: number = length === 0 ? 0 : sphereComponent(rho);
      const sphereZeta: number = length === 0 ? -radius : sphereComponent(zeta);
      const capFoot: IHumanFaceOcularCapFoot = capMetric.foot(rho, zeta);
      const capR: number = capFoot.radiusMetres;
      const capZ: number = profile.height(capR);
      const sphereDistance: number = underCap(sphereRho, sphereZeta)
        ? Infinity
        : Math.abs(length - radius);
      const radialSquared: IHumanExactFraction = Fraction.multiply(
        Fraction.from(rho),
        Fraction.from(rho),
      );
      const axialSquared: IHumanExactFraction = Fraction.multiply(
        Fraction.from(zeta),
        Fraction.from(zeta),
      );
      const normBounds: [number, number] = Fraction.sqrtBounds(
        Fraction.add(radialSquared, axialSquared),
      );
      const sphereLower: number =
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
      const sphereUpper: number =
        sphereDistance === Infinity
          ? Infinity
          : HumanBinary64Arithmetic.nextUp(
              Math.max(
                Math.abs(normBounds[0] - radius),
                Math.abs(normBounds[1] - radius),
              ),
            );
      const sr: IHumanExactFraction = Fraction.add(
        Fraction.from(sphereRho),
        Fraction.negate(Fraction.from(rho)),
      );
      const sz: IHumanExactFraction = Fraction.add(
        Fraction.from(sphereZeta),
        Fraction.negate(Fraction.from(zeta)),
      );
      const sphereOutputUpper: number =
        sphereDistance === Infinity
          ? Infinity
          : Fraction.sqrtBounds(
              Fraction.add(
                Fraction.multiply(sr, sr),
                Fraction.multiply(sz, sz),
              ),
            )[1];
      const sphereHeight: number =
        rho < radius ? Math.sqrt((radius - rho) * (radius + rho)) : 0;
      const upperHeight: number = rho < limbus ? profile.height(rho) : sphereHeight;
      const inside: boolean = rho < radius && zeta > -sphereHeight && zeta < upperHeight;
      // Compare feasible upper distances; overlapping enclosures retain the
      // selected represented point and expose the meridian/profile uncertainty;
      // frame reduction and world placement roundoff are separate.
      const useCap: boolean = capFoot.upperDistanceMetres < sphereUpper;
      const foot: IAutoMovieVector3 = useCap ? place(capR, capZ) : place(sphereRho, sphereZeta);
      const distance: number = Vector3.length(Vector3.subtract(point, foot));
      // Retain derived rim roundoff at the exact circle/cap interface.
      const lowerDistance: number = Math.max(
        0,
        HumanBinary64Arithmetic.nextDown(
          Math.min(capFoot.lowerDistanceMetres, sphereLower) - interfaceError,
        ),
      );
      const upperDistance: number = useCap
        ? HumanBinary64Arithmetic.nextUp(
            capFoot.upperDistanceMetres + capFoot.representationErrorMetres,
          )
        : Math.max(sphereUpper, sphereOutputUpper);
      const error: IHumanExactFraction = Fraction.add(
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
