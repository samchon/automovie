import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "./predicates";
import type { IFilmPositionalTargetAssertionsInput } from "./IFilmPositionalTargetAssertionsInput";

/** Run the existing placed, grouped, malformed and camera target admission assertions. */
export function assertFilmPositionalTargetKinds(input: IFilmPositionalTargetAssertionsInput): void {
  const { perform, says, silentAt } = input;
  // 3. the counter-cases one property away: a valid node target of either
  // placed flavour is not over-rejected.
  TestValidator.equals(
    "an actor target still performs",
    perform([
      {
        verb: "lookAt",
        actor: "knightA",
        start: 0,
        duration: 1,
        to: { kind: "node", node: "knightB" },
      },
    ]).success,
    true,
  );
  TestValidator.equals(
    "a set piece target still performs",
    perform([
      {
        verb: "lookAt",
        actor: "knightA",
        start: 0,
        duration: 1,
        to: { kind: "node", node: "altar" },
      },
    ]).success,
    true,
  );

  // 4. groups: every unplaced member is named; an empty one says so.
  const unplacedGroup = perform([
    {
      verb: "lookAt",
      actor: "knightA",
      start: 0,
      duration: 1,
      to: { kind: "group", nodes: ["ghost", "wraith"] },
    },
  ]);
  TestValidator.predicate(
    "an all-unplaced group names every member",
    says(
      unplacedGroup,
      "$input.draft[0].to",
      "none of its group members are placed",
      '"ghost"',
      '"wraith"',
    ),
  );
  TestValidator.predicate(
    "a group mixing a placed member with an unplaced one still resolves",
    perform([
      {
        verb: "lookAt",
        actor: "knightA",
        start: 0,
        duration: 1,
        to: { kind: "group", nodes: ["knightB", "ghost"] },
      },
    ]).success === true,
  );
  TestValidator.predicate(
    "an empty group says it names no members",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "group", nodes: [] },
        },
      ]),
      "$input.draft[0].to",
      "its group names no members",
    ),
  );

  // 5. the kinds that genuinely have no place: a point target whose point is
  // absent, relative, unknown, malformed.
  TestValidator.predicate(
    "a point target with no point says so",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "point" } as never,
        },
      ]),
      "$input.draft[0].to",
      "a point target carries no point to resolve",
    ),
  );
  TestValidator.predicate(
    "a direction target is refused as relative",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "direction", headingDeg: 90 },
        },
      ]),
      "$input.draft[0].to",
      'a target of kind "direction" is relative',
    ),
  );
  TestValidator.predicate(
    "an offscreen target is refused as relative",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "offscreen", edge: "left" },
        },
      ]),
      "$input.draft[0].to",
      'a target of kind "offscreen" is relative',
    ),
  );
  TestValidator.predicate(
    "an unknown kind is refused by that kind",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: "elsewhere" } as never,
        },
      ]),
      "$input.draft[0].to",
      '"elsewhere" is not a positional target kind',
    ),
  );
  TestValidator.predicate(
    "a malformed kind is refused as malformed",
    says(
      perform([
        {
          verb: "lookAt",
          actor: "knightA",
          start: 0,
          duration: 1,
          to: { kind: 7 } as never,
        },
      ]),
      "$input.draft[0].to",
      '"malformed" is not a positional target kind',
    ),
  );

  // 6. a point gesture with no target at all teaches the same vocabulary.
  TestValidator.predicate(
    "an untargeted point gesture states the target vocabulary",
    says(
      perform([
        {
          verb: "gesture",
          actor: "knightA",
          start: 0,
          duration: 1,
          kind: "point",
        },
      ]),
      "$input.draft[0].at",
      "whose ids name placed actors, set pieces, or cameras",
      "but none was given",
    ),
  );

  // 7. a camera is a place to point at, never a performer: the actor rule the
  // wider target table must not have loosened.
  const cameraActor = perform([
    {
      verb: "gesture",
      actor: "cam-main",
      start: 0,
      duration: 1,
      kind: "wave",
    },
  ]);
  TestValidator.equals(
    "a camera still cannot act outside frame",
    namedFacts([
      [
        "refused",
        () => says(cameraActor, "$input.draft[0].actor", "is a camera"),
      ],
      ["violated", () => silentAt(cameraActor, "$input.draft[0].at")],
    ]),
    { refused: true, violated: true },
  );

}
