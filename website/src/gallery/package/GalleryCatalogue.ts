import { ArchetypeRegistry } from "../../archetypes/ArchetypeRegistry";
import { formatArchetypeLabel } from "../formatArchetypeLabel";
import type { IGalleryCatalogue } from "../structures/IGalleryCatalogue";

/**
 * The gallery's catalogue, read from the packages.
 *
 * The website archetype resolver supplies the package functions and metadata.
 * The catalogue publishes IDs and options only; callable factories stay in
 * the local resolver. Dispatchers with concrete replacements supply aliases
 * for their old addresses.
 */
export namespace GalleryCatalogue {
  /** A displayed archetype with optional physical mass properties. */
  export type Model = ArchetypeRegistry.Model;

  /**
   * A producer as the gallery calls it: the function with the tables it
   * carries.
   */
  export type IProducer = ArchetypeRegistry.IFactory;

  /**
   * The parameters a producer needs beyond its variant, such as a cell front's
   * narrowest width.
   */
  export type ReferenceParams = Readonly<Record<string, unknown>>;

  /**
   * Stated reference parameters, or a factory that prepares them only when the
   * gallery opens the subject.
   */
  export type Reference = ReferenceParams | ReferenceFactory;

  /**
   * Prepares reference parameters on demand, such as a generated display a
   * carrier is fitted to.
   */
  export type ReferenceFactory = () => ReferenceParams;

  /** A producer's variants and the parameter that names one. */
  export interface IVariants {
    /**
     * The parameter name: `kind`, `frame` or `format`, or empty for a producer
     * with one form.
     */
    key: string;

    /**
     * The variant ids, in the producer's order; empty for a producer with one
     * form.
     */
    list: readonly string[];
  }

  /**
   * One family's displayed name and its producers by export name, in export
   * order.
   */
  interface IFamilyEntries {
    /** The family's subpath name, such as `furniture`. */
    name: string;

    /** Each producer with its export name. */
    entries: [string, IProducer][];
  }

  /**
   * A producer by its export name.
   *
   * @param id The export name, such as `createSeat`.
   * @returns The producer, or undefined when no family exports it.
   */
  export function producer(id: string): IProducer | undefined {
    return ArchetypeRegistry.get(id);
  }

  /**
   * The variants of a producer and the parameter that names one.
   *
   * @param made The producer.
   * @returns The parameter's name and the variants; an empty key and list for a
   *   producer with one form.
   */
  export function variants(made: IProducer): IVariants {
    return { key: made.variant.key, list: made.variant.values };
  }

  /**
   * Everything the gallery can show.
   *
   * @returns The displayed producers and aliases for dispatchers they
   *   represent.
   */
  export function catalogue(): IGalleryCatalogue {
    const aliases: IGalleryCatalogue.IAlias[] = [];
    const families: IFamilyEntries[] = ArchetypeRegistry.families().map(
      (family): IFamilyEntries => ({
        name: family.id,
        entries: family.factories.map(
          (factory): [string, IProducer] => [factory.id, factory],
        ),
      }),
    );
    const subjects: Map<IProducer["call"], string> = new Map(
      families.flatMap(({ entries }: IFamilyEntries) =>
        entries.map(
          ([id, made]: [string, IProducer]): [IProducer["call"], string] => [
            made.call,
            id,
          ],
        ),
      ),
    );
    const groups: IGalleryCatalogue.IGroup[] = families.map(
      ({ name, entries }: IFamilyEntries): IGalleryCatalogue.IGroup => {
        return {
          name,
          subjects: entries.flatMap(
            ([id, made]: [string, IProducer]): IGalleryCatalogue.ISubject[] => {
              const { key, list }: IVariants = variants(made);
              const replacements:
                | IGalleryCatalogue.IAliasVariant[]
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
                    (variant: string): IGalleryCatalogue.IVariant => ({
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
    subjects: ReadonlyMap<IProducer["call"], string>,
    made: IProducer,
    list: readonly string[],
  ): IGalleryCatalogue.IAliasVariant[] | undefined {
    if (Object.keys(made.producers).length === 0 || list.length === 0)
      return undefined;
    const replacements: IGalleryCatalogue.IAliasVariant[] = [];
    const used: Set<string> = new Set();
    for (const id of list) {
      const selected: IProducer | undefined = made.producers[id];
      if (selected === undefined || selected.call === made.call) return undefined;
      const subject: string | undefined = subjects.get(selected.call);
      if (subject === undefined) return undefined;
      const choices: readonly string[] = variants(selected).list;
      const variant: string =
        made.producerVariants?.[id] ?? (choices.length === 0 ? "" : id);
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
