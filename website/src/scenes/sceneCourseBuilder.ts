import { ArchetypeRegistry } from "../archetypes/ArchetypeRegistry";

/** Resolve the course expression paired with the live constructor. */
export function sceneCourseBuilder(producer: string): string {
  return ArchetypeRegistry.course(producer).expression;
}
