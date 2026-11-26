import { ArchetypeRegistry } from "../archetypes/ArchetypeRegistry";

/** Resolve the course expression paired with the live constructor. */
export function sceneCourseBuilder(
  producer: string,
): string {
  const course: ArchetypeRegistry.ICourse | undefined =
    ArchetypeRegistry.course(producer);
  if (course === undefined)
    throw new Error(`"${producer}" does not supply a vehicle course.`);
  return course.expression;
}
