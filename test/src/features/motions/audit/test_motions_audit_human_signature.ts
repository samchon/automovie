import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanSignature } from "@automovie/motions";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { TestValidator } from "@nestia/e2e";

import { auditStanceMotion } from "../../internal/auditStanceMotion";
import { humanFixture } from "../../internal/fixtures/humanFixture";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { resolvedBones } from "../../internal/resolvedBones";
import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/** Rounding of a few trigonometric readings, degrees, metres, seconds. */
const ROUNDING: number = 1e-9;

/**
 * The share of stature the standing centre of mass lies at: 0.53 to 0.59, about
 * the 55 to 57 % Winter reports for adults (Winter 2009, Biomechanics and Motor
 * Control of Human Movement, 4th ed., table 4.1), widened for the fixture's
 * proportions.
 */
const HEIGHT: readonly [number, number] = [0.53, 0.59];

/**
 * `AutoMovieMotionHumanSignature` reads the kinematic signature of a performer
 * off displayed bones, each reading a contract of its own:
 *
 * 1. The reader exposes the subject, body and heading, and `bones` reads the hips
 *    from the stored stance.
 * 2. `joint` reads a bone's position and refuses a missing one.
 * 3. `forward` lays a heading on the floor, `(sin yaw, 0, cos yaw)`.
 * 4. `trunk` reads the hip-to-shoulder line's inclination along the heading
 *    (Kendall et al. 2005): 0 upright, 30 with the shoulders `0.5 tan 30`
 *    ahead, -30 read from behind, 0 sideways.
 * 5. `flexion` reads the angle a distal segment turns from its proximal one: 0,
 *    90, 45 and 180; `knee`, `hip` and `elbow` read it at their joints: a 45
 *    degree knee, a 90 degree hip, a 120 degree elbow, straight limbs 0.
 * 6. `head` reads the pitch of the head's +Z below the horizon: 20 and -15 about
 *    +X, 0 about the vertical; a motion without a head is refused.
 * 7. `speed` reads a joint's peak speed by central differences at 240 Hz: 1.5 m/s
 *    steady, the end speed of `0.5 t^2` within the spacing, 0 still.
 * 8. `times` lists `from + k / rate`, the 30 Hz instants equal to the 120 Hz
 *    series' every fourth bit for bit; `mean` averages a reading.
 * 9. `region` places a region rigidly on its surface frame's displayed bone and
 *    refuses a missing bone.
 * 10. On the average man's quiet stance: `centre` lies within Winter's share of the
 *     stature over the midline and moves with the body; `sole` is the lowest
 *     socket; `bears` holds still on the floor, not raised 0.05 m but again on
 *     a 0.05 m floor, not sliding at 1 m/s; `apart` is positive 2 m apart and
 *     negative in one place; `gait` reads strikes, a 120 steps a minute cadence
 *     and a 271 / 482 duty from feet lifted in turn.
 *
 * The body is built whole (`humanFixtureBody`) only for the readings that read
 * it (10); the others take typed minimal readers.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names measured joint, inclination, flexion, pitch, speed, region, support and gait outcomes together with the sampled grid and reader.
 * @evidence contracts/development/testing.md#behavioral-verification Queries HumanSignature on analytic posed-bone motions and on stored-body stance and alternating foot lifts, checking geometric reads, range bounds and refusals.
 * @evidence contracts/development/testing.md#independent-expectations Explicit axes and rotations determine distances and angles. The parabola has derivative t, so the peak over one second is bounded by one sample spacing. Half-second strike spacing gives 120 steps per minute, with prescribed strikes and duty from the fixture's lifted feet.
 */
export async function test_motions_audit_human_signature(): Promise<void> {
  const reader = (
    points: readonly (readonly [AutoMovieHumanoidBone, IAutoMovieVector3])[],
    yaw: number = 0,
  ): AutoMovieMotionHumanSignature.IHeading => ({
    motion: { duration: 1, bones: () => resolvedBones(points) },
    subject: "a",
    yaw,
  });

  // 2. Joints.
  const rising: AutoMovieMotionHumanSignature.IBones = {
    motion: {
      duration: 1,
      bones: (_subject: string, t: number) =>
        resolvedBones([["head", { x: 0, y: 1.5 + 0.1 * t, z: 0 }]]),
    },
    subject: "a",
  };
  TestValidator.predicate(
    "the joint",
    vclose(
      AutoMovieMotionHumanSignature.joint(rising, 0.5, "head"),
      { x: 0, y: 1.55, z: 0 },
      ROUNDING,
    ) &&
      throwsError(() =>
        AutoMovieMotionHumanSignature.joint(rising, 0.5, "leftHand"),
      ),
  );

  // 3. Forward.
  TestValidator.predicate(
    "the headings",
    vclose(
      AutoMovieMotionHumanSignature.forward(0),
      { x: 0, y: 0, z: 1 },
      ROUNDING,
    ) &&
      vclose(
        AutoMovieMotionHumanSignature.forward(90),
        { x: 1, y: 0, z: 0 },
        ROUNDING,
      ) &&
      vclose(
        AutoMovieMotionHumanSignature.forward(180),
        { x: 0, y: 0, z: -1 },
        ROUNDING,
      ),
  );

  // 4. Trunk.
  const lean = (ahead: number, yaw: number): number =>
    AutoMovieMotionHumanSignature.trunk(
      reader(
        [
          ["leftUpperLeg", { x: 0, y: 1, z: 0.1 }],
          ["rightUpperLeg", { x: 0, y: 1, z: -0.1 }],
          ["leftUpperArm", { x: ahead, y: 1.5, z: 0.15 }],
          ["rightUpperArm", { x: ahead, y: 1.5, z: -0.15 }],
        ],
        yaw,
      ),
      0,
    );
  const ahead: number = 0.5 * Math.tan(Math.PI / 6);
  TestValidator.predicate(
    "the inclinations",
    nclose(lean(0, 90), 0, ROUNDING) &&
      nclose(lean(ahead, 90), 30, ROUNDING) &&
      nclose(lean(ahead, 270), -30, ROUNDING) &&
      nclose(lean(ahead, 0), 0, ROUNDING),
  );

  // 5. Flexions.
  const proximal = { x: 0, y: 1, z: 0 };
  const centre = { x: 0, y: 0.5, z: 0 };
  const limbs = reader([
    ["neck", { x: 0, y: 1.5, z: 0 }],
    ["leftUpperLeg", { x: 0.1, y: 1, z: 0 }],
    ["leftLowerLeg", { x: 0.1, y: 0.5, z: 0 }],
    ["leftFoot", { x: 0.1, y: 0, z: -0.5 }],
    ["rightUpperLeg", { x: 0, y: 1, z: 0 }],
    ["rightLowerLeg", { x: 0, y: 1, z: 0.45 }],
    ["rightFoot", { x: 0, y: 1, z: 0.9 }],
    ["rightUpperArm", { x: -0.2, y: 1.4, z: 0 }],
    ["rightLowerArm", { x: -0.2, y: 1.1, z: 0 }],
    [
      "rightHand",
      {
        x: -0.2,
        y: 1.1 + 0.25 * Math.cos(Math.PI / 3),
        z: 0.25 * Math.sin(Math.PI / 3),
      },
    ],
  ]);
  TestValidator.predicate(
    "the flexions",
    nclose(
      AutoMovieMotionHumanSignature.flexion(proximal, centre, {
        x: 0,
        y: 0,
        z: 0,
      }),
      0,
      ROUNDING,
    ) &&
      nclose(
        AutoMovieMotionHumanSignature.flexion(proximal, centre, {
          x: 0,
          y: 0.5,
          z: 0.3,
        }),
        90,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.flexion(proximal, centre, {
          x: 0,
          y: 0,
          z: 0.5,
        }),
        45,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.flexion(proximal, centre, {
          x: 0,
          y: 1.2,
          z: 0,
        }),
        180,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.knee(limbs, 0, "left"),
        45,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.knee(limbs, 0, "right"),
        0,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.hip(limbs, 0, "right"),
        90,
        ROUNDING,
      ) &&
      nclose(
        AutoMovieMotionHumanSignature.elbow(limbs, 0, "right"),
        120,
        ROUNDING,
      ),
  );

  // 6. Head.
  const pitch = (axis: "x" | "y", degrees: number): number =>
    AutoMovieMotionHumanSignature.head(
      {
        motion: {
          duration: 1,
          bones: () =>
            resolvedBones(
              [["head", { x: 0, y: 1.6, z: 0 }]],
              AutoMovieEngineQuaternion.fromAxisAngle(
                { x: axis === "x" ? 1 : 0, y: axis === "y" ? 1 : 0, z: 0 },
                degrees,
              ),
            ),
        },
        subject: "a",
      },
      0,
    );
  TestValidator.predicate(
    "the pitches",
    nclose(pitch("x", 20), 20, ROUNDING) &&
      nclose(pitch("x", -15), -15, ROUNDING) &&
      nclose(pitch("y", 90), 0, ROUNDING) &&
      throwsError(() => AutoMovieMotionHumanSignature.head(reader([]), 0)),
  );

  // 7. Speed.
  const peak = (
    path: (t: number) => IAutoMovieVector3,
    from: number,
    to: number,
  ): number =>
    AutoMovieMotionHumanSignature.speed(
      {
        motion: {
          duration: 2,
          bones: (_subject: string, t: number) =>
            resolvedBones([["leftHand", path(t)]]),
        },
        subject: "a",
      },
      "leftHand",
      from,
      to,
    );
  const accelerating: number = peak(
    (t: number) => ({ x: 0, y: 0.5 * t * t, z: 0 }),
    0.5,
    1,
  );
  TestValidator.predicate(
    "the speeds",
    nclose(
      peak((t: number) => ({ x: 1.5 * t, y: 1, z: 0 }), 0, 2),
      1.5,
      ROUNDING,
    ) &&
      accelerating <= 1 + ROUNDING &&
      accelerating >= 1 - 1 / 240 &&
      peak(() => ({ x: 0, y: 1, z: 0 }), 0, 2) === 0,
  );

  // 8. Times and means.
  const coarse: number[] = AutoMovieMotionHumanSignature.times(0, 0.1, 30);
  const fine: number[] = AutoMovieMotionHumanSignature.times(0, 0.1, 120);
  TestValidator.predicate(
    "the series",
    coarse.length === 4 &&
      coarse.every((t: number, k: number): boolean => fine[4 * k] === t) &&
      AutoMovieMotionHumanSignature.times(1, 0, 30).length === 0 &&
      AutoMovieMotionHumanSignature.times(0, 1).length === 61 &&
      AutoMovieMotionHumanSignature.mean(
        [1, 2, 3],
        (t: number): number => 2 * t,
      ) === 4,
  );

  // 9. Regions.
  const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces = (
    await humanFixture("m-average")
  ).surfaces;
  const regionBone = surfaces.regions.sternum.bone;
  const placed = (position: IAutoMovieVector3, turned: boolean) =>
    AutoMovieMotionHumanSignature.region(
      {
        motion: {
          duration: 1,
          bones: () =>
            resolvedBones(
              [[regionBone, position]],
              turned ? { x: 0, y: 1, z: 0, w: 0 } : { x: 0, y: 0, z: 0, w: 1 },
            ),
        },
        subject: "a",
        body: { surfaces },
      },
      "sternum",
      0,
    );
  const here: IAutoMovieVector3 = placed({ x: 0, y: 1.4, z: 0 }, false);
  TestValidator.predicate(
    "the region",
    vclose(
      placed({ x: 1, y: 1.4, z: 0 }, false),
      { ...here, x: here.x + 1 },
      ROUNDING,
    ) &&
      vclose(
        placed({ x: 0, y: 1.4, z: 0 }, true),
        { x: -here.x, y: here.y, z: -here.z },
        ROUNDING,
      ) &&
      throwsError(() =>
        AutoMovieMotionHumanSignature.region(
          {
            motion: { duration: 1, bones: () => resolvedBones([]) },
            subject: "a",
            body: { surfaces },
          },
          "sternum",
          0,
        ),
      ),
  );

  // 1 and 10. On the quiet stance.
  // Reads the whole-body centre of mass, the sole sockets and every collider.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shifted = (x: (t: number) => number, y: number = 0) =>
    auditStanceMotion(body, { shift: (t: number) => ({ x: x(t), y, z: 0 }) });
  const signature = (
    motion: IAutoMovieMotionHumanSignature.IMotion,
  ): IAutoMovieMotionHumanSignature.IReader =>
    AutoMovieMotionHumanSignature.read(motion, "a", body, 0);
  const still: IAutoMovieMotionHumanSignature.IReader = signature(
    shifted(() => 0),
  );
  TestValidator.predicate(
    "the reader",
    still.subject === "a" &&
      still.body === body &&
      still.yaw === 0 &&
      AutoMovieMotionHumanSignature.bones(still, 0).has("hips"),
  );
  const mass: IAutoMovieVector3 = AutoMovieMotionHumanSignature.centre(
    still,
    0,
  );
  TestValidator.predicate(
    "the centre",
    mass.y >= HEIGHT[0] * body.measure.stature &&
      mass.y <= HEIGHT[1] * body.measure.stature &&
      Math.abs(mass.x) <= 0.01 &&
      nclose(
        AutoMovieMotionHumanSignature.centre(signature(shifted(() => 1)), 0).x -
          mass.x,
        1,
        ROUNDING,
      ),
  );
  const sockets: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    AutoMovieMotionHumanSignature.bones(still, 0),
    "left",
  );
  const sole: IAutoMovieVector3 = AutoMovieMotionHumanSignature.sole(
    still,
    0,
    "left",
  );
  TestValidator.predicate(
    "the sole",
    sockets.every(
      (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.point.y >= sole.y,
    ),
  );
  const bears = (
    motion: IAutoMovieMotionHumanSignature.IMotion,
    floor: number,
  ) =>
    AutoMovieMotionHumanSignature.bears(signature(motion), 0.5, "left", floor);
  TestValidator.equals(
    "the bearing",
    [
      bears(
        shifted(() => 0),
        0,
      ),
      bears(
        shifted(() => 0, 0.05),
        0,
      ),
      bears(
        shifted(() => 0, 0.05),
        0.05,
      ),
      bears(
        shifted((t: number) => t),
        0,
      ),
    ],
    [true, false, true, false],
  );
  const pair = (x: number): IAutoMovieMotionHumanSignature.IMotion => {
    const moved = shifted(() => x);
    return {
      duration: 1,
      bones: (subject: string, t: number) =>
        subject === "a" ? still.motion.bones("a", t) : moved.bones("a", t),
    };
  };
  const apart = (x: number): number =>
    AutoMovieMotionHumanSignature.apart(
      AutoMovieMotionHumanSignature.read(pair(x), "a", body, 0),
      AutoMovieMotionHumanSignature.read(pair(x), "b", body, 0),
      0,
    );
  const far: number = apart(2);
  TestValidator.predicate("apart", far > 0 && far < 2 && apart(0) < 0);
  const stance = auditStanceMotion(body, { duration: 2 });
  const lifted = (side: "left" | "right", t: number): boolean =>
    side === "left"
      ? (t >= 0.25 && t < 0.75) || (t >= 1.25 && t < 1.75)
      : (t >= 0.75 && t < 1.25) || t >= 1.75;
  const walking: IAutoMovieMotionHumanSignature.IReader = signature({
    duration: 2,
    bones: (subject: string, t: number) =>
      new Map(
        [...stance.bones(subject, t)].map(
          ([name, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
            AutoMovieHumanoidBone,
            IAutoMovieResolvedBone,
          ] => {
            const side: "left" | "right" | null = name.startsWith("left")
              ? "left"
              : name.startsWith("right")
                ? "right"
                : null;
            return [
              name,
              side !== null && /(Foot|Toes)$/.test(name) && lifted(side, t)
                ? {
                    ...bone,
                    worldPosition: {
                      ...bone.worldPosition,
                      y: bone.worldPosition.y + 0.1,
                    },
                  }
                : bone,
            ];
          },
        ),
      ),
  });
  const gait: IAutoMovieMotionHumanSignature.IGait =
    AutoMovieMotionHumanSignature.gait(walking, 0, 2);
  TestValidator.predicate(
    "the gait",
    JSON.stringify(gait.strikes) ===
      JSON.stringify([
        { seconds: 0.75, side: "left" },
        { seconds: 1.25, side: "right" },
        { seconds: 1.75, side: "left" },
      ]) &&
      nclose(gait.cadence, 120, ROUNDING) &&
      nclose(gait.duty, 271 / 482, 1e-12),
  );
}
