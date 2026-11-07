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
import { AutoMovieHumanPhysicalSupports } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalSupports";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";

/** Human-specific support and recovery geometry follows each actual person.
 *
 * Scenarios:
 * 1. Male and female profiles expose both complete forefoot contact faces.
 * 2. Every witness lies on its actual box surface and neutral floor plane.
 * 3. The standing recovery envelope stays between floor and neutral COM.
 */
export function test_physical_human_support_description(): void {
  const failures: string[] = [];
  for (const id of ["m1", "f1"] as const) {
    const person: ReturnType<typeof PhysicalHumanFixtures.get> =
      PhysicalHumanFixtures.get(id);
    const profile: P = person.profile;
    const pattern: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
      profile,
      person.evaluate({}),
    );
    const bracing: ReturnType<typeof AutoMovieHumanPhysicalBracing> =
      AutoMovieHumanPhysicalBracing(profile);
    const raised: IAutoMovieFootfallPattern = AutoMovieHumanPhysicalSupports(
      profile,
      person.evaluate({}),
      ["left"],
    );
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
      failures.push(
        `${id}: raised heel invents support outside the actual envelope`,
      );
    if (pattern.limbs.length !== 2 || pattern.minimumSupports !== 1)
      failures.push(`${id}: own support population`);
    if (
      !(
        bracing.minimumCenterHeight > 0 &&
        bracing.minimumCenterHeight < profile.centerOfMass.y &&
        bracing.maximumRootShift > 0 &&
        bracing.maximumRootShift < profile.centerOfMass.y
      )
    )
      failures.push(`${id}: standing recovery envelope`);
    for (const limb of pattern.limbs) {
      if (
        limb.floorPoints?.length !== 4 ||
        limb.chain.at(-1) !== limb.bone ||
        !limb.contacts?.includes(limb.bone)
      )
        failures.push(`${id}/${limb.bone}: incomplete support binding`);
      const segment: P.ISegment = profile.segments.find(
        (candidate: P.ISegment): boolean => candidate.bone === limb.bone,
      )!;
      const shape: P.IShape = segment.shapes.find(
        (candidate: P.IShape): boolean => candidate.kind === "box",
      )!;
      if (shape.kind !== "box")
        throw new Error("Expected actual Human forefoot box");
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
          failures.push(
            `${id}/${limb.bone}: witness leaves actual source face`,
          );
      }
    }
  }
  TestValidator.equals("actual Human support geometry", failures, []);
}
