import {
  type AutoMovieArchetype,
  AutoMovieArchetypeAssembly,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDrawSession,
  type AutoMovieArchetypeMass,
} from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { convexCellObservation as observation } from "../../../internal/convexCellObservation";
import { nclose, qclose, throwsError, vclose } from "../../../internal/predicates";

/**
 * Declared convex cells own their visible closed solids, mass and colliders.
 *
 * Scenarios:
 * 1. An off-origin 2 by 3 by 4 metre box cell, rotated 30 degrees about Z
 *    and translated, retains its analytic centroid and full inertia tensor.
 * 2. Two separated wall cells with unequal thickness allocate mass by their
 *    own volumes and retain two hulls with a two-metre empty interval.
 * 3. Mutating the caller's points after build changes neither mesh nor hull.
 * 4. Empty, singleton, coplanar and nonfinite point sets and repeated part ids
 *    refuse through the public builder rather than returning a proxy solid.
 * 5. One admitted box cell serves moving and fixed rigid instances. They retain
 *    shared mesh identity and separately placed colliders through articulation,
 *    explicit repose and prefixed placed assemblies.
 * 6. Fracturing one wall cell preserves each piece's actual mesh, hull and
 *    analytic mass properties, with total mass conserved across both pieces.
 */
export function test_unit_archetypes_core_convex_cell(): void {
  // 1. A translated, rotated cell whose local centroid is not its origin.
  const size: IAutoMovieVector3 = { x: 2, y: 3, z: 4 };
  const localCenter: IAutoMovieVector3 = { x: 0.5, y: -0.25, z: 1.25 };
  const corners: IAutoMovieVector3[] = boxCorners(size, localCenter);
  const input: IAutoMovieVector3[] = corners.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => ({ ...point }),
  );
  const angle: number = Math.PI / 6;
  const cosine: number = Math.cos(angle);
  const sine: number = Math.sin(angle);
  const placement: IAutoMovieTransform = observation.frame(
    { x: 3, y: 4, z: 5 },
    { x: 0, y: 0, z: Math.sin(angle / 2), w: Math.cos(angle / 2) },
  );
  const cell: AutoMovieArchetype<"hinge", never> = builder()
    .convex("cell", input, placement.translation, {
      rotation: placement.rotation,
    })
    .build(12);

  // 3. The caller changes coordinates and grows its array before any output is observed.
  input[0]!.x += 1000;
  input.push({ x: -1000, y: -1000, z: -1000 });
  const expectedCenter: IAutoMovieVector3 = {
    x: 3 + cosine * localCenter.x - sine * localCenter.y,
    y: 4 + sine * localCenter.x + cosine * localCenter.y,
    z: 5 + localCenter.z,
  };

  // Uniform-box moments rotate about the centroid; translation affects only a distant axis.
  const xx: number = (12 * (size.y ** 2 + size.z ** 2)) / 12;
  const yy: number = (12 * (size.x ** 2 + size.z ** 2)) / 12;
  const zz: number = (12 * (size.x ** 2 + size.y ** 2)) / 12;
  expectMass("rotated cell", cell.properties, 12, expectedCenter, {
    xx: cosine ** 2 * xx + sine ** 2 * yy,
    yy: sine ** 2 * xx + cosine ** 2 * yy,
    zz,
    xy: cosine * sine * (xx - yy),
    xz: 0,
    yz: 0,
  });
  TestValidator.predicate(
    "the translated cell obeys the parallel-axis theorem",
    nclose(
      cell.moment({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }),
      zz + 12 * (expectedCenter.x ** 2 + expectedCenter.y ** 2),
      1e-9,
    ),
  );

  observation.expectCell(
    "copied cell",
    cell,
    "cell",
    corners,
    placement,
    size.x * size.y * size.z,
  );

  // 2. Different wall thicknesses make the volume contribution observable.
  const height: number = 2.5;
  const depth: number = 1;
  const thin: number = 0.25;
  const thick: number = 0.5;
  const left: number = -1 - thin / 2;
  const right: number = 1 + thick / 2;
  const leftCorners: IAutoMovieVector3[] = boxCorners({
    x: thin,
    y: height,
    z: depth,
  });
  const rightCorners: IAutoMovieVector3[] = boxCorners({
    x: thick,
    y: height,
    z: depth,
  });
  const walls: AutoMovieArchetype<"hinge", never> = builder()
    .convex("left", leftCorners, { x: left, y: 0, z: 0 })
    .convex("right", rightCorners, { x: right, y: 0, z: 0 })
    .fracture([{ id: "right-piece", parts: ["right"] }])
    .build(9, { outcome: { fracture: 1 } });
  const centerX: number = (3 * left + 6 * right) / 9;
  const offsetMoment: number =
    3 * (left - centerX) ** 2 + 6 * (right - centerX) ** 2;
  expectMass(
    "separate walls",
    walls.properties,
    9,
    { x: centerX, y: 0, z: 0 },
    {
      xx: (9 * (height ** 2 + depth ** 2)) / 12,
      yy:
        (3 * (thin ** 2 + depth ** 2) + 6 * (thick ** 2 + depth ** 2)) / 12 +
        offsetMoment,
      zz:
        (3 * (thin ** 2 + height ** 2) + 6 * (thick ** 2 + height ** 2)) / 12 +
        offsetMoment,
      xy: 0,
      xz: 0,
      yz: 0,
    },
  );
  observation.expectCell(
    "left wall",
    walls,
    "left",
    leftCorners,
    observation.frame({ x: left, y: 0, z: 0 }),
    thin * height * depth,
  );
  observation.expectCell(
    "right wall",
    walls,
    "right",
    rightCorners,
    observation.frame({ x: right, y: 0, z: 0 }),
    thick * height * depth,
  );
  const wallShapes: IAutoMoviePhysicalShape[] = walls.shapes();
  TestValidator.predicate(
    "two wall cells leave their entire middle interval empty",
    walls.parts.length === 2 &&
      wallShapes.length === 2 &&
      wallShapes.every(
        (shape: IAutoMoviePhysicalShape): boolean =>
          shape.kind === "hull" &&
          shape.points.every((point: IAutoMovieVector3): boolean => {
            const x: number = observation.transformed(
              point,
              observation.frame(
                shape.transform.position,
                shape.transform.rotation,
              ),
            ).x;
            return shape.id === "left" ? x <= -1 + 1e-10 : x >= 1 - 1e-10;
          }),
      ),
  );

  // 6. Splitting retains cell identity instead of rebuilding mesh pieces as primitives.
  const broken: ReturnType<typeof walls.broken> = walls.broken({
    energy: 1,
    momentum: { x: 0, y: 0, z: 0 },
  });
  if (
    broken === null ||
    broken.remainder === null ||
    broken.fragments.length !== 1
  )
    throw new Error("one declared wall cell must detach from the other");
  const fragment: (typeof broken.fragments)[number] = broken.fragments[0]!;
  TestValidator.predicate(
    "fracture preserves the two-cell partition and total mass",
    fragment.id === "right-piece" &&
      fragment.archetype.parts.length === 1 &&
      broken.remainder.parts.length === 1 &&
      fragment.archetype.shapes().length === 1 &&
      broken.remainder.shapes().length === 1 &&
      nclose(
        fragment.archetype.body.mass + broken.remainder.body.mass,
        9,
        1e-12,
      ),
  );
  observation.expectCell(
    "detached wall",
    fragment.archetype,
    "right",
    rightCorners,
    observation.frame({ x: right, y: 0, z: 0 }),
    thick * height * depth,
  );
  observation.expectCell(
    "remaining wall",
    broken.remainder,
    "left",
    leftCorners,
    observation.frame({ x: left, y: 0, z: 0 }),
    thin * height * depth,
  );
  expectMass(
    "detached wall",
    fragment.archetype.properties,
    6,
    { x: right, y: 0, z: 0 },
    {
      xx: (6 * (height ** 2 + depth ** 2)) / 12,
      yy: (6 * (thick ** 2 + depth ** 2)) / 12,
      zz: (6 * (thick ** 2 + height ** 2)) / 12,
      xy: 0,
      xz: 0,
      yz: 0,
    },
  );
  expectMass(
    "remaining wall",
    broken.remainder.properties,
    3,
    { x: left, y: 0, z: 0 },
    {
      xx: (3 * (height ** 2 + depth ** 2)) / 12,
      yy: (3 * (thin ** 2 + depth ** 2)) / 12,
      zz: (3 * (thin ** 2 + height ** 2)) / 12,
      xy: 0,
      xz: 0,
      yz: 0,
    },
  );

  // 4. Degenerate solids and nonfinite coordinates cannot become valid cells.
  const invalid: readonly IAutoMovieVector3[][] = [
    [],
    [{ x: 0, y: 0, z: 0 }],
    [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
    ...["x", "y", "z"].map((axis: string, index: number): IAutoMovieVector3[] =>
  for (const points of invalid)
    TestValidator.predicate(
      "invalid convex points refuse",
      throwsError((): unknown => builder().convex("invalid", points).build(1)),
    );
  TestValidator.predicate(
    "repeated convex ids refuse",
    throwsError((): unknown =>
      builder().convex("same", corners).convex("same", corners),
    ),
  );
  TestValidator.predicate(
    "a convex cell cannot reuse a primitive id",
    throwsError((): unknown =>
      builder().box("same", size, { x: 0, y: 0, z: 0 }).convex("same", corners),
    ),
  );
  TestValidator.predicate(
    "a primitive cannot reuse a convex id",
    throwsError((): unknown =>
      builder().convex("same", corners).box("same", size, { x: 0, y: 0, z: 0 }),
    ),
  );

  // 5. A moving cell and a fixed cell distinguish current frames from rest frames.
  const panelCorners: IAutoMovieVector3[] = boxCorners({
    x: 0.4,
    y: 2,
    z: 0.2,
  });
  const reusableCell: AutoMovieArchetypeConvexCell.ICell =
    AutoMovieArchetypeConvexCell.of(panelCorners);
  const panel: AutoMovieArchetype<"hinge", never> = builder()
    .convex("moving", reusableCell, { x: 1, y: 1, z: 0 })
    .convex("fixed", reusableCell, { x: -2, y: 1, z: 0 })
    .affordance({
      id: "hinge",
      kind: "hinge",
      frame: observation.frame(),
      extent: null,
      travel: 90,
      parts: ["moving"],
    })
    .build(4);
  const halfRoot: number = Math.SQRT1_2;
  const aroundY: IAutoMovieQuaternion = {
    x: 0,
    y: halfRoot,
    z: 0,
    w: halfRoot,
  };
  const opened: AutoMovieArchetype<"hinge", never> = panel.articulate({
    hinge: 90,
  });
  observation.expectCell(
    "articulated cell",
    opened,
    "moving",
    panelCorners,
    observation.frame({ x: 0, y: 1, z: -1 }, aroundY),
    0.16,
  );
  observation.expectCell(
    "fixed cell",
    opened,
    "fixed",
    panelCorners,
    observation.frame({ x: -2, y: 1, z: 0 }),
    0.16,
  );
  const reposeFrame: IAutoMovieTransform = observation.frame(
    { x: 4, y: 2, z: -3 },
    { x: halfRoot, y: 0, z: 0, w: halfRoot },
  );
  const reposed: AutoMovieArchetype<"hinge", never> = opened.reposed(
    opened.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart =>
        part.id === "moving" ? { ...part, transform: reposeFrame } : part,
    ),
  );
  observation.expectCell(
    "reposed cell",
    reposed,
    "moving",
    panelCorners,
    reposeFrame,
    0.16,
  );
  const memberPlacement: IAutoMovieTransform = observation.frame(
    { x: 7, y: 0, z: 5 },
    aroundY,
  );
  const assembled: AutoMovieArchetypeAssembly<{
    panel: AutoMovieArchetypeAssembly.IMember<"hinge", never>;
  }> = AutoMovieArchetypeAssembly.of("cells", "cells", {
    panel: { archetype: panel, placement: memberPlacement },
  }).articulate({ "panel/hinge": 90 });
  observation.expectCell(
    "placed articulated cell",
    assembled,
    "panel/moving",
    panelCorners,
    observation.frame({ x: 6, y: 1, z: 5 }, { x: 0, y: 1, z: 0, w: 0 }),
    0.16,
  );
  observation.expectCell(
    "placed fixed cell",
    assembled,
    "panel/fixed",
    panelCorners,
    observation.frame({ x: 7, y: 1, z: 7 }, aroundY),
    0.16,
  );
  const placedRepose: AutoMovieArchetypeAssembly<{
    panel: AutoMovieArchetypeAssembly.IMember<"hinge", never>;
  }> = AutoMovieArchetypeAssembly.of("reposed-cells", "reposed cells", {
    panel: { archetype: reposed, placement: memberPlacement },
  });
  observation.expectCell(
    "placed reposed cell",
    placedRepose,
    "panel/moving",
    panelCorners,
    observation.frame(
      { x: 4, y: 2, z: 1 },
      { x: 0.5, y: 0.5, z: -0.5, w: 0.5 },
    ),
    0.16,
  );

  // Rigid instances share their local solid, while each current placement stays independent.
  for (const instance of [opened, reposed, assembled, placedRepose]) {
    const moving: IAutoMovieModelPart | undefined = instance.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id.endsWith("moving"),
    );
    const fixed: IAutoMovieModelPart | undefined = instance.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id.endsWith("fixed"),
    );
    const shapes: IAutoMoviePhysicalShape[] = instance.shapes();
    const movingHull: IAutoMoviePhysicalShape | undefined = shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id.endsWith("moving"),
    );
    const fixedHull: IAutoMoviePhysicalShape | undefined = shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id.endsWith("fixed"),
    );
    TestValidator.predicate(
      "rigid cell instances reuse geometry with independent colliders",
      moving?.geometry === reusableCell.geometry &&
        fixed?.geometry === reusableCell.geometry &&
        movingHull?.kind === "hull" &&
        fixedHull?.kind === "hull" &&
        movingHull.transform !== fixedHull.transform &&
        (!vclose(
          movingHull.transform.position,
          fixedHull.transform.position,
          1e-10,
        ) ||
          !qclose(
            movingHull.transform.rotation,
            fixedHull.transform.rotation,
            1e-12,
          )),
    );
  }
}

/** A neutral public producer with no random draws or material-derived mass. */
function builder(): AutoMovieArchetypeBuilder<"hinge", never> {
  return new AutoMovieArchetypeBuilder<"hinge", never>({
    name: "convex cell fixture",
    material: "steel",
    draw: new AutoMovieArchetypeDrawSession<never>(
      "convex-cell-fixture",
      {},
      undefined,
    ),
  });
}

/** Eight corners from full metre dimensions, without a production hull helper. */
function boxCorners(
  size: IAutoMovieVector3,
  center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 },
): IAutoMovieVector3[] {
  const points: IAutoMovieVector3[] = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1])
        points.push({
          x: center.x + (x * size.x) / 2,
          y: center.y + (y * size.y) / 2,
          z: center.z + (z * size.z) / 2,
        });
  return points;
}

/** All six central tensor entries are checked, including products that must stay zero. */
function expectMass(
  label: string,
  actual: AutoMovieArchetypeMass.IProperties,
  mass: number,
  center: IAutoMovieVector3,
  inertia: AutoMovieArchetypeMass.IInertia,
): void {
  const components: readonly (keyof AutoMovieArchetypeMass.IInertia)[] = [
    "xx",
    "yy",
    "zz",
    "xy",
    "xz",
    "yz",
  ];
  TestValidator.predicate(
    `${label} has analytic mass, centroid and inertia`,
    nclose(actual.mass, mass, 1e-12) &&
      vclose(actual.centerOfMass, center, 1e-10) &&
      components.every((key: keyof AutoMovieArchetypeMass.IInertia): boolean =>
        nclose(actual.inertia[key], inertia[key], 1e-9),
      ),
  );
}
