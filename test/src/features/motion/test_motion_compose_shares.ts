import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanHand,
  AutoMovieMotionHumanHead,
  AutoMovieMotionHumanRoot,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The small shares the phrases are built from: a share of a root
 * displacement and the primitive that applies one, a head angle split
 * between the two cervical joints, and a hand shaped by a weight.
 *
 * A root displacement is in the performer's own floor frame, `x` to the
 * left and `z` ahead. A performer heading +Z has the left along +X; turned 90
 * degrees to the left the heading is +X and the left is -Z. A hand's extra
 * curl is added to the shape's fingers and not to the thumb, so at weight `w`
 * a curl of 20 degrees flexes every finger segment `20 w` more.
 *
 * Scenarios:
 * 1. A share of a displacement scales its move and its turn alike; 0 is no
 *    displacement, a negative share reverses it and a share over 1 is not
 *    clamped.
 * 2. `travel` claims the root over its span, asks its offset with the second
 *    written, moves the body in the frame of the heading it had, adds the
 *    turn, keeps every other member, and composes when written twice.
 * 3. A head angle is split half and half on its own axis; the two parts sum
 *    to the whole and the other two axes stay 0.
 * 4. A shaped hand claims its hand over its span and writes that hand's
 *    fifteen segments only; at weight 0 every shape is the same relaxed
 *    hand; a fist differs from a flat hand at weight 1; a weight outside
 *    [0, 1] is the nearer end; a curl flexes the fingers by its share and
 *    leaves the thumb.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls each public function and reads what it returns or writes; a displacement applied in the world frame, a clamped share, a head split on the wrong axis, an unclamped hand weight or a curled thumb fails.
 * @evidence contracts/development/testing.md#independent-expectations Products and sums of the stated inputs, the floor frame's two headings worked by hand, and the curl's stated definition.
 * @evidence contracts/development/testing.md#distinguishing-cases Shares inside, at and outside [0, 1]; two headings; three head axes; two shapes, both hands' keys, fingers against the thumb.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit with no body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the curl's rule, and lists the 4 scenarios.
 */
export function test_motion_compose_shares(): void {
  const close = (a: number, b: number, e: number = 1e-9): boolean =>
    Math.abs(a - b) <= e;
  const at = (g: IAutoMovieVector3, x: number, y: number, z: number): boolean =>
    close(g.x, x) && close(g.y, y) && close(g.z, z);

  // 1. A share of a displacement.
  const offset: AutoMovieMotionHumanRoot.IOffset = {
    point: { x: 0.2, y: -0.1, z: 0.4 },
    yaw: 30,
  };
  const scaled = (share: number): AutoMovieMotionHumanRoot.IOffset =>
    AutoMovieMotionHumanRoot.scale(offset, share);
  TestValidator.predicate(
    "a share scales the move and the turn alike",
    at(scaled(0.5).point, 0.1, -0.05, 0.2) &&
      close(scaled(0.5).yaw, 15) &&
      at(scaled(0).point, 0, 0, 0) &&
      close(scaled(0).yaw, 0) &&
      at(scaled(-1).point, -0.2, 0.1, -0.4) &&
      close(scaled(-1).yaw, -30) &&
      at(scaled(2).point, 0.4, -0.2, 0.8) &&
      close(scaled(2).yaw, 60),
  );

  // 2. The travelling root.
  const standing = (yaw: number): IHumanPosture => ({
    root: { x: 1, y: 0.9, z: 2 },
    yaw,
    pitch: 5,
    roll: 0,
    joints: { neck: [10, 0, 0] },
    limbs: {
      rightArm: { point: { x: 9, y: 9, z: 9 }, bend: { x: 0, y: 0, z: 0 } },
    },
  });
  const asked: number[] = [];
  const travel: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanRoot.travel({
      from: 0.5,
      to: 2,
      offset: (seconds: number): AutoMovieMotionHumanRoot.IOffset => {
        asked.push(seconds);
        return { point: { x: 0.1, y: 0.2, z: seconds }, yaw: 20 };
      },
    });
  const ahead: IHumanPosture = travel.write(standing(0), 1);
  const turned: IHumanPosture = travel.write(standing(90), 1.5);
  TestValidator.equals(
    "a travel claims the root over its span",
    [travel.channels, travel.from, travel.to],
    [["root"], 0.5, 2],
  );
  TestValidator.predicate(
    "a travel moves the body in its own frame and adds the turn",
    asked.length === 2 &&
      asked[0] === 1 &&
      asked[1] === 1.5 &&
      at(ahead.root, 1.1, 1.1, 3) &&
      close(ahead.yaw, 20) &&
      at(turned.root, 2.5, 1.1, 1.9) &&
      close(turned.yaw, 110),
  );
  TestValidator.predicate(
    "a travel keeps every other member",
    ahead.pitch === 5 &&
      ahead.joints.neck?.[0] === 10 &&
      ahead.limbs.rightArm?.point.x === 9,
  );
  const twice: IHumanPosture = AutoMovieMotionHumanRoot.travel({
    from: 0,
    to: 1,
    offset: (): AutoMovieMotionHumanRoot.IOffset => ({
      point: { x: 0, y: 0, z: 1 },
      yaw: 90,
    }),
  }).write(
    AutoMovieMotionHumanRoot.travel({
      from: 0,
      to: 1,
      offset: (): AutoMovieMotionHumanRoot.IOffset => ({
        point: { x: 0, y: 0, z: 1 },
        yaw: 90,
      }),
    }).write(standing(0), 0.5),
    0.5,
  );
  TestValidator.predicate(
    "a second travel moves along the heading the first one turned to",
    at(twice.root, 2, 0.9, 3) && close(twice.yaw, 180),
  );

  // 3. A head angle shared.
  TestValidator.equals(
    "the neck's share is a half",
    AutoMovieMotionHumanHead.NECK,
    0.5,
  );
  TestValidator.equals(
    "a flexion is split half and half",
    AutoMovieMotionHumanHead.share(0, 30),
    { neck: [15, 0, 0], head: [15, 0, 0] },
  );
  TestValidator.equals(
    "a side bend and a turn stay on their own axes",
    [
      AutoMovieMotionHumanHead.share(1, 10),
      AutoMovieMotionHumanHead.share(2, -40),
    ],
    [
      { neck: [0, 5, 0], head: [0, 5, 0] },
      { neck: [0, 0, -20], head: [0, 0, -20] },
    ],
  );

  // 4. A shaped hand.
  type Joints = IHumanPosture["joints"];
  const hand = (
    shape: "flat" | "fist",
    weight: number,
    curl?: number,
  ): Joints =>
    AutoMovieMotionHumanHand.shape({
      side: "right",
      shape,
      from: 0.5,
      to: 2,
      weight: (): number => weight,
      ...(curl === undefined ? {} : { curl }),
    }).write(standing(0), 1).joints;
  const shaped: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanHand.shape(
    {
      side: "left",
      shape: "fist",
      from: 0.5,
      to: 2,
      weight: (): number => 1,
    },
  );
  const written: string[] = Object.keys(shaped.write(standing(0), 1).joints);
  TestValidator.equals(
    "a shaped hand claims its hand over its span",
    [shaped.channels, shaped.from, shaped.to],
    [["leftHand"], 0.5, 2],
  );
  TestValidator.predicate(
    "a shaped hand writes its own fifteen segments beside what was there",
    written.length === 16 &&
      written.includes("neck") &&
      written.filter((bone: string): boolean => bone.startsWith("left"))
        .length === 15,
  );
  const same = (a: Joints, b: Joints): boolean =>
    Object.keys(a).length === Object.keys(b).length &&
    (Object.keys(a) as (keyof Joints)[]).every((bone: keyof Joints): boolean =>
      a[bone]!.every((v: number, i: number): boolean => close(v, b[bone]![i]!)),
    );
  TestValidator.predicate(
    "at weight 0 every shape is the same relaxed hand",
    same(hand("fist", 0), hand("flat", 0)) &&
      same(hand("fist", 0, 20), hand("flat", 0)),
  );
  TestValidator.predicate(
    "a fist is not a flat hand, and a weight outside [0, 1] is the nearer end",
    !same(hand("fist", 1), hand("flat", 1)) &&
      same(hand("fist", 2), hand("fist", 1)) &&
      same(hand("fist", -1), hand("fist", 0)),
  );
  const plain: Joints = hand("flat", 0.5);
  const curled: Joints = hand("flat", 0.5, 20);
  TestValidator.predicate(
    "a curl flexes every finger segment by its share and leaves the thumb",
    (Object.keys(plain) as (keyof Joints)[])
      .filter((bone: keyof Joints): boolean => bone.startsWith("right"))
      .every((bone: keyof Joints): boolean =>
        close(
          curled[bone]![0] - plain[bone]![0],
          bone.includes("Thumb") ? 0 : 10,
        ),
      ),
  );
}
