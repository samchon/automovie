import { AutoMovieArchetypePoolEdge } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import {
  AquaticCrew
} from "../../../../../packages/motions/src/sport/internal/AquaticCrew";
import {
  AquaticEdge
} from "../../../../../packages/motions/src/sport/internal/AquaticEdge";
import {
  AquaticPosture
} from "../../../../../packages/motions/src/sport/internal/AquaticPosture";
import {
  AquaticTeamBase
} from "../../../../../packages/motions/src/sport/internal/AquaticTeamBase";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  HumanHand
} from "../../../../../packages/motions/src/posture/internal/HumanHand";
import {
  aquatic
} from "../../../../../packages/motions/src/sport/internal/aquatic";
import {
  aquaticArtisticSchedule
} from "../../../../../packages/motions/src/sport/internal/aquaticArtisticSchedule";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** A quarter turn about +Y: (x, y, z) goes to (z, y, -x). */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/** Standing at (1, 0, 2) heading 30 degrees, the neck bent 5. */
const ENTRY: IAutoMovieMotionHumanPosture = {
  root: { x: 1, y: 0, z: 2 },
  yaw: 30,
  pitch: 0,
  roll: 0,
  joints: { leftLowerLeg: [0, 0, 0] },
  limbs: {
    rightArm: { point: { x: 0, y: 1, z: 0 }, bend: { x: 0, y: 1, z: -1 } },
  },
};

/**
 * The aquatic laws' shared staging: crew contact windows on a hull, the crew's
 * minimum-jerk progress, a pool edge's frame, keyed and blended postures, and a
 * team base's hand-over of a contact.
 *
 * Scenarios:
 *
 * 1. The seat borne on the scull is a bear window supported by the hull, and the
 *    named hands grip its handles throughout, left first.
 * 2. A quarter into a 1 s to 3 s window the crew has made the minimum-jerk share
 *    `10/64 - 15/256 + 6/1024` = 0.103515625.
 * 3. Off a lip at (0, 0.3, 5) facing +Z with +X along it, 0.4 m out, 1 m along and
 *    0.2 m up is (1, 0.5, 5.4).
 * 4. A key yawed 10 and tipped 80 heads the entry's 30 plus 10, tips 80 and drops
 *    the hand goal; 3 m ahead of it at 0.5 m is along its 40 degree heading.
 * 5. Halfway from the entry to a 90 degree tip 2 m further with the knee at 60,
 *    the root is 1 m along, tipped 45, the knee at 30.
 * 6. Moved 2 m along +X, a posture turned about (0, 1, 0) turns about (2, 1, 0).
 * 7. Handing a hand's contact 0.1 m along its +X fully to (0, 2, 0) facing a
 *    quarter about +Y turns the hand the quarter and stands it at (0, 2, 0.1).
 * 8. A flyer on its left and right bases, one phase late, grips 0.14 s either side
 *    of its 2.65 s figure on the same clock as its bases, its left foot on the
 *    left base's right palm and its right foot on the right base's left palm,
 *    the hands nearest the group's middle; a flyer with no bases, or one base
 *    twice, is refused.
 * 9. The breaststroke hands meet the rotated wall separately, and each foot stays
 *    at its own material anchor until push-off, in shuffled read order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name the hull contacts, pose and timing transforms, artistic support assignments and the separate hand and foot contacts of a rotated wall turn.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the individual aquatic owners on explicit inputs. It also places the breaststroke plan on a stored body and reads its resolved palm and sole sockets through the wall contact.
 * @evidence contracts/development/testing.md#independent-expectations Evaluates the stated minimum-jerk fraction and quarter-turn geometry independently. The named bases and clock fix the support windows. The wall plane and first loaded sole placements bound the repeated and shuffled socket reads.
 */
export async function test_motions_sport_aquatic(): Promise<void> {
  // 1. The crew's windows.
  TestValidator.equals(
    "the borne seat and the gripping hands",
    [
      AquaticCrew.bear("scull", "seat", "bear", 0, 1, "seat"),
      AquaticCrew.grips(
        { id: "scull" },
        { kind: "doubleScull", leftGrip: "oarL", rightGrip: "oarR" },
      ).map((w: IAutoMovieMotionHumanContactWindow): string => w.part),
    ],
    [
      {
        part: "seat",
        kind: "bear",
        from: 0,
        to: 1,
        region: "seat",
        support: { kind: "prop", subject: "scull" },
      },
      ["leftHand", "rightHand"],
    ],
  );

  // 2. The crew's progress.
  TestValidator.predicate(
    "the minimum-jerk share",
    nclose(AquaticCrew.span(1.5, 1, 3), 0.103515625, 1e-12),
  );

  // 3. The pool edge.
  TestValidator.predicate(
    "placed off the lip",
    vclose(
      AquaticEdge.at(
        {
          id: "pool",
          lip: { x: 0, y: 0.3, z: 5 },
          out: { x: 0, y: 0, z: 1 },
          across: { x: 1, y: 0, z: 0 },
        },
        0.4,
        1,
        0.2,
      ),
      { x: 1, y: 0.5, z: 5.4 },
      1e-12,
    ),
  );

  // 4. A keyed posture and a point ahead.
  const keyed: IAutoMovieMotionHumanPosture = AquaticPosture.key(ENTRY, {
    pitch: 80,
    roll: 5,
    yaw: 10,
    lift: 0,
    joints: { leftLowerLeg: [20, 0, 0] },
  });
  const r: number = (40 * Math.PI) / 180;
  TestValidator.predicate(
    "the keyed posture",
    keyed.yaw === 40 &&
      keyed.pitch === 80 &&
      Object.keys(keyed.limbs).length === 0 &&
      vclose(
        AquaticPosture.along(keyed, 3, 0.5),
        { x: 1 + 3 * Math.sin(r), y: 0.5, z: 2 + 3 * Math.cos(r) },
        1e-12,
      ),
  );

  // 5. A blend.
  const half: IAutoMovieMotionHumanPosture = AquaticPosture.blend(ENTRY, {
    ...ENTRY,
    root: { x: 1, y: 0, z: 4 },
    pitch: 90,
    joints: { leftLowerLeg: [60, 0, 0] },
  })(0.5);
  TestValidator.predicate(
    "the middle of the blend",
    vclose(half.root, { x: 1, y: 0, z: 3 }, 1e-12) &&
      nclose(half.pitch, 45, 1e-12) &&
      nclose(half.joints.leftLowerLeg![0], 30, 1e-9),
  );

  // 6. A translated turn.
  TestValidator.equals(
    "the carried pivot",
    AquaticPosture.translate(
      {
        ...ENTRY,
        root: { x: 0, y: 0, z: 0 },
        rotation: { about: { x: 0, y: 1, z: 0 }, turn: QUARTER },
      },
      { x: 2, y: 0, z: 0 },
    ).rotation,
    { about: { x: 2, y: 1, z: 0 }, turn: QUARTER },
  );

  // 7. The hand-over.
  const hand: IAutoMovieResolvedBone = {
    bone: "rightHand",
    localRotation: { x: 0, y: 0, z: 0, w: 1 },
    worldPosition: { x: 1, y: 1, z: 0 },
    worldRotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const goal: IAutoMovieHumanLimbGoal = AquaticTeamBase.transfer(
    hand,
    { x: 1, y: 0.5, z: -1 },
    { x: 0.1, y: 0, z: 0 },
    { x: 0, y: 2, z: 0 },
    QUARTER,
    1,
  );
  TestValidator.predicate(
    "handed over",
    vclose(goal.point, { x: 0, y: 2, z: 0.1 }, 1e-12) &&
      qclose(goal.rotation!, QUARTER, 1e-12),
  );

  // 8. The artistic figure's schedule.
  const flyer: aquaticArtisticSchedule.ISchedule = aquaticArtisticSchedule(
    "flyer",
    { role: "flyer", bases: ["leftBase", "rightBase"], phase: 1 },
  );
  const base: aquaticArtisticSchedule.ISchedule = aquaticArtisticSchedule(
    "leftBase",
    { role: "base", phase: 1 },
  );
  const at = (
    schedule: aquaticArtisticSchedule.ISchedule,
    name: string,
  ): number =>
    schedule.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    )!.share * aquaticArtisticSchedule.DURATION;
  TestValidator.predicate(
    "the shared grip",
    nclose(at(flyer, "figure"), 2.65, 1e-12) &&
      nclose(at(flyer, "supportAcquire"), 2.51, 1e-12) &&
      nclose(at(flyer, "supportRelease"), 2.79, 1e-12) &&
      at(base, "supportAcquire") === at(flyer, "supportAcquire"),
  );
  TestValidator.equals(
    "the feet on the inner palms",
    flyer.contacts.map(
      (w: IAutoMovieMotionHumanContactWindow): [string, unknown] => [
        w.part,
        w.support,
      ],
    ),
    [
      [
        "leftFoot",
        { kind: "person", subject: "leftBase", region: "palmRight" },
      ],
      [
        "rightFoot",
        { kind: "person", subject: "rightBase", region: "palmLeft" },
      ],
    ],
  );
  TestValidator.predicate(
    "a flyer without its bases",
    throwsError(() => aquaticArtisticSchedule("flyer", { role: "flyer" })) &&
      throwsError(() =>
        aquaticArtisticSchedule("flyer", {
          role: "flyer",
          bases: ["leftBase", "leftBase"],
        }),
      ),
  );
  await wallTurn();
}

/** Observe actual displayed contact sockets during a named-wall turn. */
async function wallTurn(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams> =
    motionActionContext<IAutoMovieMotionHumanAquatic.IParams>(
      body,
      { kind: "breaststrokeStartTurn", water: -0.15, support: "wall" },
      {
        at: { x: -5, y: 0.3, z: 0 },
        yaw: 90,
        props: [
          AutoMovieMotionHumanObject.prop("wall", AutoMovieArchetypePoolEdge.create({ kind: "deckEdge" }), {
            at: { x: 0, y: 0, z: 0 },
            yaw: -90,
            fixed: true,
          }),
        ],
      },
    );
  const turn: IAutoMovieMotionHumanActionPlan = aquatic.plan(context);
  const at = (name: string): number =>
    turn.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * turn.duration;
  const touch: number = at("twoHandTouch");
  const plant: number = at("wallPlant");
  const push: number = at("pushOff");
  const bones = AquaticPosture.markers(body, [
    "leftHand",
    "rightHand",
    "leftFoot",
    "rightFoot",
  ]);
  const shown = (
    seconds: number,
    kind: "Hand" | "Foot",
    side: AutoMovieHumanSide,
  ): IAutoMovieVector3 => {
    const part: AutoMovieHumanoidBone = `${side}${kind}`;
    const bone: IAutoMovieResolvedBone = bones(turn.posture(seconds)).get(
      part,
    )!;
    const offset: IAutoMovieVector3 =
      kind === "Hand"
        ? HumanHand.offset(body, side, "palm", "flat").point
        : HumanFoot.offset(body, side, "sole");
    return AutoMovieEngineVector3.add(
      bone.worldPosition,
      AutoMovieEngineQuaternion.rotateVector(bone.worldRotation, offset),
    );
  };
  for (const side of HumanHand.SIDES) {
    TestValidator.predicate(
      `the ${side} palm meets the named wall`,
      Math.abs(shown(touch, "Hand", side).x) < 0.006,
    );
    const anchor: IAutoMovieVector3 = shown(plant, "Foot", side);
    for (const seconds of [push, plant + (push - plant) * 0.37, plant, push])
      TestValidator.predicate(
        `the ${side} sole keeps its material point at ${seconds} s`,
        Math.abs(anchor.x) < 0.006 &&
          vclose(shown(seconds, "Foot", side), anchor, 0.006),
      );
  }
}
