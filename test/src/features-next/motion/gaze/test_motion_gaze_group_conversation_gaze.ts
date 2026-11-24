import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanConversation,
  AutoMovieMotionHumanGaze,
  AutoMovieMotionHumanStance,
} from "@automovie/motions";
import { HumanSkill } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * An authored exchange redirects the speaker and the listeners over time.
 *
 * Scenarios:
 * 1. A addresses B, redirects to C, then yields to B after a pause. Each
 *    speaker looks at their stated addressee. Silent C tracks the current
 *    speaker, including when the speaker is addressing C.
 * 2. The real standing gaze layer resolves C's person targets on opposite
 *    sides at the two turns and restores the standing eye yaw in the pause.
 * 3. A seed replays the same plan. The dyadic API keeps its fixed partner
 *    and its open-ended requests.
 * 4. Unknown subjects, duplicate roster entries, self-address, overlapping
 *    spans and a nonfinite span fail during planning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the authored exchange, speaker change, pause, gaze consumer and refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public conversation planner and applies the returned requests through the standing gaze layer.
 * @evidence contracts/development/testing.md#independent-expectations Assigns expected face IDs from the fixture's authored roles. Opposite world targets imply opposite eye yaw and the base posture supplies the pause reference.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers redirection within a turn, a change of speaker, a silent participant, a pause, repeatability, the dyadic path and malformed authored turns.
 * @evidence contracts/development/testing.md#execution-ownership Synchronous in-memory feature test using the common standing body fixture.
 */
export function test_motion_gaze_group_conversation_gaze(): void {
  const participants: readonly string[] = ["a", "b", "c"];
  const turns: readonly IAutoMovieMotionHumanConversation.IGroupTurn[] = [
    { speaker: "a", addressee: "b", from: 1, to: 2 },
    { speaker: "a", addressee: "c", from: 2, to: 3 },
    { speaker: "b", addressee: "a", from: 4, to: 5 },
  ];
  const random: IAutoMovieRandom = createAutoMovieRandom(
    deriveAutoMovieSeed("group-conversation", "gaze"),
  );
  const eyes: number = 1.6;
  const requests = (id: string): IAutoMovieMotionHumanGaze.ILayer[] =>
    AutoMovieMotionHumanConversation.groupGaze({
      subject: id,
      participants,
      turns,
      random: random.stream(id),
      eyes,
    });

  const faces = (
    track: readonly IAutoMovieMotionHumanGaze.ILayer[],
  ): string[] =>
    turns.map((turn: IAutoMovieMotionHumanConversation.IGroupTurn): string => {
      const target: IAutoMovieMotionTarget | undefined = track.find(
        (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
          nclose(request.from, turn.from, 1e-12),
      )?.target;
      return target?.kind === "person" && target.region === "face"
        ? target.subject
        : "";
    });

  TestValidator.equals(
    "A redirects to C and then listens",
    faces(requests("a")),
    ["b", "c", "b"],
  );
  TestValidator.equals("B listens and then addresses A", faces(requests("b")), [
    "a",
    "a",
    "a",
  ]);
  const listener: IAutoMovieMotionHumanGaze.ILayer[] = requests("c");
  TestValidator.equals("C tracks the current speaker", faces(listener), [
    "a",
    "a",
    "b",
  ]);
  TestValidator.predicate(
    "the last request in each span releases at the end",
    turns.every(
      (turn: IAutoMovieMotionHumanConversation.IGroupTurn): boolean => {
        const active: IAutoMovieMotionHumanGaze.ILayer[] = listener.filter(
          (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
            request.from >= turn.from && request.from < turn.to,
        );
        return (
          nclose(active.at(-1)?.to ?? NaN, turn.to) &&
          active
            .slice(0, -1)
            .every(
              (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
                request.to === undefined,
            )
        );
      },
    ),
  );

  // The first three draws for this seed exceed the one-second listener cutoff.
  const held: IAutoMovieRandom = createAutoMovieRandom("000000000000000a");
  const sustained: IAutoMovieMotionHumanGaze.ILayer[] =
    AutoMovieMotionHumanConversation.groupGaze({
      subject: "c",
      participants,
      turns,
      random: held,
      eyes,
    });
  TestValidator.predicate(
    "three of four film seconds target a face",
    nclose(
      AutoMovieMotionHumanConversation.share({
        requests: sustained,
        from: 1,
        to: 5,
      }),
      0.75,
    ),
  );
  const layer: IAutoMovieMotionHumanLayer =
    AutoMovieMotionHumanGaze.HumanGaze.layer(sustained);
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const context: IAutoMovieMotionHumanLayer.IContext = {
    subject: "c",
    body,
    skill: HumanSkill.resolve({ p: 0.5 }, "group-conversation"),
    aim: (
      target: IAutoMovieMotionTarget,
    ): {
      point: IAutoMovieVector3;
      normal: IAutoMovieVector3;
    } => {
      if (target.kind !== "person" || target.region !== "face")
        throw new Error("Expected a person face during the sample");
      return {
        point: { x: target.subject === "a" ? 0.35 : -0.35, y: eyes, z: 2 },
        normal: { x: 0, y: 0, z: -1 },
      };
    },
    action: (): undefined => undefined,
    random: (): IAutoMovieRandom => held,
  };
  const eyeYaw = (seconds: number): number =>
    layer.apply(standing, seconds, context).joints.leftEye?.[2] ?? 0;
  TestValidator.predicate(
    "C turns the left eye toward the two speakers on opposite sides",
    eyeYaw(1.5) > 5 && -5 > eyeYaw(4.5),
  );
  TestValidator.predicate(
    "the pause restores the base eye yaw",
    nclose(eyeYaw(3.5), standing.joints.leftEye?.[2] ?? 0),
  );

  TestValidator.equals(
    "identical participant stream replays the same requests",
    requests("c"),
    listener,
  );
  const dyad: IAutoMovieMotionHumanGaze.ILayer[] =
    AutoMovieMotionHumanConversation.gaze({
      subject: "a",
      partner: "b",
      turns,
      random: held,
      eyes,
    });
  TestValidator.equals("a dyad keeps one partner throughout", faces(dyad), [
    "b",
    "b",
    "b",
  ]);
  TestValidator.predicate(
    "dyadic requests are open-ended",
    dyad.every(
      (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
        request.to === undefined,
    ),
  );

  TestValidator.error("an unknown viewer is refused", (): void => {
    requests("absent");
  });
  TestValidator.error("a duplicate participant is refused", (): void => {
    AutoMovieMotionHumanConversation.groupGaze({
      subject: "a",
      participants: ["a", "b", "a"],
      turns,
      random,
      eyes,
    });
  });
  const invalid: readonly IAutoMovieMotionHumanConversation.IGroupTurn[] = [
    { speaker: "a", addressee: "absent", from: 3, to: 4 },
    { speaker: "a", addressee: "a", from: 3, to: 4 },
    { speaker: "b", addressee: "c", from: 1.5, to: 3 },
    { speaker: "b", addressee: "c", from: 3, to: Infinity },
  ];
  for (const turn of invalid)
    TestValidator.error(`refuses ${JSON.stringify(turn)}`, (): void => {
      AutoMovieMotionHumanConversation.groupGaze({
        subject: "c",
        participants,
        turns: [turns[0]!, turn],
        random,
        eyes,
      });
    });
}
