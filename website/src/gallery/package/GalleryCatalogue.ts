import {
  ARCHETYPE_FAMILIES,
  type Archetype,
  type ArchetypeMass,
} from "@automovie/archetypes";

import { formatArchetypeLabel } from "../formatArchetypeLabel";
import type { IGalleryCatalogue } from "../structures/IGalleryCatalogue";

/**
 * The gallery's catalogue, read from the packages.
 *
 * The package's `ARCHETYPE_FAMILIES` supplies its model-producing subpaths.
 * A producer is every function a family exports whose name starts with `create`. Its
 * variants are the closed list it carries beside it, `KINDS`, `FRAMES` or `FORMATS`,
 * and the parameters it needs beyond its variant
 * are its `REFERENCE`, the stated instance it carries for a caller without
 * a site. A dispatcher whose variants already have named replacements
 * supplies aliases for its old addresses.
 */
export namespace GalleryCatalogue {
  /** A displayed archetype with optional physical mass properties. */
  export type Model = Archetype<
    string,
    string,
    ArchetypeMass.IProperties | null
  >;

  /** A producer as the gallery calls it: the function with the tables it carries. */
  export interface IProducer {
    /** Build the archetype from its parameters and a seed. */
    (params: Record<string, unknown>, seed?: number | string): Model;

    /** The kinds, where the producer has kinds. */
    KINDS?: readonly string[];

    /** The frames, where the producer's variants are frames. */
    FRAMES?: readonly string[];

    /** The named formats when a producer takes a format selector. */
    FORMATS?: readonly string[];

    /** The stated reference parameters. A factory can prepare a required prop when the gallery opens it. */
    REFERENCE?:
      | Readonly<Record<string, unknown>>
      | (() => Readonly<Record<string, unknown>>);

    /** A dispatcher's public variant factories, each with its own reference parameters. */
    PRODUCERS?: Readonly<Record<string, IProducer>>;

    /** Target variant names when the old and new selectors use different IDs. */
    PRODUCER_VARIANTS?: Readonly<Record<string, string>>;
  }

  /** The archetype families, by subpath, in the package's order. */
  export const FAMILIES: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  > = ARCHETYPE_FAMILIES;

  /**
   * The producers of a family.
   *
   * @param family The family's exports.
   * @returns Each producer by its export name, in export order.
   */
  export function producers(
    family: Readonly<Record<string, unknown>>,
  ): Record<string, IProducer> {
    return Object.fromEntries(
      Object.entries(family).filter(
        ([name, value]: [string, unknown]): boolean =>
          /^create[A-Z]/.test(name) && typeof value === "function",
      ),
    ) as Record<string, IProducer>;
  }

  /**
   * A producer by its export name.
   *
   * @param id The export name, such as `createSeat`.
   * @returns The producer, or undefined when no family exports it.
   */
  export function producer(id: string): IProducer | undefined {
    for (const family of Object.values(FAMILIES)) {
      const found: IProducer | undefined = producers(family)[id];
      if (found !== undefined) return found;
    }
    return undefined;
  }

  /**
   * The variants of a producer and the parameter that names one.
   *
   * @param made The producer.
   * @returns The parameter's name and the variants; an empty key and list for a producer with one form.
   */
  export function variants(made: IProducer): {
    key: string;
    list: readonly string[];
  } {
    if (Array.isArray(made.KINDS)) return { key: "kind", list: made.KINDS };
    if (Array.isArray(made.FRAMES)) return { key: "frame", list: made.FRAMES };
    if (Array.isArray(made.FORMATS))
      return { key: "format", list: made.FORMATS };
    return { key: "", list: [] };
  }

  /**
   * Everything the gallery can show.
   *
   * @returns The displayed producers and aliases for dispatchers they represent.
   */
  export function catalogue(): IGalleryCatalogue {
    const aliases: IGalleryCatalogue.IAlias[] = [];
    const families = Object.entries(FAMILIES).map(([name, family]) => ({
      name,
      entries: Object.entries(producers(family)),
    }));
    const subjects: Map<IProducer, string> = new Map(
      families.flatMap(({ entries }) =>
        entries.map(([id, made]): [IProducer, string] => [made, id]),
      ),
    );
    const groups: IGalleryCatalogue.IGroup[] = families.map(
      ({ name, entries }): IGalleryCatalogue.IGroup => {
        return {
          name,
          subjects: entries.flatMap(
            ([id, made]): IGalleryCatalogue.ISubject[] => {
              const { key, list }: ReturnType<typeof variants> = variants(made);
              const replacements:
                | IGalleryCatalogue.IAlias["variants"]
                | undefined = replacementsOf(subjects, made, list);
              if (replacements !== undefined) {
                aliases.push({ id, variants: replacements });
                return [];
              }
              return [
                {
                  id,
                  label: formatArchetypeLabel(id),
                  group: name,
                  variantKey: key,
                  variants: list.map(
                    (variant: string): { id: string; label: string } => ({
                      id: variant,
                      label: variant,
                    }),
                  ),
                },
              ];
            },
          ),
        };
      },
    );
    return { groups, aliases };
  }

  /** Finds a visible producer and variant for each choice of a dispatcher. */
  function replacementsOf(
    subjects: ReadonlyMap<IProducer, string>,
    made: IProducer,
    list: readonly string[],
  ): IGalleryCatalogue.IAlias["variants"] | undefined {
    if (made.PRODUCERS === undefined || list.length === 0) return undefined;
    const replacements: IGalleryCatalogue.IAlias["variants"] = [];
    const used: Set<string> = new Set();
    for (const id of list) {
      const selected: IProducer | undefined = made.PRODUCERS[id];
      if (selected === undefined || selected === made) return undefined;
      const subject: string | undefined = subjects.get(selected);
      if (subject === undefined) return undefined;
      const choices: readonly string[] = variants(selected).list;
      const variant: string =
        made.PRODUCER_VARIANTS?.[id] ?? (choices.length === 0 ? "" : id);
      if (choices.length === 0 ? variant !== "" : !choices.includes(variant))
        return undefined;
      const key: string = JSON.stringify([subject, variant]);
      if (used.has(key)) return undefined;
      used.add(key);
      replacements.push({ id, subject, variant });
    }
    return replacements;
  }
}
