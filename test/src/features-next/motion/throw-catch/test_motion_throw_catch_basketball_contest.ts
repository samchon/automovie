import { createBall, createBasketballHoop } from "@automovie/archetypes";
import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieComposition,
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import type { IBallStation } from "../../../features/internal/IBallStation";
import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { ballPossessions } from "../../../features/internal/ballPossessions";
import { ballStation } from "../../../features/internal/ballStation";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A defender contests a live set shot: the defender's hands meet the same
 * ball on its way up and deflect it, so it never reaches the ring.
 *
 * Scenarios:
 * 1. Without the defender, the shot drops through the ring.
 * 2. A defender stood on the shot's flight, 0.6 m in front of the shooter,
 *    deflects it at the instant it crosses the defender's plane. The play
 *    reads the shooter's hold and shot, then the defender's deflection
 *    launch of the same ball, which never passes the ring.
 * 3. Both players keep their feet planted across the touch and their hips
 *    apart through the play.
 *
 * FIBA 2.4 sets the ring's 450 mm inner diameter at 3.05 m; a basket needs
 * the whole ball through the ring. The deflection sends the ball back by
 * its own FIBA restitution. The 0.35 m hip clearance is two hip half-widths
 * of the standard body, the space a legal guarding position keeps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shot, the contest placement, the FIBA geometry and the clearance bound.
 * @evidence contracts/development/testing.md#behavioral-verification Runs setShot and stageDeflect through HumanPerformance and reads the ball's play, its ring crossing and displayed feet and hips.
 * @evidence contracts/development/testing.md#independent-expectations Ring geometry is FIBA's; the defender's station is read from the undefended flight.
 * @evidence contracts/development/testing.md#distinguishing-cases The same shot scores undefended and is deflected when contested.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory performances of two polygon men, one ball and one hoop.
 */
export function test_motion_throw_catch_basketball_contest(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const ball: ReturnType<typeof createBall> = createBall({
    kind: "basketball",
  });
  const hoop: ReturnType<typeof createBasketballHoop> = createBasketballHoop({
    ring: 0.45,
    thickness: 0.013,
  });
  const hoopAt: IAutoMovieVector3 = { x: 0, y: 0, z: -0.85 };
  const rim: IAutoMovieAffordance = hoop.affordance("rim");
  const inner: number = 0.45 / 2;
  const ring: IAutoMovieVector3 = Vector3.add(hoopAt, {
    ...rim.frame.translation,
    z: rim.frame.translation.z - inner - rim.aperture! / 2,
  });
  const centre: IAutoMovieVector3 = ball.affordance("grip").frame.translation;
  const radius: number = ball.affordance("grip").aperture! / 2;
  const shooterAt: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };

  const take = (defender?: IBallStation): HumanPerformance => {
    // The shooter lifts the ball to the chest, where a caught ball sits.
    const parts: IAutoMovieComposition[] = [
      HumanChain.subject("shooter")
        .pickUp({ prop: "ball", handle: "grip", lift: 0.9 })
        .ballSport(
          { kind: "setShot", prop: "ball", at: ring, flightSeconds: 1.12 },
          "shot",
        )
        .stand({ hold: 2, sway: 0 }).node,
    ];
    const performers: IAutoMovieMotionHumanPerformance.IInput["performers"] = [
      {
        subject: "shooter",
        body,
        at: shooterAt,
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ];
    if (defender !== undefined) {
      performers.push({
        subject: "defender",
        body,
        at: defender.at,
        yaw: defender.yaw,
        proficiency: { level: "trained" },
      });
      parts.push(
        HumanChain.subject("defender")
          .registered("stageDeflect", {
            partner: "shot",
            ball: "ball",
            hands: "two",
            intercept: defender.intercept,
          })
          .sync({ of: "shot" })
          .stand({ hold: 2, sway: 0 }).node,
      );
    }
    return new HumanPerformance({
      seed:
        defender === undefined ? "basketball-open-shot" : "basketball-contest",
      laws: [AutoMovieMotionHumanThrowCatch.stageDeflect],
      performers,
      props: [
        HumanObject.prop("ball", ball, {
          position: { x: 0, y: 0, z: shooterAt.z - 0.49 },
          rotation: Quaternion.identity(),
        }),
        HumanObject.prop("hoop", hoop, {
          position: hoopAt,
          rotation: Quaternion.identity(),
        }),
      ],
      composition: AutoMovieComposition.parallel(...parts),
    });
  };
  const gate: IAutoMovieMotionHumanBallPlay.IDisc = {
    kind: "disc",
    centre: ring,
    normal: { x: 0, y: -1, z: 0 },
    radius: inner - radius,
  };
  const shotOf = (
    film: HumanPerformance,
  ): IAutoMovieMotionHumanBallPlay.ILaunch => {
    const shot: IAutoMovieMotionHumanBallPlay.Event | undefined = film
      .play("ball")
      .events.find(
        (event: IAutoMovieMotionHumanBallPlay.Event): boolean =>
          event.kind === "launch" && event.subject === "shooter",
      );
    if (shot?.kind !== "launch") throw new Error("The shooter never shoots");
    return shot;
  };

  const open: HumanPerformance = take();
  const openShot: IAutoMovieMotionHumanBallPlay.ILaunch = shotOf(open);
  TestValidator.predicate(
    "undefended, the shot drops through the ring",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      open,
      "ball",
      gate,
      openShot.seconds,
      open.duration,
      centre,
    ) !== undefined,
  );

  // The defender stands on the shot's flight where it crosses a plane 0.6 m
  // in front of the shooter, as the staged-catch fixture places a receiver.
  const station: IBallStation = ballStation(
    open,
    "ball",
    openShot,
    { x: 0, y: 0, z: shooterAt.z - 0.6 },
    centre,
  );
  const contested: HumanPerformance = take(station);
  const shot: IAutoMovieMotionHumanBallPlay.ILaunch = shotOf(contested);
  const play: IAutoMovieMotionHumanBallPlay = contested.play("ball");
  TestValidator.equals(
    "the shooter's ball is deflected by the defender's hands",
    ballPossessions(play),
    ["hold:shooter:false", "launch:shooter", "launch:defender"],
  );
  TestValidator.predicate(
    "the deflected ball never passes the ring",
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      contested,
      "ball",
      gate,
      shot.seconds,
      contested.duration,
      centre,
    ) === undefined,
  );
  const touch: number = shot.seconds + station.intercept;
  TestValidator.predicate(
    "both players keep their feet planted across the touch and their hips apart",
    (["shooter", "defender"] as const).every(
      (subject: string): boolean =>
        Vector3.distance(
          contested.bones(subject, touch - 0.05).get("leftFoot")!.worldPosition,
          contested.bones(subject, touch + 0.05).get("leftFoot")!.worldPosition,
        ) <= 0.005,
    ) &&
      [0, 0.25, 0.5, 0.75, 1].every(
        (share: number): boolean =>
          Vector3.distance(
            contested.bones("shooter", share * contested.duration).get("hips")!
              .worldPosition,
            contested.bones("defender", share * contested.duration).get("hips")!
              .worldPosition,
          ) >= 0.35,
      ),
  );

  // The takes pass the shipped verdicts a viewer would show.
  assertTakeClean("contested shot", contested);
}
