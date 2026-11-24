import {
  createBall,
  createBaseballBat,
  createFieldHockeyStick,
  createGolfClub,
  createRacket,
  createShuttlecock,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanStand,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  AutoMovieMotionHumanSwing,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { AutoMovieMotionHumanHeld } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionGraspedHandle } from "../../internal/motionGraspedHandle";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The precision rows this spec plays. */
type Row =
  | "tableTennisForehand"
  | "squashDrive"
  | "padelForehand"
  | "badmintonClear"
  | "fieldHockeyHit"
  | "golfChip"
  | "golfDrive"
  | "baseballHit";

/** An implement or ball model the takes use. */
type Model = ReturnType<
  | typeof createRacket
  | typeof createGolfClub
  | typeof createFieldHockeyStick
  | typeof createBaseballBat
  | typeof createBall
  | typeof createShuttlecock
>;

/**
 * One stroke to play: its row, its implement and working point, its ball and
 * the ball's height.
 */
interface IStroke {
  /** The row. */
  row: Row;

  /** The held implement. */
  tool: Model;

  /** The implement's working affordance. */
  point: string;

  /** The ball or shuttle. */
  ball: Model;

  /**
   * The ball centre's height above the floor at impact, metres; resting on the
   * floor when it equals the radius.
   */
  height: number;

  /** Whether the stroke swings and misses. */
  miss?: true;
}

/**
 * Each court, field and stick stroke is played from its family's address at a
 * waiting ball: the striker stands where `PrecisionStrokeForms.address` puts
 * them for the ball, holds the implement in the striking hand, and the stroke
 * meets the ball and launches it once, or, as a swinging miss, passes under it
 * and launches nothing.
 *
 * Scenarios:
 *
 * 1. Table tennis forehand, squash drive, padel forehand and badminton clear,
 *    one-handed through the racket face, each launch the ball once.
 * 2. A field hockey hit, a golf chip and a golf drive, two-handed, each launch the
 *    ball once from the ground or the tee.
 * 3. A baseball swing with `miss` launches nothing and the ball stays where it
 *    waited.
 * 4. Every take passes the shipped verdicts, for both bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging from the family's address, each row's implement and the outcome each asserts.
 * @evidence contracts/development/testing.md#behavioral-verification Runs each row through HumanPerformance from the address and reads the ball's play and the shipped verdicts.
 * @evidence contracts/development/testing.md#independent-expectations The launch count and the waiting ball's place follow from the rows' contract: one launch at contact, none on a miss.
 * @evidence contracts/development/testing.md#distinguishing-cases The same bat swing launches or not by `miss`; one- and two-handed grips and two bodies are each played.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of one polygon man, one implement and one ball each.
 */
export function test_motion_swing_court_strokes(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const strokes: readonly IStroke[] = [
    {
      row: "tableTennisForehand",
      tool: createRacket({ kind: "tableTennis" }),
      point: "face",
      ball: createBall({ kind: "tableTennis" }),
      height: 0.95,
    },
    {
      row: "squashDrive",
      tool: createRacket({ kind: "squash" }),
      point: "face",
      ball: createBall({ kind: "squash" }),
      height: 0.6,
    },
    {
      row: "padelForehand",
      tool: createRacket({ kind: "padel" }),
      point: "face",
      ball: createBall({ kind: "padel" }),
      height: 0.9,
    },
    {
      row: "badmintonClear",
      tool: createRacket({ kind: "badminton" }),
      point: "face",
      ball: createShuttlecock(),
      height: 2.3,
    },
    {
      row: "fieldHockeyHit",
      tool: createFieldHockeyStick(),
      point: "blade",
      ball: createBall({ kind: "fieldHockey" }),
      height: 0,
    },
    {
      row: "golfChip",
      tool: createGolfClub({ kind: "iron" }),
      point: "face",
      ball: createBall({ kind: "golf" }),
      height: 0,
    },
    {
      row: "golfDrive",
      tool: createGolfClub({ kind: "driver" }),
      point: "face",
      ball: createBall({ kind: "golf" }),
      height: 0.03,
    },
    {
      row: "baseballHit",
      tool: createBaseballBat(),
      point: "strike",
      ball: createBall({ kind: "baseball" }),
      height: 0.9,
      miss: true,
    },
  ];
  for (const kind of ["m-average", "f-small"] as const) {
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(kind);
      for (const stroke of strokes) {
        const centre: IAutoMovieVector3 =
          stroke.ball.affordance("grip").frame.translation;
        const radius: number = stroke.ball.affordance("grip").aperture! / 2;
        const ball: IAutoMovieVector3 = {
          x: 0,
          y: radius + stroke.height,
          z: 0,
        };
        const toward: IAutoMovieVector3 = { x: 0, y: 0, z: 10 };
        // The implement is held by its grip as a hand grasps a handle, the
        // shaft across the palm (`motionGraspedHandle`); the address reads it
        // in the hand as the hold will keep it.
        const inHand: IAutoMovieRigidTransform = motionGraspedHandle(
          body,
          "right",
          stroke.tool.affordance("grip").frame,
          stroke.tool.affordances!.find(
            (a: IAutoMovieAffordance): boolean => a.id === stroke.point,
          )!.frame.translation,
        );
        const held = (
          bones: ReturnType<HumanPerformance["bones"]>,
        ): IAutoMovieRigidTransform => {
          const wrist: IAutoMovieResolvedBone = bones.get("rightHand")!;
          return {
            position: Vector3.add(
              wrist.worldPosition,
              Quaternion.rotateVector(wrist.worldRotation, inHand.position),
            ),
            rotation: Quaternion.multiply(wrist.worldRotation, inHand.rotation),
          };
        };
        const quiet: ReturnType<HumanPerformance["bones"]> =
          new HumanPerformance({
            seed: `${stroke.row}-quiet`,
            performers: [
              {
                subject: "striker",
                body,
                at: { x: 0, y: 0, z: 0 },
                yaw: 0,
                proficiency: { level: "trained" },
              },
            ],
            composition: HumanChain.subject("striker").stand({
              hold: 0.2,
              sway: 0,
            }).node,
          }).bones("striker", 0);
        const at: IAutoMovieVector3 =
          AutoMovieMotionHumanSwing.PrecisionStrokeForms.address({
            body,
            row: stroke.row,
            side: "right",
            yaw: 0,
            ball,
            radius,
            toward,
            held: AutoMovieMotionHumanHeld.grasped(
              body,
              "right",
              "tool",
              held(quiet),
              stroke.tool.affordances ?? [],
              {
                point: quiet.get("rightHand")!.worldPosition,
                rotation: quiet.get("rightHand")!.worldRotation,
              },
            ),
          });
        const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] =
          [
            {
              subject: "striker",
              body,
              at,
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ];
        const ready: HumanPerformance = new HumanPerformance({
          seed: `${stroke.row}-ready`,
          performers,
          composition: HumanChain.subject("striker").stand({
            hold: 0.2,
            sway: 0,
          }).node,
        });
        const hold: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
          {
            ...AutoMovieMotionHumanStance.stand,
            name: "strokeFixtureHold",
            plan: (
              context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
            ): IAutoMovieMotionHumanActionPlan => ({
              ...AutoMovieMotionHumanStance.stand.plan(context),
              holds: [{ side: "right", prop: "tool", from: 0 }],
            }),
          };
        const take: HumanPerformance = new HumanPerformance({
          seed: `${stroke.row}-${kind}`,
          laws: [
            hold,
            AutoMovieMotionHumanSwing.HumanPrecisionSport[stroke.row],
          ],
          performers,
          props: [
            HumanObject.prop(
              "tool",
              stroke.tool,
              held(ready.bones("striker", 0)),
            ),
            HumanObject.prop("ball", stroke.ball, {
              position: Vector3.subtract(ball, centre),
              rotation: Quaternion.identity(),
            }),
          ],
          composition: HumanChain.subject("striker")
            .registered(hold.name, { hold: 0.2, sway: 0 })
            .registered(stroke.row, {
              tool: "tool",
              ball: "ball",
              speed: 12,
              target: { kind: "point", frame: "world", at: toward },
              ...(stroke.miss === true ? { miss: true } : {}),
            })
            .stand({ hold: 0.5, sway: 0 }).node,
        });
        const play: IAutoMovieMotionHumanBallPlay = take.play("ball");
        const launches: number = play.events.filter(
          (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
            event.kind === "launch",
        ).length;
        checks.check(
          `${kind} ${stroke.row} ${stroke.miss === true ? "misses and launches nothing" : "launches the ball once"}`,
          launches === (stroke.miss === true ? 0 : 1),
        );
        if (stroke.miss === true)
          checks.check(
            `${kind} ${stroke.row} leaves the missed ball where it waited`,
            Vector3.length(
              Vector3.subtract(
                Vector3.add(take.prop("ball", take.duration).position, centre),
                ball,
              ),
            ) < 1e-6,
          );
        verdict(checks, `${kind} ${stroke.row}`, take);
      }
    } catch (error: unknown) {
      checks.check(`${String(kind)}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("swing court strokes");
}

/** Gather a take's shipped verdicts as one check. */
function verdict(
  checks: motionComplaints.IGatherer,
  label: string,
  film: HumanPerformance,
): void {
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(
      `${label}: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
}
