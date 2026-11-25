import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropLaunch,
  IAutoMovieProjectileFirstContact,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanPerformanceRead,
  HumanPropCatchHands,
  HumanPropSweepHands,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { actingPerformanceState } from "../../internal/fixtures/actingPerformanceState";
import { testAffordance } from "../../internal/fixtures/testAffordance";

/** Grip type. */
type IGrip = IAutoMovieMotionHumanPerformanceState.IGrip;

/**
 * `HumanPropSweepHands` reads the hands a flight sweep meets: whether an action
 * launches a prop, a collider present until a handback, the sides a handback's
 * fit owns, a prop's frame when it stands still over a span, and the grips that
 * carry it; `HumanPropCatchHands` reserves a capture's receiving hands.
 *
 * The actor's action from 0 to 2 s launches a ball at 1 s; a cup rests at (1,
 * 0, 0); a bell hangs on a line from a hook.
 *
 * Scenarios:
 *
 * 1. The ball is launched, the cup is not.
 * 2. A collider until 1 s reads as itself before and absent from 1 s on.
 * 3. A handback at 1 s with the right hand owns the right hand and the left hand
 *    holding a racket then, each once; a grip ended before it or a worn span is
 *    not one.
 * 4. A cup no grip holds over 0 to 1 s stands still at its rest; held there, or
 *    moving by itself, or held on a line, it may move; a fixture stands still
 *    though gripped.
 * 5. The grips spanning a sweep carry the cup; a mount among them, or a line, or
 *    its own motion leaves none.
 * 6. A capture's approach is the grip closing at the capture with that launch
 *    and a hand contact; without a sphere or a capture, none.
 * 7. Within an approach the hand and its fingers are omitted from a reading,
 *    the other hand and the arm kept; outside it nothing is.
 * 8. A reserved hold closes on a ball centred at the fitted hand, not on one ten
 *    metres off; a hold without a capture always closes.
 */
export async function test_motions_perform_sweep_hands(): Promise<void> {
  const origin = { at: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const plain = (subject: string, at = origin): IAutoMovieMotionHumanProp =>
    HumanObject.prop(subject, { affordances: [] }, at);
  const launch: IAutoMovieMotionPropLaunch = {
    prop: "ball",
    seconds: 1,
    point: { x: 0, y: 1, z: 0 },
    velocity: { x: 0, y: 0, z: 5 },
    sphere: { radius: 0.1, centre: { x: 0, y: 0, z: 0 } },
  };
  const hook: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop(
      "hook",
      { affordances: [testAffordance("tip", "hook", { x: 0, y: 2, z: 0 })] },
      origin,
    ),
    tethers: [
      {
        id: "string",
        from: "tip",
        to: { prop: "bell", point: "loop" },
        length: { kind: "free", metres: 1 },
      },
    ],
  };
  const self: IAutoMovieMotionHumanPerformanceState =
    await actingPerformanceState(
      [
        plain("ball"),
        plain("cup", { at: { x: 1, y: 0, z: 0 }, yaw: 0 }),
        plain("racket"),
        hook,
        HumanObject.prop(
          "bell",
          { affordances: [testAffordance("loop", "hook", { x: 0, y: 0, z: 0 })] },
          origin,
        ),
      ],
      [{ start: 0, end: 2, duration: 2, plan: { launches: [launch] } }],
    );

  // 1. Launched.
  TestValidator.predicate(
    "launched props",
    HumanPropSweepHands.launched(self, "ball") &&
      !HumanPropSweepHands.launched(self, "cup"),
  );

  // 2. Until a handback.
  const a: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const wall: IAutoMovieProjectileFirstContact.ICollider = {
    id: "wall",
    nearest: () => ({ distance: 0.3, point: a, normal: { x: 1, y: 0, z: 0 } }),
  };
  const gone = HumanPropSweepHands.until(wall, 1);
  TestValidator.predicate(
    "a collider until a handback",
    gone.distance!(a, a, 0.5) === 0.3 &&
      gone.nearest(a, a, 0.5).distance === 0.3 &&
      gone.distance!(a, a, 1) === Infinity &&
      gone.nearest(a, a, 1.5).distance === Infinity,
  );

  // 3. Handback sides.
  const racket: IGrip = { subject: "actor", side: "left", from: 0, to: 2 };
  const sides = HumanPropSweepHands.handbackSides(
    {
      ...self,
      grips: new Map([
        ["racket", [racket]],
        ["cup", [{ subject: "actor", side: "left", from: 0, to: 0.5 }]],
        [
          "ball",
          [{ subject: "actor", side: "right", bone: "head", from: 0, to: 2 }],
        ],
      ]),
    },
    { subject: "actor", at: 1, from: 0.5, hands: ["right"] },
  );
  TestValidator.equals(
    "the handback's hands",
    [...sides].sort((a, b): number => a.localeCompare(b)),
    ["left", "right"],
  );
  TestValidator.equals(
    "an ended grip and a worn span own no hand",
    HumanPropSweepHands.handbackSides(
      {
        ...self,
        grips: new Map([
          ["cup", [{ subject: "actor", side: "left", from: 0, to: 0.5 }]],
          [
            "ball",
            [{ subject: "actor", side: "left", bone: "head", from: 0, to: 2 }],
          ],
          [
            "racket",
            [
              {
                subject: "actor",
                side: "left",
                mount: { prop: "hook", point: "tip" },
                from: 0,
                to: 2,
              },
            ],
          ],
        ]),
      },
      { subject: "actor", at: 1, from: 0.5, hands: ["right"] },
    ),
    ["right"],
  );

  // 4. Still.
  const cup: IAutoMovieMotionHumanProp = self.props.get("cup")!;
  const held: IGrip = { subject: "actor", side: "right", from: 0.5, to: 3 };
  const rest = HumanPropSweepHands.still(self, cup, [], 0, 1);
  TestValidator.predicate(
    "standing still",
    rest !== undefined &&
      rest.position.x === 1 &&
      HumanPropSweepHands.still(self, cup, [held], 0, 1) === undefined &&
      HumanPropSweepHands.still(self, cup, [held], 3, 4) !== undefined &&
      HumanPropSweepHands.still(
        self,
        { ...cup, motion: (): IAutoMovieRigidTransform => cup.frame },
        [],
        0,
        1,
      ) === undefined &&
      HumanPropSweepHands.still(self, self.props.get("bell")!, [], 0, 1) ===
        undefined &&
      HumanPropSweepHands.still(self, { ...cup, fixed: true }, [held], 0, 1) !==
        undefined,
  );

  // 5. Carriers.
  const mount: IGrip = {
    subject: "hook",
    side: "right",
    mount: { prop: "hook", point: "tip" },
    from: 0.8,
    to: 5,
  };
  TestValidator.predicate(
    "the carrying grips",
    HumanPropSweepHands.carriers(self, cup, [held], 0, 1)[0] === held &&
      HumanPropSweepHands.carriers(self, cup, [held], 3, 4).length === 0 &&
      HumanPropSweepHands.carriers(self, cup, [held, mount], 0, 1).length ===
        0 &&
      HumanPropSweepHands.carriers(self, self.props.get("bell")!, [held], 0, 1)
        .length === 0 &&
      HumanPropSweepHands.carriers(
        self,
        { ...cup, motion: (): IAutoMovieRigidTransform => cup.frame },
        [held],
        0,
        1,
      ).length === 0,
  );

  // 6. A capture's approach.
  const capture: IGrip = {
    subject: "other",
    side: "left",
    from: 1.4,
    to: 3,
    capture: { launch, handContactFrom: 1.2, matches: (): boolean => true },
  };
  const approach = HumanPropCatchHands.forLaunch(launch, [held, capture], 1.4);
  TestValidator.predicate(
    "the capture's approach",
    approach.length === 1 &&
      approach[0]!.subject === "other" &&
      approach[0]!.side === "left" &&
      approach[0]!.from === 1.2 &&
      approach[0]!.until === 1.4 &&
      HumanPropCatchHands.forLaunch(launch, [capture], undefined).length ===
        0 &&
      HumanPropCatchHands.forLaunch(
        {
          prop: launch.prop,
          seconds: launch.seconds,
          point: launch.point,
          velocity: launch.velocity,
        },
        [capture],
        1.4,
      ).length === 0 &&
      HumanPropCatchHands.forLaunch(launch, [capture], 1.3).length === 0,
  );

  // 7. Omitted bones.
  const reading = (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    HumanPerformanceRead.bones(self, "actor", 0.5);
  const all: number = reading().size;
  const inside = HumanPropCatchHands.omit(reading(), approach, 1.3);
  const outside = HumanPropCatchHands.omit(reading(), approach, 1.5);
  const left: AutoMovieHumanoidBone[] = [...reading().keys()].filter(
    (name: AutoMovieHumanoidBone): boolean =>
      name === "leftHand" ||
      (name.startsWith("left") && /Thumb|Index|Middle|Ring|Little/.test(name)),
  );
  TestValidator.predicate(
    "the reserved hand omitted within its approach",
    left.length > 1 &&
      inside.size === all - left.length &&
      !inside.has("leftHand") &&
      inside.has("rightHand") &&
      inside.has("leftLowerArm") &&
      outside.size === all,
  );

  // 8. A reserved hold closes only on a hand that reaches the sphere.
  const hand: IAutoMovieResolvedBone = HumanPerformanceRead.bones(
    self,
    "actor",
    1.4,
  ).get("leftHand")!;
  const catching: IGrip = { ...capture, subject: "actor" };
  const placed = (offset: number): IAutoMovieRigidTransform => ({
    position: {
      x: hand.worldPosition.x + offset,
      y: hand.worldPosition.y,
      z: hand.worldPosition.z,
    },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  TestValidator.predicate(
    "a hold closes where the fitted hand reaches the ball",
    HumanPropCatchHands.closes(self, catching, placed(0)) &&
      !HumanPropCatchHands.closes(self, catching, placed(10)) &&
      HumanPropCatchHands.closes(self, held, placed(10)),
  );
}
