import { createHorse, rideHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** Seconds from the take-up to the horse's downward change: the author's. */
const LATENCY: number = 0.4;

/** The stirrups and reins the rider keeps. */
const HOLD: IAutoMovieMotionHumanMounted.ISupports = {
  leftFoot: "leftStirrup",
  rightFoot: "rightStirrup",
  leftHand: "leftRein",
  rightHand: "rightRein",
};

/**
 * A bolt and its pull-up: from a walk the horse surges to a gallop at
 * 2 m/s², and the rider, keeping the seat, both stirrups and both reins,
 * leans into the surge and back as the take-ups bring the horse down
 * through its gaits again.
 *
 * Scenarios:
 * 1. At the horse's walk-to-trot change, in the surge, the displayed trunk leans forward against the saddle by more than 3 degrees beyond the same take ridden with no response; at its first downward change, from the gallop while it still slows, it leans back against the saddle beyond the rigid take, as far as the reins stay in reach.
 * 2. Every downward gait change of the pull-up has a take-up whose event lies `LATENCY` before it.
 * 3. Through the surge, the gallop and the pull-up the seat region stays within 10 mm of the saddle and both balls of the feet within 10 mm of their stirrups' treads (the campaign's held-contact bound).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, its three scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law with and without its response over an actual horse ride that bolts and pulls up, and reads the displayed trunk, seat and soles against the moving saddle and stirrups and the aids against the ride's own gait instants; a trunk carried rigidly through the surge, a late aid or a lost contact fails.
 * @evidence contracts/development/testing.md#independent-expectations The surge and pull-up are the archetype ride's own; the lean's direction is the inertial one, forward into an acceleration; the bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Surge against pull-up, with against without the response.
 * @evidence contracts/development/testing.md#execution-ownership Two in-memory films of one polygon man over one archetype ride.
 */
export function test_motion_mount_equestrian_bolt(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    8,
  );
  const course: mountedHorseScene.Ride = rideHorse(horse, {
    start: { x: 0, z: 0, heading: 0 },
    legs: [
      { kind: "straight", length: 6 },
      { kind: "straight", length: 60 },
      { kind: "straight", length: 30 },
      { kind: "straight", length: 6 },
    ],
    speeds: [1.4, 8, 1.4, 1.4],
    cruise: 8,
    startSpeed: 1.4,
    acceleration: 2,
    deceleration: 1.5,
  });
  const gaits: { label: string; seconds: number }[] = course.instants
    .filter((e): boolean => e.label.startsWith("gait:"))
    .map((e) => ({ label: e.label, seconds: WAIT + e.seconds }));
  const order: readonly string[] = ["walk", "trot", "canter", "gallop"];
  const downward = (label: string): boolean => {
    const [from, to] = label.slice("gait:".length).split("-");
    return order.indexOf(to!) < order.indexOf(from!);
  };
  const downs: number[] = gaits
    .filter((g): boolean => downward(g.label))
    .map((g): number => g.seconds);
  const surge: number | undefined = gaits.find(
    (g): boolean => g.label === "gait:walk-trot",
  )?.seconds;
  // The pull-up's first change, from the gallop, falls while the horse still slows.
  const pulled: number | undefined = downs[0];
  const cues: Record<string, { name: string; seconds: number }[]> = {
    down: downs.map((seconds: number) => ({ name: "down", seconds })),
  };
  const responding: mountedHorseScene.IScene = stage(
    horse,
    body,
    course,
    cues,
    1,
  );
  const rigid: mountedHorseScene.IScene = stage(horse, body, course, cues, 0);
  if (surge === undefined || pulled === undefined || downs.length < 2)
    findings.push(`gait changes ${gaits.map((g) => g.label).join(", ")}`);

  // 1. The trunk leans into the surge and back in the pull-up.
  const lean = (scene: mountedHorseScene.IScene, at: number): number => {
    const local: IAutoMovieVector3 = mountedHorseScene.turned(
      scene.part("seat", at),
      Vector3.subtract(
        Vector3.lerp(
          mountedHorseScene.joint(scene, "leftUpperArm", at),
          mountedHorseScene.joint(scene, "rightUpperArm", at),
          0.5,
        ),
        Vector3.lerp(
          mountedHorseScene.joint(scene, "leftUpperLeg", at),
          mountedHorseScene.joint(scene, "rightUpperLeg", at),
          0.5,
        ),
      ),
    );
    return (Math.atan2(local.z, local.y) * 180) / Math.PI;
  };
  if (
    surge !== undefined &&
    !(lean(responding, surge) - lean(rigid, surge) > 3)
  )
    findings.push(
      `in the surge the trunk leans ${lean(responding, surge).toFixed(1)} degrees against the saddle, ${lean(rigid, surge).toFixed(1)} ridden rigid`,
    );
  if (pulled !== undefined && !(lean(responding, pulled) < lean(rigid, pulled)))
    findings.push(
      `in the pull-up the trunk leans ${lean(responding, pulled).toFixed(1)} degrees against the saddle, ${lean(rigid, pulled).toFixed(1)} ridden rigid`,
    );

  // 2. Each downward change has its take-up the latency before.
  const take: IAutoMovieMotionHumanSegment =
    responding.segments[responding.segments.length - 1]!;
  const onsets: number[] = take.plan.events
    .filter((e): boolean => e.name.startsWith("aid:takeUp"))
    .map((e): number => take.start + e.share * (take.end - take.start));
  for (const at of downs)
    if (!onsets.some((o: number): boolean => Math.abs(at - o - LATENCY) < 1e-6))
      findings.push(
        `the downward change at ${at.toFixed(3)} s has no take-up ${LATENCY} s before it`,
      );

  // 3. The seat and stirrups hold through the bolt.
  const ball = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      responding.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(responding.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const seat = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      responding.part("seat", at),
      HumanSignature.region(responding.reader, "seat", at),
    );
  const before: number = WAIT - 0.5;
  for (const at of gaits.map((g): number => g.seconds)) {
    if (Vector3.distance(seat(at), seat(before)) > CONTACT)
      findings.push(`the seat slides on the saddle at ${at.toFixed(2)} s`);
    for (const side of ["left", "right"] as const)
      if (Math.abs(ball(side, at).y) > CONTACT)
        findings.push(
          `the ${side} ball leaves its stirrup at ${at.toFixed(2)} s`,
        );
  }

  assertTakeClean("the responding bolt", responding.film);
  assertTakeClean("the rigid bolt", rigid.film);
  TestValidator.equals("a bolt and its pull-up", findings, []);
}

/** Sit, ride on with the stirrups and reins, then hold the seat through the bolt with the given response, taking up the reins before each downward change. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  course: mountedHorseScene.Ride,
  cues: Record<string, { name: string; seconds: number }[]>,
  respond: number,
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "walk",
    wait: WAIT,
    course,
    cues,
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
          respond,
          aids: [{ kind: "takeUp", cue: "down", latency: LATENCY }],
          figures: [
            {
              seat: "entered",
              transfer: 0.3,
              hold: course.duration + WAIT - 4,
              supports: HOLD,
            },
          ],
        }),
  });
}
