import { IAutoMoviePerformedShot } from "@automovie/engine";
import {
  IAutoMovieActionCall,
  IAutoMovieActionTarget,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { assertFilmPositionalTargetKinds } from "../internal/assertFilmPositionalTargetKinds";
import { createFilmPositionalTargetPerformer } from "../internal/createFilmPositionalTargetPerformer";
import { namedFacts } from "../internal/predicates";

/** True when the refusal at `path` states every fragment. */
const says = (
  result: IAutoMoviePerformedShot,
  path: string,
  ...fragments: string[]
): boolean =>
  result.success === false &&
  result.violations.some(
    (item) =>
      item.path === path &&
      fragments.every((fragment) => item.expected.includes(fragment)),
  );

/** True when nothing was refused at `path` (the over-rejection counter-case). */
const silentAt = (result: IAutoMoviePerformedShot, path: string): boolean =>
  result.success === true ||
  result.violations.every((item) => item.path !== path);

/** One unresolved-target probe per verb that routes through the helper. */
const UNRESOLVED_BY_VERB: ReadonlyArray<
  readonly [string, IAutoMovieActionCall, string]
> = [
  [
    "locomote",
    {
      verb: "locomote",
      actor: "knightA",
      start: 0,
      duration: 1,
      gait: "walk",
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "lookAt",
    {
      verb: "lookAt",
      actor: "knightA",
      start: 0,
      duration: 1,
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "reach",
    {
      verb: "reach",
      actor: "knightA",
      start: 0,
      duration: 1,
      hand: "right",
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "point gesture",
    {
      verb: "gesture",
      actor: "knightA",
      start: 0,
      duration: 1,
      kind: "point",
      at: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].at",
  ],
  [
    "strike gesture",
    {
      verb: "gesture",
      actor: "knightA",
      start: 0,
      duration: 1,
      kind: "strike",
      at: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].at",
  ],
  [
    "launch",
    {
      verb: "launch",
      actor: "knightA",
      start: 0,
      duration: 1,
      projectile: "pebble",
      at: { kind: "node", node: "ghost" },
      speed: 20,
    },
    "$input.draft[0].at",
  ],
  [
    "frame subject",
    {
      verb: "frame",
      actor: "cam-main",
      start: 0,
      duration: "auto",
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].on",
  ],
  [
    "frame focus",
    {
      verb: "frame",
      actor: "cam-main",
      start: 0,
      duration: "auto",
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "knightA" },
      focus: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].focus",
  ],
];

/** The same probes, aimed at a staged camera instead of an unknown id. */
const CAMERA_BY_VERB: ReadonlyArray<readonly [string, IAutoMovieActionCall]> = [
  [
    "locomote",
    {
      verb: "locomote",
      actor: "knightA",
      start: 0,
      duration: 1,
      gait: "walk",
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "lookAt",
    {
      verb: "lookAt",
      actor: "knightA",
      start: 0,
      duration: 1,
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "reach",
    {
      verb: "reach",
      actor: "knightA",
      start: 0,
      duration: 1,
      hand: "right",
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "point gesture",
    {
      verb: "gesture",
      actor: "knightA",
      start: 0,
      duration: 1,
      kind: "point",
      at: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "strike gesture",
    {
      verb: "gesture",
      actor: "knightA",
      start: 0,
      duration: 1,
      kind: "strike",
      at: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "launch",
    {
      verb: "launch",
      actor: "knightA",
      start: 0,
      duration: 1,
      projectile: "pebble",
      at: { kind: "node", node: "cam-main" },
      speed: 20,
    },
  ],
  [
    "frame subject",
    {
      verb: "frame",
      actor: "cam-main",
      start: 0,
      duration: "auto",
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "cam-side" },
    },
  ],
  [
    "frame focus",
    {
      verb: "frame",
      actor: "cam-main",
      start: 0,
      duration: "auto",
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "knightA" },
      focus: { kind: "node", node: "cam-side" },
    },
  ],
];

/**
 * The positional-target seam of the PERFORMANCE consumer (#1294). Two rules
 * live here: a target resolves against every staged placement (actors, set
 * pieces, and cameras alike, so an actor may be directed to look down the
 * lens), and a target that fails names the id that failed rather than echoing a
 * discriminator the same sentence lists as valid.
 *
 * Scenarios:
 *
 * 1. Every verb routing through `resolvePositionalTarget` (lookAt, reach, the
 *    point and strike gesture aims, a launch aim, a frame subject, a frame
 *    focus) accepts a staged camera id: the reported repro, direct address,
 *    performs instead of being refused.
 * 2. The same verbs aimed at a genuinely unknown id are refused at their own path,
 *    and the refusal quotes that id and says it is not placed. It never reads
 *    `not "node"`, the discriminator the old message echoed while the same
 *    sentence listed `node` as legal.
 * 3. The adjacent cases one property away still pass: an actor target and a set
 *    piece target are not over-rejected by the wider table.
 * 4. A group target whose members are all unplaced names every member; an empty
 *    group says it names none.
 * 5. A `point` target carrying no point says exactly that (its kind was never the
 *    fault); a relative target (`direction`, `offscreen`) is refused as
 *    relative, the one case where the kind IS the fault; an unknown or
 *    malformed kind is refused by that kind.
 * 6. A `point` gesture with no `at` at all still refuses at `.at`, teaching the
 *    same target vocabulary.
 * 7. Camera-as-TARGET does not loosen camera-as-ACTOR: a gesture performed by a
 *    camera is still refused at `.actor`.
 * 8. Locomote refuses broken absolute node/group/bone/point destinations at `.to`,
 *    refuses vertical-only ground travel, resolves a live bone at
 *    `action.start`, and preserves the explicit relative direction/offscreen
 *    in-place fallback.
 */
export const test_film_perform_shot_positional_target = (): void => {
  const perform = createFilmPositionalTargetPerformer();

  // 1. every positional verb accepts a staged camera.
  for (const [label, action] of CAMERA_BY_VERB) {
    const performed = perform([action]);
    TestValidator.equals(
      `${label} at a staged camera performs`,
      performed.success,
      true,
    );
  }

  // 2. an unknown id is named, per verb, at its own path.
  for (const [label, action, path] of UNRESOLVED_BY_VERB) {
    const performed = perform([action]);
    TestValidator.equals(
      `${label} names the unresolved id, not the discriminator`,
      namedFacts([
        [
          "namesTheUnplacedId",
          () =>
            says(
              performed,
              path,
              '"ghost"',
              "is not placed in the staged scene",
            ),
        ],
        ["refused", () => performed.success === false],
        // the failure check is restated because the earlier fact's narrowing of
        // the result union does not reach inside this closure, and only the
        // failed arm carries `violations`.
        [
          "neverEchoesTheDiscriminator",
          () =>
            performed.success === false &&
            performed.violations.every(
              (item) => !item.expected.includes('not "node"'),
            ),
        ],
      ]),
      {
        namesTheUnplacedId: true,
        refused: true,
        neverEchoesTheDiscriminator: true,
      },
    );
  }

  assertFilmPositionalTargetKinds({ perform, says, silentAt });

  // 8. Locomote's in-place fallback belongs only to intentionally relative
  // targets. Broken absolute destinations are authored mistakes, not steps in
  // place that may be reported as a successful trip.
  const locomote = (
    to: IAutoMovieActionTarget,
    start = 0,
  ): IAutoMovieActionCall => ({
    verb: "locomote",
    actor: "knightA",
    start,
    duration: 1,
    gait: "walk",
    to,
  });
  TestValidator.predicate(
    "locomote refuses a group with no placed member",
    says(
      perform([locomote({ kind: "group", nodes: ["ghost"] })]),
      "$input.draft[0].to",
      "none of its group members are placed",
    ),
  );
  TestValidator.predicate(
    "locomote refuses an unstaged bone actor at its node",
    says(
      perform([locomote({ kind: "bone", node: "ghost", bone: "leftHand" })]),
      "$input.draft[0].to.node",
      "must be a staged scene node",
    ),
  );
  TestValidator.predicate(
    "locomote refuses non-finite point coordinates",
    says(
      perform([
        locomote({
          kind: "point",
          point: { x: Number.NaN, y: 0, z: 1 },
        }),
      ]),
      "$input.draft[0].to",
      "finite x/y/z coordinates",
    ),
  );
  TestValidator.predicate(
    "locomote refuses a vertical-only ground destination at its target",
    says(
      perform([
        locomote({
          kind: "point",
          point: { x: 0, y: 1, z: 0 },
        }),
      ]),
      "$input.draft[0].to",
      'actor "knightA"',
      "vertical-only destination",
      "walkable ground point",
    ),
  );
  TestValidator.predicate(
    "locomote uses the full displacement at the shared epsilon boundary",
    says(
      perform([
        locomote({
          kind: "point",
          point: { x: 0.8e-6, y: 0.8e-6, z: 0 },
        }),
      ]),
      "$input.draft[0].to",
      "vertical-only destination",
    ),
  );
  TestValidator.equals(
    "locomote may step in place at its exact current ground point",
    perform([
      locomote({
        kind: "point",
        point: { x: 0, y: 0, z: 0 },
      }),
    ]).success,
    true,
  );
  const resumedPerform = createFilmPositionalTargetPerformer(
    undefined,
    {
      beat: "beat-0",
      shot: "shot:beat-0",
      actors: [
        {
          node: "knightA",
          transform: {
            translation: { x: 1, y: 1, z: 0 },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: 1, y: 1, z: 1 },
          },
          facing: { x: 0, y: 0, z: 1 },
          pose: null,
          motion: null,
          localTime: 1,
          gaitPhase: null,
          rootVelocity: null,
          footPlants: null,
          mount: null,
        },
      ],
    },
    { x: 1, y: 1, z: 0 },
  );
  TestValidator.predicate(
    "locomote diagnoses from the resumed staged actor origin",
    says(
      resumedPerform([
        locomote({
          kind: "point",
          point: { x: 1, y: 0, z: 0 },
        }),
      ]),
      "$input.draft[0].to",
      "vertical-only destination",
    ),
  );
  TestValidator.equals(
    "a resumed horizontal destination uses the same staged world frame",
    resumedPerform([
      locomote({
        kind: "point",
        point: { x: 0, y: 1, z: 0 },
      }),
    ]).success,
    true,
  );
  for (const [label, target] of [
    ["node", { kind: "node", node: "altar" }],
    ["group", { kind: "group", nodes: ["altar", "ghost"] }],
    ["point", { kind: "point", point: { x: 1, y: 0, z: 1 } }],
    ["direction", { kind: "direction", headingDeg: 90 }],
    ["offscreen", { kind: "offscreen", edge: "left" }],
  ] as const)
    TestValidator.equals(
      `locomote accepts a legal ${label} target`,
      perform([locomote(target as IAutoMovieActionTarget)]).success,
      true,
    );

  const sampledAt: number[] = [];
  const livePerform = createFilmPositionalTargetPerformer(
    (_target, seconds) => {
      sampledAt.push(seconds);
      return { x: 1, y: 1.4, z: 1 };
    },
  );
  TestValidator.equals(
    "a live bone locomote target resolves at the action start",
    livePerform([
      locomote({ kind: "bone", node: "knightB", bone: "leftHand" }, 0.5),
    ]).success,
    true,
  );
  TestValidator.equals(
    "the live resolver receives action.start",
    sampledAt,
    [0.5],
  );
};
