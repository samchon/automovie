import { createHandgun, createTable } from "@automovie/archetypes";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  type IHumanActionLaw,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";

/**
 * The reading of the specs `test_human_motion_firearm_reload_held_<body>`: a
 * reload presses the support hand's palm to the magazine of the gun the
 * other hand holds, so the press reads the gun the performer carries, which
 * the performer's own hand places.
 *
 * The scene is one a production wrote (the website's range counter): a
 * compact pistol lies on a counter top 0.91 m high, the performer takes it
 * up (`drawFirearm`), presses the palm to its `magazine` (`reloadFirearm`)
 * and lays it back (`holsterFirearm`). Read at the second the press was
 * solved, the gun's frame read the hand that carries it, whose pose was the
 * press reading the gun again: the build overran the stack. It must plan, or
 * be refused by a `HumanRefusal` naming its reason; how near the palm lands
 * is the touch law's, read by its own specs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the act, the production's scene, the failure it guards and what it leaves to the touch law.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the scene through the public chain and reads only what the build throws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One build per body, one outcome.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refusal is accepted only as a `HumanRefusal`; any other error is reported with its name and message.
 * @evidence contracts/development/implementation.md#efficient-algorithms One performance per call.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bodies come from `motionHumanBody`, the laws from `HUMAN_LEXICON`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps nothing once read.
 */
export namespace motionHumanReloadHeld {
  /**
   * Build the scene on one body.
   *
   * @param name The body.
   * @returns What went wrong, empty when the scene planned or was refused by a `HumanRefusal`.
   */
  export function read(name: motionHumanBody.Name): string[] {
    const laws: IHumanActionLaw<never>[] = Object.values(HUMAN_LEXICON).flat();
    try {
      new HumanPerformance({
        seed: "range-counter",
        laws,
        performers: [
          {
            subject: "eve",
            body: motionHumanBody(name),
            at: { x: 0, y: 0, z: 0.12 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("counter", createTable({ kind: "counter" }), {
            at: { x: 0, y: 0, z: 0.65 },
            yaw: 180,
          }),
          HumanObject.prop("gun", createHandgun({ frame: "compact" }), {
            at: { x: -0.18, y: 0.91, z: 0.42 },
            yaw: 0,
          }),
        ],
        composition: HumanChain.subject("eve")
          .registered("drawFirearm", { prop: "gun" })
          .registered("reloadFirearm", {
            target: { kind: "prop", subject: "gun", point: "magazine" },
          })
          .registered("holsterFirearm", {
            prop: "gun",
            at: { x: -0.18, y: 0.91, z: 0.42 },
          }).node,
      });
      return [];
    } catch (error) {
      return error instanceof HumanRefusal
        ? []
        : [
            `${name}: the scene threw ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}, a plan or a refusal expected`,
          ];
    }
  }
}
