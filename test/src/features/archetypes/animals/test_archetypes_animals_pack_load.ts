import {
  type AutoMovieArchetypeEquine,
  AutoMovieArchetypeHorse,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeEquinePackLoad as Pack,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import assert from "node:assert/strict";

import { nclose } from "../../internal/nclose";

/** Roundoff for one quaternion action and a world translation, in metres. */
const METRES: number = 64 * Number.EPSILON;

/**
 * A pack load lies against its real pad in a rotated placement.
 *
 * Scenarios:
 *
 * 1. Both emitted boxes retain the authored mass and size. Their inside face meets
 *    the pad and the positive local Y axis faces out of it.
 * 2. A load may exactly fit the narrower pad, while either overhang, zero mass and
 *    missing tack each refuse on their associated axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes load size and mass, rotated pad contact and exact fit, overhang, zero mass and missing tack inputs.
 * @evidence contracts/development/testing.md#behavioral-verification Assembles actual paired loads and measures the emitted boxes, inner faces and outward frame directions after applying the scene placement. Exercises dimension and tack refusals.
 * @evidence contracts/development/testing.md#independent-expectations The authored pad faces bound the loads. The fixture's quarter-turn placement maps local offsets into world `(2+z, 3+y, -4-x)`, fixing expected contact points and normals.
 */
export function test_archetypes_animals_pack_load(): void {
  const horse: ReturnType<typeof AutoMovieArchetypeHorse.create> =
    AutoMovieArchetypeHorse.create({ tack: "pack", withersHeight: 1.6 }, 2);
  const left: IAutoMovieAffordance = horse.affordance("leftLoad");
  const right: IAutoMovieAffordance = horse.affordance("rightLoad");
  const load: Pack.ILoad = {
    length: Math.min(left.width!, right.width!),
    height: Math.min(left.depth!, right.depth!),
    thickness: 1 / 4,
    mass: 35,
  };
  const prepared: Pack.IPrepared = Pack.prepare(horse, load);
  const placement: IAutoMovieTransform = {
    translation: { x: 2, y: 3, z: -4 },
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
    scale: { x: 1, y: 1, z: 1 },
  };
  const sample: AutoMovieArchetypeRide.ISample<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > = {
    archetype: horse,
    placement,
    course: {
      distance: 0,
      progress: 0,
      speed: 0,
      curvature: 0,
      reverse: false,
      placement,
    },
  };
  const placed: ReturnType<Pack.IPrepared["at"]> = prepared.at(sample);
  for (const id of ["leftLoad", "rightLoad"] as const) {
    const pad: IAutoMovieTransform = horse.affordance(id).frame;
    const box: IAutoMovieModelPart = prepared.models[id].parts[0]!;
    const shape: IAutoMovieModelPart["geometry"] = box.geometry;
    if (shape.type !== "primitive" || shape.shape.type !== "box")
      throw new Error(`${id} must emit a box`);
    TestValidator.predicate(
      `${id} uses the largest common pad footprint and the authored load`,
      nclose(shape.shape.width, load.length, METRES) &&
        nclose(shape.shape.depth, load.height, METRES) &&
        nclose(shape.shape.height, load.thickness, METRES) &&
        prepared.models[id].body.mass === load.mass,
    );
    const inside: IAutoMovieVector3 = {
      x: box.transform!.translation.x,
      y: box.transform!.translation.y - shape.shape.height / 2,
      z: box.transform!.translation.z,
    };
    const normal: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const local: IAutoMovieVector3 = pad.translation;
    const actual: IAutoMovieTransform = placed[id];
    const displacement: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      actual.rotation,
      inside,
    );
    const localNormal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      pad.rotation,
      normal,
    );
    const worldNormal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      actual.rotation,
      normal,
    );
    TestValidator.predicate(
      `${id} inside face and outward normal follow the quarter-turn`,
      nclose(actual.translation.x + displacement.x, 2 + local.z, METRES) &&
        nclose(actual.translation.y + displacement.y, 3 + local.y, METRES) &&
        nclose(actual.translation.z + displacement.z, -4 - local.x, METRES) &&
        nclose(worldNormal.x, localNormal.z, METRES) &&
        nclose(worldNormal.y, localNormal.y, METRES) &&
        nclose(worldNormal.z, -localNormal.x, METRES),
    );
  }
  refuses("load.length", () =>
    Pack.prepare(horse, { ...load, length: load.length + 0.001 }),
  );
  refuses("load.height", () =>
    Pack.prepare(horse, { ...load, height: load.height + 0.001 }),
  );
  refuses("load.mass", () => Pack.prepare(horse, { ...load, mass: 0 }));
  refuses("tack", () =>
    Pack.prepare(
      AutoMovieArchetypeHorse.create({ tack: "saddle", withersHeight: 1.6 }, 2),
      load,
    ),
  );
}

/** Check the report is attributed to the offending input dimension. */
function refuses(axis: string, sample: () => unknown): void {
  assert.throws(
    sample,
    (error: unknown): boolean =>
      error instanceof AutoMovieArchetypeRefusal && error.axis === axis,
  );
}
