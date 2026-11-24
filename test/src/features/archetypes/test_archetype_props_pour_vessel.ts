import { createPourVessel } from "@automovie/archetypes";
import {
  Quaternion,
  createAutoMovieMeshRayCaster,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";
import { convexCellObservation } from "../internal/convexCellObservation";
import { nclose, vclose } from "../internal/predicates";

/**
 * A serving cup has a clear receiving mouth, and a pitcher has a clear
 * spout and a reachable handle on the opposite side.
 *
 * Scenarios:
 * 1. At published cup and pitcher dimensions, the wall bases meet the floor.
 *    The open centre admits a vertical probe to the visible interior floor.
 * 2. The cup's upward socket and inner rim are level. The pitcher's lip
 *    projects beyond its 110 mm body rim and leaves space behind the tip.
 * 3. The handle grip lies on its vertical bar and admits a finger probe in
 *    the loop with the pouring edge on the opposite side.
 * 4. A repeated seed reproduces the cup and a different seed varies its
 *    diameter and empty mass within the maker's bounds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the measured geometry, seeded admission and four distinct scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Measures collider and mesh openings independently, probes the spout and handle clearance, reads the upward mouth and bar frames, and compares seeded models.
 * @evidence contracts/development/testing.md#independent-expectations The makers provide 82–90 mm and 55 mm for the cup and 110 mm and 170–210 mm for the jug. The floor grounds the vessel and meets every wall base in the same horizontal plane. The mouth ray meets the measured collider floor within 1e-7 m. The cup's lip matches the innermost front rim point at rim height.
 * @evidence contracts/development/testing.md#distinguishing-cases A visible cap, hidden solid collider, missing floor, flat pitcher rim, off-bar grip, filled handle loop or nondeterministic seed each breaks a different expectation.
 * @evidence contracts/development/testing.md#execution-ownership The discovered entry uses public model records and engine queries in memory.
 */
export function test_archetype_props_pour_vessel(): void {
  const cup: ReturnType<typeof createPourVessel> = createPourVessel({
    kind: "cup",
    id: "recipient",
    height: 0.055,
    diameter: 0.082,
    mass: 0.165,
  });
  const pitcher: ReturnType<typeof createPourVessel> = createPourVessel({
    kind: "pitcher",
    id: "source",
    height: 0.17,
    diameter: 0.11,
    mass: 0.68,
  });
  const cupShapes: IAutoMoviePhysicalShape[] = cup.shapes();
  const pitcherShapes: IAutoMoviePhysicalShape[] = pitcher.shapes();
  for (const { vessel, shapes, height, width, gap, mass } of [
    {
      vessel: cup,
      height: 0.055,
      shapes: cupShapes,
      width: 0.082,
      gap: 0.052,
      mass: 0.165,
    },
    {
      vessel: pitcher,
      height: 0.17,
      shapes: pitcherShapes,
      width: 0.11,
      gap: 0.07,
      mass: 0.68,
    },
  ]) {
    const mouth: IAutoMovieAffordance = vessel.affordance("mouth");
    const lip: IAutoMovieAffordance = vessel.affordance("lip");
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    TestValidator.predicate(
      `${vessel.id} stands at the origin with upward rim sites`,
      mouth.kind === "socket" &&
        lip.kind === "ledge" &&
        vclose(mouth.frame.translation, { x: 0, y: height, z: 0 }, 1e-10) &&
        vclose(Quaternion.rotateVector(mouth.frame.rotation, up), up, 1e-10) &&
        vclose(Quaternion.rotateVector(lip.frame.rotation, up), up, 1e-10) &&
        nclose(lip.frame.translation.y, height, 1e-10) &&
        nclose(lip.frame.translation.x, 0, 1e-10) &&
        nclose(archetypeExtent(shapes, "y").low, 0, 1e-10) &&
        nclose(archetypeExtent(shapes, "x").size, width, 1e-10) &&
        nclose(vessel.body.mass, mass, 1e-10),
    );

    const floor: ReturnType<typeof archetypeExtent> = archetypeExtent(
      shapes,
      "y",
      ["floor"],
    );
    const walls: IAutoMoviePhysicalShape[] = shapes.filter(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id.startsWith("wall-"),
    );
    TestValidator.predicate(
      `${vessel.id} has a grounded floor that closes against every wall`,
      nclose(floor.low, 0, 1e-10) &&
        floor.size > 0 &&
        floor.high + 0.004 < height &&
        walls.length > 0 &&
        walls.every((wall: IAutoMoviePhysicalShape): boolean =>
          nclose(archetypeExtent([wall], "y").low, floor.high, 1e-10),
        ),
    );
    const above: IAutoMovieVector3 = { x: 0, y: height + 0.01, z: 0 };
    const inside: IAutoMovieVector3 = { x: 0, y: floor.high + 0.004, z: 0 };
    const below: IAutoMovieVector3 = { x: 0, y: -0.01, z: 0 };
    const handle: IAutoMovieAffordance = vessel.affordance("handle");
    const bar: IAutoMoviePhysicalShape | undefined = shapes.find(
      (shape: IAutoMoviePhysicalShape): boolean => shape.id === "handle",
    );
    const acrossLoop: IAutoMovieVector3 = { x: 0, y: height / 2, z: -gap };
    TestValidator.predicate(
      `${vessel.id} colliders preserve the floor, mouth and handle loop`,
      shapes.every(
        (shape: IAutoMoviePhysicalShape): boolean =>
          separation(shape, above, inside) > 0.003 &&
          separation(shape, acrossLoop, acrossLoop) > 0.005,
      ) &&
        shapes.some(
          (shape: IAutoMoviePhysicalShape): boolean =>
            -0.001 > separation(shape, inside, below),
        ) &&
        handle.kind === "handle" &&
        handle.grip === "hook" &&
        handle.length! >= 0.03 &&
        handle.aperture! >= 0.008 &&
        handle.frame.translation.z < -gap &&
        bar !== undefined &&
        separation(bar, handle.frame.translation, handle.frame.translation) <
          -0.003 &&
        vclose(
          Quaternion.rotateVector(handle.frame.rotation, { x: 1, y: 0, z: 0 }),
          up,
          1e-10,
        ),
    );

    const hit: number = downwardMeshTravel(vessel.parts, above);
    TestValidator.predicate(
      `${vessel.id} visible surface opens down to the floor`,
      nclose(hit, above.y - floor.high, 1e-7),
    );
  }

  const cupLip: IAutoMovieVector3 = cup.affordance("lip").frame.translation;
  const frontRim: number[] = [];
  for (const shape of cupShapes) {
    if (shape.kind !== "hull") continue;
    const frame: ReturnType<typeof convexCellObservation.frame> =
      convexCellObservation.frame(
        shape.transform.position,
        shape.transform.rotation,
      );
    for (const point of shape.points) {
      const placed: IAutoMovieVector3 = convexCellObservation.transformed(
        point,
        frame,
      );
      if (
        nclose(placed.x, 0, 1e-10) &&
        nclose(placed.y, 0.055, 1e-10) &&
        placed.z > 0
      )
        frontRim.push(placed.z);
    }
  }
  const pitcherLip: IAutoMovieVector3 =
    pitcher.affordance("lip").frame.translation;
  const spout: IAutoMovieVector3 = { x: 0, y: 0.167, z: 0.06 };
  TestValidator.predicate(
    "the cup marks its inner edge and the pitcher marks a projecting, open tip",
    frontRim.length >= 2 &&
      nclose(cupLip.z, Math.min(...frontRim), 1e-10) &&
      pitcherLip.z >= 0.069 &&
      nclose(archetypeExtent(pitcherShapes, "z").high, pitcherLip.z, 1e-10) &&
      pitcherShapes.every(
        (shape: IAutoMoviePhysicalShape): boolean =>
          separation(shape, spout, spout) > 0.002,
      ),
  );

  const seeded: ReturnType<typeof createPourVessel> = createPourVessel(
    { kind: "cup" },
    "table",
  );
  const other: ReturnType<typeof createPourVessel> = createPourVessel(
    { kind: "cup" },
    "counter",
  );
  TestValidator.equals(
    "same kind and seed reproduce the generated vessel",
    JSON.stringify(seeded),
    JSON.stringify(createPourVessel({ kind: "cup" }, "table")),
  );
  const diameter: number = archetypeExtent(seeded, "x").size;
  const otherDiameter: number = archetypeExtent(other, "x").size;
  TestValidator.predicate(
    "seed variation stays within the source dimensions and empty mass",
    diameter >= 0.082 &&
      diameter <= 0.09 &&
      seeded.body.mass >= 0.165 &&
      seeded.body.mass <= 0.18 &&
      otherDiameter >= 0.082 &&
      otherDiameter <= 0.09 &&
      other.body.mass >= 0.165 &&
      other.body.mass <= 0.18 &&
      !nclose(diameter, otherDiameter, 1e-8) &&
      !nclose(seeded.body.mass, other.body.mass, 1e-8),
  );
}

/** Measure a segment's signed separation from one collider in model coordinates. */
function separation(
  shape: IAutoMoviePhysicalShape,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): number {
  const pose: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  return physicalShapeSegmentDistance(pose, shape, from, to);
}

/** First intersection of a downward ray with the vessel's placed triangle surfaces. */
function downwardMeshTravel(
  parts: readonly IAutoMovieModelPart[],
  from: IAutoMovieVector3,
): number {
  let travel: number = Infinity;
  for (const part of parts) {
    if (part.geometry.type !== "mesh" || part.transform === null) continue;
    const mesh: typeof part.geometry.mesh = part.geometry.mesh;
    const positions: number[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) {
      const world: IAutoMovieVector3 = convexCellObservation.transformed(
        {
          x: mesh.positions[i]!,
          y: mesh.positions[i + 1]!,
          z: mesh.positions[i + 2]!,
        },
        part.transform,
      );
      positions.push(world.x, world.y, world.z);
    }
    const hit: number | null = createAutoMovieMeshRayCaster({
      ...mesh,
      positions,
    }).nearest([from.x, from.y, from.z], [0, -1, 0], from.y + 0.001);
    if (hit !== null) travel = Math.min(travel, hit);
  }
  return travel;
}
