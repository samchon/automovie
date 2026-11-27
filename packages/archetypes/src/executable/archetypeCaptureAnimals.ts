import type { IAutoMovieJointPose } from "@automovie/interface";

import { AutoMovieArchetypeQuadrupedBody, AutoMovieArchetypeQuadrupedSkeleton, AutoMovieArchetypeHorse } from "../animals";
import { EquineHarness } from "../animals/equine/EquineHarness";
import { EquineSaddle } from "../animals/equine/EquineSaddle";
import type { archetypeCaptureCatalog } from "./archetypeCaptureCatalog";
import { archetypeCaptureSubject } from "./archetypeCaptureSubject";

/**
 * Canonical coarse rig poses with their carried tack and contact marks.
 *
 * @returns Rest, neck-turn and head-turn views of the same seeded horse with
 *   riding and harness tack.
 */
export function archetypeCaptureAnimals(): Readonly<
  Record<string, archetypeCaptureCatalog.ISubject>
> {
  const horse: ReturnType<typeof AutoMovieArchetypeHorse.create> = AutoMovieArchetypeHorse.create(
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

  /**
   * An authored test angle isolates each axial control without changing the
   * rest input.
   */
  const turn: (
    bone: AutoMovieArchetypeQuadrupedBody.Bone,
  ) => ReturnType<typeof AutoMovieArchetypeHorse.create> = (
    bone: AutoMovieArchetypeQuadrupedBody.Bone,
  ): ReturnType<typeof AutoMovieArchetypeHorse.create> =>
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
