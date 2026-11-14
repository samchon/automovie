import { createBall, createRacket } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  type HumanSegment,
  HumanSportSwing,
  HumanSportThrow,
  type IHumanBody,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A racket and a ball serve the strokes that read them: a forehand carries the racket's own `sweetSpot` to a tennis ball's centre with its `face` leading, and a kick meets a football at the centre and size the ball declares.
 *
 * The tennis racket lies level before the right hand, its head ahead, and a tennis ball hangs where the stroke meets it, ahead and to the right at hip height. The football rests on the floor ahead of the right foot; the kick names it, reading its centre from the ball's `grip` and its radius from that grip's aperture.
 *
 * Scenarios, on the average man and the small woman:
 * 1. Taking the racket up by `grip` and driving a forehand at the tennis ball, the racket's `sweetSpot` the working point and its `face` the edge, plans; at the stroke's contact the ball's centre lies over the racket's head: inside the head's length about the `sweetSpot` and its width, and within 60 mm of the face's plane (provisional: the ball's radius and a margin). The cut the stroke is a row of lands the implement's striking part some way behind the working point, so the ball is met on the strings, not at the `sweetSpot` itself.
 * 2. A right-footed kick of the football toward a point 5 m ahead plans; at its contact the right foot or toes lie within the ball's radius and 80 mm of its centre (provisional: the foot's half-thickness and a margin).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the stroke and the kick through the public chain with the real racket and balls and reads the displayed racket and joints; a stroke or a kick that misses the ball fails with the distance.
 * @evidence contracts/development/testing.md#independent-expectations The working point, the edge, the balls' centres and sizes are the archetypes' own affordances; the bounds are stated provisional; nothing is read from the laws but their contact instants.
 * @evidence contracts/development/testing.md#distinguishing-cases A held implement's stroke and a foot's kick on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and four films; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the stage and the 2 scenarios with their bounds.
 */
export function test_archetype_sport_strike(): void {
  const racket: ReturnType<typeof createRacket> = createRacket({
    kind: "tennis",
  });
  const tennis: ReturnType<typeof createBall> = createBall({ kind: "tennis" });
  const football: ReturnType<typeof createBall> = createBall({
    kind: "football",
  });
  const sweet: IAutoMovieVector3 =
    racket.affordance("sweetSpot").frame.translation;
  const head: Readonly<{ length: number; width: number }> = {
    length: racket.dimensions.headLength!,
    width: racket.dimensions.headWidth!,
  };
  const tennisCentre: IAutoMovieVector3 =
    tennis.affordance("grip").frame.translation;
  const footballCentre: IAutoMovieVector3 =
    football.affordance("grip").frame.translation;
  const radius: number = football.affordance("grip").aperture! / 2;
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const contact = (film: HumanPerformance, row: string): number => {
    const act: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === row)!;
    return act.start + (act.plan.contact ?? Number.NaN);
  };
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const performer: HumanPerformance.IInput["performers"][number] = {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    };

    // 1. The forehand.
    try {
      const ballAt: IAutoMovieVector3 = {
        x: -0.35 * stature,
        y: 0.5 * stature,
        z: 0.45 * stature,
      };
      const film: HumanPerformance = new HumanPerformance({
        seed: "forehand",
        laws: [HumanSportSwing.forehand],
        performers: [performer],
        props: [
          HumanObject.prop("racket", racket, {
            position: {
              x: -0.1 * stature,
              y: 0.6 * stature,
              z: 0.18 * stature,
            },
            rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
          }),
          HumanObject.prop("ball", tennis, {
            position: Vector3.subtract(ballAt, tennisCentre),
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "racket",
            handle: "grip",
            use: { tip: "sweetSpot", line: "oblique" },
          })
          .registered("forehand", {
            blade: "racket",
            tip: "sweetSpot",
            edge: "face",
            target: { kind: "prop", subject: "ball", point: "grip" },
          }).node,
      });
      const at: number = contact(film, "forehand");
      const frame: IHumanProp.IFrame = film.prop("racket", at);
      // The ball's centre in the racket's own frame.
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(ballAt, frame.position),
      );
      const along: number = local.y - sweet.y;
      if (
        !(
          Math.abs(along) <= head.length / 2 &&
          Math.abs(local.x) <= head.width / 2 &&
          Math.abs(local.z) <= 0.06
        )
      )
        complaints.push(
          `${name} forehand: at the contact the ball's centre lies ${mm(along)} mm along the racket from the sweet spot (the head ${mm(head.length / 2)} mm either way), ${mm(local.x)} mm across (${mm(head.width / 2)} mm) and ${mm(local.z)} mm off the face's plane (60 mm)`,
        );
    } catch (error) {
      complaints.push(
        `${name} forehand: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // 2. The kick.
    try {
      const rest: IAutoMovieVector3 = { x: -0.06, y: 0, z: 0.45 };
      const centre: IAutoMovieVector3 = Vector3.add(rest, footballCentre);
      const film: HumanPerformance = new HumanPerformance({
        seed: "kick",
        laws: [HumanSportThrow.kickRight],
        performers: [performer],
        props: [HumanObject.prop("ball", football, { at: rest, yaw: 0 })],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("kickRight", {
            ball: "ball",
            toward: { kind: "point", at: { x: 0, y: 0, z: 5 }, frame: "world" },
          }).node,
      });
      const at: number = contact(film, "kickRight");
      const near: number = Math.min(
        ...(["rightFoot", "rightToes"] as const).map(
          (bone: "rightFoot" | "rightToes"): number =>
            Vector3.length(
              Vector3.subtract(
                film.bones("a", at).get(bone)?.worldPosition ?? {
                  x: Infinity,
                  y: Infinity,
                  z: Infinity,
                },
                centre,
              ),
            ),
        ),
      );
      if (!(near <= radius + 0.08))
        complaints.push(
          `${name} kick: at the contact the right foot lies ${mm(near)} mm from the ball's centre, within ${mm(radius + 0.08)} mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${name} kick: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals(
    "a racket and balls serve the stroke and the kick",
    complaints,
    [],
  );
}
