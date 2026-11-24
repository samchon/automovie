import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
} from "@automovie/interface";
import {
  conversationGaze,
  conversationGroupGaze,
  conversationShare,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** The eyes' height the looks away are read from, metres. */
const EYES: number = 1.6;

/**
 * `conversationGroupGaze` plans a participant's gaze over authored turns in a
 * group: a speaker looks at the stated addressee, a listener at the current
 * speaker, each span's last request releasing at its end; the dyadic
 * `conversationGaze` keeps one partner and leaves its requests open.
 *
 * Scenarios, A addressing B over 1 to 2 s, then C over 2 to 3 s, and B
 * addressing A over 4 to 5 s:
 *
 * 1. A faces B, C, then B; B faces A throughout; silent C faces A, A, then B.
 * 2. C's last request in each span releases at the span's end, the others are
 *    open.
 * 3. On a stream whose first draws exceed the one-second listener cutoff, three of
 *    the four film seconds from 1 to 5 s target a face.
 * 4. The same stream replays the same requests; the dyad keeps B and leaves its
 *    requests open.
 * 5. An unknown viewer, a duplicate participant, an unknown or self addressee, an
 *    overlapping span and an unending span are refused, the dyad refusing the
 *    unending span too.
 */
export function test_unit_motions_everyday_conversation_group_gaze(): void {
  const participants: readonly string[] = ["a", "b", "c"];
  const turns: readonly IAutoMovieMotionHumanConversation.IGroupTurn[] = [
    { speaker: "a", addressee: "b", from: 1, to: 2 },
    { speaker: "a", addressee: "c", from: 2, to: 3 },
    { speaker: "b", addressee: "a", from: 4, to: 5 },
  ];
  const random: IAutoMovieRandom = createAutoMovieRandom(
    deriveAutoMovieSeed("group-conversation", "gaze"),
  );
  const requests: (id: string) => IAutoMovieMotionHumanGaze.ILayer[] = (
    id: string,
  ): IAutoMovieMotionHumanGaze.ILayer[] =>
    conversationGroupGaze({
      subject: id,
      participants,
      turns,
      random: random.stream(id),
      eyes: EYES,
    });
  const faces: (
    track: readonly IAutoMovieMotionHumanGaze.ILayer[],
  ) => string[] = (
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
  const listener: IAutoMovieMotionHumanGaze.ILayer[] = requests("c");
  TestValidator.equals(
    "who faces whom",
    [faces(requests("a")), faces(requests("b")), faces(listener)],
    [
      ["b", "c", "b"],
      ["a", "a", "a"],
      ["a", "a", "b"],
    ],
  );
  TestValidator.predicate(
    "each span's last request releases at its end",
    turns.every(
      (turn: IAutoMovieMotionHumanConversation.IGroupTurn): boolean => {
        const active: IAutoMovieMotionHumanGaze.ILayer[] = listener.filter(
          (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
            request.from >= turn.from && request.from < turn.to,
        );
        return (
          nclose(active.at(-1)?.to ?? NaN, turn.to, 1e-12) &&
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
  const held: IAutoMovieRandom = createAutoMovieRandom("000000000000000a");
  TestValidator.predicate(
    "three of four seconds on a face",
    nclose(
      conversationShare({
        requests: conversationGroupGaze({
          subject: "c",
          participants,
          turns,
          random: held,
          eyes: EYES,
        }),
        from: 1,
        to: 5,
      }),
      0.75,
      1e-12,
    ),
  );
  TestValidator.equals("replayed", requests("c"), listener);
  const dyad: IAutoMovieMotionHumanGaze.ILayer[] = conversationGaze({
    subject: "a",
    partner: "b",
    turns,
    random: held,
    eyes: EYES,
  });
  TestValidator.predicate(
    "the dyad",
    faces(dyad).every((face: string): boolean => face === "b") &&
      dyad.every(
        (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
          request.to === undefined,
      ),
  );
  TestValidator.error("an unending dyad", (): void => {
    conversationGaze({
      subject: "a",
      partner: "b",
      turns: [{ speaker: "a", addressee: "b", from: 1, to: Infinity }],
      random: held,
      eyes: EYES,
    });
  });
  TestValidator.error("an unknown viewer", (): void => {
    requests("absent");
  });
  TestValidator.error("a duplicate participant", (): void => {
    conversationGroupGaze({
      subject: "a",
      participants: ["a", "b", "a"],
      turns,
      random,
      eyes: EYES,
    });
  });
  for (const turn of [
    { speaker: "a", addressee: "absent", from: 3, to: 4 },
    { speaker: "a", addressee: "a", from: 3, to: 4 },
    { speaker: "b", addressee: "c", from: 1.5, to: 3 },
    { speaker: "b", addressee: "c", from: 3, to: Infinity },
  ] satisfies IAutoMovieMotionHumanConversation.IGroupTurn[])
    TestValidator.error(`refuses ${JSON.stringify(turn)}`, (): void => {
      conversationGroupGaze({
        subject: "c",
        participants,
        turns: [turns[0]!, turn],
        random,
        eyes: EYES,
      });
    });
}
