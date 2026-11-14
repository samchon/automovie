import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieJointPose,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanActionLaw,
  StrikingRecord,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * The readings of the strike specs that read how a punch meets a target
 * moving as the puncher perceives it: a punch is planned on what the
 * puncher sees at its launch and corrected as each later observation
 * arrives, never on an observation still to come.
 *
 * Scenes:
 * - `settling`: the punch row's former stage, a straight punch launched at
 *   0.8 s at the face of a partner whose guard settles until 0.6 s, from
 *   the striking captures' punching range (1.3 of the puncher's arm from
 *   the shoulder to the fingertips). Read a reaction time before the
 *   launch the guard is still moving, so the launch plan extrapolates the
 *   face about 10 cm beyond where it comes to rest; the corrections bring
 *   the fist onto it, and the arm, its step decided at the launch, lands
 *   bent: the punch records `jammed`, and the elbow at impact lies within
 *   its range of motion (`DEFAULT_HUMANOID_ROM`).
 * - `exchange`: two novices throwing a jab, a cross and a hook at each
 *   other at once, 2.4 m apart. Each punch reads the other's punch while it
 *   plans; it must plan, or be refused by a `HumanRefusal` naming its
 *   reason.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rule the scenes read, each scene and what it must show.
 * @evidence contracts/development/implementation.md#principled-implementation Builds each scene through the public chain and reads the punch's own record and displayed joints at its own events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder per scene, one complaint per expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is accepted only as a `HumanRefusal`; any other error is reported with its name and message.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per scene.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bodies come from `motionHumanBody`, the staging from `motionHumanLaw`, the laws from `HUMAN_LEXICON`, the elbow's range from the engine's table.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanStrikeScenes {
  const face = (
    subject: string,
    region: AutoMovieHumanoidRegion,
  ): {
    at: { kind: "person"; subject: string; region: AutoMovieHumanoidRegion };
  } => ({
    at: { kind: "person", subject, region },
  });

  /**
   * The straight punch at a guard still settling as the puncher perceives it.
   *
   * @param one The puncher's body.
   * @param other The partner's body.
   * @returns What went wrong; empty when the punch records `jammed` and its elbow lies within its range.
   */
  export function settling(
    one: motionHumanBody.Name,
    other: motionHumanBody.Name,
  ): string[] {
    const label: string = `a straight punch by ${one} at ${other}'s settling guard`;
    const puncher = motionHumanBody(one);
    const range: number =
      1.3 *
      (puncher.measure.upperArm +
        puncher.measure.forearm +
        puncher.measure.hand);
    let film: motionHumanLaw.IFilm;
    try {
      film = motionHumanLaw.perform(
        "signature",
        [
          { subject: "a", body: puncher },
          {
            subject: "b",
            body: motionHumanBody(other),
            at: { x: 0, y: 0, z: range },
            yaw: 180,
          },
        ],
        {
          kind: "parallel",
          parts: [
            HumanChain.subject("a")
              .act("guard", { seconds: 0.8 })
              .act("punch", { technique: "straight", ...face("b", "face") })
              .node,
            HumanChain.subject("b").act("guard", { seconds: 3 }).node,
          ],
        },
      );
    } catch (error) {
      return [
        `${label}: threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a plan expected`,
      ];
    }
    const punch: HumanSegment.ISegment | undefined = film.performance
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "punch");
    const record: StrikingRecord.IRecord | undefined =
      punch === undefined ? undefined : StrikingRecord.of(punch.plan);
    if (punch === undefined || record === undefined)
      return [`${label}: planned without a punch record`];
    const out: string[] = [];
    if (record.status !== "jammed")
      out.push(`${label}: records ${record.status}, jammed expected`);
    const impact: number =
      punch.start +
      (punch.plan.events.find((e): boolean => e.name === "impact")?.share ??
        1) *
        punch.plan.duration;
    const bone: "leftLowerArm" | "rightLowerArm" =
      record.limb === "leftHand" ? "leftLowerArm" : "rightLowerArm";
    const flexion: number =
      film.performance
        .pose("a", impact)
        .joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone)
        ?.flexion ?? 0;
    const allowed: { min: number; max: number } =
      DEFAULT_HUMANOID_ROM[bone]!.flexion!;
    if (!(flexion >= allowed.min && flexion <= allowed.max))
      out.push(
        `${label}: the elbow flexes ${flexion.toFixed(2)} degrees at impact, within [${allowed.min}, ${allowed.max}] expected`,
      );
    return out;
  }

  /**
   * Two novices exchanging a jab, a cross and a hook at each other at once.
   *
   * @param one The first fighter's body.
   * @param other The second's, 2.4 m away facing them.
   * @returns What went wrong; empty when the exchange plans or is refused by a `HumanRefusal`.
   */
  export function exchange(
    one: motionHumanBody.Name,
    other: motionHumanBody.Name,
  ): string[] {
    const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
    const fighter = (subject: string, opponent: string): HumanChain =>
      HumanChain.subject(subject)
        .registered("jab", face(opponent, "face"))
        .registered("cross", face(opponent, "face"))
        .registered("hook", face(opponent, "jawLeft"));
    try {
      new HumanPerformance({
        seed: "strike",
        laws,
        performers: [
          {
            subject: "a",
            body: motionHumanBody(one),
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "novice" },
          },
          {
            subject: "b",
            body: motionHumanBody(other),
            at: { x: 0, y: 0, z: 2.4 },
            yaw: 180,
            proficiency: { level: "novice" },
          },
        ],
        composition: fighter("a", "b").with(fighter("b", "a")).node,
      });
      return [];
    } catch (error) {
      return error instanceof HumanRefusal
        ? []
        : [
            `two novices ${one} and ${other} exchanging punches: threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a plan or a refusal expected`,
          ];
    }
  }
}
