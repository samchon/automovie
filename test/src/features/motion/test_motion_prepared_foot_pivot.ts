import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { HumanFoot, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * Prepared foot rockers keep their actual authored sole contact fixed while
 * pitch varies through the heading, roll and articulated-toe frame.
 *
 * Scenarios:
 * 1. Both feet pivot at heel, ball, toe and metatarsal joint with fixed
 *    heading37, roll-12 and toe flexion20 degrees. Four out-of-order pitches
 *    give the ankle predicted by the independent Y-Z-X rotation matrix.
 * 2. The actual rotation maps every cardinal basis vector through that same
 *    matrix, distinguishing noncommuting order or a reversed pitch sign.
 *    A prepared sole-point reader returns the fixed contact at every pitch.
 * 3. Mutating a returned ankle/rotation cannot change replay or another
 *    earlier placement, and every returned placement owns its nested records.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines degree/world-metre frames, original profile/toe geometry, Y-Z-X rotation order, both-sided contacts and prepared result ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public preparePivot and preparePoint on a canonical Human, checks actual ankle coordinates and basis-vector rotations against explicit trigonometric matrices, and observes stationary contact, changing pitches and nested output isolation.
 * @evidence contracts/development/testing.md#independent-expectations The profile socket supplies local geometry; a toe-carried socket adds the actual toe-joint-minus-ankle rest offset plus Rx(-toes) of its own local point. Applying explicit Rx(-pitch), Rz(roll), Ry(heading) gives the rotated point, and fixed contact minus it fixes the expected ankle. Neither public offset, pivot nor point output supplies this oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers left/right, heel/ball/toe/metatarsal contacts, nonzero toe bend, noncommuting heading/roll, positive/zero/negative pitch, arbitrary/repeated query order and mutable earlier results. Gait scheduling and full planted-leg ROM remain separately owned.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory unit borrows an unchanged canonical Human and owns contacts/results. It starts no viewer, renderer, process or compiler, changes no physical bound and replaces no foreign function or global.
 */
export function test_motion_prepared_foot_pivot(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const contact: IAutoMovieVector3 = { x: 1, y: 0, z: 2 };
  const heading: number = 37;
  const roll: number = -12;
  const toes: number = 20;
  for (const side of ["left", "right"] as const)
    for (const socket of ["heel", "ball", "toe", "mtp"] as const) {
      const local: IAutoMovieVector3 = offset(body, side, socket, toes);
      const read: ReturnType<typeof HumanFoot.preparePivot> = HumanFoot.preparePivot(
        body, side, socket, contact, heading, toes, roll,
      );
      const point: ReturnType<typeof HumanFoot.preparePoint> = HumanFoot.preparePoint(body, side, socket, toes);
      const previous: HumanFoot.IPlacement[] = [];
      for (const pitch of [25, 0, -15, 10, 25]) {
        const actual: HumanFoot.IPlacement = read(pitch);
        const rotated: IAutoMovieVector3 = rotate(local, heading, pitch, roll);
        TestValidator.predicate("prepared rocker ankle follows the independent rigid pivot law",
          vclose(actual.ankle, { x: contact.x - rotated.x, y: contact.y - rotated.y, z: contact.z - rotated.z }, 1e-12),
        );
        for (const axis of [{ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 }])
          TestValidator.predicate("prepared orientation keeps the physical multiplication order",
            vclose(Quaternion.rotateVector(actual.rotation, axis), rotate(axis, heading, pitch, roll), 1e-12),
          );
        TestValidator.predicate("actual prepared sole point stays at the authored contact",
          vclose(point(actual), contact, 1e-12),
        );
        for (const earlier of previous)
          TestValidator.predicate("each rocker query owns fresh placement records",
            actual !== earlier && actual.ankle !== earlier.ankle && actual.rotation !== earlier.rotation,
          );
        previous.push(actual);
      }
      previous[0]!.ankle.x = 123;
      previous[0]!.rotation.w = 456;
      const replay: HumanFoot.IPlacement = read(25);
      const expected: IAutoMovieVector3 = rotate(local, heading, 25, roll);
      TestValidator.predicate("returned rocker mutation cannot poison replay",
        vclose(replay.ankle, { x: contact.x - expected.x, y: contact.y - expected.y, z: contact.z - expected.z }, 1e-12) &&
        vclose(point(replay), contact, 1e-12) && previous[0]!.ankle.x === 123 && previous[0]!.rotation.w === 456,
      );
    }
}

/** Derive ankle-local geometry directly from the canonical profile's authored frames. */
function offset(body: IHumanBody, side: "left" | "right",
  name: "heel" | "ball" | "toe" | "mtp", toes: number): IAutoMovieVector3 {
  const ankle: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  if (name === "mtp") {
    const joint: IAutoMovieVector3 = body.rest.get(`${side}Toes`)!;
    return { x: joint.x - ankle.x, y: joint.y - ankle.y, z: joint.z - ankle.z };
  }
  const socket: IHumanBody["surfaces"]["sockets"]["heelLeft"] = body.surfaces.sockets[
    `${name}${side === "left" ? "Left" : "Right"}`
  ];
  if (socket.bone === `${side}Foot`) return { ...socket.point };
  const joint: IAutoMovieVector3 = body.rest.get(socket.bone)!;
  const turned: IAutoMovieVector3 = rotate(socket.point, 0, toes, 0);
  return { x: joint.x - ankle.x + turned.x, y: joint.y - ankle.y + turned.y, z: joint.z - ankle.z + turned.z };
}

/** Apply cardinal matrices directly: local negative pitch, then roll, then heading. */
function rotate(value: IAutoMovieVector3, heading: number, pitch: number, roll: number): IAutoMovieVector3 {
  const h: number = heading * Math.PI / 180;
  const p: number = pitch * Math.PI / 180;
  const r: number = roll * Math.PI / 180;
  const y: number = Math.cos(p) * value.y + Math.sin(p) * value.z;
  const z: number = -Math.sin(p) * value.y + Math.cos(p) * value.z;
  const x: number = Math.cos(r) * value.x - Math.sin(r) * y;
  const up: number = Math.sin(r) * value.x + Math.cos(r) * y;
  return { x: Math.cos(h) * x + Math.sin(h) * z, y: up, z: -Math.sin(h) * x + Math.cos(h) * z };
}
