import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMomentum,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { combinePhysicalMassProperties } from "../physics/combinePhysicalMassProperties";
import { physicalInertiaTensor } from "../physics/physicalInertiaTensor";
import type { resolveAutoMovieBoneRates } from "./resolveAutoMovieBoneRates";
import type { resolveAutoMovieCenterOfMass } from "./resolveAutoMovieCenterOfMass";
import type { resolveAutoMovieMomentum } from "./resolveAutoMovieMomentum";

/**
 * Instantaneous centroidal momentum from actual bone-origin rates.
 *
 * The model, posed parts, bones and rates must describe the same instant and
 * the same unchanged mass model, in one common frame. Bone linear rates are
 * metres per second and angular rates radians per second in that frame.
 * Parts and their centre come from the existing mass-model pose owner;
 * principal axes retain that owner's actual principal-to-common rotation.
 * A part's centre moves at `v_bone + omega_bone cross (c_part - p_bone)`.
 * The result has the existing momentum shape, with centre and rates at this
 * instant rather than at the middle of a finite interval.
 *
 * Every part remains present, including zero-mass parts whose intrinsic
 * inertia can still contribute spin under the existing mass-model contract.
 * The whole body needs finite positive mass. Inputs are borrowed for this
 * synchronous reduction, and every returned vector is fresh. This function
 * does not replace the two-pose momentum API or certify callback derivatives.
 *
 * @param model The same ordered SI mass model that produced posed.
 * @param posed Its rigid parts and mass-weighted centre at this instant.
 * @param bones The actual common-frame bone poses used to produce posed.
 * @param rates Actual common-frame origin and angular derivatives of bones.
 * @returns Instantaneous centre, centre velocity and linear/angular momentum.
 * @throws {Error} When mass, rates or results are nonfinite, total mass is not positive, part count/masses do not match, or a segment's bone/rate is missing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States SI units, common-frame and same-instant/model premises, bone-origin versus part-centre rates, actual principal orientation, fresh ownership, zero-mass behavior and admission failures. The returned existing momentum record represents this instant rather than an interval midpoint.
 * @evidence contracts/development/implementation.md#principled-implementation Rigid kinematics gives v_part=v_bone+omega cross rotated_offset. Linear momentum is sum(m*v), COM velocity is that sum divided by total mass, and centroidal angular momentum is sum(I_common*omega+(r-C) cross m*(v-V)). The shared physical tensor owner supplies I_common*omega from each actual principal frame. Binary64 overflow is refused and cancellation has its ordinary floating-point limit; no finite difference or smoothness assumption enters this reduction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Capture each ordered part's current common-frame rates while reducing linear momentum, then use the resulting COM velocity in one orbital-plus-spin pass. Mass posing, bone-rate propagation and intrinsic tensor rotation retain their existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment contributes according to its actual mass and inertia, without body/action switches, cutoffs, guessed missing rates, repaired values, fitted coefficients or altered tolerances. Invalid mass, missing inputs and nonfinite arithmetic throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two O(S) ordered passes over S parts capture O(S) current rates and reduce momentum. Two passes are needed to subtract the computed COM velocity before orbital accumulation. Intrinsic spin delegates to the existing scalar tensor product without constructing a composite tensor or principal eigensolve.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the already posed mass centres, masses, principal moments and actual principal rotations from the same model/instant. Current numeric rates are captured once per part for both reductions; no result, time, pose identity or approximate dependency key is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only this synchronous call owns its O(S) captured numeric rate records. They release on return or throw, and the fresh constant-size result retains no model, pose, rate map, callback, task or resource handle.
 */
export function resolveAutoMovieMomentumRates(
  model: IAutoMovieResolveCenterOfMass.IModel,
  posed: resolveAutoMovieMomentum.IPosed,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  rates: ReadonlyMap<AutoMovieHumanoidBone, resolveAutoMovieBoneRates.IRate>,
): IAutoMovieBodyMomentum {
  if (!(Number.isFinite(model.mass) && model.mass > 0))
    throw new Error("Instantaneous momentum needs finite positive total mass");
  if (posed.parts.length !== model.segments.length)
    throw new Error("Instantaneous momentum needs this model's ordered posed parts");
  if (!finiteVector(posed.centre))
    throw new Error("Instantaneous momentum needs a finite centre of mass");

  const partRates: IPartRate[] = [];
  let mass: number = 0;
  let linearX: number = 0;
  let linearY: number = 0;
  let linearZ: number = 0;
  for (let i: number = 0; i < model.segments.length; i++) {
    const segment: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
    const part: IAutoMovieCombinePhysicalMassProperties.IPart = posed.parts[i]!;
    const bone: IAutoMovieResolvedBone | undefined = bones.get(segment.bone);
    const rate: resolveAutoMovieBoneRates.IRate | undefined = rates.get(segment.bone);
    if (bone === undefined || rate === undefined)
      throw new Error(`Instantaneous momentum needs the posed bone and rate ${segment.bone}`);
    if (!(Number.isFinite(part.mass) && part.mass >= 0 && Object.is(part.mass, segment.mass)))
      throw new Error(`Instantaneous momentum needs this model's finite part mass for ${segment.bone}`);

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
    if (!finiteVector(angular) || !finiteVector(linear))
      throw new Error(`Instantaneous momentum needs finite rates for ${segment.bone}`);
    partRates.push({ velocity: linear, angular });
    mass += part.mass;
    linearX += part.mass * linear.x;
    linearY += part.mass * linear.y;
    linearZ += part.mass * linear.z;
  }
  if (!Object.is(mass, model.mass))
    throw new Error("Instantaneous momentum needs the model's exact ordered mass sum");

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
  if (!finiteVector(velocity) || !finiteVector(linear) || !finiteVector(angular))
    throw new Error("Instantaneous momentum exceeds finite arithmetic");
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

/** Admit the current numeric vector without changing its frame or scale. */
function finiteVector(value: IAutoMovieVector3): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y) && Number.isFinite(value.z);
}
