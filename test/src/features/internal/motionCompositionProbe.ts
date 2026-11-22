import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionTarget,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The composition probes of the coverage ledger: combinations of shipped
 * actions a screenplay needs (a knock on a door, a turn on the spot, a drink,
 * a wave and a touch from a chair, a phone held while walking, a push that
 * staggers a partner, a chase), written with the vocabulary as it is and
 * performed by the average man, with the small woman as partner in the
 * probes that involve her (the push and the chases). A probe that
 * plans with a clean verdict report is expressible by composition; one that
 * is refused or breaks a bound names what the grammar or a law still lacks.
 * Each probe is its own test (`test_human_motion_composition_probe_<name>`),
 * so each runs under a minute.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a probe is, who performs it and what a pass or a finding means.
 * @evidence contracts/development/implementation.md#principled-implementation Each probe builds its composition through the public chain and reads the shipped verdict report; nothing is read from a law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scene shared by every probe and one table of compositions by name.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal and any broken bound are reported with the probe's name, never skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance and one report per probe.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bodies come from `motionHumanBody`, prepared once per process.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A probe keeps nothing once read.
 */
export namespace motionCompositionProbe {
  /** The probes, by name. */
  export const NAMES = [
    "knock",
    "turnInPlace",
    "seatedDrink",
    "seatedWave",
    "seatedTouch",
    "textingWalk",
    "push",
    "chaseApproach",
    "chaseRun",
  ] as const;

  /** A probe's name. */
  export type Name = (typeof NAMES)[number];

  /**
   * Perform a probe and read its verdicts.
   *
   * @param name The probe.
   * @returns Nothing when it plans with a clean report; otherwise one line naming the refusal or the broken bounds.
   */
  export function run(name: Name): string[] {
    const a: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
    const b: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
    const reach: number = a.measure.upperArm + a.measure.forearm;
    const door: IAutoMovieMotionHumanProp = {
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
    const probe: IProbe = probes(a, reach)[name];
    let outcome: string;
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "probe",
          performers: [
            {
              subject: "a",
              body: a,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            // The partner is staged only where the composition involves her,
            // so a solo probe reads one person's verdicts.
            ...(probe.partner === true
              ? [
                  {
                    subject: "b",
                    body: b,
                    at: { x: 0, y: 0, z: probe.gap },
                    yaw: name.startsWith("chase") ? 0 : 180,
                    proficiency: { level: "trained" as const },
                  },
                ]
              : []),
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
    return outcome.endsWith("verdicts: clean") ? [] : [`${name}: ${outcome}`];
  }

  /** One probe's scene: the partner's distance, any layers and the composition. */
  interface IProbe {
    /** How far ahead the partner stands, metres. */
    gap: number;

    /** Whether the composition involves the partner, who is staged only then. */
    partner?: true;

    /** Production layers by performer. */
    layers?: Record<string, IAutoMovieMotionHumanLayer[]>;

    /** The composition. */
    composition: () => IAutoMovieMotionHumanChain["node"];
  }

  /** Every probe's scene for a performer of an arm's reach. */
  function probes(
    a: IAutoMovieMotionHumanBody,
    reach: number,
  ): Record<Name, IProbe> {
    const panel: IAutoMovieMotionTarget = {
      kind: "prop",
      subject: "door",
      point: "panel",
    };
    const chair: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: AutoMovieMotionHumanSeat.seated.popliteal(a),
        z: a.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    const texting: IAutoMovieMotionHumanLayer = {
      name: "texting",
      apply: (
        posture: IAutoMovieMotionHumanPosture,
      ): IAutoMovieMotionHumanPosture => {
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
    const start = (subject: string = "a"): IAutoMovieMotionHumanChain =>
      HumanChain.subject(subject);
    const chestOfB: IAutoMovieMotionTarget = {
      kind: "person",
      subject: "b",
      region: "sternum",
    };
    return {
      knock: {
        gap: 3,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start().touch({
            target: panel,
            kind: "tap",
            effector: "fist",
            count: 3,
          }).node,
      },
      turnInPlace: {
        gap: 3,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start().walk({ to: { x: 0, y: 0, z: 0 }, face: 90 }).node,
      },
      seatedDrink: {
        gap: 3,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start().sit({ seat: chair, hold: 0.5 }).handToFace({ kind: "drink" })
            .node,
      },
      seatedWave: {
        gap: 3,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start().sit({ seat: chair, hold: 0.5 }).gesture({ kind: "wave" })
            .node,
      },
      seatedTouch: {
        gap: 3,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start()
            .sit({ seat: chair, hold: 0.5 })
            .touch({ target: { kind: "self", region: "sternum" }, kind: "pat" })
            .node,
      },
      textingWalk: {
        gap: 6,
        layers: { a: [texting] },
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start().walk({ to: { x: 0, y: 0, z: 3 } }).node,
      },
      push: {
        gap: 0.75 * reach,
        partner: true,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start()
            .touch({ target: chestOfB, kind: "press" }, "push")
            .with(
              start("b")
                .stand({ hold: 6 })
                .until({ of: "push", event: "ready" })
                // A push she steps out of: the stumble's 0.5 m/s, about
                // the largest backward lean young adults recover from by
                // stepping (`HumanPose.stumble`); 1 m/s pushed backward is
                // past what four recovery steps catch on her.
                .stagger({
                  target: { kind: "person", subject: "a", region: "sternum" },
                  speed: 0.5,
                }),
            ).node,
      },
      chaseApproach: {
        gap: 2,
        partner: true,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start()
            .approach({ target: chestOfB, pace: "fast" })
            .with(start("b").walk({ to: { x: 0, y: 0, z: 6 } })).node,
      },
      // A chase at a run: both run the same distance, the chaser stopping the
      // gap behind where the quarry stops. A quarry who walks is overtaken
      // inside the gap (a run's speed is about 3.5 m/s at a 0.93 m hip, a
      // walk's 1.35, `run` and `walk`), so the chaser's run to a point behind
      // where she stops would pass through her; the vocabulary's chase of a
      // walker is `chaseApproach`.
      chaseRun: {
        gap: 2,
        partner: true,
        composition: (): IAutoMovieMotionHumanChain["node"] =>
          start()
            .run({ to: { x: 0, y: 0, z: 5 } })
            .with(start("b").run({ to: { x: 0, y: 0, z: 7 } })).node,
      },
    };
  }
}
