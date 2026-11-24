import {
  AutoMovieXpbdBody,
  physicalLegCapacity,
  physicalStanceAllocation,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A support leg's force capacity and the region it leaves the centre of
 * pressure, against closed forms:
 *
 * 1. Capacity: a hip at (0, 1, 0) and a knee at (0, 0.55, 0.3), each turning
 *    about x, hold a foot point at (0, 0.1, 0.2). The floor's newton turns the
 *    hip by (p - o) x n . x = -0.2, which its motor holds forward within 100 N
 *    m, 500 N, and the knee by +0.1, held in reverse within 60 N m, 600 N:
 *    the leg holds 500 N (tau = J^T f; Herzog et al. 2016, Section 2.1).
 * 2. Region: a front foot spanning z in [0.2, 0.4] that may carry at most 0.6
 *    of the weight, with a rear foot spanning [-0.4, -0.2], leaves the
 *    centre of pressure a front edge at 0.4 (-0.2) + 0.6 (0.4) = 0.16; a
 *    command far ahead is allocated there, where the front foot's share is
 *    exactly 0.6, never more (MIT Cheetah-Software `maxForce`; Chen et al.
 *    2022, `f_max`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the capacity, the region and their closed forms.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalLegCapacity`, `physicalLegCapacity.region` and `physicalStanceAllocation.allocate` and reads their values.
 * @evidence contracts/development/testing.md#independent-expectations The joint moments, forces, edge and share are evaluated by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates a forward cap from a reverse one, the binding joint from the slack one, and a bounded foot's region from the unbounded support.
 * @evidence contracts/development/testing.md#execution-ownership Pure arithmetic in memory over stand-in segment poses; no native world, viewer or file host.
 */
export function test_physical_leg_capacity(): void {
  const failures: string[] = [];
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const rigid = (
    position: IAutoMovieVector3,
  ): Pick<AutoMovieXpbdBody, "translation" | "rotation"> => ({
    translation: (): IAutoMovieVector3 => position,
    rotation: (): IAutoMovieQuaternion => identity,
  });

  // 1. The bent leg's capacity.
  const segments: ReadonlyMap<
    string,
    Pick<AutoMovieXpbdBody, "translation" | "rotation">
  > = new Map([
    ["pelvis", rigid({ x: 0, y: 1, z: 0 })],
    ["thigh", rigid({ x: 0, y: 0.55, z: 0.3 })],
    ["shin", rigid({ x: 0, y: 0.1, z: 0.2 })],
  ]);
  const joint = (
    parent: string,
    child: string,
    reverse: number,
  ): IAutoMoviePhysicalJoint => ({
    id: child,
    parent,
    child,
    parentFrame: { position: zero, rotation: identity },
    childFrame: { position: zero, rotation: identity },
    axes: [
      {
        axis: "x",
        minimum: -Math.PI,
        maximum: Math.PI,
        stiffness: 0,
        damping: 0,
        maximumTorque: 100,
        reverseTorque: reverse,
        channel: "flexion",
      },
    ],
  });
  const profile: Pick<IAutoMoviePhysicalProfile, "joints"> = {
    joints: [joint("pelvis", "thigh", 80), joint("thigh", "shin", 60)],
  };
  const force: number = physicalLegCapacity({
    profile,
    segments,
    chain: ["thigh", "shin"],
    point: { x: 0, y: 0.1, z: 0.2 },
  });
  if (!(Math.abs(force - 500) < 1e-9))
    failures.push(`the bent leg holds ${force} N against 500`);

  // 2. A front foot bounded at 0.6 of the weight.
  const strip = (back: number, front: number): IAutoMovieVector3[] => [
    { x: -0.5, y: 0, z: back },
    { x: 0.5, y: 0, z: back },
    { x: 0.5, y: 0, z: front },
    { x: -0.5, y: 0, z: front },
  ];
  const region: IAutoMovieVector3[] | undefined = physicalLegCapacity.region([
    { points: strip(0.2, 0.4), share: 0.6 },
    { points: strip(-0.4, -0.2), share: 2 },
  ]);
  if (!region) failures.push("a bounded front foot leaves no region");
  else {
    const front: number = Math.max(...region.map((p) => p.z));
    const back: number = Math.min(...region.map((p) => p.z));
    if (!(Math.abs(front - 0.16) < 1e-12) || !(Math.abs(back + 0.4) < 1e-12))
      failures.push(`the region spans ${back} to ${front} against -0.4 to 0.16`);
    const allocated = physicalStanceAllocation.allocate({
      capture: { x: 0, y: 0, z: 0.1 },
      reference: zero,
      command: { x: 0, y: 0, z: 0.5 },
      offset: zero,
      shrunken: region,
      support: region,
    });
    const share: number = (allocated.pressure.z + 0.2) / (0.4 + 0.2);
    if (!(Math.abs(allocated.pressure.z - 0.16) < 1e-12) || share > 0.6 + 1e-12)
      failures.push(
        `a command ahead is allocated at ${allocated.pressure.z}, the front foot's share ${share}`,
      );
  }
  if (
    physicalLegCapacity.region([
      { points: strip(0.2, 0.4), share: 2 },
      { points: strip(-0.4, -0.2), share: 2 },
    ]) !== undefined
  )
    failures.push("unbounded feet cut the support");

  TestValidator.equals("leg capacity", failures, []);
}
