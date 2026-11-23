import { AutoMovieArchetypeUnits, createSignPost } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The STOP sign's blank is the R1-1 regular octagon of its model's size, and
 * its front carries a `face` surface of that size.
 *
 * Scenarios:
 *
 * 1. For each model, 30 in and 36 in, the blank's front face (its largest model
 *    `z`) holds exactly eight vertices, at equal 45 degree steps about the
 *    blank's centre, all at one radius.
 * 2. The octagon's flats lie across the model's size: its extent along X and along
 *    Y is the size.
 * 3. The `face` affordance is a `surface` whose `width` and `depth` equal the
 *    size, whose frame lies at the blank's centre on its front, and whose local
 *    `+Y` points along model `+Z`.
 * 4. The face's outline is the same octagon in the face's XZ plane: eight points
 *    on the blank's radius at 22.5° + k·45°.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the octagon's vertex, flat and face checks for both models.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the built blank's mesh positions and the face contact from the public producer.
 * @evidence contracts/development/testing.md#independent-expectations The R1-1 sign is a regular octagon whose across-flats size is the model's 30 in or 36 in, as the FHWA Standard Highway Signs book draws it.
 * @evidence contracts/development/testing.md#distinguishing-cases A square blank has four front vertices, a rotated octagon has corners where the flats belong and an across-corners size gives a wider extent; each fails.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory against the produced model, with no host.
 */
export function test_archetype_sign_post_face(): void {
  for (const [model, inches] of [
    ["STOP 30 in", 30],
    ["STOP 36 in", 36],
  ] as const) {
    const size: number = inches * AutoMovieArchetypeUnits.INCH;
    const sign: ReturnType<typeof createSignPost> = createSignPost(
      { model },
      1,
    );
    const blank: IAutoMovieModelPart | undefined = sign.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "sign",
    );
    if (blank?.geometry.type !== "mesh" || blank.transform === null)
      throw new Error(`${model}: the blank is not a mesh`);
    const offset: IAutoMovieVector3 = blank.transform.translation;
    const positions: readonly number[] = blank.geometry.mesh.positions;
    const points: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < positions.length; i += 3)
      points.push({
        x: positions[i]! + offset.x,
        y: positions[i + 1]! + offset.y,
        z: positions[i + 2]! + offset.z,
      });
    const front: number = Math.max(...points.map((p) => p.z));
    const corners: { x: number; y: number }[] = [];
    for (const p of points)
      if (
        nclose(p.z, front) &&
        !corners.some((c) => nclose(c.x, p.x) && nclose(c.y, p.y))
      )
        corners.push({ x: p.x, y: p.y });
    const cx: number = corners.reduce((s, c) => s + c.x, 0) / corners.length;
    const cy: number = corners.reduce((s, c) => s + c.y, 0) / corners.length;
    const angles: number[] = corners
      .map((c) => Math.atan2(c.y - cy, c.x - cx))
      .sort((a, b) => a - b);
    const radii: number[] = corners.map((c) => Math.hypot(c.x - cx, c.y - cy));
    TestValidator.equals(`${model} front vertices`, corners.length, 8);
    TestValidator.predicate(
      `${model} corners lie at equal angles on one radius`,
      angles.every((angle, k) =>
        nclose(
          (k === 7 ? angles[0]! + 2 * Math.PI : angles[k + 1]!) - angle,
          Math.PI / 4,
        ),
      ) && radii.every((radius) => nclose(radius, radii[0]!)),
    );
    TestValidator.predicate(
      `${model} flats lie across the model's size`,
      nclose(
        Math.max(...corners.map((c) => c.x)) -
          Math.min(...corners.map((c) => c.x)),
        size,
      ) &&
        nclose(
          Math.max(...corners.map((c) => c.y)) -
            Math.min(...corners.map((c) => c.y)),
          size,
        ),
    );

    const face: IAutoMovieAffordance = sign.affordance("face");
    const q: IAutoMovieQuaternion = face.frame.rotation;
    // Local +Y rotated by the frame's unit quaternion: the second column of its matrix.
    const out: IAutoMovieVector3 = {
      x: 2 * (q.x * q.y - q.w * q.z),
      y: 1 - 2 * (q.x * q.x + q.z * q.z),
      z: 2 * (q.y * q.z + q.w * q.x),
    };
    TestValidator.predicate(
      `${model} face spans the blank's front`,
      face.kind === "surface" &&
        nclose(face.width!, size) &&
        nclose(face.depth!, size) &&
        nclose(face.frame.translation.x, cx) &&
        nclose(face.frame.translation.y, cy) &&
        nclose(face.frame.translation.z, front) &&
        nclose(out.z, 1),
    );
    TestValidator.predicate(
      `${model} face outline is the blank's octagon`,
      face.outline?.length === 8 &&
        face.outline.every(
          (point: IAutoMovieVector3, k: number): boolean =>
            nclose(Math.hypot(point.x, point.z), radii[0]!) &&
            nclose(
              Math.atan2(point.z, point.x),
              Math.atan2(
                Math.sin(Math.PI / 8 + (k * Math.PI) / 4),
                Math.cos(Math.PI / 8 + (k * Math.PI) / 4),
              ),
            ),
        ),
    );
  }
}
