import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { physicalInertiaTensor } from "../../physics/physicalInertiaTensor";
import type { resolveAutoMovieBoneRates } from "../resolveAutoMovieBoneRates";
import type { resolveAutoMovieMomentum } from "../resolveAutoMovieMomentum";

/**
 * Instantaneous centroidal momentum from actual bone-origin rates.
 *
 * The model, posed parts, bones and rates must describe the same instant and
 * the same unchanged mass model, in one common frame. Bone linear rates are
 * metres per second and angular rates radians per second in that frame. Parts
 * and their centre come from the existing mass-model pose owner; principal axes
 * retain that owner's actual principal-to-common rotation. A part's centre
 * moves at `v_bone + omega_bone cross (c_part - p_bone)`. The result has the
 * existing momentum shape, with centre and rates at this instant rather than at
 * the middle of a finite interval.
 *
 * Every part remains present, including zero-mass parts whose intrinsic inertia
 * can still contribute spin under the existing mass-model contract. The whole
 * body needs finite positive mass. Inputs are borrowed for this synchronous
 * reduction, and every returned vector is fresh. This function does not replace
 * the two-pose momentum API or certify callback derivatives.
 *
 * @param model The same ordered SI mass model that produced posed.
 * @param posed Its rigid parts and mass-weighted centre at this instant.
 * @param bones The actual common-frame bone poses used to produce posed.
 * @param rates Actual common-frame origin and angular derivatives of bones.
 * @returns Instantaneous centre, centre velocity and linear/angular momentum.
 * @throws {Error} When mass, rates or results are nonfinite, total mass is not
 *   positive, part count/masses do not match, or a segment's bone/rate is
 *   missing.
 */
export function resolveAutoMovieMomentumRates(
  model: IAutoMovieResolveCenterOfMass.IModel,
  posed: resolveAutoMovieMomentum.IPosed,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  rates: ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>,
): IAutoMovieBodyMomentum {
  if (!(model.mass > 0))
    throw new Error("Instantaneous momentum needs finite positive total mass");
  if (posed.parts.length !== model.segments.length)
    throw new Error(
      "Instantaneous momentum needs this model's ordered posed parts",
    );

  const partRates: IPartRate[] = [];
  let mass: number = 0;
  let linearX: number = 0;
  let linearY: number = 0;
  let linearZ: number = 0;
  for (let i: number = 0; i < model.segments.length; i++) {
    const segment: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
    const part: IAutoMovieCombinePhysicalMassProperties.IPart = posed.parts[i]!;
    const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
    const rate: resolveAutoMovieBoneRates.IRate | undefined = rates.get(
      segment.bone,
    );
    if (bone === undefined || rate === undefined)
      throw new Error(
        `Instantaneous momentum needs the posed bone and rate ${segment.bone}`,
      );
    if (!(part.mass >= 0 && Object.is(part.mass, segment.mass)))
      throw new Error(
        `Instantaneous momentum needs this model's finite part mass for ${segment.bone}`,
      );

    // The posed COM already contains the actual rotated bone-local offset.
    // Its difference from the bone origin is in the rate's common frame.
    const x: number = part.centerOfMass.x - bone.worldPosition.x;
    const y: number = part.centerOfMass.y - bone.worldPosition.y;
    const z: number = part.centerOfMass.z - bone.worldPosition.z;
    const angular: IAutoMovieVector3 = {
      x: rate.angular.x,
      y: rate.angular.y,
      z: rate.angular.z,
    };
    const linear: IAutoMovieVector3 = {
      x: rate.linear.x + (angular.y * z - angular.z * y),
      y: rate.linear.y + (angular.z * x - angular.x * z),
      z: rate.linear.z + (angular.x * y - angular.y * x),
    };
    partRates.push({ velocity: linear, angular });
    mass += part.mass;
    linearX += part.mass * linear.x;
    linearY += part.mass * linear.y;
    linearZ += part.mass * linear.z;
  }
  if (!Object.is(mass, model.mass))
    throw new Error(
      "Instantaneous momentum needs the model's exact ordered mass sum",
    );

  const velocity: IAutoMovieVector3 = {
    x: linearX / model.mass,
    y: linearY / model.mass,
    z: linearZ / model.mass,
  };
  let angularX: number = 0;
  let angularY: number = 0;
  let angularZ: number = 0;
  for (let i: number = 0; i < posed.parts.length; i++) {
    const part: IAutoMovieCombinePhysicalMassProperties.IPart = posed.parts[i]!;
    const rate: IPartRate = partRates[i]!;
    const x: number = part.centerOfMass.x - posed.centre.x;
    const y: number = part.centerOfMass.y - posed.centre.y;
    const z: number = part.centerOfMass.z - posed.centre.z;
    const vx: number = rate.velocity.x - velocity.x;
    const vy: number = rate.velocity.y - velocity.y;
    const vz: number = rate.velocity.z - velocity.z;
    const spin: IAutoMovieVector3 = physicalInertiaTensor.spin(
      part,
      part.inertiaRotation,
      rate.angular,
    );

    // Removing the COM velocity before each cross product keeps uniform
    // translation out of the orbital momentum about that same COM.
    angularX += (y * vz - z * vy) * part.mass + spin.x;
    angularY += (z * vx - x * vz) * part.mass + spin.y;
    angularZ += (x * vy - y * vx) * part.mass + spin.z;
  }
  const linear: IAutoMovieVector3 = { x: linearX, y: linearY, z: linearZ };
  const angular: IAutoMovieVector3 = { x: angularX, y: angularY, z: angularZ };
  return {
    centre: { x: posed.centre.x, y: posed.centre.y, z: posed.centre.z },
    velocity,
    linear,
    angular,
  };
}

/** Current rigid-part rates after transferring the bone origin to its COM. */
interface IPartRate {
  /** Velocity at this part's centre of mass, common-frame metres per second. */
  velocity: IAutoMovieVector3;

  /** Its bone's unchanged angular velocity, common-frame radians per second. */
  angular: IAutoMovieVector3;
}
