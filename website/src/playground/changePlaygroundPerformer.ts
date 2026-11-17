import type { IPlaygroundComposition } from "./structures/IPlaygroundComposition";

/**
 * Change or remove a performer without leaving authored impulses on an old
 * subject. Renaming keeps that person's impulses; removal drops them. Other
 * performer edits preserve the force data, and legacy inputs gain no field.
 *
 * @param composition The editor's composition, which is left untouched.
 * @param index The performer to change.
 * @param patch Changed fields, or null to remove the performer.
 * @returns The changed composition; the input when the index names nobody.
 */
export function changePlaygroundPerformer(
  composition: IPlaygroundComposition,
  index: number,
  patch: Partial<IPlaygroundComposition.IPerformer> | null,
): IPlaygroundComposition {
  const current: IPlaygroundComposition.IPerformer | undefined =
    composition.performers[index];
  if (current === undefined) return composition;
  const performers: IPlaygroundComposition.IPerformer[] =
    patch === null
      ? composition.performers.filter(
          (_person: IPlaygroundComposition.IPerformer, at: number): boolean =>
            at !== index,
        )
      : composition.performers.map(
          (
            person: IPlaygroundComposition.IPerformer,
            at: number,
          ): IPlaygroundComposition.IPerformer =>
            at === index ? { ...person, ...patch } : person,
        );
  if (composition.forces === undefined) return { ...composition, performers };
  const forces: NonNullable<IPlaygroundComposition["forces"]> =
    composition.forces.flatMap(
      (
        force: NonNullable<IPlaygroundComposition["forces"]>[number],
      ): NonNullable<IPlaygroundComposition["forces"]> => {
        if (force.subject !== current.subject) return [force];
        return patch === null
          ? []
          : [{ ...force, subject: patch.subject ?? current.subject }];
      },
    );
  return { ...composition, performers, forces };
}
