import { createBall, createClub, createGolfClub } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStand,
  IAutoMovieQuaternion,
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
import {
  AutoMovieMotionHumanHeld,
  HumanHand,
} from "@automovie/motions/internal";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionGraspedHandle } from "../../internal/motionGraspedHandle";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * Bound sport strokes touch the displayed ball before redirecting its actual
 * scene prop.
 *
 * Scenarios:
 *
 * 1. Contact the baseball with the barrel's sweet spot and send it forward from
 *    the live ball frame.
 * 2. Contact a raised greenside ball with the iron's face and carry it upward in
 *    the chip branch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the two mounted fixture poses, contact and subsequent flight observations.
 * @evidence contracts/development/testing.md#behavioral-verification Uses each registered action through the public performance constructor and reads displayed prop frames at contact and around flight onset.
 * @evidence contracts/development/testing.md#independent-expectations Derives contact from the model's own affordance frame transformed by the displayed tool, and subtracts the independent ball radius along the authored aim. Checks exact staged frame onset separately from positive outgoing movement.
 * @evidence contracts/development/testing.md#distinguishing-cases A high ball with a long bat checks near-horizontal reach. A low raised ball with the iron checks the separate short stroke and lifted departure.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory ready pose and two performances, each with its implement grasped by its handle and its player at the stroke's address. No external host or generated data.
 */
export function test_motion_swing_precision_contact(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const at: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
    { subject: "player", body, at, yaw: 0, proficiency: { level: "trained" } },
  ];
  const ready: HumanPerformance = new HumanPerformance({
    seed: "precision-ready",
    performers,
    composition: HumanChain.subject("player").stand({ hold: 0.2, sway: 0 })
      .node,
  });
  const hand: IAutoMovieVector3 = HumanHand.frame(
    body,
    ready.bones("player", 0),
    "right",
    "grip",
  ).point;
  const hold: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanStand.IParams> =
    {
      ...AutoMovieMotionHumanStance.stand,
      name: "precisionFixtureHold",
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
      ): IAutoMovieMotionHumanActionPlan => ({
        ...AutoMovieMotionHumanStance.stand.plan(context),
        holds: [{ side: "right", prop: "implement", from: 0 }],
      }),
    };
  const bat: ReturnType<typeof createClub> = createClub({ kind: "bat" });
  const iron: ReturnType<typeof createGolfClub> = createGolfClub({
    kind: "iron",
  });
  const baseball: ReturnType<typeof createBall> = createBall({
    kind: "baseball",
  });
  const golf: ReturnType<typeof createBall> = createBall({ kind: "golf" });
  const cases = [
    {
      row: AutoMovieMotionHumanSwing.HumanPrecisionSport.baseballHit,
      tool: bat,
      point: bat.affordance("strike"),
      ball: baseball,
      down: 4,
      height: 1.03,
      front: 0.28,
    },
    {
      row: AutoMovieMotionHumanSwing.HumanPrecisionSport.golfChip,
      tool: iron,
      point: iron.affordance("face"),
      ball: golf,
      down: 78,
      height: 0.21,
      front: 0.24,
    },
  ] as const;

  for (const fixture of cases) {
    try {
      const grip: IAutoMovieVector3 =
        fixture.tool.affordance("grip").frame.translation;
      // The bat barrel is above its grip in its model. The head of the iron is below its grip.
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 0, z: 1 },
        fixture.row.name === "baseballHit"
          ? -90 - fixture.down
          : 90 - fixture.down,
      );
      const working: IAutoMovieVector3 = Quaternion.rotateVector(
        rotation,
        Vector3.subtract(fixture.point.frame.translation, grip),
      );
      const gripBall: IAutoMovieAffordance = fixture.ball.affordance("grip");
      const radius: number = gripBall.aperture! / 2;
      const centre: IAutoMovieVector3 = {
        x: 0.6 * hand.x + working.x,
        y: fixture.height,
        z: fixture.front,
      };
      const ballAt: IAutoMovieRigidTransform = {
        position: Vector3.subtract(centre, gripBall.frame.translation),
        rotation: identity,
      };
      // The implement is held by its grip as a hand grasps a handle, its
      // working end out past the index finger (`motionGraspedHandle`), and the
      // player stands at the stroke's own address for the ball
      // (`PrecisionStrokeForms.address`), the implement carried there.
      const inHand: IAutoMovieRigidTransform = motionGraspedHandle(
        body,
        "right",
        fixture.tool.affordance("grip").frame,
        fixture.point.frame.translation,
      );
      const wrist: IAutoMovieResolvedBone = ready
        .bones("player", 0)
        .get("rightHand")!;
      const held: IAutoMovieRigidTransform = {
        position: Vector3.add(
          wrist.worldPosition,
          Quaternion.rotateVector(wrist.worldRotation, inHand.position),
        ),
        rotation: Quaternion.multiply(wrist.worldRotation, inHand.rotation),
      };
      const toward: IAutoMovieVector3 = { ...centre, z: centre.z + 3 };
      const stance: IAutoMovieVector3 =
        AutoMovieMotionHumanSwing.PrecisionStrokeForms.address({
          body,
          row: fixture.row.name,
          side: "right",
          yaw: 0,
          ball: centre,
          radius,
          toward,
          held: AutoMovieMotionHumanHeld.grasped(
            body,
            "right",
            "implement",
            held,
            fixture.tool.affordances ?? [],
            { point: wrist.worldPosition, rotation: wrist.worldRotation },
          ),
        });
      const implement: IAutoMovieRigidTransform = {
        position: Vector3.add(held.position, stance),
        rotation: held.rotation,
      };
      const impact: number = 0.56;
      const film: HumanPerformance = new HumanPerformance({
        seed: `precision-${fixture.row.name}`,
        laws: [hold, fixture.row],
        performers: [{ ...performers[0]!, at: stance }],
        props: [
          HumanObject.prop("implement", fixture.tool, implement),
          HumanObject.prop("ball", fixture.ball, ballAt),
        ],
        composition: HumanChain.subject("player")
          .registered(hold.name, { hold: 0.2, sway: 0 })
          .registered(fixture.row.name, {
            tool: "implement",
            ball: "ball",
            speed: 6,
            impact,
            target: { kind: "point", frame: "world", at: toward },
          }).node,
      });
      const action: IAutoMovieMotionHumanSegment = film.segments("player")[1]!;
      const strike: number = action.start + impact;
      const tool: IAutoMovieRigidTransform = film.prop("implement", strike);
      const actual: IAutoMovieVector3 = Vector3.add(
        tool.position,
        Quaternion.rotateVector(tool.rotation, fixture.point.frame.translation),
      );
      checks.check(
        `${fixture.row.name} face reaches the sphere within its contact allowance`,
        vclose(
          actual,
          { ...centre, z: centre.z - radius },
          Math.min(0.012, 0.2 * radius),
        ),
      );
      checks.check(
        `${fixture.row.name} publishes its only launch at the same instant`,
        film.flights("ball").length === 1 &&
          nclose(film.flights("ball")[0]!.launch, strike),
      );
      checks.check(
        `${fixture.row.name} preserves incoming ball position at strike`,
        vclose(film.prop("ball", strike - 1e-4).position, ballAt.position) &&
          vclose(film.prop("ball", strike).position, ballAt.position),
      );
      const departure: IAutoMovieVector3 = Vector3.subtract(
        film.prop("ball", strike + 0.015).position,
        ballAt.position,
      );
      checks.check(
        `${fixture.row.name} outgoing ball leaves forward and upward`,
        departure.z > 0.05 &&
          departure.y > 0.005 &&
          Math.abs(departure.x) < 1e-6,
      );
    } catch (error: unknown) {
      checks.check(
        `${String(fixture)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.assert("swing precision contact");
}
