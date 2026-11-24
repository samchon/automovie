import { createScenicContainer } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/predicates";

/**
 * Tolerance for comparing computed model geometry with an authored coordinate,
 * in metres.
 */
const TOLERANCE: number = 1e-8;

/** Whether two lengths in metres agree to within the geometry tolerance. */
function near(actual: number, expected: number): boolean {
  return nclose(actual, expected, TOLERANCE);
}

/**
 * Scenic containers stand on the ground and expose a placement surface on a
 * real lid or interior floor.
 *
 * Scenarios:
 *
 * 1. All five independently listed silhouettes have the supplied X, Y and Z
 *    dimensions and honor the author id.
 * 2. The closed forms place their surface on the actual lid or cap. Two are
 *    narrower than their body and the rectangular coffer uses its full lid. The
 *    open forms place their surface on a real interior floor and have clear
 *    center space above it.
 * 3. One crate seed replays its free dimensions. A different draw varies height
 *    without disturbing a fixed width, and an oversized width is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sizing, actual-part contact, open-interior and seed observations.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public archetypes, collider extents, public affordances, repeated seeds and normal dimension admission.
 * @evidence contracts/development/testing.md#independent-expectations Fixed dimensions and supplied kinds are authored here. Footprint corners touch the actual supporting solid at its top face to within 1e-8 m. The opening check proves the vertical centerline is clear.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks two open floors, a full rectangular lid, two faceted tops, and seeded, fixed and refused dimensions.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit test discovered by its exported name.
 */
export function test_archetype_scenic_container(): void {
  const cases: readonly {
    params: createScenicContainer.IParams &
      Required<
        Pick<createScenicContainer.IParams, "width" | "depth" | "height">
      >;
    surface: createScenicContainer.Affordance;
    part: string;
  }[] = [
    {
      params: { kind: "coilBasket", width: 0.34, depth: 0.3, height: 0.22 },
      surface: "top",
      part: "lid",
    },
    {
      params: {
        kind: "woodenFishBasket",
        width: 0.5,
        depth: 0.41,
        height: 0.47,
      },
      surface: "inside",
      part: "floor",
    },
    {
      params: { kind: "plankCoffer", width: 0.8, depth: 0.43, height: 0.4 },
      surface: "top",
      part: "lid",
    },
    {
      params: { kind: "moldedCrate", width: 0.34, depth: 0.37, height: 0.29 },
      surface: "inside",
      part: "floor",
    },
    {
      params: { kind: "cargoPod", width: 0.97, depth: 0.57, height: 0.62 },
      surface: "top",
      part: "cap",
    },
  ];
  for (const scenario of cases) {
    const { kind, width, depth, height } = scenario.params;
    const params: createScenicContainer.IParams = {
      ...scenario.params,
      id: kind,
    };
    const model: ReturnType<typeof createScenicContainer> =
      createScenicContainer(params, 1007);
    const shapes: IAutoMoviePhysicalShape[] = model.shapes();
    const lateral: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "x",
    );
    const vertical: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "y",
    );
    const longitudinal: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "z",
    );
    TestValidator.predicate(
      `${kind} is centered and grounded at its fixed dimensions`,
      (): boolean =>
        model.id === kind &&
        near(lateral.low, -width / 2) &&
        near(lateral.high, width / 2) &&
        near(longitudinal.low, -depth / 2) &&
        near(longitudinal.high, depth / 2) &&
        near(vertical.low, 0) &&
        near(vertical.high, height),
    );

    const placement: ReturnType<typeof model.affordance> = model.affordance(
      scenario.surface,
    );
    TestValidator.predicate(
      `${kind} has one support surface`,
      (): boolean =>
        placement.kind === "stack-top" && model.affordances.length === 1,
    );
    if (placement.kind !== "stack-top" || placement.extent === null)
      throw new Error(`${kind} has no stacking footprint`);
    const corners: readonly IAutoMovieVector3[] = placement.extent;
    const footprintWidth: number =
      2 *
      Math.max(
        ...corners.map((point: IAutoMovieVector3): number => Math.abs(point.x)),
      );
    const footprintDepth: number =
      2 *
      Math.max(
        ...corners.map((point: IAutoMovieVector3): number => Math.abs(point.z)),
      );
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      placement.frame.rotation,
      Vector3.create(0, 1, 0),
    );
    const solid: IAutoMoviePhysicalShape | undefined = shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id === scenario.part,
    );
    if (solid === undefined) throw new Error(`${kind} has no supporting solid`);
    const top: number = archetypeExtent([solid], "y").high;
    const origin: IAutoMovieRigidTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    TestValidator.predicate(
      `${kind} supports a centered upward footprint`,
      (): boolean =>
        near(placement.frame.translation.x, 0) &&
        near(placement.frame.translation.y, top) &&
        near(placement.frame.translation.z, 0) &&
        near(up.y, 1) &&
        footprintWidth > 0 &&
        footprintDepth > 0 &&
        corners.length === 4 &&
        corners.every((corner: IAutoMovieVector3): boolean => {
          const point: IAutoMovieVector3 = Vector3.add(
            placement.frame.translation,
            Quaternion.rotateVector(placement.frame.rotation, corner),
          );
          return (
            near(point.y, top) &&
            near(physicalShapeSegmentDistance(origin, solid, point, point), 0)
          );
        }),
    );
    if (scenario.surface === "inside") {
      TestValidator.predicate(
        `${kind} leaves the interior center open`,
        (): boolean =>
          top < vertical.high &&
          shapes
            .filter(
              (shape: IAutoMoviePhysicalShape): boolean =>
                shape.id !== scenario.part,
            )
            .every((shape: IAutoMoviePhysicalShape): boolean => {
              const x: ReturnType<typeof archetypeExtent> = archetypeExtent(
                [shape],
                "x",
              );
              const z: ReturnType<typeof archetypeExtent> = archetypeExtent(
                [shape],
                "z",
              );
              return x.low > 0 || x.high < 0 || z.low > 0 || z.high < 0;
            }),
      );
    } else {
      TestValidator.predicate(
        `${kind} has a top on its lid or cap`,
        (): boolean =>
          near(top, vertical.high) &&
          (kind === "plankCoffer"
            ? near(footprintWidth, width) && near(footprintDepth, depth)
            : footprintWidth < width && footprintDepth < depth),
      );
    }
  }

  const crateParams: createScenicContainer.IParams = {
    kind: "moldedCrate",
    width: 0.34,
  };
  const seeded: ReturnType<typeof createScenicContainer> =
    createScenicContainer(crateParams, 0);
  TestValidator.equals(
    "one seed reproduces a crate with free dimensions",
    JSON.stringify(seeded),
    JSON.stringify(createScenicContainer(crateParams, 0)),
  );
  const seededShapes: IAutoMoviePhysicalShape[] = seeded.shapes();
  const height: number = archetypeExtent(seededShapes, "y").size;
  TestValidator.predicate(
    "seeded crate respects the fixed width",
    near(archetypeExtent(seededShapes, "x").size, 0.34),
  );
  let differentHeight: boolean = false;
  for (const seed of [1, 2, 3]) {
    const shapes: IAutoMoviePhysicalShape[] = createScenicContainer(
      crateParams,
      seed,
    ).shapes();
    TestValidator.predicate(
      `seed ${seed} preserves the fixed width`,
      near(archetypeExtent(shapes, "x").size, 0.34),
    );
    differentHeight ||= !near(archetypeExtent(shapes, "y").size, height);
  }
  TestValidator.predicate(
    "a different draw changes free height",
    differentHeight,
  );
  TestValidator.error(
    "a scenic crate refuses an oversized fixed width",
    (): unknown => createScenicContainer({ kind: "moldedCrate", width: 1 }),
  );
}
