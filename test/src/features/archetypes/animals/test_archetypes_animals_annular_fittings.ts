import {
  type AutoMovieArchetypeEquine,
  AutoMovieArchetypeEquineHobble,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  createDog,
  createHobble,
  createHorse,
} from "@automovie/archetypes";
import { Quaternion, physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** Keep the world and the model frame coincident in the local bore tests. */
const IDENTITY: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: Quaternion.identity(),
};

/**
 * Collar and cuff shells keep the open bore in their visible rigid geometry.
 *
 * Scenarios:
 *
 * 1. A 40 mm cannon and the dog neck both have a clear axis and bore.
 * 2. A midpoint is inside the leather and a point beyond is outside.
 * 3. Live cannon rotation carries all cuff cells and both strap anchors.
 */
export function test_archetypes_animals_annular_fittings(): void {
  const hobble: ReturnType<typeof createHobble> = createHobble(0.04, {
    strap: 0.4,
  });
  for (const side of ["leftCuff", "rightCuff"]) {
    const at: IAutoMovieTransform = hobble.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === side,
    )!.transform!;
    probes(
      hobble
        .shapes()
        .filter((value: IAutoMoviePhysicalShape): boolean =>
          value.id.startsWith(side),
        ),
      at,
      0.04,
      0.008,
    );
  }
  const dog: ReturnType<typeof createDog> = createDog({
    mass: 22,
    cohort: "pet",
    collar: {
      width: 0.02,
      thickness: 0.003,
      leadLength: 0.6,
      leadRadius: 0.004,
    },
  });
  const neck: IAutoMovieModelPart = dog.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "neck",
  )!;
  const collar: IAutoMovieModelPart = dog.parts.find(
    (part: IAutoMovieModelPart): boolean => part.id === "collar",
  )!;
  if (
    neck.geometry.type !== "primitive" ||
    (neck.geometry.shape.type !== "cylinder" &&
      neck.geometry.shape.type !== "capsule")
  )
    throw new Error("the collar test needs the producer's actual round neck");
  probes(
    dog
      .shapes()
      .filter((value: IAutoMoviePhysicalShape): boolean =>
        value.id.startsWith("collar"),
      ),
    collar.transform!,
    neck.geometry.shape.radius,
    0.003,
  );

  const horse: ReturnType<typeof createHorse> = createHorse({ tack: "bare" });
  const carrier: ReturnType<
    typeof AutoMovieArchetypeRide.along<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >
  > = AutoMovieArchetypeRide.along(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      startSpeed: 1,
      cruise: 1,
      endSpeed: 1,
      legs: [{ kind: "straight", length: 2 }],
    },
    (state, seconds) => ({
      archetype: horse,
      placement: {
        ...state.placement,
        rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 18 * seconds),
      },
    }),
  );
  const worn: ReturnType<typeof AutoMovieArchetypeEquineHobble.ride> =
    AutoMovieArchetypeEquineHobble.ride(hobble, carrier);
  for (const time of [1.3, 0.2, 1.75, 0.2]) {
    const actual = worn.at(time).archetype;
    for (const id of ["leftCuff", "rightCuff"]) {
      const sleeve: IAutoMovieModelPart[] = actual.parts.filter(
        (part: IAutoMovieModelPart): boolean => part.id.startsWith(id),
      );
      const first: IAutoMovieTransform = sleeve[0]!.transform!;
      TestValidator.predicate(
        "every circumferential cell follows the same live cuff",
        sleeve.length > 1 &&
          sleeve.every(
            (part: IAutoMovieModelPart): boolean =>
              qclose(part.transform!.rotation, first.rotation, 1e-12) &&
              vclose(part.transform!.translation, first.translation, 1e-12),
          ),
      );
      const end: IAutoMovieVector3 =
        id === "leftCuff" ? actual.span("strap").from : actual.span("strap").to;
      TestValidator.predicate(
        "the strap stays attached on the body's moving wall",
        vclose(
          end,
          AutoMovieArchetypeFrame.point(first, {
            x: id === "leftCuff" ? -0.048 : 0.048,
            y: 0,
            z: 0,
          }),
          1e-12,
        ),
      );
    }
  }
}

/** Check the physical boundary the display emits for this open fitting. */
function probes(
  cells: readonly IAutoMoviePhysicalShape[],
  frame: IAutoMovieTransform,
  inner: number,
  thickness: number,
): void {
  TestValidator.predicate(
    "the fitting is made of visible convex material",
    cells.length > 1 &&
      cells.every(
        (cell: IAutoMoviePhysicalShape): boolean => cell.kind === "hull",
      ),
  );
  const distance = (radial: number, angle: number = 0): number => {
    const point: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(frame, {
      x: radial * Math.cos(angle),
      y: 0,
      z: radial * Math.sin(angle),
    });
    return Math.min(
      ...cells.map((cell: IAutoMoviePhysicalShape): number =>
        physicalShapeSegmentDistance(IDENTITY, cell, point, point),
      ),
    );
  };
  TestValidator.predicate(
    "the central bore retains the actual inner radius",
    nclose(distance(0), inner, 1e-10),
  );
  TestValidator.predicate(
    "a concentric body fits every way around the bore",
    Array.from(
      { length: 51 },
      (_: unknown, i: number): boolean => distance(inner - 1e-5, i * 0.782) > 0,
    ).every(Boolean),
  );
  TestValidator.predicate(
    "material spans the leather thickness",
    distance(inner + thickness / 2) < 0,
  );
  TestValidator.predicate(
    "the fitting has a finite outer boundary",
    distance(inner + thickness + 0.001) > 0,
  );
}
