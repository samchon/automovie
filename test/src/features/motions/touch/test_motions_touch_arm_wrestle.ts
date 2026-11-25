import { Quaternion, physicalShapeFaceContact } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSocial } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * A wrestling pad receives the posed elbow exterior at zero clearance.
 *
 * Scenarios:
 *
 * 1. A vertical 4 cm capsule axis with a 2 cm radius reaches the pad when it is
 *    centred 6 cm above the surface. Lifting and sinking by 5 mm change the
 *    signed clearance by the same amount.
 * 2. A center beyond the pad and radius cannot bear on it.
 * 3. The mutual plan forwards each side's actual pad and keeps the declared table,
 *    winner, and pin values.
 */
export function test_motions_touch_arm_wrestle(): void {
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const elbow: IAutoMoviePhysicalShape = {
    id: "elbow",
    material: "test",
    kind: "capsule",
    halfLength: 0.04,
    radius: 0.02,
    transform: frame,
  };
  const outline: readonly IAutoMovieVector3[] = [
    { x: -0.08, y: 0, z: -0.08 },
    { x: 0.08, y: 0, z: -0.08 },
    { x: 0.08, y: 0, z: 0.08 },
    { x: -0.08, y: 0, z: 0.08 },
  ];
  const face: ReturnType<typeof physicalShapeFaceContact.prepare> =
    physicalShapeFaceContact.prepare(frame, outline);
  const gap = (x: number, y: number): number | undefined =>
    face({ ...frame, position: { x, y, z: 0 } }, elbow)?.clearance;
  TestValidator.predicate(
    "the elbow exterior determines contact and signed clearance",
    nclose(gap(0, 0.06)!, 0, 1e-9) &&
      nclose(gap(0, 0.065)!, 0.005, 1e-9) &&
      nclose(gap(0, 0.055)!, -0.005, 1e-9) &&
      gap(0.101, 0.06) === undefined,
  );
  const params = {
    table: { x: 2, y: 0.8, z: 3 },
    winner: "one" as const,
    pin: 30,
    pads: {
      one: { prop: "pad-l", point: "top" },
      other: { prop: "pad-r", point: "top" },
    },
  };
  const cast = { one: "left", other: "right" };
  TestValidator.equals(
    "each arm retains its named support and shared contest geometry",
    [
      HumanSocial.armWrestle.act("one", params, cast).params,
      HumanSocial.armWrestle.act("other", params, cast).params,
    ],
    [
      {
        partner: "right",
        table: params.table,
        wins: true,
        pin: 30,
        pad: params.pads.one,
      },
      {
        partner: "left",
        table: params.table,
        wins: false,
        pin: 30,
        pad: params.pads.other,
      },
    ],
  );
}
