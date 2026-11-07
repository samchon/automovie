import type {
  IAutoMovieFootfallPattern,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { Vector3 } from "../../../../packages/engine/src/math/Vector3";
import { physicalShapeBounds } from "../../../../packages/engine/src/physics/physicalShapeBounds";
import { AutoMovieHumanPhysicalBracing } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalBracing";
import { AutoMovieHumanPhysicalProfile } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalProfile";
import { AutoMovieHumanPhysicalSupports } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalSupports";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanSex } from "../../../../packages/human/src/typings/AutoMovieHumanSex";

/** The Human physical provider maps the polygon person's parameters to a coherent articulated profile and its own support description.
 *
 * Scenarios:
 * 1. Segment masses add up to the declared body mass.
 * 2. Every joint's parent and child anchors coincide at the neutral pose.
 * 3. Both feet expose a complete forefoot contact face whose witnesses lie on the actual box surface and the neutral floor plane; a raised heel keeps only witnesses of that face.
 * 4. The standing recovery envelope stays between the floor and the neutral centre of mass.
 */
export function test_physical_human_profile(): void {
  const prepared: ReturnType<typeof AutoMovieHumanPhysicalProfile.prepare> =
    AutoMovieHumanPhysicalProfile.prepare(polygonPerson(), {
      mass: 80,
      frequency: 20,
      dampingRatio: 1,
      torquePerKg: 50,
      passiveRate: 5,
      equipment: [],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      skin: "skin",
    });
  const profile: P = prepared.profile;
  const failures: string[] = [];

  // Mass is distributed, never invented or lost.
  const total: number = profile.segments.reduce(
    (sum: number, segment: P.ISegment): number => sum + segment.mass,
    0,
  );
  if (!(Math.abs(total - 80) <= 1e-9 * 80))
    failures.push(`segment masses sum to ${total} kg`);

  // Each joint connects the same world point from both sides.
  const bone: (name: string) => P.ISegment = (name: string): P.ISegment =>
    profile.segments.find(
      (segment: P.ISegment): boolean => segment.bone === name,
    )!;
  for (const joint of profile.joints) {
    const anchor: (
      segment: P.ISegment,
      local: IAutoMovieVector3,
    ) => IAutoMovieVector3 = (
      segment: P.ISegment,
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        segment.neutral.position,
        Quaternion.rotateVector(segment.neutral.rotation, local),
      );
    const gap: number = Vector3.length(
      Vector3.subtract(
        anchor(bone(joint.parent), joint.parentFrame.position),
        anchor(bone(joint.child), joint.childFrame.position),
      ),
    );
    if (!(gap <= 1e-9)) failures.push(`${joint.id}: anchors ${gap} m apart`);
  }

  // Supports come from the provider's own foot envelope.
  const pattern: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
    profile,
    prepared.evaluate({}),
  );
  const raised: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
    profile,
    prepared.evaluate({}),
    ["left"],
  );
  if (pattern.limbs.length !== 2 || pattern.minimumSupports !== 1)
    failures.push("own support population");
  if (
    raised.limbs[0]!.floorPoints?.length !== 2 ||
    raised.limbs[1]!.floorPoints?.length !== 4 ||
    raised.limbs[0]!.floorPoints!.some(
      (
        witness: NonNullable<
          IAutoMovieFootfallPattern["limbs"][number]["floorPoints"]
        >[number],
      ): boolean =>
        !pattern.limbs[0]!.floorPoints!.some(
          (corner: typeof witness): boolean =>
            Vector3.length(
              Vector3.subtract(corner.localPoint, witness.localPoint),
            ) < 1e-12,
        ),
    )
  )
    failures.push("raised heel invents support outside the actual envelope");
  for (const limb of pattern.limbs) {
    if (
      limb.floorPoints?.length !== 4 ||
      limb.chain.at(-1) !== limb.bone ||
      !limb.contacts?.includes(limb.bone)
    )
      failures.push(`${limb.bone}: incomplete support binding`);
    const segment: P.ISegment = bone(limb.bone);
    const shape: P.IShape = segment.shapes.find(
      (candidate: P.IShape): boolean => candidate.kind === "box",
    )!;
    if (shape.kind !== "box")
      throw new Error("Expected the Human forefoot box");
    const minimum: number = physicalShapeBounds(segment.neutral, shape).min.y;
    for (const witness of limb.floorPoints!) {
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(shape.transform.rotation),
        Vector3.subtract(witness.localPoint, shape.transform.position),
      );
      const world: IAutoMovieVector3 = Vector3.add(
        segment.neutral.position,
        Quaternion.rotateVector(segment.neutral.rotation, witness.localPoint),
      );
      if (
        Math.abs(local.y + shape.halfExtents.y) > 1e-10 ||
        Math.abs(Math.abs(local.x) - shape.halfExtents.x) > 1e-10 ||
        Math.abs(Math.abs(local.z) - shape.halfExtents.z) > 1e-10 ||
        Math.abs(world.y - minimum) > 1e-10
      )
        failures.push(`${limb.bone}: witness leaves the actual source face`);
    }
  }

  // Recovery bracing stays inside the standing body.
  const bracing: ReturnType<typeof AutoMovieHumanPhysicalBracing> =
    AutoMovieHumanPhysicalBracing(profile);
  if (
    !(
      bracing.minimumCenterHeight > 0 &&
      bracing.minimumCenterHeight < profile.centerOfMass.y &&
      bracing.maximumRootShift > 0 &&
      bracing.maximumRootShift < profile.centerOfMass.y
    )
  )
    failures.push("standing recovery envelope");
  TestValidator.equals("Human physical provider mapping", failures, []);
}

/** The original polygon person's adult parameters: survey defaults with authored athletic girths, no likeness. */
function polygonPerson(): IAutoMovieHumanParameters {
  return {
    body: {
      anatomy: {
        sex: AutoMovieHumanSex.Male,
        stature: 1750,
        chestCircumference: 1060,
        acrossBackShoulderWidth: 465,
        waistCircumference: 820,
        hipCircumference: 980,
        neckCircumference: 410,
        upperArmCircumference: 355,
        thighCircumference: 590,
      },
    },
    head: {
      length: 195,
      cephalicIndex: 78,
      circumference: 575,
      height: 230,
      faceHeight: 120,
      faceWidth: 145,
      mandibularWidth: 110,
      minimumFrontalWidth: 110,
      mouthOpening: 48,
      mandibularLaterotrusion: 10,
      face: {
        eyePair: {
          left: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
          right: { palpebralFissureLength: 29, palpebralFissureHeight: 10 },
        },
        intercanthalWidth: 33,
        nose: { width: 36, height: 52, protrusion: 20 },
        mouth: { width: 50, upperVermilionHeight: 7, lowerVermilionHeight: 9 },
      },
      earPair: {
        left: { length: 66, breadth: 29, protrusion: 18 },
        right: { length: 66, breadth: 29, protrusion: 18 },
      },
    },
  };
}
