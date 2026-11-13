import { Quaternion } from "@automovie/engine";
import type { AutoMovieMotionTarget } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
  type IHumanBody,
  type IHumanLayer,
  type IHumanPosture,
  type IHumanProp,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../features/internal/motionHumanBody";

/**
 * Combinations of shipped actions that a screenplay needs and that had never
 * been performed each plan and keep every physical bound.
 *
 * These are the composition probes of the coverage ledger: acts a person
 * performs every day (a knock on a door, a turn on the spot, a drink while
 * seated, a wave and a touch from a chair, a phone held while walking, a
 * push that staggers a partner, a chase) written with the vocabulary as it
 * is. A probe that plans with a clean verdict report is expressible by
 * composition; one that is refused or breaks a bound names what the grammar
 * or a law still lacks.
 *
 * Pending: measured on the average man with the small woman as partner, no
 * probe is clean yet and one is refused. The measured rows are on the
 * ledger's issue; each probe moves to the features with the fix of what it
 * found.
 *
 * Scenarios, each expected to plan and report clean:
 * 1. Knock: a fist tapped three times on a prop's point.
 * 2. Turn in place: a walk to where the performer stands with only the
 *    facing changed.
 * 3. Seated drink, 4. seated wave, 5. seated self touch: each entered from
 *    the end of sitting down.
 * 6. Texting walk: a production layer holding an arm ahead of the chest
 *    over a walk.
 * 7. Push: a press on a partner's chest cut into the partner's stagger.
 * 8. Chase by approach and 9. chase by run, after a walking person.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each composition through the public chain and performance and reads the shipped verdict report; a refusal or any broken bound fails the probe.
 * @evidence contracts/development/testing.md#independent-expectations Each probe is an act people perform, so it must plan and break no physical bound; no value is read from the laws.
 * @evidence contracts/development/testing.md#distinguishing-cases One probe per unverified combination of the coverage research: a prop target, a turn, three seated entries, a layer over travel, a cut across two people and two pursuits.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men and performs nine films with their reports, about eight minutes; a pending specification until its findings are fixed.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 probes, what a pass means and why the file is pending.
 */
export function test_human_composition_probes(): void {
  const a: IHumanBody = motionHumanBody("m-average");
  const b: IHumanBody = motionHumanBody("f-small");
  const reach: number = a.measure.upperArm + a.measure.forearm;
  const door: IHumanProp = {
    subject: "door",
    frame: {
      position: { x: 0, y: 0, z: 0.75 * reach },
      rotation: Quaternion.identity(),
    },
    points: {
      panel: {
        point: { x: -0.15, y: a.measure.chestHeight, z: 0 },
        normal: { x: 0, y: 0, z: -1 },
      },
    },
  };
  const panel: AutoMovieMotionTarget = {
    kind: "prop",
    subject: "door",
    point: "panel",
  };
  const chair: seated.ISeat = {
    at: { x: 0, y: seated.popliteal(a), z: a.rest.get("leftFoot")!.z - 0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const texting: IHumanLayer = {
    name: "texting",
    apply: (posture: IHumanPosture): IHumanPosture => {
      const yaw: number = (posture.yaw * Math.PI) / 180;
      const ahead = (
        x: number,
        y: number,
        z: number,
      ): { x: number; y: number; z: number } => ({
        x: posture.root.x + x * Math.cos(yaw) + z * Math.sin(yaw),
        y,
        z: posture.root.z - x * Math.sin(yaw) + z * Math.cos(yaw),
      });
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          rightArm: {
            point: ahead(-0.1, a.measure.chestHeight - 0.05, 0.3),
            bend: ahead(-0.35, a.measure.chestHeight - 0.4, 0),
          },
        },
      };
    },
  };
  const start = (subject: string = "a"): HumanChain =>
    HumanChain.subject(subject);
  const chestOfB: AutoMovieMotionTarget = {
    kind: "person",
    subject: "b",
    region: "sternum",
  };

  const probes: {
    name: string;
    gap: number;
    layers?: Record<string, IHumanLayer[]>;
    composition: () => HumanChain["node"];
  }[] = [
    {
      name: "knock: touch on a prop point",
      gap: 3,
      composition: () =>
        start().touch({ target: panel, kind: "tap", with: "fist", count: 3 })
          .node,
    },
    {
      name: "turn in place: walk with only face changed",
      gap: 3,
      composition: () =>
        start().walk({ to: { x: 0, y: 0, z: 0 }, face: 90 }).node,
    },
    {
      name: "seated drink: handToFace from sit's end",
      gap: 3,
      composition: () =>
        start().sit({ seat: chair, seconds: 0.5 }).handToFace({ task: "drink" })
          .node,
    },
    {
      name: "seated wave: gesture from sit's end",
      gap: 3,
      composition: () =>
        start().sit({ seat: chair, seconds: 0.5 }).gesture({ kind: "wave" })
          .node,
    },
    {
      name: "seated self touch: touch from sit's end",
      gap: 3,
      composition: () =>
        start()
          .sit({ seat: chair, seconds: 0.5 })
          .touch({ target: { kind: "self", region: "sternum" }, kind: "pat" })
          .node,
    },
    {
      name: "texting walk: a layer driving an arm over walk",
      gap: 6,
      layers: { a: [texting] },
      composition: () => start().walk({ to: { x: 0, y: 0, z: 3 } }).node,
    },
    {
      name: "push: touch press cut into the partner's stagger",
      gap: 0.75 * reach,
      composition: () =>
        start()
          .touch({ target: chestOfB, kind: "press" }, "push")
          .with(
            start("b")
              .stand({ seconds: 6 })
              .until({ of: "push", event: "ready" })
              .stagger({
                from: { kind: "person", subject: "a", region: "sternum" },
                speed: 1,
              }),
          ).node,
    },
    {
      name: "chase: approach a walking person",
      gap: 2,
      composition: () =>
        start()
          .approach({ target: chestOfB, pace: "fast" })
          .with(start("b").walk({ to: { x: 0, y: 0, z: 6 } })).node,
    },
    {
      name: "chase: run to where a walking person goes",
      gap: 2,
      composition: () =>
        start()
          .run({ to: { x: 0, y: 0, z: 5 } })
          .with(start("b").walk({ to: { x: 0, y: 0, z: 6 } })).node,
    },
  ];

  const complaints: string[] = [];
  for (const probe of probes) {
    let outcome: string;
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "probe",
        performers: [
          {
            subject: "a",
            body: a,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body: b,
            at: { x: 0, y: 0, z: probe.gap },
            yaw: probe.name.startsWith("chase") ? 0 : 180,
            proficiency: { level: "trained" },
          },
        ],
        props: [door],
        composition: probe.composition(),
        ...(probe.layers === undefined ? {} : { layers: probe.layers }),
      });
      outcome = `plans ${performance.duration.toFixed(2)} s; verdicts: ${HumanVerdicts.describe(HumanVerdicts.of(performance))}`;
    } catch (error) {
      outcome =
        error instanceof HumanRefusal
          ? `refused [${error.kind}] ${error.message}`
          : `threw ${(error as Error).message}`;
    }
    if (!outcome.endsWith("verdicts: clean"))
      complaints.push(`${probe.name}: ${outcome}`);
  }
  TestValidator.equals("every probe plans and reports clean", complaints, []);
}
