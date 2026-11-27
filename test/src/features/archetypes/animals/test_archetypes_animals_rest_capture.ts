import {
  AutoMovieArchetypeQuadrupedJoints
} from "../../../../../packages/archetypes/src/animals/AutoMovieArchetypeQuadrupedJoints";
import {
  archetypeCaptureRest
} from "../../../../../packages/archetypes/src/executable/internal/archetypeCaptureRest";
import {
  archetypeQuadrupedMarks
} from "../../../../../packages/archetypes/src/executable/internal/archetypeQuadrupedMarks";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Draw-time support marks follow the actual fitted solids through rest. */
export function test_archetypes_animals_rest_capture(): void {
  const subjects: ReturnType<typeof archetypeCaptureRest> =
    archetypeCaptureRest();
  for (const [name, fitting] of [
    ["rest-dog", "collar-wall-1"],
    ["rest-horse", "saddle-twist"],
  ] as const) {
    const member = subjects[name]!.members[0]!;
    const anchor: string = `set/${member.name}`;
    const marks: ReturnType<typeof archetypeQuadrupedMarks> =
      archetypeQuadrupedMarks(member.reference);
    for (const seconds of [0, 1, 2.5, 4, 5]) {
      const sample: ReturnType<typeof member.at> = member.at(seconds);
      const observed: ReturnType<typeof marks> = marks(
        sample.archetype,
        anchor,
        sample.goals,
      );
      TestValidator.equals(
        `${name} at ${seconds} has four marked soles`,
        4,
        observed.filter((mark): boolean => mark.kind === "rig/sole").length,
      );
      TestValidator.predicate(
        `${name} at ${seconds} has a finite floor ruler for ${fitting}`,
        observed.some(
          (mark): boolean =>
            mark.path === `${anchor}/rig/floor/${fitting}` &&
            mark.shape.type === "segments" &&
            mark.shape.points.every(Number.isFinite),
        ),
      );
    }
    const settled = member.at(2.5).archetype;
    const joints: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read> =
      AutoMovieArchetypeQuadrupedJoints.read(settled.parts);
    for (const [limb, [attachment, joint]] of Object.entries(joints.limbs)) {
      const proximal: ReturnType<typeof AutoMovieEngineVector3.subtract> = AutoMovieEngineVector3.subtract(
        joint!,
        attachment!,
      );
      TestValidator.predicate(
        `${name} ${limb} folds close to the floor during the hold`,
        proximal.y <= 0.2 * AutoMovieEngineVector3.length(proximal),
      );
    }
  }
}
