import { AutoMovieEngineKinematics, AutoMovieEngineQuaternion } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePhysicalProfile, IAutoMoviePhysicalSegment, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IHumanFixture } from "../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a mass sum over the profile's segments, kilograms. */
const MASS: number = 1e-9;

/** Rounding of a mass-weighted mean of rotated points, metres. */
const CENTRE: number = 1e-9;

/**
 * `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass` builds a body's segmental mass model, whose
 * `place` is the mass-weighted mean of the segments' centres posed on their
 * bones (Winter, Biomechanics and Motor Control of Human Movement, ch. 4).
 *
 * The rig and profile are the stored people (`humanFixture`), no figure
 * prepared. At rest each segment's centre is its neutral frame's position plus
 * its neutral rotation applied to its local centre of mass, read straight from
 * the profile; so the rest pose's whole-body centre and the total mass follow
 * from the profile alone, independent of the model's bone-local storage.
 *
 * Scenarios:
 *
 * 1. For the average man and the small woman, the model's mass is the sum of the
 *    profile's segment masses.
 * 2. The rest pose's centre is the profile's mass-weighted mean of the segments'
 *    neutral centres.
 * 3. A profile with a segment on a bone the rig lacks is refused.
 * 4. A profile without positive mass is refused.
 * 5. Placing the model on bones that miss a segment's bone is refused.
 */
export async function test_engine_kinematics_resolve_center_of_mass(): Promise<void> {
  for (const name of humanFixture.NAMES) {
    const person: IHumanFixture = await humanFixture(name);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(person.skeleton, person.profile);

    // 1. The total mass.
    const mass: number = person.profile.segments.reduce(
      (sum: number, segment: IAutoMoviePhysicalSegment): number =>
        sum + segment.mass,
      0,
    );
    TestValidator.predicate(
      `${name}: the model's mass is the profile's`,
      nclose(model.mass, mass, MASS),
    );

    // 2. The rest centre from the profile alone.
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      AutoMovieEngineKinematics.resolvePose(
        { skeleton: person.skeleton.id, root: null, joints: [] },
        person.skeleton,
      ).map(
        (
          bone: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone],
      ),
    );
    const expected: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of person.profile.segments) {
      const local: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
        segment.neutral.rotation,
        segment.centerOfMass,
      );
      expected.x +=
        (segment.mass * (segment.neutral.position.x + local.x)) / mass;
      expected.y +=
        (segment.mass * (segment.neutral.position.y + local.y)) / mass;
      expected.z +=
        (segment.mass * (segment.neutral.position.z + local.z)) / mass;
    }
    TestValidator.predicate(
      `${name}: the rest centre is the profile's weighted mean`,
      vclose(AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, rest), expected, CENTRE),
    );

    // 3. A segment on a bone the rig lacks.
    const stray: IAutoMoviePhysicalProfile = {
      ...person.profile,
      segments: [
        ...person.profile.segments,
        { ...person.profile.segments[0]!, bone: "tail" },
      ],
    };
    TestValidator.predicate(
      `${name}: a segment off the rig is refused`,
      throwsError(() => AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(person.skeleton, stray)),
    );

    // 4. No mass.
    const weightless: IAutoMoviePhysicalProfile = {
      ...person.profile,
      segments: person.profile.segments.map(
        (segment: IAutoMoviePhysicalSegment): IAutoMoviePhysicalSegment => ({
          ...segment,
          mass: 0,
        }),
      ),
    };
    TestValidator.predicate(
      `${name}: a weightless profile is refused`,
      throwsError(() =>
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(person.skeleton, weightless),
      ),
    );

    // 5. A pose missing a segment's bone.
    const missing: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      rest,
    );
    missing.delete(model.segments[0]!.bone);
    TestValidator.predicate(
      `${name}: placing on bones that miss a segment is refused`,
      throwsError(() => AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, missing)),
    );
  }
}
