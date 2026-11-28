import {
  AutoMovieArchetypeBasketballHoop,
  AutoMovieArchetypeSphericalBall,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieHumanCanonicalBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanJump,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanThrowCatch,
} from "@automovie/motions";

import { M_AVERAGE } from "./M_AVERAGE";
import fixture from "./body.json" with { type: "json" };

const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});

/**
 * Resolve the original ten-performer scene at the source clock. Each mount owns
 * a fresh performance. The recovery variant adds a real two-hand receiver for
 * the same scored ball after the floor bounce.
 *
 * @param route The reviewed score route or the held-rebound variant.
 * @returns The native performance, display body, stock prop models and film
 *   window.
 * @evidence contracts/development/common.md#meaningful-documentation Names the source clock, result owners and the change the recovery input makes.
 * @evidence contracts/development/implementation.md#principled-implementation Stock actions read the ball and the moving carrier. Interceptions name prior launches and the installed performance resolves actual ownership and floor contact. A checked fixture supplies the same binding for the visible and physical bodies.
 * @evidence contracts/development/implementation.md#efficient-algorithms A mount resolves the shared body and fixed props once and builds one native performance for the chosen cast. The caller owns those objects for its seeks and releases them with the mount.
 */
export function stage(route: stage.Route = "score") {
  const authored = fixture as unknown as Pick<
    IAutoMovieHumanCanonicalBody.IBody,
    "skeleton" | "profile"
  >;
  const prepared = AutoMovieHumanCanonicalBody.prepare(M_AVERAGE.params, {
    id: "m-average",
    mass: M_AVERAGE.mass,
  });
  if (!sameBind(prepared.skeleton, authored.skeleton))
    throw new Error(
      "The installed m-average bind differs from this scene's snapshot.",
    );
  const canonical = { ...prepared, ...authored };
  const body = AutoMovieMotionHumanBody.create(
    canonical.skeleton,
    canonical.profile,
  );
  const stock = AutoMovieArchetypeSphericalBall.create({
    id: "ball",
    kind: "basketball",
  });
  const ring = AutoMovieArchetypeBasketballHoop.create({
    id: "hoop",
    ring: 0.45,
    height: 3.05,
  });
  const rotation = AutoMovieEngineQuaternion.identity();
  const hoopAt = point(0, 0, 1.5);
  const rim = point(
    0,
    ring.dimensions.height! - ring.dimensions.bar! / 2,
    hoopAt.z + ring.dimensions.offset! + ring.dimensions.ring! / 2,
  );
  const ball: IAutoMovieMotionHumanProp = {
    subject: "ball",
    frame: {
      position: point(-0.26, 0.96 - stock.dimensions.diameter! / 2, 0.42),
      rotation,
    },
    points: {},
    shapes: stock.shapes(),
    affordances: stock.affordances,
    body: stock.body,
  };
  const hoop: IAutoMovieMotionHumanProp = {
    subject: "hoop",
    fixed: true,
    frame: { position: hoopAt, rotation },
    points: {},
    shapes: ring.shapes(),
    affordances: ring.affordances,
    body: ring.body,
  };
  const person = (
    subject: string,
    x: number,
    z: number,
    yaw: number,
  ): IAutoMovieMotionHumanPerformer => ({
    body,
    subject,
    yaw,
    at: point(x, 0, z),
    proficiency: { level: "elite" },
  });
  const hasRebound = route === "recovery";
  const wingStart = point(-2.1, 0, 1.5);
  const wingEnd = point(-2.3, 0, 2.75);
  const wingHeading =
    (Math.atan2(wingEnd.x - wingStart.x, wingEnd.z - wingStart.z) * 180) /
    Math.PI;
  const cast = [
    person("a", 0, 0, 0),
    person("receiver", 0, 4.57, 180),
    person("defender", 1.35, 3.9, 180),
    person("a3", wingStart.x, wingStart.z, wingHeading),
    person("a4", -2.8, 3.9, 70),
    person("a5", 3.1, 4.1, 230),
    person("d2", 2, 1.3, 205),
    person("d3", -1.6, 3.5, 135),
    person("d4", 2.1, 4.7, 205),
    hasRebound ? person("d5", 0, -0.9, 0) : person("d5", -3.9, 4.5, 110),
  ];
  const { dribblePush } = AutoMovieMotionHumanThrowCatch;
  const { verticalContest } = AutoMovieMotionHumanJump;
  const Chain = AutoMovieMotionHumanChain.extend({
    dribblePush,
    verticalContest,
  });

  const passer = Chain.subject("a")
    .pickUp({ prop: "ball", handle: "grip", lift: 0, hand: "right" }, "pickup")
    .stand({ hold: 0.25 }, "gather")
    .walk(
      {
        to: point(0, 0, 3),
        pace: "normal",
        armSwing: 0,
        manner: { pace: 0.75 },
      },
      "carry",
    )
    .over((arms) =>
      arms
        .dribblePush(
          {
            ball: "ball",
            velocity: point(
              0.008227268077920513,
              -2.5202183418750153,
              0.82572353716448,
            ),
          },
          "push",
        )
        .sync({ of: "carry", offset: 0.75 })
        .dribblePush(
          {
            ball: "ball",
            velocity: point(0.15, -4.1, 1.9),
            incoming: { from: "push", seconds: 0.5 },
          },
          "touch",
        )
        .stageCatch(
          { partner: "touch", ball: "ball", hands: "two", intercept: 0.55 },
          "secure",
        ),
    )
    .stand({ hold: 0.15 }, "reset")
    .ballSport(
      {
        kind: "chestPass",
        prop: "ball",
        at: point(0, 1.33, 4.14),
        flightSeconds: 0.4,
      },
      "pass",
    )
    .stand({ hold: 0.15 });
  const receiver = Chain.subject("receiver")
    .stageCatch(
      { partner: "pass", ball: "ball", hands: "two", intercept: 0.4 },
      "receipt",
    )
    .stand({ hold: 0.1 })
    .ballSport(
      { kind: "setShot", prop: "ball", at: rim, flightSeconds: 1.05 },
      "shot",
    )
    .stand({ hold: 1.15 });
  const defender = Chain.subject("defender")
    .walk(
      {
        to: point(0.95, 0, 3.9),
        facing: { yaw: 180 },
        pace: "fast",
        manner: { pace: 1.2 },
      },
      "close",
    )
    .stand({ hold: 4.9 }, "ready")
    .verticalContest({ apex: 0.17 }, "contest")
    .stand({ hold: 1.6 }, "recover");
  const moves = [
    ["a3", wingEnd.x, wingEnd.z, wingHeading, 2.1],
    ["a4", -2.7, 3.3, 70, 4.2],
    ["a5", 2.8, 4.5, 230, 4.9],
    ["d2", 1.4, 2.7, 205, 2.1],
    ["d3", -1.35, 2.6, 135, 4.2],
    ["d4", 1.65, 4.8, 205, 5],
    ["d5", -3.6, 4.6, 110, 4],
  ] as const;
  const offBall = moves
    .filter(([subject]) => !hasRebound || subject !== "d5")
    .map(([subject, x, z, yaw, wait]) =>
      Chain.subject(subject)
        .stand({ hold: wait })
        .walk({ to: point(x, 0, z), facing: { yaw }, pace: "normal" })
        .stand({ hold: 1.8 }),
    );
  if (hasRebound)
    offBall.push(
      Chain.subject("d5")
        .stand({ hold: 7 }, "holdRecovery")
        .walk({ to: point(0, 0, -0.1), pace: "normal" }, "fillRecovery")
        .stageCatch(
          { partner: "shot", ball: "ball", hands: "two", intercept: 1.8 },
          "rebound",
        )
        .stand({ hold: 0.3 }),
    );
  const take = new AutoMovieMotionHumanPerformance({
    seed: "court-witness",
    performers: cast,
    props: [ball, hoop],
    laws: [dribblePush, verticalContest],
    composition: passer.with(receiver, defender, ...offBall).node,
  });
  return {
    take,
    canonical,
    cast,
    stock,
    ring,
    hoop,
    rim,
    filmWindow: { start: 0.65, end: 10.65 },
  };
}

export namespace stage {
  /** The placements used for the stock scene or its separately verified gather. */
  export type Route = "score" | "recovery";
}

/**
 * Body snapshots preserve authored rest planes within one trillionth of their
 * numeric unit.
 */
function sameBind(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (typeof left === "number" && typeof right === "number")
    return Math.abs(left - right) <= 1e-12;
  if (
    left === null ||
    right === null ||
    typeof left !== "object" ||
    typeof right !== "object"
  )
    return false;
  const a = Object.entries(left);
  const b = Object.entries(right);
  return (
    a.length === b.length &&
    a.every(
      ([name, value], index) =>
        name === b[index]![0] && sameBind(value, b[index]![1]),
    )
  );
}
