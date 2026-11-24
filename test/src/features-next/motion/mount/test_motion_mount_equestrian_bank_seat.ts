import { createHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** Seconds the horse stands: the whole take. */
const WAIT: number = 12;

/** A bank's face, degrees nose up: the horse pitched down it or up it from the start. */
const BANK: number = 20;

/** How far the trunk's inclination in space may differ from the level horse's, degrees (provisional: the response's joints stop at their ranges). */
const SPACE: number = 5;

/**
 * The bank seats (#3946): a rider on a horse pitched down a bank's face takes the descent seat, and on one pitched up it the ascent seat.
 *
 * Scenarios:
 * 1. In each seat, held, the trunk's forward inclination in space (the hips to the neck against the vertical, along the level forward) lies within 5 degrees of the same seat's on a level horse, though the horse is pitched 20 degrees from before the performance began: the trunk keeps its inclination in space against the carrier's own attitude, not against its change since the start.
 * 2. On the level the descent's trunk is upright within 10 degrees, and the ascent's inclines forward by more than 20 degrees.
 * 4. A descent entered from a two-point seat, the trunk leant forward over the withers, sits upright in space on the bank within 10 degrees: the seat sets its own trunk, not the entry's.
 * 3. On the bank the descent's hips, in the saddle's frame, lie within 30 mm of their height on the level (the seat kept), and the ascent's stand higher than the descent's on the level (the seat clear); the ascent's left wrist is within 0.7 hand lengths of the mane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both seats, each scenario and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law's bank seats on an actual polygon man on an actual horse turned onto a bank's face and reads the displayed hips, neck, seat region and wrist; a trunk carried with the pitched saddle, a seat left on the saddle in the ascent or a hand off the mane fails.
 * @evidence contracts/development/testing.md#independent-expectations The level horse's own take is the reference; the vertical is the world's.
 * @evidence contracts/development/testing.md#distinguishing-cases Descent against ascent, pitched against level.
 * @evidence contracts/development/testing.md#execution-ownership In-memory films of one polygon man on one archetype horse.
 */
export function test_motion_mount_equestrian_bank_seat(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const feet: IAutoMovieMotionHumanMounted.ISupports = {
    leftFoot: "leftStirrup",
    rightFoot: "rightStirrup",
  };
  const figures: Record<Bank, IAutoMovieMotionHumanMounted.IFigure[]> = {
    descent: [
      {
        seat: "descent",
        transfer: 0.8,
        hold: 1.5,
        supports: { ...feet, leftHand: "leftRein", rightHand: "rightRein" },
      },
    ],
    ascent: [
      {
        seat: "ascent",
        transfer: 0.8,
        hold: 1.5,
        supports: { ...feet, leftHand: "mane", rightHand: "rightRein" },
      },
      {
        seat: "entered",
        transfer: 0.8,
        hold: 0.2,
        supports: { ...feet, leftHand: "mane", rightHand: "rightRein" },
      },
    ],
  };
  // The seat held: half a second after the first figure arrives.
  const take = (
    seat: Bank,
    grade: number,
    list: IAutoMovieMotionHumanMounted.IFigure[] = figures[seat],
    arrival: string = `${seat}:0`,
  ): ITake => {
    const scene: mountedHorseScene.IScene = mountedHorseScene.build({
      horse,
      body,
      gait: "walk",
      wait: WAIT,
      grade,
      from: { x: 0.6, y: 0, z: -0.2 },
      acts: (seated) =>
        seated
          .registered("ride", {
            on: "horse",
            duration: 0.6,
            seat: "seat",
            feet: { left: "leftStirrup", right: "rightStirrup" },
            hands: { left: "leftRein", right: "rightRein" },
          })
          .registered("mounted", {
            on: "horse",
            frame: "seat",
            figures: list,
          }),
    });
    assertTakeClean(`the ${seat} seat on a ${grade}-degree grade`, scene.film);
    const act: IAutoMovieMotionHumanSegment =
      scene.segments[scene.segments.length - 1]!;
    const arrived: number =
      act.start +
      act.plan.events.find((e) => e.name === arrival)!.share *
        (act.end - act.start);
    return { scene, at: arrived + 0.5 };
  };
  const inclination = (scene: mountedHorseScene.IScene, at: number): number => {
    const bones: ReturnType<mountedHorseScene.IScene["film"]["bones"]> =
      scene.film.bones("rider", at);
    const trunk: IAutoMovieVector3 = Vector3.subtract(
      bones.get("neck")!.worldPosition,
      bones.get("hips")!.worldPosition,
    );
    const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
      scene.part("seat", at).rotation,
      { x: 0, y: 0, z: 1 },
    );
    const level: IAutoMovieVector3 = Vector3.normalize({ ...ahead, y: 0 });
    return (Math.atan2(Vector3.dot(trunk, level), trunk.y) * 180) / Math.PI;
  };
  for (const [seat, grade] of [
    ["descent", -BANK],
    ["ascent", BANK],
  ] as const) {
    const flat: ITake = take(seat, 0);
    const banked: ITake = take(seat, grade);
    const level: number = inclination(flat.scene, flat.at);
    const pitched: number = inclination(banked.scene, banked.at);

    // 1. The inclination in space.
    if (Math.abs(pitched - level) > SPACE)
      findings.push(
        `${seat}: the trunk inclines ${pitched.toFixed(1)} degrees in space on the bank against ${level.toFixed(1)} on the level`,
      );

    // 2. Upright down, forward up.
    if (seat === "descent" && Math.abs(level) > 10)
      findings.push(
        `descent: the trunk inclines ${level.toFixed(1)} degrees on the level`,
      );
    if (seat === "ascent" && !(level > 20))
      findings.push(
        `ascent: the trunk inclines only ${level.toFixed(1)} degrees forward on the level`,
      );

    // 3. The seat and the mane.
    const socket: number = mountedHorseScene.local(
      banked.scene.part("seat", banked.at),
      mountedHorseScene.joint(banked.scene, "hips", banked.at),
    ).y;
    const sat: number = mountedHorseScene.local(
      flat.scene.part("seat", flat.at),
      mountedHorseScene.joint(flat.scene, "hips", flat.at),
    ).y;
    if (seat === "descent" && Math.abs(socket - sat) > 0.03)
      findings.push(
        `descent: the hips stand ${(socket - sat).toFixed(3)} m off their level seat`,
      );
    if (seat === "ascent") {
      const seated: ITake = take("descent", 0);
      const down: number = mountedHorseScene.local(
        seated.scene.part("seat", seated.at),
        mountedHorseScene.joint(seated.scene, "hips", seated.at),
      ).y;
      if (!(socket > down))
        findings.push("ascent: the seat does not clear the saddle");
      const mane: number = Vector3.distance(
        mountedHorseScene.joint(banked.scene, "leftHand", banked.at),
        banked.scene.part("mane", banked.at).translation,
      );
      if (mane > 0.7 * body.measure.hand)
        findings.push(
          `ascent: the left wrist is ${mane.toFixed(3)} m from the mane`,
        );
    }
  }
  // 4. A descent entered leaning forward.
  const forward: ITake = take(
    "descent",
    -BANK,
    [
      {
        seat: "twoPoint",
        transfer: 0.8,
        hold: 0.5,
        supports: { ...feet, leftHand: "leftRein", rightHand: "rightRein" },
      },
      ...figures.descent,
    ],
    "descent:1",
  );
  const after: number = inclination(forward.scene, forward.at);
  if (Math.abs(after) > 10)
    findings.push(
      `descent after a two-point seat: the trunk inclines ${after.toFixed(1)} degrees in space`,
    );
  TestValidator.equals("the bank seats", findings, []);
}

/** A bank seat. */
type Bank = "descent" | "ascent";

/** A take and the second its seat is read at. */
interface ITake {
  /** The scene. */
  scene: mountedHorseScene.IScene;

  /** Film seconds: half a second after the first figure arrives. */
  at: number;
}
