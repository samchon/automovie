import { ANKLE_DORSIFLEXION } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditContact,
  AutoMovieMotionHumanAuditGround,
  AutoMovieMotionHumanAuditRange,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";
import { nclose } from "../internal/nclose";

/** A deck's heading: a quarter turn about +Y, so a reading that left the support's rotation out would not hold the foot. */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/** The deck: it travels 1 m/s along +Z under its quarter-turned heading. */
const deck = (seconds: number): IAutoMovieRigidTransform => ({
  position: { x: 0, y: 0, z: seconds },
  rotation: QUARTER,
});

/** One second-long action that declares both feet planted on a support, or nothing. */
const spans = (
  support: IAutoMovieMotionHumanContactWindow.Support | null,
): IAutoMovieMotionHumanAuditMotion.ISpan[] => [
  {
    name: "ride",
    start: 0,
    entryTime: 0,
    end: 1,
    plan: {
      duration: 1,
      contacts:
        support === null
          ? []
          : (["leftFoot", "rightFoot"] as const).map(
              (
                part: "leftFoot" | "rightFoot",
              ): IAutoMovieMotionHumanContactWindow => ({
                part,
                kind: "plant",
                from: 0,
                to: 1,
                support,
              }),
            ),
    },
  },
];

/**
 * The audits read a planted foot in the frame of the support it is planted
 * on, read the floor only where one bears the person, and count a plant on a
 * prop as bearing load.
 *
 * Scenarios:
 * 1. Feet planted on a deck travelling 1 m/s: no slip and no loose foot, while the same motion read without the deck's frame slips by the deck's travel.
 * 2. Feet that travel 10 % faster than the deck: the 0.1 m slip on the deck and its 0.1 m/s loose speed are caught.
 * 3. A swimmer 1 m under the surface: no floor finding while the water carries them, and about 1 m read against the world plane otherwise.
 * 4. A swimmer's feet sweeping at the surface at 1 m/s: no skate in the water, a skate on a floor.
 * 5. Feet planted on a bank 0.3 m high read as on level ground, and 0.1 m sunk into it reads as 0.1 m sunk into the floor; on a slope the lower foot's ground is the floor; a rider seated on a wading horse 0.6 m below the plane has no floor under them, while the same body with nothing bearing it is 0.6 m under the floor.
 * 6. An ankle dorsiflexed 10 degrees past the unloaded limit: no overshoot while a plant on a prop holds the foot, 10 degrees with no plant.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Slip, loose, floor, skate and unloaded readings on supports and in water.
 * @evidence contracts/development/testing.md#independent-expectations The deck's travel, the feet's extra 0.1 m, the 1 m depth, the 1 m/s sweep and the 10 degree overshoot are written into the motion in closed form.
 * @evidence contracts/development/testing.md#distinguishing-cases Each reading is paired with its control: the same motion without the support's frame, without a floor reader, or without a plant.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public audits directly on hand-made motions in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, its expected value and its control.
 */
export function test_motion_audit_moving_support(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance = motionHumanStance(body);
  const onDeck: IAutoMovieMotionHumanContactWindow.Support = {
    kind: "prop",
    subject: "deck",
  };
  const along =
    (speed: number) =>
    (_bone: unknown, seconds: number): IAutoMovieVector3 => ({
      x: 0,
      y: 0,
      z: speed * seconds,
    });
  const carried = (speed: number): IAutoMovieMotionHumanAuditMotion => ({
    ...motionAuditMoved(stance, 1, along(speed), spans(onDeck)),
    support: (
      _support: IAutoMovieMotionHumanContactWindow.Support,
      seconds: number,
    ): IAutoMovieRigidTransform => deck(seconds),
  });

  // 1. Carried by the deck.
  TestValidator.predicate(
    "a foot carried by its deck does not slip",
    AutoMovieMotionHumanAuditGround.slip(carried(1), "a", body).value < 1e-9,
  );
  TestValidator.predicate(
    "a foot carried by its deck is not loose",
    AutoMovieMotionHumanAuditContact.measure(carried(1), "a", body).loose
      .value < 1e-9,
  );
  TestValidator.predicate(
    "read in the world, the deck's travel is a slip",
    nclose(
      AutoMovieMotionHumanAuditGround.slip(
        motionAuditMoved(stance, 1, along(1), spans(onDeck)),
        "a",
        body,
      ).value,
      1,
      1e-9,
    ),
  );

  // 2. Slipping on the deck.
  TestValidator.predicate(
    "a foot sliding on its deck slips by its travel on the deck",
    nclose(
      AutoMovieMotionHumanAuditGround.slip(carried(1.1), "a", body).value,
      0.1,
      1e-9,
    ),
  );
  TestValidator.predicate(
    "a foot sliding on its deck is loose at its speed on the deck",
    nclose(
      AutoMovieMotionHumanAuditContact.measure(carried(1.1), "a", body).loose
        .value,
      0.1,
      1e-9,
    ),
  );

  // 3. Under the water.
  const lowered = (by: number) => (): IAutoMovieVector3 => ({
    x: 0,
    y: by,
    z: 0,
  });
  const sunk = motionAuditMoved(stance, 1, lowered(-1), spans(null));
  const water = (): boolean => true;
  TestValidator.predicate(
    "no floor finding inside the water",
    AutoMovieMotionHumanAuditGround.floor({ ...sunk, water }, "a", body)
      .value === 0,
  );
  TestValidator.predicate(
    "the depth against a floor",
    AutoMovieMotionHumanAuditGround.floor(sunk, "a", body).value > 0.9,
  );

  // 4. Sweeping at the surface.
  const sweep = motionAuditMoved(stance, 1, along(1), spans(null));
  TestValidator.predicate(
    "no skate in the water",
    AutoMovieMotionHumanAuditContact.measure({ ...sweep, water }, "a", body)
      .skate.value === 0,
  );
  TestValidator.predicate(
    "a skate on a floor",
    nclose(
      AutoMovieMotionHumanAuditContact.measure(sweep, "a", body).skate.value,
      1,
      1e-9,
    ),
  );

  // 5. A raised bank, a slope and a ford.
  const plane = (by: number): number =>
    AutoMovieMotionHumanAuditGround.floor(
      motionAuditMoved(stance, 1, lowered(by), spans({ kind: "ground" })),
      "a",
      body,
    ).value;
  const level: number = plane(0);
  const bank = (by: number): number =>
    AutoMovieMotionHumanAuditGround.floor(
      motionAuditMoved(
        stance,
        1,
        lowered(by),
        spans({ kind: "ground", height: 0.3 }),
      ),
      "a",
      body,
    ).value;
  TestValidator.predicate(
    "standing on a raised bank reads as standing on the ground",
    nclose(bank(0.3), level, 1e-9),
  );
  TestValidator.predicate(
    "sinking 0.1 m into a raised bank reads as sinking 0.1 m into the floor",
    bank(0.2) > 0.05 && nclose(bank(0.2), plane(-0.1), 1e-9),
  );
  const slope = motionAuditMoved(stance, 1, lowered(0), [
    {
      name: "climb",
      start: 0,
      entryTime: 0,
      end: 1,
      plan: {
        duration: 1,
        contacts: [
          {
            part: "leftFoot",
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground" },
          },
          {
            part: "rightFoot",
            kind: "plant",
            from: 0,
            to: 1,
            support: { kind: "ground", height: 0.2 },
          },
        ],
      },
    },
  ]);
  TestValidator.predicate(
    "on a slope the lower foot's ground is the floor",
    nclose(
      AutoMovieMotionHumanAuditGround.floor(slope, "a", body).value,
      level,
      1e-9,
    ),
  );
  const ford = (borne: boolean): number =>
    AutoMovieMotionHumanAuditGround.floor(
      motionAuditMoved(stance, 1, lowered(-0.6), [
        {
          name: "ride",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: {
            duration: 1,
            contacts: borne
              ? [
                  {
                    part: "seat",
                    kind: "seat",
                    from: 0,
                    to: 1,
                    support: { kind: "prop", subject: "horse" },
                  },
                ]
              : [],
          },
        },
      ]),
      "a",
      body,
    ).value;
  TestValidator.predicate(
    "a rider borne by a wading horse has no floor under the stirrups",
    ford(true) === 0,
  );
  TestValidator.predicate(
    "the same body with nothing bearing it is under the floor",
    ford(false) > 0.5,
  );
  // 6. A loaded ankle on a prop.
  const posed: IAutoMovieMotionHumanAuditRange.IPosed = {
    duration: 1,
    pose: () => ({
      skeleton: "human",
      root: null,
      joints: [
        {
          bone: "rightFoot",
          flexion: ANKLE_DORSIFLEXION.unloaded + 10,
          abduction: null,
          twist: null,
        },
      ],
    }),
  };
  TestValidator.predicate(
    "a plant on a prop bears the foot",
    AutoMovieMotionHumanAuditRange.unloaded(
      motionAuditMoved(stance, 1, along(0), spans(onDeck)),
      posed,
      "a",
    ).overshoot.value === 0,
  );
  TestValidator.predicate(
    "with no plant the foot bears nothing",
    nclose(
      AutoMovieMotionHumanAuditRange.unloaded(
        motionAuditMoved(stance, 1, along(0), spans(null)),
        posed,
        "a",
      ).overshoot.value,
      10,
      1e-9,
    ),
  );
}
