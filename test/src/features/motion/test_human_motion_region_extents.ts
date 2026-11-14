import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every region of a body is an area: a disc about its point, reaching half
 * way to its nearest neighbour that faces the same way, no farther than its
 * segment allows and never smaller than the 10 mm contact tolerance.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Every region has an extent of at least 10 mm.
 * 2. No two regions that face the same way overlap: their extents together
 *    are no more than the distance between their points, unless both sit at
 *    the 10 mm floor.
 * 3. A region and its mirror have the same extent.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the bodies' resolved regions and asserts each scenario's relation over every region pair.
 * @evidence contracts/development/testing.md#independent-expectations The relations are the definition's own geometry, read from the regions' rest places, not from the extents' code.
 * @evidence contracts/development/testing.md#distinguishing-cases A disc that reaches past its neighbour fails 2, a lopsided pair fails 3, a zero extent fails 1.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and reads their rest pose in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios.
 */
export function test_human_motion_region_extents(): void {
  const findings: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const entries = Object.entries(body.surfaces.regions) as [
      AutoMovieHumanoidRegion,
      (typeof body.surfaces.regions)[AutoMovieHumanoidRegion],
    ][];
    const placed = entries.map(([region, frame]) => {
      const rest: IAutoMovieVector3 = body.rest.get(frame.bone)!;
      return {
        region,
        radius: frame.radius ?? 0,
        point: Vector3.add(rest, frame.point),
        normal: Quaternion.rotateVector(Quaternion.identity(), frame.normal),
      };
    });
    for (const a of placed) {
      // 1. The floor.
      if (!(a.radius >= 0.01 - 1e-12))
        findings.push(`${name} ${a.region}: extent ${a.radius}`);
      // 3. The mirror.
      const mirror: string = a.region.endsWith("Left")
        ? a.region.replace(/Left$/, "Right")
        : a.region.replace(/Right$/, "Left");
      const twin = placed.find((p) => p.region === mirror);
      if (twin !== undefined && Math.abs(twin.radius - a.radius) > 1e-9)
        findings.push(
          `${name} ${a.region}: extent ${a.radius} but its mirror's ${twin.radius}`,
        );
      // 2. No overlap with a neighbour facing the same way.
      for (const b of placed)
        if (
          a.region < b.region &&
          Vector3.dot(a.normal, b.normal) > 0 &&
          !(a.radius <= 0.01 + 1e-12 && b.radius <= 0.01 + 1e-12) &&
          a.radius + b.radius >
            Vector3.length(Vector3.subtract(a.point, b.point)) + 1e-9
        )
          findings.push(`${name} ${a.region} and ${b.region} overlap`);
    }
  }
  TestValidator.equals("region extents", findings, []);
}
