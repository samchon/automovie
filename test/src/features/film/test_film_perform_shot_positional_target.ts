import type { IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieConstraintViolation } from "@automovie/interface";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";

import { TestValidator } from "@nestia/e2e";

import { assertFilmPositionalTargetKinds } from "../internal/assertFilmPositionalTargetKinds";
import { createFilmPositionalTargetPerformer } from "../internal/createFilmPositionalTargetPerformer";
import { namedFacts, nclose } from "../internal/predicates";

/** True when the refusal at `path` states every fragment. */
function says (
  result: IAutoMoviePerformedShot,
  path: string,
  ...fragments: string[]
): boolean { return result.success === false &&
  result.violations.some(
    (item: IAutoMovieConstraintViolation) : boolean =>
      item.path === path &&
      fragments.every((fragment: string) : boolean => item.expected.includes(fragment)),
  ); }

/** True when nothing was refused at `path` (the over-rejection counter-case). */
function silentAt (result: IAutoMoviePerformedShot, path: string): boolean { return result.success === true ||
  result.violations.every((item: IAutoMovieConstraintViolation) : boolean => item.path !== path); }

/** Shared staged actor and one-second span; each case changes its target or verb. */
const TIMING: { actor: string; start: number; duration: number } = { actor: "knightA", start: 0, duration: 1 };

/** One unresolved-target probe per verb that routes through the helper. */
const UNRESOLVED_BY_VERB: ReadonlyArray<
  readonly [string, IAutoMovieActionCall, string]
> = [
  [
    "locomote",
    {
      verb: "locomote",
      ...TIMING,
      gait: "walk",
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "lookAt",
    {
      verb: "lookAt",
      ...TIMING,
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "reach",
    {
      verb: "reach",
      ...TIMING,
      hand: "right",
      to: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].to",
  ],
  [
    "point gesture",
    {
      verb: "gesture",
      ...TIMING,
      kind: "point",
      at: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].at",
  ],
  [
    "strike gesture",
    {
      verb: "gesture",
      ...TIMING,
      kind: "strike",
      at: { kind: "node", node: "ghost" },
    },
    "$input.draft[0].at",
  ],
  [
    "launch",
    {
      verb: "launch",
      ...TIMING,
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
      ...TIMING,
      gait: "walk",
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "lookAt",
    {
      verb: "lookAt",
      ...TIMING,
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "reach",
    {
      verb: "reach",
      ...TIMING,
      hand: "right",
      to: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "point gesture",
    {
      verb: "gesture",
      ...TIMING,
      kind: "point",
      at: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "strike gesture",
    {
      verb: "gesture",
      ...TIMING,
      kind: "strike",
      at: { kind: "node", node: "cam-main" },
    },
  ],
  [
    "launch",
    {
      verb: "launch",
      ...TIMING,
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
 * Performance targets resolve against staged placements without silently dropping members.
 *
 * Scenarios:
 * 1. Positional verbs accept staged cameras, actors and set pieces.
 * 2. Missing ids are refused by their identity at each verb's owning target path.
 * 3. Empty/missing/mixed groups and malformed/relative targets receive located faults.
 * 4. A camera may be a target but cannot perform a gesture.
 * 5. Locomote distinguishes vertical-only, in-place, horizontal and relative goals.
 * 6. Resumed origins and live bone targets use the authored world frame and action clock.
 * 7. Every group member is admitted, and invalid targets never reach a live resolver.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls performShot through the shared positional-target performer for each applicable verb and asserts accepted placements, located target faults, actor-camera separation and locomote displacement checks; the delegated kind cases also detect a silently omitted group member.
 * @evidence contracts/testing.md#independent-expectations Authored fixture positions and target ids determine placement and displacement outcomes; the live resolver records the supplied action clock independently, and refusal messages must name the actual missing data instead of merely echoing a legal discriminator.
 * @evidence contracts/testing.md#distinguishing-cases Covers camera/actor/set subjects, missing nodes, malformed and relative targets, empty/all-missing/mixed groups, unstaged bones, non-finite points, vertical-only and in-place travel, epsilon-boundary displacement and resumed/live targets; launch-specific recoil admission has a separate test.
 * @evidence contracts/testing.md#execution-ownership This portable unit entry owns the table-driven verb cases and invokes assertFilmPositionalTargetKinds for the delegated kind cases; both reach engine source without a browser, process or native build.
 */
export function test_film_perform_shot_positional_target (): void {
  const perform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = createFilmPositionalTargetPerformer();

  // 1. every positional verb accepts a staged camera.
  for (const [label, action] of CAMERA_BY_VERB) {
    const performed: IAutoMoviePerformedShot = perform([action]);
    TestValidator.equals(
      `${label} at a staged camera performs`,
      performed.success,
      true,
    );
  }

  // 2. an unknown id is named, per verb, at its own path.
  for (const [label, action, path] of UNRESOLVED_BY_VERB) {
    const performed: IAutoMoviePerformedShot = perform([action]);
    TestValidator.equals(
      `${label} names the unresolved id, not the discriminator`,
      namedFacts([
        [
          "namesTheUnplacedId",
          () : boolean =>
            says(
              performed,
              path,
              '"ghost"',
              "is not placed in the staged scene",
            ),
        ],
        ["refused", () : boolean => performed.success === false],
        // the failure check is restated because the earlier fact's narrowing of
        // the result union does not reach inside this closure, and only the
        // failed arm carries `violations`.
        [
          "neverEchoesTheDiscriminator",
          () : boolean =>
            performed.success === false &&
            performed.violations.every(
              (item: IAutoMovieConstraintViolation) : boolean => !item.expected.includes('not "node"'),
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
  function locomote (
    to: IAutoMovieActionTarget,
    start: number = 0,
  ): IAutoMovieActionCall { return ({
    verb: "locomote",
    actor: "knightA",
    start,
    duration: 1,
    gait: "walk",
    to,
  }); }
  TestValidator.predicate(
    "locomote refuses a group with no placed member",
    says(
      perform([locomote({ kind: "group", nodes: ["ghost"] })]),
      "$input.draft[0].to.nodes[0]",
      '"ghost"',
      "must name a staged placement",
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
  const resumedPerform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = createFilmPositionalTargetPerformer(
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
    ["group", { kind: "group", nodes: ["altar", "knightB"] }],
    ["point", { kind: "point", point: { x: 1, y: 0, z: 1 } }],
    ["direction", { kind: "direction", headingDeg: 90 }],
    ["offscreen", { kind: "offscreen", edge: "left" }],
  ] as const)
    TestValidator.equals(
      `locomote accepts a legal ${label} target`,
      perform([locomote(target as IAutoMovieActionTarget)]).success,
      true,
    );

  TestValidator.predicate(
    "locomote refuses a group whose missing member would change its centroid",
    says(
      perform([locomote({ kind: "group", nodes: ["altar", "ghost"] })]),
      "$input.draft[0].to.nodes[1]",
      '"ghost"',
      "must name a staged placement",
      "centroid",
    ),
  );

  const sampledAt: number[] = [];
  const livePerform: (draft: IAutoMovieActionCall[]) => IAutoMoviePerformedShot = createFilmPositionalTargetPerformer(
    (_target: IAutoMovieActionTarget, seconds: number) : { x: number; y: number; z: number; } => {
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
  TestValidator.predicate(
    "the live resolver receives action.start",
    sampledAt.length === 1 && nclose(sampledAt[0]!, 0.5),
  );
  sampledAt.length = 0;
  for (const target of [
    { kind: "node", node: "ghost" },
    { kind: "point" } as never,
    { kind: "group", nodes: ["altar", "ghost"] },
    { kind: "group", nodes: [] },
    { kind: "bone", node: "ghost", bone: "leftHand" },
    { kind: "direction", headingDeg: 90 },
    { kind: "offscreen", edge: "left" },
  ] satisfies IAutoMovieActionTarget[])
    TestValidator.equals("a live resolver cannot admit a malformed or unstaged target", livePerform([{ verb: "lookAt", actor: "knightA", start: 0, duration: 1, to: target }]).success, false);
  TestValidator.equals("invalid target payloads never reach the live resolver", sampledAt, []);
}
