import type { IAutoMovieJointPose } from "@automovie/interface";

import {
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeQuadrupedSkeleton,
  createHorse,
} from "../animals";
import { EquineHarness } from "../animals/EquineHarness";
import { EquineSaddle } from "../animals/EquineSaddle";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Canonical coarse rig poses with their carried tack and contact marks.
 *
 * @returns Rest, neck-turn and head-turn views of the same seeded horse with riding and harness tack.
 * @evidence contracts/development/common.md#meaningful-documentation States the deterministic horse, isolated twenty-degree test poses and explicit head/tack attachment boundary.
 * @evidence contracts/development/implementation.md#principled-implementation AutoMovieArchetypeQuadrupedSkeleton drives the real animal through generic FK; declared rigid bridle parts follow the head, while held rein/lead contacts stay on the trunk and flexible spans reconnect them to their head-local bit anchors. Independent diagnostic marks use the original neutral horse for all three controls.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Build one seeded source, declare the carried bindings and make three independent models through the shared still-subject helper.
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
    AutoMovieArchetypeQuadrupedSkeleton.of(horse).bones.map(
      (
        bone: ReturnType<
          typeof AutoMovieArchetypeQuadrupedSkeleton.of
        >["bones"][number],
      ): string => bone.bone,
    ),
  );
  const parts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {};
  const contacts: Record<string, AutoMovieArchetypeQuadrupedBody.Bone> = {};
  const head: Set<string> = new Set([
    ...EquineHarness.HEAD,
    ...EquineSaddle.HEAD,
  ]);
  for (const part of horse.parts)
    if (!bones.has(part.id))
      parts[part.id] = head.has(part.id) ? "head" : "trunk";
  for (const contact of horse.affordances) contacts[contact.id] = "trunk";

  /** An authored test angle isolates each axial control without changing the rest input. */
  const turn: (
    bone: AutoMovieArchetypeQuadrupedBody.Bone,
  ) => ReturnType<typeof createHorse> = (
    bone: AutoMovieArchetypeQuadrupedBody.Bone,
  ): ReturnType<typeof createHorse> =>
    AutoMovieArchetypeQuadrupedSkeleton.pose(
      horse,
      new Map<
        AutoMovieArchetypeQuadrupedBody.Bone,
        Pick<IAutoMovieJointPose, "flexion" | "abduction" | "twist">
      >([[bone, { flexion: 20, abduction: 0, twist: 0 }]]),
      parts,
      contacts,
    );
  const subject: archetypeCaptureCatalog.ISubject =
    archetypeCaptureSubject.still({
      "horse-rest": horse,
      "horse-neck": turn("neck"),
      "horse-head": turn("head"),
    });
  return {
    "animal-skeleton": {
      ...subject,
      members: subject.members.map(
        (
          member: archetypeCaptureCatalog.IMember,
        ): archetypeCaptureCatalog.IMember => ({ ...member, reference: horse }),
      ),
    },
  };
}
