import {
  type Archetype,
  ArchetypeFrame,
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
  IAutoMoviePhysicalProfile,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeCatalog } from "../internal/archetypeCatalog";

/**
 * Every grip's declared width is the width of the part the hand closes on, every contact frame is a right-handed unit frame, and a frame's `+Y` points out of the solid behind the contact.
 *
 * Scenarios:
 * 1. For each `handle` and `bar` affordance of each catalog row that declares an `aperture`, at rest for three seeds: the collider whose centre lies nearest the grip point (with any other exactly as near, such as a closed book's two halves), measured along the grip's approach (the frame's `+Y`), spans the aperture within a millimetre. This is how a grasp reads a grip's width when none is declared, so the declaration and the collider must agree.
 * 2. Every affordance frame of every row has orthonormal axes with `+X` cross `+Y` equal to `+Z`.
 * 3. Every archetype has one collider per part.
 * 4. `+Y` points out of the contact: for a dining chair's seat at its middle and at its front edge, a desk's top, a bed's surface and a door's push plate, the point a centimetre along `+Y` from the site lies in no collider and the point a centimetre along `-Y` lies in or on one; for a door's upright pull bar, whose frame is on the bar's axis, every 5 mm step out from the bar's surface along `+Y` for 100 mm is free while the steps back along `-Y` reach the leaf.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces every archetype, takes its colliders and measures them with the engine's shape span along each grip's approach and its point distance beside a contact; a grip placed off its part's axis, an aperture that is not the part's width, a frame built from non-perpendicular directions, a part without a collider, or a contact frame facing into its solid is caught.
 * @evidence contracts/development/testing.md#independent-expectations The millimetre is #3369's acceptance ("each grip affordance's aperture matches the object's collider within 1 mm"); the nearest-collider rule is the grasp's own (`HumanGrasp.at`), restated here; `+Y` out of the contact is the frame convention of `AutoMovieAffordanceKind`; the span and the point distance are measured by the engine, not by the archetypes.
 * @evidence contracts/development/testing.md#distinguishing-cases Every producer and kind for widths and frames; grips without an aperture are skipped because the grasp then reads the collider itself. The outward sense is checked on a representative seat, three surfaces and one handle mounted on a face, each with both the free and the solid side; a round bar taken from any side has no solid side to tell.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_contract_grip(): void {
  const findings: string[] = [];
  const origin: IAutoMoviePhysicalProfile.ITransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  for (const row of archetypeCatalog())
    for (const seed of [undefined, 1, 2]) {
      const archetype: ReturnType<typeof row.create> = row.create(seed);
      const shapes: IAutoMoviePhysicalProfile.IShape[] = archetype.shapes();
      if (shapes.length !== archetype.parts.length)
        findings.push(
          `${row.name}: ${shapes.length} colliders for ${archetype.parts.length} parts`,
        );
      for (const affordance of archetype.affordances) {
        const x: IAutoMovieVector3 = ArchetypeFrame.axis(affordance.frame, "x");
        const y: IAutoMovieVector3 = ArchetypeFrame.axis(affordance.frame, "y");
        const z: IAutoMovieVector3 = ArchetypeFrame.axis(affordance.frame, "z");
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
        // The part or parts at the grip point: the nearest collider, and any other as near (a closed book's two halves).
        const away = (shape: IAutoMoviePhysicalProfile.IShape): number =>
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
          if (away(shape) > least + 1e-6) continue;
          const [from, to]: readonly [number, number] = physicalShapeSpan(
            origin,
            shape,
            y,
          );
          low = Math.min(low, from);
          high = Math.max(high, to);
          held.push(shape.id);
        }
        if (Math.abs(high - low - affordance.aperture!) > 1e-3)
          findings.push(
            `${row.name}@${String(seed)}/${affordance.id}: aperture ${affordance.aperture} but ${held.join("+")} spans ${high - low}`,
          );
      }
    }

  // 4. A surface's and a seat's +Y leaves the solid the contact lies on.
  const solids = (
    archetype: Archetype,
    frame: IAutoMovieTransform,
    along: number,
  ): string[] => {
    const at: IAutoMovieVector3 = ArchetypeFrame.point(frame, {
      x: 0,
      y: along,
      z: 0,
    });
    return archetype
      .shapes()
      .filter(
        (shape: IAutoMoviePhysicalProfile.IShape): boolean =>
          physicalShapeSegmentDistance(origin, shape, at, at) <= 1e-9,
      )
      .map((shape: IAutoMoviePhysicalProfile.IShape): string => shape.id);
  };
  const chair: ReturnType<typeof createSeat> = createSeat(
    { kind: "dining" },
    4,
  );
  const plated: ReturnType<typeof createDoor> = createDoor(
    { hardware: "plate" },
    4,
  );
  const faces: readonly (readonly [string, Archetype, IAutoMovieTransform])[] =
    [
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
