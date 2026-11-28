import {
  AutoMovieArchetypeBasketballHoop,
  AutoMovieArchetypeSphericalBall,
} from "@automovie/archetypes";
import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBallSport,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
  AutoMovieMotionHumanThrowCatch,
  AutoMovieMotionHumanVerdicts,
} from "@automovie/motions";
import assert from "node:assert/strict";

import { AutoMovieMotionHumanAuditTangle } from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTangle";
import { HumanPropHandback } from "../../../../../packages/motions/src/perform/internal/HumanPropHandback";
import { HumanHand } from "../../../../../packages/motions/src/posture/internal/HumanHand";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * A stock character moves through two native court rebounds and takes a final
 * gather, or keeps dribbling for a third rebound.
 *
 * The holding elbow, wrist and finger remain continuous when the first push
 * begins on either gait. The moving gather keeps both palms on the carried
 * sphere as the thumbs open within the body-clearance bound and return during
 * the hold. A separate pass from that gather leads to a set shot with a
 * continuous detached finish.
 *
 * The same schedule refuses a physically blocked rebound, a displaced launch, a
 * same-valued copy of the wrong runtime owner, upward velocity and no gait.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the actual moving ball, repeated touch and hold outcomes and the matched refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Uses the shipped law through the typed stock chain. Brackets the displayed elbow, wrist and finger at initial acquisition and reads native bounce, release, gait and gather records. Reads the gathered ball, both palms and stock thumb colliders through the timed carry, then checks the receiver's body across the detached shot finish.
 * @evidence contracts/development/testing.md#independent-expectations A two-microsecond interval cannot contain more than five metres per second of joint travel or a visible change of the held hand. Each anchored offset fixes a distinct touch. The sphere radius defines the moving palm gap and the existing 10 mm body bound judges the thumb against the spine. The matched pass and catch retain the reference shot release while the native body limits judge the whole finish. The support plane and stock sphere determine floor contact. The obstructing prop is placed across the clear arc and the malformed incoming publications use the same arm pose and authored times.
 */
export async function test_motions_sport_dribble_push(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const model = AutoMovieArchetypeSphericalBall.create({
    id: "ball",
    kind: "basketball",
  });
  const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  const ball: IAutoMovieMotionHumanProp = {
    subject: "ball",
    frame: {
      position: point(-0.26, 0.96 - model.dimensions.diameter! / 2, 0.42),
      rotation,
    },
    points: {},
    shapes: model.shapes(),
    affordances: model.affordances,
    body: model.body,
  };
  const blocker: IAutoMovieMotionHumanProp = {
    subject: "blocker",
    fixed: true,
    frame: { position: point(-0.292, 0.5, 0.7), rotation },
    points: {},
    shapes: [
      {
        id: "blocker-sphere",
        material: "default",
        kind: "sphere",
        radius: 0.11,
        transform: { position: point(0, 0, 0), rotation },
      },
    ],
  };
  const first = point(
    0.008227268077920513,
    -2.5202183418750153,
    0.82572353716448,
  );
  const repeat = point(first.x, -2.4, first.z);

  type Variant =
    | "repeat"
    | "run"
    | "missingPalm"
    | "gather"
    | "shot"
    | "obstruction"
    | "offset"
    | "foreign"
    | "upward"
    | "stationary";
  const law = AutoMovieMotionHumanThrowCatch.dribblePush;
  const take = (variant: Variant): AutoMovieMotionHumanPerformance => {
    const dribblePush: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanBallSport.IDribblePush> =
      variant === "offset" || variant === "foreign" || variant === "missingPalm"
        ? {
            ...law,
            plan(context) {
              const planned = law.plan(context);
              if (context.params.incoming === undefined) return planned;
              if (variant === "missingPalm") {
                return {
                  ...planned,
                  posture(seconds, channels, resolution, projection) {
                    const base = context.carrier!.posture(
                      seconds,
                      channels,
                      resolution,
                      projection,
                    );
                    return {
                      ...base,
                      limbs: {
                        ...base.limbs,
                        rightArm: {
                          point: point(
                            base.root.x - 0.5,
                            base.root.y + 1.3,
                            base.root.z + 0.1,
                          ),
                          bend: point(
                            base.root.x - 0.38,
                            base.root.y + 1.08,
                            base.root.z + 0.2,
                          ),
                        },
                      },
                    };
                  },
                };
              }
              const launched = planned.launches![0]!;
              const changed =
                variant === "offset"
                  ? {
                      ...launched,
                      point: { ...launched.point, x: launched.point.x + 0.15 },
                    }
                  : HumanPropHandback.tag(launched, {
                      ...HumanPropHandback.predecessor(launched)!,
                    });
              return { ...planned, launches: [changed] };
            },
          }
        : law;
    const Chain = AutoMovieMotionHumanChain.extend({ dribblePush });
    const ready = Chain.subject("a")
      .pickUp(
        { prop: "ball", handle: "grip", lift: 0, hand: "right" },
        "pickup",
      )
      .stand({ hold: 0.25 }, "gather");
    const running = variant === "run";
    const gathers = variant === "gather" || variant === "shot";
    const gait = running
      ? ready.run(
          {
            to: point(0, 0, 3),
            pace: "jog",
            armSwing: 0,
            manner: { pace: 0.6 },
          },
          "carry",
        )
      : ready.walk(
          {
            to: point(0, 0, 3),
            pace: "normal",
            armSwing: 0,
            manner: { pace: 0.75 },
          },
          "carry",
        );
    const runningRelease = point(
      0.14953547854051896,
      -3.2561978556651283,
      1.3832898721899411,
    );
    const phrase =
      variant === "stationary"
        ? ready.dribblePush({ ball: "ball", velocity: first }, "push")
        : gait.over((arms) => {
            const immediate = arms
              .dribblePush(
                {
                  ball: "ball",
                  velocity:
                    variant === "upward"
                      ? point(0, 2, 0)
                      : running
                        ? runningRelease
                        : first,
                },
                "push",
              )
              .sync({ of: "carry", offset: running ? 0.64 : 0.75 })
              .dribblePush(
                {
                  ball: "ball",
                  velocity: gathers
                    ? point(0.15, -4.1, 1.9)
                    : running
                      ? point(runningRelease.x, -2.4, runningRelease.z)
                      : repeat,
                  incoming: { from: "push", seconds: running ? 0.54 : 0.5 },
                },
                "touch",
              );
            if (gathers)
              return immediate.stageCatch(
                {
                  partner: "touch",
                  ball: "ball",
                  hands: "two",
                  intercept: 0.55,
                },
                "secure",
              );
            if (variant === "repeat")
              return immediate.dribblePush(
                {
                  ball: "ball",
                  velocity: repeat,
                  incoming: { from: "touch", seconds: 0.48 },
                },
                "touch2",
              );
            return immediate;
          });
    if (variant === "shot") {
      const basket = AutoMovieArchetypeBasketballHoop.create({
        id: "hoop",
        ring: 0.45,
        height: 3.05,
      });
      const rim = point(
        0,
        basket.dimensions.height! - basket.dimensions.bar! / 2,
        1.5 + basket.dimensions.offset! + basket.dimensions.ring! / 2,
      );
      const pass = phrase
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
      const receive = Chain.subject("receiver")
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
      return new AutoMovieMotionHumanPerformance({
        seed: "court-witness",
        performers: [
          {
            subject: "a",
            body,
            at: point(0, 0, 0),
            yaw: 0,
            proficiency: { level: "elite" },
          },
          {
            subject: "receiver",
            body,
            at: point(0, 0, 4.57),
            yaw: 180,
            proficiency: { level: "elite" },
          },
        ],
        props: [
          ball,
          {
            subject: "hoop",
            fixed: true,
            frame: { position: point(0, 0, 1.5), rotation },
            points: {},
            shapes: basket.shapes(),
            affordances: basket.affordances,
            body: basket.body,
          },
        ],
        composition: pass.with(receive).node,
        laws: [dribblePush],
      });
    }
    return new AutoMovieMotionHumanPerformance({
      seed: "court-witness",
      performers: [
        {
          subject: "a",
          body,
          at: point(0, 0, 0),
          yaw: 0,
          proficiency: { level: "elite" },
        },
      ],
      props: variant === "obstruction" ? [ball, blocker] : [ball],
      composition: phrase.node,
      laws: [dribblePush],
    });
  };

  const recurring = take("repeat");
  const flights = recurring.flights("ball");
  assert.equal(flights.length, 3);
  const [initial, firstTouch, secondTouch] = flights;
  assert.ok(
    initial !== undefined &&
      firstTouch !== undefined &&
      secondTouch !== undefined,
  );
  assert.ok(nclose(firstTouch.launch - initial.launch, 0.5, 1e-10));
  assert.ok(nclose(secondTouch.launch - firstTouch.launch, 0.48, 1e-10));
  assert.equal(initial.supersededAt, firstTouch.launch);
  assert.equal(firstTouch.supersededAt, secondTouch.launch);
  assert.equal(
    HumanPropHandback.predecessor(firstTouch.published),
    initial.published,
  );
  assert.equal(
    HumanPropHandback.predecessor(secondTouch.published),
    firstTouch.published,
  );
  for (const flight of flights) {
    assert.equal(flight.contact?.struck.kind, "ground");
    assert.equal(flight.contact?.outcome, "bounce");
    assert.ok(flight.end > flight.launch);
    assert.ok(flight.end < (flight.supersededAt ?? recurring.duration));
    assert.ok(nclose(flight.contact.point.y, 0, 1e-10));
  }
  const before = recurring.pose("a", initial.launch).root;
  const after = recurring.pose("a", secondTouch.launch).root;
  assert.ok(before !== null && after !== null);
  assert.ok(after.translation.z - before.translation.z > 0.7);
  const held = recurring
    .play("ball")
    .events.filter((event) => event.kind === "hold");
  assert.equal(held.length, 1);
  assert.equal(held[0]!.to, initial.launch);

  const jogging = take("run");
  const [jogPush, jogTouch] = jogging.flights("ball");
  assert.ok(jogPush !== undefined && jogTouch !== undefined);
  assert.equal(jogPush.contact?.struck.kind, "ground");
  assert.equal(jogTouch.contact?.struck.kind, "ground");
  assert.ok(nclose(jogTouch.launch - jogPush.launch, 0.54, 1e-10));
  assert.equal(
    HumanPropHandback.predecessor(jogTouch.published),
    jogPush.published,
  );
  const jogStart = jogging.pose("a", jogPush.launch).root;
  const jogEnd = jogging.pose("a", jogTouch.launch).root;
  assert.ok(jogStart !== null && jogEnd !== null);
  assert.ok(jogEnd.translation.z - jogStart.translation.z > 0.5);

  for (const moving of [recurring, jogging]) {
    const entry = moving
      .overlays("a")
      .find((segment) => segment.id === "push")!.start;
    const before = moving.bones("a", entry - 1e-6);
    const after = moving.bones("a", entry + 1e-6);
    for (const bone of [
      "rightLowerArm",
      "rightHand",
      "rightLittleDistal",
    ] as const) {
      const from = before.get(bone)!;
      const to = after.get(bone)!;
      assert.ok(
        Math.hypot(
          to.worldPosition.x - from.worldPosition.x,
          to.worldPosition.y - from.worldPosition.y,
          to.worldPosition.z - from.worldPosition.z,
        ) < 1e-5,
        `${bone} moves continuously across the held-push entry`,
      );
      const q = from.worldRotation;
      const r = to.worldRotation;
      const dot = Math.abs(q.x * r.x + q.y * r.y + q.z * r.z + q.w * r.w);
      assert.ok(
        2 * Math.acos(Math.min(1, dot)) < 1e-4,
        `${bone} turns continuously across the held-push entry`,
      );
    }
  }

  const gathering = take("gather");
  const finishing = gathering.flights("ball").at(-1)!;
  assert.equal(finishing.contact?.outcome, "bounce");
  assert.ok(nclose(finishing.capturedAt! - finishing.launch, 0.55, 1e-10));
  const custody = gathering
    .play("ball")
    .events.find((event) => event.kind === "hold" && event.caught);
  assert.ok(custody?.kind === "hold");
  assert.equal(custody.from, finishing.capturedAt);
  assert.deepEqual(custody.hands, ["left", "right"]);
  assert.ok(custody.to >= gathering.duration);
  const gather = gathering
    .overlays("a")
    .find((segment) => segment.id === "secure")!;
  const event = (name: string) =>
    gather.start +
    gather.plan.duration *
      gather.plan.events.find((entry) => entry.name === name)!.share;
  const secured = event("secured");
  const carried = event("held");
  const sphere = finishing.published.sphere!;
  for (let sample = 0; sample <= 80; ++sample) {
    const seconds = secured + ((carried - secured) * sample) / 80;
    const bones = gathering.bones("a", seconds);
    const ball = gathering.prop("ball", seconds);
    const centre = AutoMovieEngineVector3.add(
      ball.position,
      AutoMovieEngineQuaternion.rotateVector(ball.rotation, sphere.centre),
    );
    for (const side of ["left", "right"] as const) {
      const palm = HumanHand.frame(body, bones, side, "palm", "relaxed").point;
      assert.ok(
        Math.abs(
          AutoMovieEngineVector3.distance(centre, palm) - sphere.radius,
        ) < 0.007,
      );
    }
    for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
      if (
        (pair.a === "leftThumbDistal" && pair.b === "spine") ||
        (pair.a === "spine" && pair.b === "leftThumbDistal")
      )
        assert.ok(
          pair.depth <= 0.01,
          "the secured thumb stays within the spine-clearance bound",
        );
  }
  const thumb = (seconds: number) =>
    gathering
      .pose("a", seconds)
      .joints.find((joint) => joint.bone === "leftThumbDistal")!.flexion!;
  assert.ok(nclose(thumb(secured), 25, 1e-6));
  assert.ok(nclose(thumb(carried), 0, 1e-6));
  assert.ok(nclose(thumb(gather.end - 1e-6), 25, 1e-6));

  const scored = take("shot");
  const scoreFlight = scored.flights("ball").at(-1)!;
  assert.ok(nclose(scoreFlight.launch, 8.107847042417557, 1e-10));
  assert.equal(scoreFlight.contact?.struck.kind, "ground");
  const report = AutoMovieMotionHumanVerdicts.read(scored, 24, {
    from: 0.65,
    to: 10.65,
  });
  assert.deepEqual(report.findings, []);

  const refusals = [
    ["obstruction", "ball", "not rising"],
    ["offset", "ball", "position error"],
    ["foreign", "ball", "does not own the ball"],
    ["missingPalm", "ball", "final fitted palm misses the ball"],
    ["upward", "velocity", "downward world velocity"],
    ["stationary", "over", "walk or run on the ground"],
  ] as const;
  for (const [variant, axis, reason] of refusals)
    assert.throws(
      () => take(variant),
      (error) =>
        error instanceof AutoMovieMotionHumanRefusal &&
        error.axis === axis &&
        error.message.includes(reason),
    );
}
