import { createScenicContainer } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { nclose } from "../internal/predicates";

/** Tolerance for comparing computed model geometry with an authored coordinate, in metres. */
const TOLERANCE: number = 1e-8;

/** Whether two lengths in metres agree to within the geometry tolerance. */
function near(actual: number, expected: number): boolean {
  return nclose(actual, expected, TOLERANCE);
}

/**
 * Scenic containers stand on the ground and expose a placement surface on a real lid or interior floor.
 *
 * Scenarios:
 * 1. All five independently listed silhouettes contain the given distinct X, Y and Z dimensions, honor the author id, and are deterministic across repetitions of a seed.
 * 2. The closed forms place their surface on the actual lid or cap. Two are narrower than their body and the rectangular coffer uses its full lid. The open forms place their surface on a real interior floor and have clear center space above it.
 * 3. Free dimensions vary with the seed without disturbing a fixed dimension, and a width outside the modern crate's band is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sizing, actual-part contact, open-interior and seed observations.
 * @evidence contracts/development/testing.md#behavioral-verification Uses public archetypes, collider extents, public affordances, repeated seeds and normal dimension admission.
 * @evidence contracts/development/testing.md#independent-expectations Fixed dimensions and supplied kinds are authored here. Surface locations are measured against built parts and openings rather than calculated from the producer's construction ratios.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks two open floors, an overhanging rectangular lid, two faceted tops, and seeded, fixed and refused dimensions.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit test discovered by its exported name.
 */
export function test_archetype_scenic_container(): void {
  const cases: readonly {
    params: createScenicContainer.IParams &
      Required<Pick<createScenicContainer.IParams, "width" | "depth" | "height">>;
    surface: createScenicContainer.Affordance;
    part: string;
  }[] = [
    {
      params: { kind: "coilBasket", width: 0.34, depth: 0.3, height: 0.22 },
      surface: "top",
      part: "lid",
    },
    {
      params: { kind: "woodenFishBasket", width: 0.5, depth: 0.41, height: 0.47 },
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
    const params: createScenicContainer.IParams = { ...scenario.params, id: kind };
    const model: ReturnType<typeof createScenicContainer> =
      createScenicContainer(params, "scenery");
    const vertical: ReturnType<typeof archetypeExtent> = archetypeExtent(model, "y");
    TestValidator.predicate(`${kind} is centered and grounded at its fixed dimensions`,
      (): boolean =>
        model.id === kind &&
        near(archetypeExtent(model, "x").low, -width / 2) &&
        near(archetypeExtent(model, "x").high, width / 2) &&
        near(archetypeExtent(model, "z").low, -depth / 2) &&
        near(archetypeExtent(model, "z").high, depth / 2) &&
        near(vertical.low, 0) &&
        near(vertical.high, height),
    );
    TestValidator.equals(`${kind} repeats a seeded build`,
      JSON.stringify(model),
      JSON.stringify(createScenicContainer(params, "scenery")),
    );

    const placement: ReturnType<typeof model.affordance> = model.affordance(scenario.surface);
    TestValidator.predicate(`${kind} has one support surface`,
      (): boolean => placement.kind === "stack-top" && model.affordances.length === 1,
    );
    if (placement.kind !== "stack-top" || placement.extent === null)
      throw new Error(`${kind} has no stacking footprint`);
    const corners: readonly IAutoMovieVector3[] = placement.extent;
    const footprintWidth: number =
      2 * Math.max(...corners.map((point: IAutoMovieVector3): number => Math.abs(point.x)));
    const footprintDepth: number =
      2 * Math.max(...corners.map((point: IAutoMovieVector3): number => Math.abs(point.z)));
    const up: IAutoMovieVector3 = Quaternion.rotateVector(
      placement.frame.rotation,
      Vector3.create(0, 1, 0),
    );
    const top: number = archetypeExtent(model, "y", [scenario.part]).high;
    const floorWidth: number = archetypeExtent(model, "x", [scenario.part]).size;
    const floorDepth: number = archetypeExtent(model, "z", [scenario.part]).size;
    TestValidator.predicate(`${kind} supports a centered upward footprint`,
      (): boolean =>
        near(placement.frame.translation.x, 0) &&
        near(placement.frame.translation.y, top) &&
        near(placement.frame.translation.z, 0) &&
        near(up.y, 1) &&
        footprintWidth > 0 &&
        footprintDepth > 0 &&
        footprintWidth <= floorWidth + TOLERANCE &&
        footprintDepth <= floorDepth + TOLERANCE,
    );
    if (scenario.surface === "inside") {
      TestValidator.predicate(`${kind} leaves the interior center open`,
        (): boolean =>
          top < vertical.high &&
          model.shapes().filter((shape: IAutoMoviePhysicalShape): boolean => shape.id !== scenario.part).every((shape: IAutoMoviePhysicalShape): boolean => {
            const x: ReturnType<typeof archetypeExtent> = archetypeExtent(model, "x", [shape.id]);
            const z: ReturnType<typeof archetypeExtent> = archetypeExtent(model, "z", [shape.id]);
            return x.low > 0 || x.high < 0 || z.low > 0 || z.high < 0;
          }),
      );
    } else {
      TestValidator.predicate(`${kind} has a top on its lid or cap`,
        (): boolean =>
          near(top, vertical.high) &&
          (kind === "plankCoffer"
            ? near(footprintWidth, width) && near(footprintDepth, depth)
            : footprintWidth < width && footprintDepth < depth),
      );
    }
  }

  const variety: ReturnType<typeof createScenicContainer>[] = [0, 1, 2, 3].map(
    (seed: number): ReturnType<typeof createScenicContainer> =>
      createScenicContainer({ kind: "moldedCrate", width: 0.34 }, seed),
  );
  TestValidator.predicate("seeding varies free crate sizes while preserving its fixed width",
    (): boolean =>
      variety.every((item: ReturnType<typeof createScenicContainer>): boolean => near(archetypeExtent(item, "x").size, 0.34)) &&
      new Set(variety.map((item: ReturnType<typeof createScenicContainer>): number => archetypeExtent(item, "y").size)).size > 1,
  );
  TestValidator.error("a scenic crate refuses an oversized fixed width",
    (): unknown => createScenicContainer({ kind: "moldedCrate", width: 1 }),
  );
}
