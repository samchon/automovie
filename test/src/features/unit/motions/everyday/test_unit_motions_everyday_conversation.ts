import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanConversation,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionTarget,
  IAutoMovieRandom,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  conversationGaze,
  conversationGroupGaze,
  conversationShare,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

namespace part_conversation_gaze {
  /** The eyes' height the looks away are read from, metres. */
  const EYES: number = 1.6;

  /** The seeds the shares are averaged over. */
  const SEEDS: number = 200;

  /** The distribution tolerance on a mean share. */
  const SHARE: number = 0.2;

  /** How far a look away turns the gaze, degrees: the eyes' share of a shift. */
  const AWAY: number = 15;

  /**
   * `conversationGaze` looks at the partner more while listening than while
   * speaking, at the shares Acarturk et al. 2021 measured, and starts each turn
   * looking at the partner.
   *
   * Scenarios, a speaker change between two 30-second turns:
   *
   * 1. Over 200 seeds the mean share of listening time on the partner's face is 3.89
   *    / (3.89 + 0.29) and of speaking time 1.82 / (1.82 + 0.83), each within 20
   *    %.
   * 2. Every turn's first request looks at the partner.
   * 3. Requests are in time order; a listener's look away aims below the eyes, and
   *    every look away turns the gaze by 15 degrees.
   * 4. The same stream gives the same requests; a turn that ends before it starts is
   *    refused.
   */
  export function run(): void {
    const turns: IAutoMovieMotionHumanConversation.ITurn[] = [
      { speaker: "a", from: 0, to: 30 },
      { speaker: "b", from: 30, to: 60 },
    ];
    const gaze: (seed: string) => ReturnType<typeof conversationGaze> = (
      seed: string,
    ): ReturnType<typeof conversationGaze> =>
      conversationGaze({
        subject: "a",
        partner: "b",
        turns,
        random: createAutoMovieRandom(deriveAutoMovieSeed("talk", seed)),
        eyes: EYES,
      });
    let speaking: number = 0;
    let listening: number = 0;
    for (let seed: number = 0; seed < SEEDS; seed++) {
      const requests: ReturnType<typeof conversationGaze> = gaze(String(seed));
      for (const turn of turns) {
        const share: number = conversationShare({
          requests,
          from: turn.from,
          to: turn.to,
        });
        if (turn.speaker === "a") speaking += share;
        else listening += share;
      }
    }
    const listened: number = 3.89 / (3.89 + 0.29);
    const spoken: number = 1.82 / (1.82 + 0.83);
    TestValidator.predicate(
      `listening share ${listening / SEEDS}`,
      Math.abs(listening / SEEDS / listened - 1) < SHARE,
    );
    TestValidator.predicate(
      `speaking share ${speaking / SEEDS}`,
      Math.abs(speaking / SEEDS / spoken - 1) < SHARE,
    );

    const requests: ReturnType<typeof conversationGaze> = gaze("0");
    type Request = (typeof requests)[number];
    TestValidator.predicate(
      "turns start on the partner",
      turns.every(
        (turn: IAutoMovieMotionHumanConversation.ITurn): boolean =>
          requests.find((r: Request): boolean => r.from === turn.from)?.target
            .kind === "person",
      ),
    );
    TestValidator.predicate(
      "requests ordered",
      requests.every(
        (r: Request, i: number): boolean =>
          i === 0 || r.from >= requests[i - 1]!.from,
      ),
    );
    TestValidator.predicate(
      "a listener looks away below the eyes",
      requests.every(
        (r: Request): boolean =>
          r.target.kind !== "point" ||
          turns.find(
            (turn: IAutoMovieMotionHumanConversation.ITurn): boolean =>
              turn.from <= r.from && r.from < turn.to,
          )!.speaker === "a" ||
          r.target.at.y < EYES,
      ),
    );
    TestValidator.predicate(
      "a look away turns the gaze by the eyes' share",
      requests.every((r: Request): boolean => {
        if (r.target.kind !== "point") return true;
        const at: IAutoMovieVector3 = r.target.at;
        const angle: number =
          (Math.acos(at.z / Math.hypot(at.x, at.y - EYES, at.z)) * 180) /
          Math.PI;
        return Math.abs(angle - AWAY) < 1e-9;
      }),
    );
    TestValidator.equals("deterministic", gaze("0"), requests);
    TestValidator.predicate(
      "a backward turn is refused",
      throwsError((): unknown =>
        conversationGaze({
          subject: "a",
          partner: "b",
          turns: [{ speaker: "a", from: 2, to: 1 }],
          random: createAutoMovieRandom(deriveAutoMovieSeed("x")),
          eyes: EYES,
        }),
      ),
    );
  }
}

namespace part_conversation_group_gaze {
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
  export function run(): void {
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
      turns.map(
        (turn: IAutoMovieMotionHumanConversation.IGroupTurn): string => {
          const target: IAutoMovieMotionTarget | undefined = track.find(
            (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
              nclose(request.from, turn.from, 1e-12),
          )?.target;
          return target?.kind === "person" && target.region === "face"
            ? target.subject
            : "";
        },
      );
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
        turns: [{ speaker: "a", from: 1, to: Infinity }],
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
}

namespace part_conversation_share {
  /** Rounding of a few sums of film seconds and one quotient, unitless. */
  const ROUNDING: number = 1e-12;

  /**
   * `conversationShare` is the share of a film span the gaze requests spend on a
   * person's face: each request runs from its start to its release or the next
   * request, whichever is first, clipped to the span.
   *
   * Over the span 0 to 10 s: a face from 1 s released at 3 s, a point from 4 s, a
   * face from 6 s with no release, and a face from 8 s.
   *
   * Scenarios:
   *
   * 1. The faces hold 2 + 2 + 2 = 6 of the 10 s: 0.6. The point's 2 s do not count,
   *    and the face from 6 s ends where the next request begins.
   * 2. Clipped to 2 to 7 s: the first face's 1 s and the third's 1 s, 2 of 5 s.
   */
  export function run(): void {
    const face: IAutoMovieMotionTarget = {
      kind: "person",
      subject: "b",
      region: "forehead",
    };
    const point: IAutoMovieMotionTarget = {
      kind: "point",
      at: { x: 0, y: 1.6, z: 3 },
      frame: "world",
    };
    const requests: IAutoMovieMotionHumanGaze.ILayer[] = [
      { target: face, from: 1, to: 3 },
      { target: point, from: 4 },
      { target: face, from: 6 },
      { target: face, from: 8 },
    ];
    TestValidator.predicate(
      "the faces' share of the span",
      nclose(conversationShare({ requests, from: 0, to: 10 }), 0.6, ROUNDING),
    );
    TestValidator.predicate(
      "clipped to a part of the span",
      nclose(conversationShare({ requests, from: 2, to: 7 }), 0.4, ROUNDING),
    );
  }
}

/**
 * `conversation`'s unit contract: its gaze and turn shares.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `conversation_gaze`: `conversationGaze` looks at the partner more while
 *   listening than while speaking, at the shares Acarturk et al.
 * - `conversation_group_gaze`: `conversationGroupGaze` plans a participant's gaze
 *   over authored turns in a group:
 * - `conversation_share`: `conversationShare` is the share of a film span the
 *   gaze requests spend on a person's face:
 */
export async function test_unit_motions_everyday_conversation(): Promise<void> {
  part_conversation_gaze.run();
  part_conversation_group_gaze.run();
  part_conversation_share.run();
}
