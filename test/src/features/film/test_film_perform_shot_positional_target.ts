import { filmPositionalTargetSays as says } from "../internal/filmPositionalTargetSays";
import { filmPositionalTargetSilentAt as silentAt } from "../internal/filmPositionalTargetSilentAt";
import { createFilmPositionalLocomote as locomote } from "../internal/createFilmPositionalLocomote";
import type { IAutoMovieActionCall, IAutoMovieActionTarget, IAutoMovieConstraintViolation } from "@automovie/interface";

import { IAutoMoviePerformedShot } from "../../../../packages/engine/src/film/IAutoMoviePerformedShot";

import { TestValidator } from "@nestia/e2e";

import { assertFilmPositionalTargetKinds } from "../internal/assertFilmPositionalTargetKinds";
import { createFilmPositionalTargetPerformer } from "../internal/createFilmPositionalTargetPerformer";
import { namedFacts, nclose } from "../internal/predicates";

/**
 * Shared staged actor and one-second span; each case changes its target or verb.
 */
const TIMING: { actor: string; start: number; duration: number } = { actor: "knightA", start: 0, duration: 1 };

/**
 * One unresolved-target probe per verb that routes through the helper.
 */
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

/**
 * The same probes, aimed at a staged camera instead of an unknown id.
 */
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
 * Calls performShot through the shared positional-target performer for each applicable verb and asserts accepted placements, located target faults, actor-camera separation and locomote displacement checks; the delegated kind cases also detect a silently omitted group member.
 *
 * Scenarios:
 * 1. Admit staged camera targets for the eight listed verb/field roles.
 * 2. Locate unknown node targets and name the missing id rather than the kind.
 * 3. Delegate actor/set target neighbours.
 * 4. Delegate empty, all-missing and mixed group refusals.
 * 5. Delegate missing-point, relative, unknown and malformed target kinds.
 * 6. Delegate the absent point-gesture aim refusal.
 * 7. Delegate camera-as-actor refusal without inventing an aim error.
 * 8. Distinguish locomote vertical-only, epsilon-band and in-place destinations.
 * 9. Diagnose from explicitly restaged carried-origin coordinates and admit legal target kinds.
 * 10. Observe live-bone action-start timing and keep malformed targets away from the callback.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls performShot through the shared positional-target performer for each applicable verb and asserts accepted placements, located target faults, actor-camera separation and locomote displacement checks; the delegated kind cases also detect a silently omitted group member.
 * @evidence contracts/testing.md#independent-expectations Authored positions and ids determine displacement and refusal paths. The .8e-6 X/Y case has full distance above 1e-6 but horizontal distance below it. The carried-origin case explicitly restages (1,1,0) as well as supplying previous state, so it does not isolate automatic continuity restoration. The live callback records action start independently and compares .5 seconds with canonical nclose; no expected diagnosis is read from the gate's own report.
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
