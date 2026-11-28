import { AutoMovieArchetypeScenicContainer } from "@automovie/archetypes";
import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { nclose } from "../../internal/predicates";

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
 * @evidence contracts/development/common.md#meaningful-documentation States all five silhouettes, authored dimensions, supporting faces, open interiors and replay and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Measures public models and their contacts through colliders. It checks floor space in two open containers, a rectangular lid, two faceted caps, a repeated seed and fixed dimension admission.
 * @evidence contracts/development/testing.md#independent-expectations Uses explicit authored dimensions and a `1e-8` metre contact tolerance. The corners must lie on the actual supporting solid's top. The centreline check verifies an unobstructed opening.
 */
export function test_archetype_scenic_container(): void {
  const cases: readonly {
    params: AutoMovieArchetypeScenicContainer.IParams &
      Required<
        Pick<AutoMovieArchetypeScenicContainer.IParams, "width" | "depth" | "height">
      >;
    surface: AutoMovieArchetypeScenicContainer.Affordance;
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
    const params: AutoMovieArchetypeScenicContainer.IParams = {
      ...scenario.params,
      id: kind,
    };
    const model: ReturnType<typeof AutoMovieArchetypeScenicContainer.create> =
      AutoMovieArchetypeScenicContainer.create(params, 1007);
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
    const up: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      placement.frame.rotation,
      AutoMovieEngineVector3.create(0, 1, 0),
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
          const point: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            placement.frame.translation,
            AutoMovieEngineQuaternion.rotateVector(placement.frame.rotation, corner),
          );
          return (
            near(point.y, top) &&
            near(AutoMovieEnginePhysics.physicalShapeSegmentDistance(origin, solid, point, point), 0)
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

  const crateParams: AutoMovieArchetypeScenicContainer.IParams = {
    kind: "moldedCrate",
    width: 0.34,
  };
  const seeded: ReturnType<typeof AutoMovieArchetypeScenicContainer.create> =
    AutoMovieArchetypeScenicContainer.create(crateParams, 0);
  TestValidator.equals(
    "one seed reproduces a crate with free dimensions",
    JSON.stringify(seeded),
    JSON.stringify(AutoMovieArchetypeScenicContainer.create(crateParams, 0)),
  );
  const seededShapes: IAutoMoviePhysicalShape[] = seeded.shapes();
  const height: number = archetypeExtent(seededShapes, "y").size;
  TestValidator.predicate(
    "seeded crate respects the fixed width",
    near(archetypeExtent(seededShapes, "x").size, 0.34),
  );
  let differentHeight: boolean = false;
  for (const seed of [1, 2, 3]) {
    const shapes: IAutoMoviePhysicalShape[] = AutoMovieArchetypeScenicContainer.create(
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
    (): unknown => AutoMovieArchetypeScenicContainer.create({ kind: "moldedCrate", width: 1 }),
  );
}
