import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The readings of the specs `test_human_motion_core_mutual_reads_<case>`:
 * two people who read each other at once, each with hands on the other.
 *
 * A hand that reaches for a person reads them as perceived, a reaction time
 * before the reach is planned, and rides them a frame behind while it lies
 * on them, so neither reads the posture the other is still solving. Read at
 * the seconds of the reach instead, the two people's poses nested inside
 * each other back to the film's start: a choke and the struggle against it
 * overran the stack, the deeper the longer the film and the later the
 * second first read (the production's scene overflowed reading its film
 * from the end).
 *
 * Each scene must plan, or be refused by a `HumanRefusal` naming its
 * reason; planned, every 24th of a second of both people's film is read
 * from the end back to the start, then from the start to the end, on the
 * default stack.
 *
 * Scenes:
 * - `choke`: the production's record, a choke (both palms on the neck,
 *   squeezed and held) against the struggle at the attacker's forearms,
 *   the two 0.5 m apart from the film's start.
 * - `chokeRound`: its longer version, the choke followed by a restraint and
 *   a hair pull, the struggle by standing 3 s and the grabbed reaction.
 * - `held`: two hands pressed and held 2 s, each on the other's shoulder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule the scenes guard, the measured overflow, the outcome required and each scene.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each scene through the public chain and reads the displayed bones of both people in two orders.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One build per scene, two sweeps of reads.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is accepted only as a `HumanRefusal`; any other error is reported with its name, message and where it was thrown.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per scene; the second sweep reads what the first one shows.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bodies come from `motionHumanBody`, the laws from `HUMAN_LEXICON`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanMutualReads {
  /** A scene of two people reading each other. */
  export type Scene = "choke" | "chokeRound" | "held";

  /**
   * Build a scene and read its film both ways.
   *
   * @param scene The scene.
   * @param attacker The body of the first person (`xia`).
   * @param victim The body of the second (`yan`), 0.5 m ahead facing them.
   * @returns What went wrong, empty when the scene planned and read, or was refused by a `HumanRefusal`.
   */
  export function read(
    scene: Scene,
    attacker: motionHumanBody.Name,
    victim: motionHumanBody.Name,
  ): string[] {
    const label: string = `${scene} (${attacker} and ${victim})`;
    const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
    let xia: HumanChain = HumanChain.subject("xia");
    let yan: HumanChain = HumanChain.subject("yan");
    if (scene === "held") {
      const press = (other: string) => ({
        target: {
          kind: "person" as const,
          subject: other,
          region: "shoulderLeft" as const,
        },
        with: "palm" as const,
        kind: "press" as const,
        hold: 2,
      });
      xia = xia.stand({ seconds: 0.3 }).touch(press("yan"));
      yan = yan.stand({ seconds: 0.3 }).touch(press("xia"));
    } else {
      xia = xia.registered("choke", {
        target: { kind: "person", subject: "yan", region: "neckLeft" },
        other: { kind: "person", subject: "yan", region: "neckRight" },
      });
      yan = yan.registered("struggle", {
        target: { kind: "person", subject: "xia", region: "forearmLeft" },
        other: { kind: "person", subject: "xia", region: "forearmRight" },
      });
      if (scene === "chokeRound") {
        xia = xia
          .registered("restrain", { partner: "yan" })
          .registered("hairPull", {
            target: { kind: "person", subject: "yan", region: "crown" },
          });
        yan = yan.stand({ seconds: 3 }).registered("grabbed", {
          from: { kind: "person", subject: "xia", region: "handRight" },
        });
      }
    }
    try {
      const film: HumanPerformance = new HumanPerformance({
        seed: "chokehold",
        laws,
        performers: [
          {
            subject: "xia",
            body: motionHumanBody(attacker),
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "yan",
            body: motionHumanBody(victim),
            at: { x: 0, y: 0, z: 0.5 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: xia.with(yan).node,
      });
      const last: number = Math.floor(film.duration * 24);
      for (let k: number = last; k >= 0; --k) {
        film.bones("xia", k / 24);
        film.bones("yan", k / 24);
      }
      for (let k: number = 0; k <= last; ++k) {
        film.bones("xia", k / 24);
        film.bones("yan", k / 24);
      }
      return [];
    } catch (error) {
      if (error instanceof HumanRefusal) return [];
      return [
        `${label}: threw ${error instanceof Error ? `${error.name}: ${error.message} ${(error.stack ?? "").split("\n").slice(1, 6).join(" | ")}` : String(error)}, a plan or a refusal expected`,
      ];
    }
  }
}
