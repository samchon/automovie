import { nclose, vclose } from "../../internal/predicates";
import {
  AutoMovieHumanHipSupportPlacement,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type {
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * A provided mechanical support breadth determines only its signed half-span.
 *
 * Scenarios:
 * 1. B60 retains a made chain whose support offset is30; B80 places it at40 and its reflected twin at-40 while AP/Y, other offsets and reference rotations stay independent.
 * 2. Zero, negative, nonfinite and over-800mm values are refused by the existing identity field's range.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual support owner and reads its chain and existing frame/reflection consumers; ignored breadth and silent invalid input both fail.
 * @evidence contracts/development/testing.md#independent-expectations A symmetric separation B gives signed coordinates plus/minus B/2; the literal translated root and support offset independently give world [13,24,40].
 * @evidence contracts/development/common.md#meaningful-documentation Reference breadth retains the made chain. Broader support changes the signed half span through world placement and reflection, while invalid breadth has a named refusal.
 */
export function test_human_hip_support_placement(): void {
  const chain: IAutoMovieHumanSegmentJoint[] = [
    { name: "pelvis", parent: null, offset: [10, 20, 0], rotation: F.IDENTITY },
    {
      name: "support",
      parent: "pelvis",
      offset: [3, 4, 30],
      rotation: [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ],
    },
    {
      name: "distal",
      parent: "support",
      offset: [1, 2, 3],
      rotation: F.IDENTITY,
    },
  ];
  const failures: string[] = [];
  const unchanged: readonly IAutoMovieHumanSegmentJoint[] = AutoMovieHumanHipSupportPlacement.place(
    { hipJointCentreBreadth: 60 },
    chain,
    "support",
  );
  if (unchanged !== chain)
    failures.push("the unchanged B60 chain lost identity");
  const placed: readonly IAutoMovieHumanSegmentJoint[] = AutoMovieHumanHipSupportPlacement.place(
    { hipJointCentreBreadth: 80 },
    chain,
    "support",
  );
  const support: IAutoMovieHumanSegmentJoint | undefined = placed.find(
    (joint: IAutoMovieHumanSegmentJoint): boolean => joint.name === "support",
  );
  if (
    support === undefined ||
    !vclose(
      { x: support.offset[0], y: support.offset[1], z: support.offset[2] },
      { x: 3, y: 4, z: 40 },
      1e-12,
    )
  )
    failures.push("B80 did not produce [3,4,40]");
  if (
    support?.rotation !== chain[1]!.rotation ||
    placed[0] !== chain[0] ||
    placed[2] !== chain[2]
  )
    failures.push("independent frames/offset records changed");
  const frames: Map<string, IAutoMovieHumanSegmentFrame> = F.world(
    placed,
    (): undefined => undefined,
  );
  const frame: IAutoMovieHumanSegmentFrame | undefined = frames.get("support");
  if (
    frame === undefined ||
    !vclose(
      { x: frame.origin[0], y: frame.origin[1], z: frame.origin[2] },
      { x: 13, y: 24, z: 40 },
      1e-12,
    ) ||
    !nclose(F.mirror(frame).origin[2], -40, 1e-12)
  )
    failures.push("world or twin support half-span differs");
  const distal: IAutoMovieHumanSegmentFrame | undefined = frames.get("distal");
  if (
    distal === undefined ||
    !vclose(
      { x: distal.origin[0], y: distal.origin[1], z: distal.origin[2] },
      { x: 11, y: 25, z: 43 },
      1e-12,
    )
  )
    failures.push("the independent R90 descendant did not follow the support");
  for (const breadth of [0, -1, NaN, Infinity, 801, Number.MIN_VALUE]) {
    let refused: boolean = false;
    try {
      AutoMovieHumanHipSupportPlacement.place(
        { hipJointCentreBreadth: breadth },
        chain,
        "support",
      );
    } catch (error: unknown) {
      refused =
        error instanceof Error &&
        error.message.includes("hipJointCentreBreadth");
    }
    if (!refused) failures.push("invalid breadth accepted: " + String(breadth));
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
