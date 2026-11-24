import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  createBed,
  createDoor,
  createSeat,
  createTable,
} from "@automovie/archetypes";
import {
  Vector3,
  physicalShapeSegmentDistance,
  physicalShapeSpan,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../../../internal/archetypeCatalog";

/**
 * Every grip's declared width is the width of the part the hand closes on, every contact frame is a right-handed unit frame, and a frame's `+Y` points out of the solid behind the contact.
 *
 * Scenarios:
 * 1. For each `handle` and `bar` affordance of each catalog row that declares an `aperture`, at rest for three seeds: the held colliders span the aperture along the grip's `+Y` approach within a millimetre. Use the nearest collider centres for ordinary grips. The closed book is gripped across its stack, so measure all three layers intersected by the approach line at the spine.
 * 2. Every affordance frame of every row has orthonormal axes with `+X` cross `+Y` equal to `+Z`.
 * 3. Each solid primitive or declared convex cell has one collider with the part's id. Visual meshes without a declared cell contribute no collider.
 * 4. `+Y` points out of the contact: for a dining chair's seat at its middle and at its front edge, a desk's top, a bed's surface and a door's push plate, the point a centimetre along `+Y` from the site lies in no collider and the point a centimetre along `-Y` lies in or on one; for a door's upright pull bar, whose frame is on the bar's axis, every 5 mm step out from the bar's surface along `+Y` for 100 mm is free while the steps back along `-Y` reach the leaf.
 */
export function test_unit_archetypes_core_contract_grip(): void {
  const findings: string[] = [];
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  for (const row of archetypeCatalog())
    for (const seed of [undefined, 1, 2]) {
      const archetype: ReturnType<typeof row.create> = row.create(seed);
      const shapes: IAutoMoviePhysicalShape[] = archetype.shapes();
      const cells: AutoMovieArchetype["convexCells"] = archetype.convexCells;
      const expected: string[] = archetype.parts
        .filter(
          ({ id, geometry }: IAutoMovieModelPart): boolean =>
            cells.has(id) ||
            (geometry.type === "primitive" && geometry.shape.type !== "plane"),
        )
        .map(({ id }: IAutoMovieModelPart): string => id);
      if (
        shapes.length !== expected.length ||
        shapes.some((shape, i): boolean => shape.id !== expected[i])
      )
        findings.push(
          `${row.name}: expected ${expected.join(", ")}, found ${shapes.map(({ id }) => id).join(", ")}`,
        );
      for (const affordance of archetype.affordances) {
        const x: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          affordance.frame,
          "x",
        );
        const y: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          affordance.frame,
          "y",
        );
        const z: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
          affordance.frame,
          "z",
        );
        if (
          Math.abs(Vector3.length(x) - 1) > 1e-9 ||
          Math.abs(Vector3.length(y) - 1) > 1e-9 ||
          Math.abs(Vector3.dot(x, y)) > 1e-9 ||
          Vector3.length(Vector3.subtract(Vector3.cross(x, y), z)) > 1e-9
        )
          findings.push(
            `${row.name}/${affordance.id}: frame is not orthonormal`,
          );
        if (!gripped(affordance)) continue;
        // The grip closes on the whole book. Its moving leaf has the
        // nearest centre without being the only layer between the fingers.
        const bookSpine: boolean =
          row.name === "stationery-book" && affordance.id === "grip";
        const grip: IAutoMovieVector3 = affordance.frame.translation;
        const approach: number = Vector3.dot(grip, y);
        const away = (shape: IAutoMoviePhysicalShape): number =>
          Vector3.length(
            Vector3.subtract(
              shape.transform.position,
              affordance.frame.translation,
            ),
          );
        const least: number = Math.min(...shapes.map(away));
        let low: number = Infinity;
        let high: number = -Infinity;
        const held: string[] = [];
        for (const shape of shapes) {
          if (!bookSpine && away(shape) > least + 1e-6) continue;
          const [from, to]: readonly [number, number] = physicalShapeSpan(
            origin,
            shape,
            y,
          );
          if (
            bookSpine &&
            physicalShapeSegmentDistance(
              origin,
              shape,
              Vector3.add(grip, Vector3.scale(y, from - approach)),
              Vector3.add(grip, Vector3.scale(y, to - approach)),
            ) > 1e-6
          )
            continue;
          low = Math.min(low, from);
          high = Math.max(high, to);
          held.push(shape.id);
        }
        if (
          bookSpine &&
          (!held.includes("back") ||
            !held.includes("front") ||
            !held.includes("leaf"))
        )
          findings.push(
            `${row.name}@${String(seed)}: the spine approach only meets ${held.join("+")}`,
          );
        if (Math.abs(high - low - affordance.aperture!) > 1e-3)
          findings.push(
            `${row.name}@${String(seed)}/${affordance.id}: aperture ${affordance.aperture} but ${held.join("+")} spans ${high - low}`,
          );
      }
    }

  // 4. A surface's and a seat's +Y leaves the solid the contact lies on.
  const solids = (
    archetype: AutoMovieArchetype,
    frame: IAutoMovieTransform,
    along: number,
  ): string[] => {
    const at: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(frame, {
      x: 0,
      y: along,
      z: 0,
    });
    return archetype
      .shapes()
      .filter(
        (shape: IAutoMoviePhysicalShape): boolean =>
          physicalShapeSegmentDistance(origin, shape, at, at) <= 1e-9,
      )
      .map((shape: IAutoMoviePhysicalShape): string => shape.id);
  };
  const chair: ReturnType<typeof createSeat> = createSeat(
    { kind: "dining" },
    4,
  );
  const plated: ReturnType<typeof createDoor> = createDoor(
    { hardware: "plate" },
    4,
  );
  const faces: readonly (readonly [
    string,
    AutoMovieArchetype,
    IAutoMovieTransform,
  ])[] = [
    ["a chair's seat", chair, chair.site("seat", 0.5, 0.5)],
    ["a chair's seat at its front edge", chair, chair.site("seat", 0.5, 0)],
    [
      "a desk's top",
      createTable({ kind: "desk" }, 4),
      createTable({ kind: "desk" }, 4).site("top"),
    ],
    [
      "a bed's surface",
      createBed({ kind: "single" }, 4),
      createBed({ kind: "single" }, 4).site("surface"),
    ],
    ["a door's push plate", plated, plated.site("push")],
  ];
  for (const [name, archetype, frame] of faces)
    if (
      solids(archetype, frame, 0.01).length !== 0 ||
      solids(archetype, frame, -0.01).length === 0
    )
      findings.push(
        `${name}: a centimetre out along +Y lies in [${solids(archetype, frame, 0.01).join(", ")}] and a centimetre in along -Y in [${solids(archetype, frame, -0.01).join(", ")}]`,
      );

  // 4. A pull bar's +Y leaves the bar away from the leaf it stands on: stepping out from the bar's surface meets nothing, stepping back meets the leaf.
  const pull: IAutoMovieAffordance = plated.affordance("pull");
  const steps: number[] = Array.from(
    { length: 20 },
    (_: unknown, k: number): number => pull.aperture! / 2 + 0.005 * (k + 1),
  );
  const ahead: string[] = steps.flatMap((step: number): string[] =>
    solids(plated, pull.frame, step),
  );
  const behind: string[] = steps.flatMap((step: number): string[] =>
    solids(plated, pull.frame, -step),
  );
  if (ahead.length !== 0 || !behind.includes("leaf"))
    findings.push(
      `a door's pull bar: out along +Y lies [${ahead.join(", ")}], back along -Y [${behind.join(", ")}]`,
    );
  TestValidator.equals("grips match their colliders", findings, []);
}

/** Whether an affordance is a grip that declares its width. */
function gripped(affordance: IAutoMovieAffordance): boolean {
  return (
    (affordance.kind === "handle" || affordance.kind === "bar") &&
    affordance.aperture !== undefined
  );
}
