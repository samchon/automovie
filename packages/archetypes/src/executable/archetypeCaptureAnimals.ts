import type { IAutoMovieJointPose } from "@automovie/interface";

import { QuadrupedBody, QuadrupedSkeleton, createHorse } from "../animals";
import { HorseHarness } from "../animals/HorseHarness";
import { HorseSaddle } from "../animals/HorseSaddle";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Canonical coarse rig poses with their actual carried tack and contact marks.
 *
 * @returns Rest, neck-turn and head-turn views of the same seeded horse with riding and harness tack.
 * @evidence contracts/development/common.md#meaningful-documentation States the actual deterministic horse, isolated twenty-degree test poses and explicit head/tack attachment boundary.
 * @evidence contracts/development/implementation.md#principled-implementation QuadrupedSkeleton drives the real animal through the shared generic FK; the horse harness's declared head-part list supplies its accessory bindings and rein contacts explicitly follow the head under both neck and head articulation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build one seeded source, declare the carried bindings and make three independent actual models through the shared still-subject helper.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts These are isolated rig inspection poses, not measured animal action laws; no renderer-only replacement geometry or altered solver supplies the picture.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three fixed-size coarse models are prepared once for the subject catalogue; each seek reads the existing still models.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One source animal supplies all neutral geometry and declared attachment identities; every posed sample remains independent.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Subject models transfer to the inspection catalogue; no process or renderer resource is opened here.
 */
export function archetypeCaptureAnimals(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const horse: ReturnType<typeof createHorse> = createHorse(
    { tack: "both" },
    12,
  );
  const bones: Set<string> = new Set(
    QuadrupedSkeleton.of(horse).bones.map(
      (
        bone: ReturnType<typeof QuadrupedSkeleton.of>["bones"][number],
      ): string => bone.bone,
    ),
  );
  const parts: Record<string, QuadrupedBody.Bone> = {};
  const contacts: Record<string, QuadrupedBody.Bone> = {};
  const head: Set<string> = new Set([
    ...HorseHarness.HEAD,
    ...HorseSaddle.HEAD,
  ]);
  for (const part of horse.parts)
    if (!bones.has(part.id))
      parts[part.id] = head.has(part.id) ? "head" : "trunk";
  for (const contact of horse.affordances)
    contacts[contact.id] = contact.kind === "rein" ? "head" : "trunk";

  /** An authored test angle isolates each axial control without changing the rest input. */
  const turn: (bone: QuadrupedBody.Bone) => ReturnType<typeof createHorse> = (
    bone: QuadrupedBody.Bone,
  ): ReturnType<typeof createHorse> =>
    QuadrupedSkeleton.pose(
      horse,
      new Map<
        QuadrupedBody.Bone,
        Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
      >([[bone, { flexion: 20, abduction: 0, twist: 0 }]]),
      parts,
      contacts,
    );
  return {
    "animal-skeleton": archetypeCaptureSubject.still({
      "horse-rest": horse,
      "horse-neck": turn("neck"),
      "horse-head": turn("head"),
    }),
  };
}
