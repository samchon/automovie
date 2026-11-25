import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import { placeOverHeadPath } from "@automovie/motions/internal";
import { strict as assert } from "node:assert";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** One degree of bracketing refined by 40 halvings, plus arithmetic rounding. */
const ANGLE_ROUNDING_DEGREES: number = 2e-12;

/** The radius and arc products each contribute rounding of a few ulps. */
const ARC_ROUNDING_METRES: number = 4 * Number.EPSILON;

/** Clearance search refines a valid roll bracket to a thousandth of a degree. */
const ROLL_ROUNDING_DEGREES: number = 0.001;

/**
 * The most restrictive hand limits the terminal angle at 10 mm of signed
 * separation. The nape stays fixed while the front travels its circular arc.
 * An axial roll instead keeps the nape and front fixed while lifting a grip.
 */
export function test_unit_motions_dressing_place_over_head_fall(): void {
  assert.equal(placeOverHeadPath.settledFall(60, () => 0.01), 60);
  const gap = (degrees: number): number =>
    Math.min(0.025, 0.0455 - 0.001 * degrees);
  const angle: number | undefined = placeOverHeadPath.settledFall(60, gap);
  assert(angle !== undefined && gap(angle) >= 0.01);
  assert(nclose(angle, 35.5, ANGLE_ROUNDING_DEGREES));
  assert.equal(placeOverHeadPath.settledFall(60, () => 0.009), undefined);

  const front: IAutoMovieVector3 = { x: 0.17, y: 0.18, z: 0.24 };
  const wear: IAutoMovieVector3 = { x: -0.43, y: 0, z: 0 };
  // The in-plane radius is 0.3 m from the 3-4-5 triangle. The axial offset
  // does not turn, so a quarter circle travels 0.15π metres.
  assert(nclose(placeOverHeadPath.fallArc(front, wear, 90), 0.15 * Math.PI, ARC_ROUNDING_METRES));
  assert.equal(placeOverHeadPath.fallArc(front, wear, 0), 0);

  assert(nclose(placeOverHeadPath.rollLimit(0.1, 0.05), 60, ANGLE_ROUNDING_DEGREES));
  const signed = (degrees: number): number => 0.008 - 0.0002 * degrees;
  const roll: number | undefined = placeOverHeadPath.settledRoll(30, signed);
  assert(roll !== undefined && signed(roll) >= 0.01);
  assert(nclose(roll, -10, ROLL_ROUNDING_DEGREES));
  assert.equal(placeOverHeadPath.settledRoll(8, signed), undefined);

  const nape: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const pendant: IAutoMovieVector3 = { x: 1, y: 0, z: 0.25 };
  const rolled: IAutoMovieRigidTransform = placeOverHeadPath.roll(
    { position: { x: -1, y: 1, z: 2 }, rotation: Quaternion.identity() },
    nape,
    pendant,
    90,
  );
  const world = (point: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(rolled.position, Quaternion.rotateVector(rolled.rotation, point));
  assert(vclose(world(nape), { x: 0, y: 1, z: 2 }, ARC_ROUNDING_METRES));
  assert(vclose(world(pendant), { x: 0, y: 1, z: 2.25 }, ARC_ROUNDING_METRES));
  assert(vclose(world({ x: 2, y: 0, z: 0 }), { x: 0, y: 2, z: 2 }, ARC_ROUNDING_METRES));
}
