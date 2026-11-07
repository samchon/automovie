import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanGrounding as Grounding } from "../../../../packages/human/src/skeleton/AutoMovieHumanGrounding";
import { AutoMovieHumanPhysicalFootPoints } from "../../../../packages/human/src/skeleton/AutoMovieHumanPhysicalFootPoints";
import { AutoMovieHumanRigControls as Controls } from "../../../../packages/human/src/skeleton/AutoMovieHumanRigControls";
import type { AutoMovieHumanSkeleton as Skeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import { AutoMovieHumanSkeletonMath as Math3D } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeletonMath";
import type { AutoMovieHumanSupportFrame as Frame } from "../../../../packages/human/src/skeleton/AutoMovieHumanSupportFrame";
import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";

/** Actual provider envelopes and FK use the existing grounding owner; all corners constrain the floor while the root recovers a translated sole target. */
export async function test_physical_human_grounding(): Promise<void> {
  const person: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get();
  const feet: Frame.IPoint[] = AutoMovieHumanPhysicalFootPoints(person.profile);
  const neutral: Skeleton.IOutput = person.evaluate({});
  const solve: Grounding.IPrepared = Grounding.prepare(person.evaluate, feet);
  const placements: Map<string, Skeleton.IPlacement> = new Map(
    neutral.posed.map(
      (item: Skeleton.IPlacement): [string, Skeleton.IPlacement] => [
        item.bone,
        item,
      ],
    ),
  );
  const world: (point: Frame.IPoint) => Controls.MetrePoint = (
    point: Frame.IPoint,
  ): Controls.MetrePoint => {
    const placement: Skeleton.IPlacement = placements.get(point.bone)!;
    return Math3D.add(
      placement.position,
      Math3D.rotate(placement.rotation, point.localPoint),
    );
  };
  const floor: number = Math.min(
    ...feet.map((point: Frame.IPoint): number => world(point)[1]),
  );
  const support: Frame.IPoint = feet.reduce(
    (a: Frame.IPoint, b: Frame.IPoint): Frame.IPoint =>
      world(a)[1] < world(b)[1] ? a : b,
  );
  const root: Grounding.IRoot = {
    translation: [0, -0.02, 0],
    rotation: [0, 0, 0, 1],
  };
  const request: Grounding.IRequest = {
    targets: [{ ...support, position: world(support) }],
    channels: [],
    floor,
    rootAxes: ["y"],
  };
  const snapshot: string = JSON.stringify({ root, feet, request });
  const before: Grounding.IResult = solve.inspect({}, root, {
    ...request,
    channels: [],
  });
  const after: Grounding.IResult = solve({}, root, request);
  TestValidator.equals("complete four-envelope vertex count", feet.length, 32);
  TestValidator.equals(
    "independent translated floor violation is observable",
    before.floorMinimum < floor - 0.019,
    true,
  );
  TestValidator.equals(
    "actual provider geometry is admitted by shared grounding",
    after.status,
    "admitted",
  );
  TestValidator.equals(
    "full-foot floor and support target recovered together",
    after.floorMinimum >= floor - 0.000001 && after.supportError <= 0.00025,
    true,
  );
  TestValidator.equals(
    "borrowed input remains owned by caller",
    JSON.stringify({ root, feet, request }),
    snapshot,
  );
}
