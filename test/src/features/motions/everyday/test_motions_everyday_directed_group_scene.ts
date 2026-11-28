import { AutoMovieArchetypeBox } from "@automovie/archetypes";
import {
  AutoMovieEnginePhysics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineRandom,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanConversation,
  AutoMovieMotionHumanGaze,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../internal/vclose";

/**
 * A worker redirects their attention while carrying a carton. The newly
 * addressed observer turns their head on the cue in one take and stays still in
 * the other. The carton continues moving in the same hand in both takes. In a
 * narrow aisle, one walker takes the side bay while the priority walker passes.
 * Reversing priority swaps their routes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two turns, the optional acknowledgment, the continuing task, and the priority reversal in the aisle.
 * @evidence contracts/development/testing.md#behavioral-verification Plays the attention cues with three bodies, a carton pickup and a walking carrier in two seeds. Plays both choices of priority between the same two staged obstacles, reading placed cue times, body headings and shoulder-envelope clearance.
 * @evidence contracts/development/testing.md#independent-expectations The addressees stand on opposite sides and the observer turns only after the redirect without changing carton custody. The aisle allows one shoulder envelope through at a time. The walker in the side bay holds until the other has passed and then leaves by the opposite mark.
 */
export async function test_motions_everyday_directed_group_scene(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
    x,
    y,
    z,
  });
  const actor = (
    subject: string,
    x: number,
    z: number,
    yaw: number,
  ): IAutoMovieMotionHumanPerformer => ({
    subject,
    body,
    at: point(x, 0, z),
    yaw,
    proficiency: { level: "trained" },
  });
  const worker = actor("worker", -0.32, 0, 0);
  const visitor = actor("visitor", 0.23, 1.1, 180);
  const observer = actor("observer", -1.13, 1.05, 180);
  const carton = AutoMovieMotionHumanObject.prop(
    "carton",
    AutoMovieArchetypeBox.create({ width: 0.43, height: 0.33, depth: 0.36 }),
    { at: point(-0.32, 0.73, 0.37), yaw: 0 },
  );
  const subject = AutoMovieMotionHumanChain.subject;
  const composition = subject(worker.subject)
    .stand({ hold: 0.4 })
    .pickUp({ prop: "carton", handle: "right", hand: "left" }, "acquire")
    .walk({ to: point(-0.32, 0, 0.65) }, "carry")
    .stand({ hold: 0.4 })
    .with(subject(visitor.subject).stand({ hold: 5, sway: 0 }))
    .with(subject(observer.subject).stand({ hold: 5, sway: 0 })).node;
  const forward = (
    take: AutoMovieMotionHumanPerformance,
    subject: string,
    seconds: number,
  ): IAutoMovieVector3 =>
    AutoMovieEngineQuaternion.rotateVector(
      take.bones(subject, seconds).get("head")!.worldRotation,
      point(0, 0, 1),
    );
  const carried = (take: AutoMovieMotionHumanPerformance, seconds: number) => {
    const hand = take.bones(worker.subject, seconds).get("leftHand")!;
    const carton = take.prop("carton", seconds);
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(hand.worldRotation),
      AutoMovieEngineVector3.subtract(carton.position, hand.worldPosition),
    );
  };

  for (const seed of ["stock-room-a", "stock-room-b"]) {
    const base = {
      seed,
      performers: [worker, visitor, observer],
      props: [carton],
      composition,
    };
    const bare = new AutoMovieMotionHumanPerformance(base);
    const start = bare.instant({ of: "carry", event: "start" });
    const end = bare.instant({ of: "carry", event: "end" });
    const offer = start + 0.07;
    const redirect = (start + end) / 2;
    const finish = end - 0.02;
    const workerGaze = AutoMovieMotionHumanGaze.HumanGaze.layer(
      AutoMovieMotionHumanConversation.groupGaze({
        subject: worker.subject,
        participants: [worker.subject, visitor.subject, observer.subject],
        turns: [
          {
            speaker: worker.subject,
            addressee: visitor.subject,
            from: offer,
            to: redirect,
          },
          {
            speaker: worker.subject,
            addressee: observer.subject,
            from: redirect,
            to: finish,
          },
        ],
        random: AutoMovieEngineRandom.createRandom(seed),
        eyes: 1.6,
      }).map((request) => ({ ...request, with: "head" as const })),
    );
    const cue = { of: "dialogue", event: "redirect" };
    const take = (respond: boolean): AutoMovieMotionHumanPerformance =>
      new AutoMovieMotionHumanPerformance({
        ...base,
        cues: {
          dialogue: [
            { name: "offer", seconds: offer },
            { name: "redirect", seconds: redirect },
          ],
        },
        layers: {
          worker: [workerGaze],
          ...(respond
            ? {
                observer: [
                  {
                    from: cue,
                    to: finish,
                    anchor: "ack",
                    fade: 0.035,
                    layer: ({ from, to }) =>
                      AutoMovieMotionHumanGaze.HumanGaze.layer([
                        {
                          from,
                          to,
                          with: "head",
                          target: {
                            kind: "person",
                            subject: worker.subject,
                            region: "face",
                          },
                        },
                      ]),
                  },
                ],
              }
            : {}),
        },
      });
    const active = take(true);
    const silent = take(false);
    const first = offer + (redirect - offer) * 0.38;
    const second = redirect + (finish - redirect) * 0.38;
    const onset = active.instant({ of: "ack", event: "onset" });
    const redirectedHeading = -0.48;
    TestValidator.predicate(
      `${seed} draws the observer only on the new address`,
      active.instant(cue) === onset &&
        first < onset &&
        onset < second &&
        forward(active, worker.subject, first).x > 0.28 &&
        forward(active, worker.subject, second).x < redirectedHeading &&
        Math.abs(forward(active, observer.subject, first).x) < 0.02 &&
        forward(active, observer.subject, second).x > 0.5 &&
        Math.abs(forward(silent, observer.subject, second).x) < 0.02,
    );

    for (const take of [active, silent]) {
      for (const seconds of [first, second]) {
        TestValidator.predicate(
          `${seed} preserves torso, walk and left-hand custody at ${seconds}`,
          vclose(
            take.bones(worker.subject, seconds).get("chest")!.worldPosition,
            bare.bones(worker.subject, seconds).get("chest")!.worldPosition,
            1e-6,
          ) &&
            vclose(
              take.prop("carton", seconds).position,
              bare.prop("carton", seconds).position,
              1e-6,
            ) &&
            vclose(carried(take, seconds), carried(bare, first), 0.001),
        );
      }
      TestValidator.predicate(
        `${seed} advances the held carton during the attention exchange`,
        AutoMovieEngineVector3.distance(
          take.prop("carton", first).position,
          take.prop("carton", second).position,
        ) > 0.35,
      );
    }
  }
  verifyPassage(body);
}

function verifyPassage(body: IAutoMovieMotionHumanBody): void {
  const at = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const boxes = [-0.62, 0.62].map((x, i) =>
    AutoMovieMotionHumanObject.prop(
      `aisle-${i}`,
      AutoMovieArchetypeBox.create({ width: 0.43, height: 0.59, depth: 0.36 }),
      { at: at(x, 0), yaw: 0, fixed: true },
    ),
  );
  const envelope = body.measure.shoulderHalfWidth + body.measure.upperArmRadius;
  const clearance = boxes.map((box) =>
    AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(
      box.frame,
      box.shapes![0]!,
    ),
  );
  const performers: readonly IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "north",
      body,
      at: at(0, -1.38),
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "south",
      body,
      at: at(0, 1.38),
      yaw: 180,
      proficiency: { level: "trained" },
    },
  ];
  const subject = AutoMovieMotionHumanChain.subject;
  TestValidator.predicate(
    "the aisle admits one shoulder envelope at a time",
    2 * envelope < 0.81 && 4 * envelope > 0.81,
  );
  for (const priority of ["north", "south"] as const) {
    const direction = priority === "north" ? 1 : -1;
    const yields = priority === "north" ? "south" : "north";
    const face = direction === 1 ? 180 : 0;
    const bay = subject(yields)
      .walk({ to: at(0.68, 0.5 * direction), face }, "bay")
      .stand({ hold: 2.7, sway: 0 }, "held")
      .walk({ to: at(0, 0.51 * direction), face }, "resume")
      .sync({ of: "held", event: "end" })
      .walk({ to: at(0, -1.38 * direction), face }, "depart");
    const through = subject(priority)
      .walk({ to: at(0, -0.8 * direction) }, "approach")
      .walk({ to: at(0, 1.38 * direction) }, "pass")
      .sync({ of: "held", event: "start", offset: 0.15 })
      .stand({ hold: 4, sway: 0 });
    const take = new AutoMovieMotionHumanPerformance({
      seed: "stock-room-passage",
      performers,
      props: boxes,
      composition: bay.with(through).node,
    });
    const time = (of: string, event: "start" | "end"): number =>
      take.instant({ of, event });
    const hold = time("held", "start");
    const pass = time("pass", "start");
    const clear = time("pass", "end");
    const resume = time("resume", "start");
    const depart = time("depart", "end");
    const reverseExitMark = -1.25;
    TestValidator.predicate(
      `${priority} passes after the other walker holds and before they resume`,
      time("bay", "end") === hold &&
        time("approach", "end") < pass &&
        Math.abs(pass - hold - 0.15) < 1e-9 &&
        pass < clear &&
        clear < resume &&
        resume === time("held", "end") &&
        take.posture(priority, pass).yaw === 180 - face &&
        take.posture(yields, pass).yaw === face &&
        take.posture(priority, clear).root.z * direction > 1.25 &&
        take.posture(yields, depart).root.z * direction < reverseExitMark,
    );
    const roots = (seconds: number): readonly IAutoMovieVector3[] => [
      take.posture(priority, seconds).root,
      take.posture(yields, seconds).root,
    ];
    const held = take.posture(yields, hold).root;
    let previous = roots(0);
    let closest = Infinity;
    let edge = Infinity;
    let holdTravel = 0;
    const samples = [
      ...new Set([
        hold,
        pass,
        clear,
        resume,
        depart,
        ...Array.from({ length: Math.ceil(depart * 60) }, (_, i) => i / 60),
      ]),
    ].sort((a, b) => a - b);
    for (const seconds of samples) {
      const next = roots(seconds);
      closest = Math.min(
        closest,
        Math.hypot(next[0]!.x - next[1]!.x, next[0]!.z - next[1]!.z),
      );
      for (const shape of clearance)
        for (const [i, point] of next.entries()) {
          const last = previous[i]!;
          edge = Math.min(
            edge,
            shape({ ...last, y: 0.35 }, { ...point, y: 0.35 }) - envelope,
          );
        }
      previous = next;
      if (hold <= seconds && seconds <= resume)
        holdTravel = Math.max(
          holdTravel,
          Math.hypot(next[1]!.x - held.x, next[1]!.z - held.z),
        );
    }
    TestValidator.predicate(
      `${priority} clears the other walker and both physical aisle edges`,
      closest > 2 * envelope + 0.03 &&
        edge > 0.02 &&
        held.x > 0.6 &&
        holdTravel < 0.06,
    );
  }
}
