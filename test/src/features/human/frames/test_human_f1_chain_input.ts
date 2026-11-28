import { vclose } from "../../internal/predicates";
import { AutoMovieHumanF1Placement, AutoMovieHumanSegmentFrame } from "@automovie/human";
import type {
  AutoMovieMatrix3Tuple,
  IAutoMovieHumanF1Placement,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An invocation's segment chain places every descendant before any family,
 * port or source is built, without falling back to the stored person's chain.
 *
 * Scenarios:
 *
 * 1. A made three-joint chain carries its translated root and quarter-turn parent to the grandchild's independently prescribed world point.
 * 2. A supplied pose replaces the parent's quarter-turn once; descendants follow the same chain without a second placement.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public placement frame factory with a made chain and reads descendant frames; ignoring the invocation chain or applying its rotation twice fails.
 * @evidence contracts/development/testing.md#independent-expectations The expected translations follow a right-angle rotation of [3,0,0] to [0,3,0], added to the stated parent and root offsets; no generated figure supplies expectations.
 * @evidence contracts/development/common.md#meaningful-documentation A three-joint chain checks invocation ownership by applying the supplied root and parent pose to one grandchild frame exactly once.
 */
export function test_human_f1_chain_input(): void {
  const chain: IAutoMovieHumanSegmentJoint[] = [
    {
      name: "root",
      parent: null,
      offset: [10, 20, 30],
      rotation: AutoMovieHumanSegmentFrame.IDENTITY,
    },
    {
      name: "parent",
      parent: "root",
      offset: [2, 0, 0],
      rotation: [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ],
    },
    {
      name: "child",
      parent: "parent",
      offset: [3, 0, 0],
      rotation: AutoMovieHumanSegmentFrame.IDENTITY,
    },
  ];
  const frames: (
    pose?: IAutoMovieHumanF1Placement.IPose,
    input?: readonly IAutoMovieHumanSegmentJoint[],
  ) => IAutoMovieHumanF1Placement.IFrames = AutoMovieHumanF1Placement.frames;

  // 1. The reference chain includes both the root translation and parent turn.
  const reference: IAutoMovieHumanF1Placement.IFrames = frames(undefined, chain);
  const referenceChild: IAutoMovieHumanSegmentFrame | undefined =
    reference.get("child");
  TestValidator.predicate(
    "the child follows the supplied chain",
    referenceChild !== undefined &&
      vclose(
        {
          x: referenceChild.origin[0],
          y: referenceChild.origin[1],
          z: referenceChild.origin[2],
        },
        { x: 12, y: 23, z: 30 },
        1e-12,
      ),
  );

  // 2. Replacing the parent rotation changes the same descendant once.
  const posed: IAutoMovieHumanF1Placement.IFrames = frames(
    (name: string): AutoMovieMatrix3Tuple | undefined =>
      name === "parent" ? AutoMovieHumanSegmentFrame.IDENTITY : undefined,
    chain,
  );
  const posedChild: IAutoMovieHumanSegmentFrame | undefined =
    posed.get("child");
  TestValidator.predicate(
    "the pose is applied once to the invocation chain",
    posedChild !== undefined &&
      vclose(
        {
          x: posedChild.origin[0],
          y: posedChild.origin[1],
          z: posedChild.origin[2],
        },
        { x: 15, y: 20, z: 30 },
        1e-12,
      ),
  );
}
