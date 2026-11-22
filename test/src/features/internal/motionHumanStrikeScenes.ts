import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieInteractionEvent,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanStrikingRecord,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
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
 * - `settling`: a straight punch at the face of a partner who steps back
 *   as it is launched, from the striking captures' punching range (1.3 of
 *   the puncher's arm from the shoulder to the fingertips). The partner
 *   holds a guard for a second and takes one fighting step back (half a
 *   stance length over 0.35 s, `step`), then holds the guard again; the
 *   puncher holds its guard for 1.5 s and throws. It reads the partner a
 *   reaction time and a look before the launch (`HumanPerception.REACTION`,
 *   `StrikingTarget.LOOK`), inside the step, and predicts the face at the
 *   contact from its velocity then (`StrikingAim`, first order): from
 *   anywhere between the step's 40 and 60 % the face moves at 1.73 or more
 *   step lengths per step period (the minimum-jerk profile's speed there)
 *   and the contact is more than 0.43 s (a jab's own time) away, so the
 *   plan lies more than a step length beyond where the face comes to rest,
 *   which a plan made on observations still to come would not. The
 *   corrections then bring the fist onto the face: the punch's first stop
 *   on the partner is on the head, and the elbow at impact lies within its
 *   range of motion (`DEFAULT_HUMANOID_ROM`). The punch row's former stage,
 *   a guard settling under the perception, staged this until the guard
 *   kept its head on the opponent (the face then hardly travels while the
 *   guard settles, and the punch reached it as planned).
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
   * The straight punch at a partner seen stepping back as it is launched.
   *
   * @param one The puncher's body.
   * @param other The partner's body.
   * @returns What went wrong; empty when the punch planned beyond the face's rest by more than the partner's step, first stops on the head and its elbow lies within its range.
   */
  export function settling(
    one: motionHumanBody.Name,
    other: motionHumanBody.Name,
  ): string[] {
    const label: string = `a straight punch by ${one} at ${other} stepping back`;
    const puncher = motionHumanBody(one);
    const partner = motionHumanBody(other);
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
            body: partner,
            at: { x: 0, y: 0, z: range },
            yaw: 180,
          },
        ],
        {
          kind: "parallel",
          parts: [
            HumanChain.subject("a")
              .act("guard", { duration: 1.5 })
              .act("punch", { technique: "straight", ...face("b", "face") })
              .node,
            HumanChain.subject("b")
              .act("guard", { duration: 1 })
              .act("step", { direction: "back" })
              .act("guard", { duration: 2 }).node,
          ],
        },
      );
    } catch (error) {
      return [
        `${label}: threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a plan expected`,
      ];
    }
    const punch: IAutoMovieMotionHumanSegment | undefined = film.performance
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "punch");
    const record: IAutoMovieMotionHumanStrikingRecord.IRecord | undefined =
      punch === undefined
        ? undefined
        : AutoMovieMotionHumanStrike.StrikingRecord.of(punch.plan);
    if (punch === undefined || record === undefined)
      return [`${label}: planned without a punch record`];
    const out: string[] = [];
    const impact: number =
      punch.start +
      (punch.plan.events.find((e): boolean => e.name === "impact")?.share ??
        1) *
        punch.plan.duration;

    // The step's length as the film shows it (the hips' travel over the
    // step), and how far the launch planned beyond the face at rest along
    // the line from the puncher (+z).
    const stepped: IAutoMovieMotionHumanSegment | undefined = film.performance
      .segments("b")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "step");
    if (stepped === undefined) return [`${label}: the partner took no step`];
    const hips = (seconds: number): IAutoMovieVector3 =>
      film.performance.bones("b", seconds).get("hips")!.worldPosition;
    const length: number = Math.hypot(
      hips(stepped.end).x - hips(stepped.start).x,
      hips(stepped.end).z - hips(stepped.start).z,
    );
    const rest: IAutoMovieVector3 = HumanSignature.region(
      HumanSignature.of(film, "b", partner, 180),
      "face",
      impact,
    );
    const beyond: number = record.planned.z - rest.z;
    if (!(beyond > length))
      out.push(
        `${label}: the launch planned ${(beyond * 1000).toFixed(0)} mm beyond the face at rest, more than the partner's step (${(length * 1000).toFixed(0)} mm) expected`,
      );
    const first: IAutoMovieInteractionEvent | undefined =
      film.performance.hits("b")[0];
    if (first?.bone !== "head")
      out.push(
        `${label}: the punch first stops on the partner's ${first?.bone ?? "nothing"}, the head expected`,
      );
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
    const laws: IAutoMovieMotionHumanActionLaw<never>[] =
      Object.values(HUMAN_LEXICON).flat();
    const fighter = (
      subject: string,
      opponent: string,
    ): IAutoMovieMotionHumanChain =>
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
