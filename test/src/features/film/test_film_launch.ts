import {
  AutoMovieInteractionEventKind,
  IAutoMovieInteractionEvent,
  IAutoMovieLaunchAction,
  IAutoMovieReactAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieLaunchResult } from "@automovie/engine";
import { compileLaunch } from "@automovie/engine";
import { projectileAt } from "@automovie/engine";
import {
  namedFacts,
  nclose,
  throwsError,
  vclose,
} from "../internal/predicates";

/**
 * Build the original launch action with caller overrides applied last.
 *
 * Speed 20, release .5 and participant names are authored defaults, with explicit
 * per-case overrides. The owning test performs every solve and assertion.
 */
function launch(
  over: Partial<IAutoMovieLaunchAction> = {},
): IAutoMovieLaunchAction {
  return {
    verb: "launch",
    actor: "archer",
    projectile: "arrow",
    at: { kind: "node", node: "foe" },
    speed: 20,
    start: 0.5,
    duration: "auto",
    ...over,
  };
}

/**
 * `compileLaunch`: compose the `launch` verb's primitives into a projectile
 * flight plus the target's scheduled reaction. The contract: the baked flight
 * lands on the target, the reaction is scheduled at the computed contact (not a
 * hand-timed one), and its `from` recoils the body along the shot's travel.
 *
 * Scenarios:
 *
 * 1. A direct shot at a downrange target compiles: the clip is the projectile
 *    node's flight, its last position sits on the target, and the solved launch
 *    speed matches the request.
 * 2. With `onHit`, the emitted `react` targets the struck node, starts at
 *    `action.start + hitTime` (the computed contact, offset by the launch's own
 *    start), and carries the force/unbalance through.
 * 3. The react's `from` sits upstream of the incoming velocity, so `target − from`
 *    points down the arrow's travel: the body is knocked the way the arrow
 *    flew, not toward the shooter.
 * 4. Without `onHit`, no reaction is scheduled (`react` is null).
 * 5. The lobbed `high` arc reaches the same target with a longer flight than the
 *    flat `direct` arc.
 * 6. A target out of range at the given speed → null (nothing to fly).
 * 7. A vertical lob to exactly its apex (under a custom gravity) arrives with zero
 *    speed: the degenerate case where the incoming direction falls back to the
 *    sightline, so the reaction still has a well-formed `from`.
 * 8. With `targetAt`, the aim **leads a moving target**: against a foe sliding
 *    downrange, the baked flight lands where the target will be (past its start
 *    point), and the react is still timed to the computed contact. `targetAt`
 *    reads shot time, so a launch loosed at 0.5 s meets the foe where it stands
 *    at `0.5 + hitTime`, not where it stood `hitTime` after the shot began.
 * 9. A nodeless aim without onHit keeps its flight/contact; requesting a recoil
 *    with a null or blank targetNode is refused rather than silently omitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises compileLaunch's flight, timed recoil, impact events and moving interception; assertions catch wrong speed or landing, reversed incoming recoil, missing onHit actors, and an event clock that omits the action start.
 * @evidence contracts/testing.md#independent-expectations Requested speed and target coordinates define the static oracle; constant-velocity target motion defines the independent interception oracle, and the custom-gravity apex gives a zero-velocity sightline case. Timing compares the solved contact against the same result's reaction and events, so it checks clock consistency rather than the ballistic root alone.
 * @evidence contracts/testing.md#distinguishing-cases Covers node and nodeless aims, reactions with and without unbalance, missing/blank struck actors, actor lists, direct and high arcs, unreachable targets, zero landing velocity and moving targets; full-shot admission and late-impact refusal belong to perform-shot launch tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous unit entry directly imports compileLaunch and projectileAt and executes its portable physics cases without a renderer, process or native artifact.
 */
export function test_film_launch(): void {
  const origin: IAutoMovieVector3 = { x: 0, y: 1.6, z: 0 };
  const target: IAutoMovieVector3 = { x: 12, y: 1.4, z: 0 };

  const hit: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ onHit: { force: 0.7, unbalance: true } }),
    origin,
    target,
    targetNode: "foe",
  })!;

  // 1. the flight lands on the target, at the requested speed
  TestValidator.equals(
    "the flight is the projectile node's clip",
    hit.clip.id,
    "trajectory:arrow",
  );
  const values: number[] = hit.clip.tracks[0]!.values;
  TestValidator.predicate(
    "the baked flight ends on the target",
    vclose(
      {
        x: values[values.length - 3]!,
        y: values[values.length - 2]!,
        z: values[values.length - 1]!,
      },
      target,
      2e-3,
    ),
  );
  TestValidator.predicate(
    "the hit point is the target",
    vclose(hit.hitPoint, target, 2e-3),
  );
  TestValidator.predicate(
    "launch speed matches the request",
    nclose(
      Math.hypot(hit.velocity.x, hit.velocity.y, hit.velocity.z),
      20,
      1e-9,
    ),
  );
  TestValidator.predicate("a positive flight time", hit.hitTime > 0);

  // 2. the reaction is scheduled at the computed contact
  const react: IAutoMovieReactAction = hit.react!;
  TestValidator.equals("the struck node reacts", react.actor, "foe");
  TestValidator.equals("react verb", react.verb, "react");
  TestValidator.predicate(
    "react starts at launch.start + hitTime",
    nclose(react.start, 0.5 + hit.hitTime),
  );
  TestValidator.predicate("force carried through", nclose(react.force, 0.7));
  TestValidator.equals("unbalance carried through", react.unbalance, true);
  TestValidator.equals(
    "the launch emits contact, hit, and fall events",
    hit.events.map(
      (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
        event.kind,
    ),
    ["contact", "hit", "fall"],
  );
  TestValidator.predicate(
    "the contact time and point follow the solved landing",
    (): boolean =>
      hit.events[0]!.actionIndex === null &&
      nclose(hit.events[0]!.time, react.start) &&
      hit.events[0]!.point !== null &&
      vclose(hit.events[0]!.point, target, 2e-3),
  );
  TestValidator.equals(
    "the contact event is the collision-solver landing",
    namedFacts([
      [
        "hitEventsSource",
        (): boolean => hit.events[0]!.source === "collisionSolver",
      ],
      ["hitEventsTarget", (): boolean => hit.events[0]!.target === "foe"],
      ["hitEventsObject", (): boolean => hit.events[0]!.object === "arrow"],
      [
        "hitEventsActionIndex",
        (): boolean => hit.events[0]!.actionIndex === null,
      ],
      [
        "hitEventsPoint",
        (): boolean =>
          hit.events[0]!.actionIndex === null && hit.events[0]!.point !== null,
      ],
    ]),
    {
      hitEventsSource: true,
      hitEventsTarget: true,
      hitEventsObject: true,
      hitEventsActionIndex: true,
      hitEventsPoint: true,
    },
  );
  TestValidator.predicate(
    "the hit event uses the reaction contact second",
    (): boolean => nclose(hit.events[1]!.time, react.start),
  );
  TestValidator.equals(
    "the hit event names the downstream reaction",
    namedFacts([
      [
        "hitEventsSource",
        (): boolean => hit.events[1]!.source === "impactOutput",
      ],
      ["hitEventsReaction", (): boolean => hit.events[1]!.reaction === "foe"],
    ]),
    { hitEventsSource: true, hitEventsReaction: true },
  );
  TestValidator.equals(
    "unbalance emits a fall event",
    namedFacts([
      ["hitEventsKind", (): boolean => hit.events[2]!.kind === "fall"],
      [
        "hitEventsActor",
        (): boolean =>
          hit.events[2]!.kind === "fall" && hit.events[2]!.actor === "foe",
      ],
      [
        "hitEventsSource",
        (): boolean =>
          hit.events[2]!.kind === "fall" &&
          hit.events[2]!.source === "impactOutput",
      ],
      [
        "hitEventsReaction",
        (): boolean =>
          hit.events[2]!.kind === "fall" && hit.events[2]!.reaction === "foe",
      ],
    ]),
    {
      hitEventsKind: true,
      hitEventsActor: true,
      hitEventsSource: true,
      hitEventsReaction: true,
    },
  );

  // 3. `from` sits upstream of the incoming velocity: the body is knocked the
  // way the arrow flew, not toward the shooter. `hitPoint − from` reconstructs
  // the incoming direction within the selected tolerance, and
  // it runs downrange (+x, no lateral drift for this in-plane shot).
  const from: IAutoMovieVector3 | null =
    react.from.kind === "point" ? react.from.point : null;
  TestValidator.predicate("react.from is a world point", from !== null);
  const knock: IAutoMovieVector3 = {
    x: hit.hitPoint.x - from!.x,
    y: hit.hitPoint.y - from!.y,
    z: hit.hitPoint.z - from!.z,
  };
  TestValidator.predicate(
    "the recoil runs downrange (+x), no lateral drift",
    (): boolean =>
      knock.x > 0 && Math.abs(knock.z) < 1e-9 && nclose(knock.z, 0, 1e-9),
  );
  const vHit: IAutoMovieVector3 = projectileAt(
    { origin, velocity: hit.velocity, gravity: { x: 0, y: -9.81, z: 0 } },
    hit.hitTime,
  ).velocity;
  const vLen: number = Math.hypot(vHit.x, vHit.y, vHit.z);
  TestValidator.predicate(
    "the recoil direction matches incoming velocity within 1e-9",
    vclose(
      knock,
      { x: vHit.x / vLen, y: vHit.y / vLen, z: vHit.z / vLen },
      1e-9,
    ),
  );
  TestValidator.predicate(
    "and it noses downward (a lobbed hit comes down)",
    knock.y < 0,
  );

  // 4. no onHit → no scheduled reaction
  const quiet: IAutoMovieLaunchResult = compileLaunch({
    action: launch(),
    origin,
    target,
    targetNode: "foe",
  })!;
  TestValidator.equals("no onHit → no react", quiet.react, null);

  TestValidator.equals(
    "a hit without onHit still records contact and hit",
    quiet.events.map(
      (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
        event.kind,
    ),
    ["contact", "hit"],
  );
  TestValidator.equals(
    "but it records no downstream reaction",
    quiet.events[1]!.reaction,
    null,
  );
  const listedActor: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ actor: ["archer", "spotter"] }),
    origin,
    target,
    targetNode: "foe",
  })!;
  TestValidator.equals(
    "actor-list launch events use the first actor",
    listedActor.events[0]!.actor,
    "archer",
  );
  const emptyActor: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ actor: [] }),
    origin,
    target,
    targetNode: "foe",
  })!;
  TestValidator.equals(
    "empty actor-list launch events record no initiator",
    emptyActor.events[0]!.actor,
    null,
  );

  // 4b. A literal aim without onHit still flies and records contact only.
  const pointed: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ at: { kind: "point", point: target } }),
    origin,
    target,
    targetNode: null,
  })!;
  TestValidator.equals("a nodeless target → no react", pointed.react, null);
  TestValidator.equals(
    "a point target records contact but no node hit",
    pointed.events.map(
      (event: IAutoMovieInteractionEvent): AutoMovieInteractionEventKind =>
        event.kind,
    ),
    ["contact"],
  );
  TestValidator.equals(
    "the contact has no target node",
    pointed.events[0]!.target,
    null,
  );
  TestValidator.predicate(
    "but the flight still bakes",
    (): boolean =>
      pointed.clip.id === "trajectory:arrow" &&
      vclose(pointed.hitPoint, target, 2e-3),
  );
  for (const targetNode of [null, "", " "])
    TestValidator.predicate(
      "a requested reaction without an identified struck actor is refused",
      throwsError(
        (): unknown =>
          compileLaunch({
            action: launch({ onHit: { force: 0.9 } }),
            origin,
            target,
            targetNode,
          }),
        ["onHit requires", "targetNode", "struck actor"],
      ),
    );

  // 5. the high arc flies longer than the direct arc to the same target
  const direct: IAutoMovieLaunchResult = compileLaunch({
    action: launch(),
    origin,
    target,
    targetNode: "foe",
  })!;
  const high: IAutoMovieLaunchResult = compileLaunch({
    action: launch(),
    origin,
    target,
    targetNode: "foe",
    arc: "high",
  })!;
  TestValidator.predicate(
    "the high arc flies longer than the direct arc",
    high.hitTime > direct.hitTime,
  );
  TestValidator.predicate(
    "the high arc also lands on the target",
    vclose(high.hitPoint, target, 2e-3),
  );

  // 6. out of range → null
  TestValidator.equals(
    "a target out of range → null",
    compileLaunch({
      action: launch({ speed: 4 }),
      origin,
      target: { x: 200, y: 1.4, z: 0 },
      targetNode: "foe",
    }),
    null,
  );

  // 7. a vertical lob to exactly its apex under a custom gravity: speed 10,
  // g = 8 → apex 100/16 = 6.25 m (all exact in float), where the projectile
  // arrives with zero velocity. The incoming direction degenerates, so `from`
  // falls back to the sightline (straight up), one meter below the target.
  const apex: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ speed: 10, onHit: { force: 0.5 } }),
    origin: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 6.25, z: 0 },
    targetNode: "foe",
    gravity: { x: 0, y: -8, z: 0 },
  })!;
  TestValidator.predicate(
    "the apex lob lands on the target",
    vclose(apex.hitPoint, { x: 0, y: 6.25, z: 0 }, 1e-6),
  );
  TestValidator.predicate(
    "the apex-lob react.from falls back to the sightline",
    (): boolean =>
      apex.react!.from.kind === "point" &&
      vclose(apex.react!.from.point, { x: 0, y: 5.25, z: 0 }, 1e-6),
  );
  TestValidator.equals(
    "onHit without unbalance carries undefined through",
    apex.react!.unbalance,
    undefined,
  );

  // 8. leading a MOVING target: with `targetAt` sampling a foe sliding downrange
  // (+x at 4 m/s from x = 10 at shot time 0), the aim leads it: the baked
  // flight lands where the target WILL be when the arrow arrives, shot time
  // `start + hitTime`, past its start point, and the react is still timed to
  // the computed contact.
  const startAt: IAutoMovieVector3 = { x: 10, y: 1.4, z: 0 };
  /**
   * The authored target starts at X=10 and moves along +X at 4 m/s.
   *
   * The authored affine path X=10+4t is independent of the ballistic solver.
   * The owner's landing check uses returned flight time, so it witnesses
   * interception consistency rather than independently measuring the root time.
   */
  function slide(t: number): IAutoMovieVector3 {
    return {
      x: startAt.x + 4 * t,
      y: startAt.y,
      z: startAt.z,
    };
  }
  const led: IAutoMovieLaunchResult = compileLaunch({
    action: launch({ speed: 24, onHit: { force: 0.6 } }),
    origin,
    target: startAt,
    targetNode: "foe",
    targetAt: slide,
  })!;
  TestValidator.predicate(
    "the led flight lands where the moving target will be",
    vclose(led.hitPoint, slide(0.5 + led.hitTime), 2e-3),
  );
  TestValidator.predicate(
    "leading a +x mover aims past its start point",
    led.hitPoint.x > startAt.x + 1e-3,
  );
  TestValidator.predicate(
    "the moving-target react is timed to the computed contact",
    (): boolean =>
      led.react !== null && nclose(led.react.start, 0.5 + led.hitTime),
  );
  TestValidator.predicate(
    "the moving-target hit event follows the led contact time",
    led.events.some(
      (event: IAutoMovieInteractionEvent): boolean =>
        event.kind === "hit" &&
        event.target === "foe" &&
        nclose(event.time, 0.5 + led.hitTime),
    ),
  );
}
