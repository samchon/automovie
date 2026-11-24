import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleCue,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanCue, HumanPerformance } from "@automovie/motions";
import { AutoMovieMotionClock } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { throwsError } from "../../../../features/internal/throwsError";

/**
 * An action entered past its start is aligned on the timing it will have
 * when placed: the instant the schedule aligns falls on its target second.
 *
 * A test law `marker` lasts a second with its `mark` at three quarters, and
 * its own cancel table enters a following `marker` at half of it. The
 * second marker is synced so that its `mark` falls on the third beat of a
 * 96 bpm score (1.25 s), which cuts into the first one. The schedule plans it once as a trial to read how
 * far its `mark` lies after its start, then places it: the trial must read
 * what the placed action gives, the part left after the entry and the
 * shares on that part, or the mark lands a quarter second early.
 *
 * Scenarios:
 * 1. The placed second marker is entered at half of its plan.
 * 2. Its `mark` falls on the beat at 1.25 s, within a microsecond.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers a law through the public input, syncs it to a cue track and reads the placed action's instant; a trial that reads the whole plan's shares misplaces the mark by the entry's part.
 * @evidence contracts/development/testing.md#independent-expectations The beat is the score's own second (2 x 60 / 96) and the entry and the mark's share are the test law's own numbers; nothing is read from the schedule.
 * @evidence contracts/development/testing.md#distinguishing-cases An action entered past its start, which no shipped cancel table does yet; one entered at its start is the sync spec's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one short performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the test law and the 2 scenarios.
 */
export function test_motion_posture_paired_event(): void {
  checkCueRecipients();
  // Two roles meet on the same cue, while their independent follow-through durations remain intact.
  for (const lead of [0.25, 0.75]) {
    const native = AutoMovieMotionClock.of(2, [
      { name: "meet", seconds: lead },
      { name: "alsoMeet", seconds: lead },
      { name: "release", seconds: 2 },
    ]);
    const aligned = AutoMovieMotionClock.align(native, "meet", 1);
    TestValidator.equals(
      "both cue labels align",
      [aligned.at("meet"), aligned.at("alsoMeet")],
      [1, 1],
    );
    TestValidator.equals(
      "release keeps the role's own remaining duration",
      aligned.at("release"),
      1 + (2 - lead),
    );
    let refused: boolean = false;
    try {
      AutoMovieMotionClock.align(native, "absent", 1);
    } catch {
      refused = true;
    }
    TestValidator.predicate("missing cue cannot align", refused);
  }
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const marker: IAutoMovieMotionHumanActionLaw<never> = {
    name: "marker",
    interrupts: {
      marker: [{ window: [0, 1], kind: "inertialize", entry: 0.5, blend: 0.1 }],
    } as IAutoMovieMotionHumanActionLaw["interrupts"],
    plan: (
      context: IAutoMovieMotionHumanActionContext<never>,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      events: [{ name: "mark", share: 0.75 }],
      contacts: context.entry.supports.map(
        (
          support: IAutoMovieMotionHumanEntryState.ISupport,
        ): IAutoMovieMotionHumanActionPlan["contacts"][number] => ({
          ...support,
          from: 0,
          to: 1,
        }),
      ),
      posture: (): IAutoMovieMotionHumanPosture => context.entry.posture,
    }),
  };
  checkHandoff(body, marker);
  const cues: Record<"music", IAutoMovieScheduleCue[]> = {
    music: HumanCue.beats({ bpm: 96, count: 8 }),
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "entry",
    laws: [marker],
    cues,
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .registered("marker")
      .registered("marker")
      .sync({ of: "music", event: "beat", index: 2, align: "mark" }).node,
  });
  const second: IAutoMovieMotionHumanSegment = performance.segments("a")[2]!;
  const entered: number =
    (second.entryTime - second.start) / second.plan.duration;
  const mark: number =
    second.start +
    (second.plan.events.find(
      (e: IAutoMovieMotionHumanActionPlan["events"][number]): boolean =>
        e.name === "mark",
    )?.share ?? NaN) *
      second.plan.duration;
  TestValidator.predicate(
    "the second marker is entered at half of its plan",
    Math.abs(entered - 0.5) <= 1e-9,
  );
  TestValidator.equals(
    "its mark falls on the beat",
    Math.abs(mark - 1.25) <= 1e-6 ? "on the beat" : `at ${mark.toFixed(6)} s`,
    "on the beat",
  );
}

/** Role-specific delays align to the selected cue and do not move another role's clock. */
function checkCueRecipients(): void {
  const body = motionHumanBody("m-average");
  const cues = HumanCue.orders([
    { word: "second", at: 4 },
    { word: "first", at: 2, caution: 0.5 },
  ]);
  TestValidator.equals("a preparatory cue precedes its named event", cues, [
    { name: "firstCaution", seconds: 1.5 },
    { name: "first", seconds: 2 },
    { name: "second", seconds: 4 },
  ]);
  for (const earlier of [[], [{ word: "earlier", at: 1 }]]) {
    const at = earlier.length === 0 ? 0.5 : 1.5;
    TestValidator.predicate(
      "a caution cannot precede the score or an earlier word",
      throwsError(
        () => HumanCue.orders([...earlier, { word: "late", at, caution: 1 }]),
        "late",
      ),
    );
  }
  const moments = {
    instants: [
      { label: "other", seconds: 0.5 },
      { label: "mark", seconds: 2 },
      { label: "mark", seconds: 1 },
    ],
  };
  TestValidator.equals(
    "reported cue identity and ordering",
    HumanCue.instants(moments, ["mark"]),
    [
      { name: "mark", seconds: 1 },
      { name: "mark", seconds: 2 },
    ],
  );
  const leads = (delay: number) =>
    new HumanPerformance({
      seed: "ordered",
      performers: ["leader", "follower"].map((subject, index) => ({
        subject,
        body,
        at: { x: 2 * index, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" as const },
      })),
      cues: { score: cues },
      composition: AutoMovieComposition.parallel(
        HumanChain.subject("leader")
          .stand({ hold: 1 })
          .sync({ of: "score", event: "second" }).node,
        HumanChain.subject("follower")
          .stand({ hold: 1 })
          .sync({
            of: "score",
            event: "first",
            latency: { mean: delay, spread: 0 },
          }).node,
      ),
    });
  for (const delay of [0, 0.25]) {
    const performance = leads(delay);
    TestValidator.equals(
      "each recipient starts from their own named signal",
      [
        performance.segments("leader")[0]!.entryTime,
        performance.segments("follower")[0]!.entryTime,
      ],
      [4, 2 + delay],
    );
  }
}

/** After the second hand closes, an offset prop landmark moves rigidly with that hand. */
function checkHandoff(
  body: IAutoMovieMotionHumanBody,
  marker: IAutoMovieMotionHumanActionLaw<never>,
): void {
  const accept: IAutoMovieMotionHumanActionLaw<never> = {
    ...marker,
    name: "takeRibbon",
    plan: (context) => ({
      ...marker.plan(context),
      holds: [{ side: "right", prop: "ribbon", from: 0.5 }],
    }),
  };
  const origin = { x: 0, y: 0, z: 0 };
  const rotation = { x: 0, y: 0, z: 0, w: 1 };
  const tip = { x: 0, y: 0.15, z: 0 };
  const act = new HumanPerformance({
    seed: "pass",
    laws: [accept],
    props: [
      {
        subject: "ribbon",
        frame: { position: origin, rotation },
        points: { tip: { point: tip, normal: { x: 0, y: 1, z: 0 } } },
        worn: {
          subject: "giver",
          bone: "rightHand",
          offset: { position: origin, rotation },
        },
      },
    ],
    performers: ["giver", "receiver"].map((subject, index) => ({
      subject,
      body,
      at: { x: 0.5 * index, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" as const },
    })),
    composition: AutoMovieComposition.parallel(
      HumanChain.subject("giver").stand({ hold: 3 }).node,
      HumanChain.subject("receiver")
        .registered("takeRibbon")
        .walk({ to: { x: 0.5, y: 0, z: 2 } }).node,
    ),
  });
  const local = (time: number): IAutoMovieVector3 => {
    const hand = act.bones("receiver", time).get("rightHand")!;
    const frame = act.prop("ribbon", time);
    const world = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, tip),
    );
    return Quaternion.rotateVector(
      Quaternion.inverse(hand.worldRotation),
      Vector3.subtract(world, hand.worldPosition),
    );
  };
  const caught = local(0.5);
  for (const time of [1, act.duration])
    TestValidator.predicate(
      "the receiver carries the same offset landmark",
      Vector3.length(Vector3.subtract(local(time), caught)) <= 1e-3,
    );
}
