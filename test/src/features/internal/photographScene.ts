import { createDevice } from "@automovie/archetypes";
import {
  HumanChain,
  HumanHabit,
  HumanObject,
  HumanPerformance,
  type IHumanBody,
} from "@automovie/motions";

/**
 * The photograph scene the verdict specs read: a performer picks the device
 * archetype's compact camera up by its grip for its use, its back at the
 * bridge of the nose and its long axis across the face, and performs the
 * lexicon's `photograph` row with a hold of 0.3 s.
 *
 * @param body The performer's body.
 * @returns The performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scene, its input and its result.
 * @evidence contracts/development/implementation.md#principled-implementation The production's own chain: the pick up for the use and the row, through the public input.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One prop, one performer, one chain.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The camera stands where a hand reaches it, before the right shoulder at waist height, from the body's own measures.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One performance.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each spec builds its own film.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the performance.
 */
export function photographScene(body: IHumanBody): HumanPerformance {
  return new HumanPerformance({
    seed: "verdict",
    laws: [HumanHabit.photograph],
    props: [
      HumanObject.prop("camera", createDevice({ kind: "camera" }), {
        at: {
          x: -body.measure.shoulderHalfWidth,
          y: body.measure.waistHeight,
          z: 0.6 * (body.measure.upperArm + body.measure.forearm),
        },
        yaw: 0,
      }),
    ],
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
      .pickUp({
        prop: "camera",
        handle: "grip",
        use: { tip: "screen", line: "across", at: { region: "noseBridge" } },
      })
      .registered("photograph", { seconds: 0.3, prop: "camera" }).node,
  });
}
