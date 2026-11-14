import {
  ARCHETYPE_FAMILIES,
  type Archetype,
  type IArchetypeBand,
} from "@automovie/archetypes";

import { formatArchetypeLabel } from "../formatArchetypeLabel";
import type { IGalleryCatalogue } from "../structures/IGalleryCatalogue";

/**
 * The gallery's catalogue, read from the packages.
 *
 * An archetype family is one entry of the package's `ARCHETYPE_FAMILIES`,
 * which names each subpath it exports with that subpath's module. A producer
 * is every function a family exports whose name starts with `create`. Its
 * variants are the closed list it carries beside it, `KINDS` or `FRAMES`,
 * and its bands are its `BANDS`. Nothing here names a producer or a kind, so
 * one a package adds, in a family it already has or a new one, appears
 * without a change to the site.
 */
export namespace GalleryCatalogue {
  /** A producer as the gallery calls it: the function with the tables it carries. */
  export interface IProducer {
    /** Build the archetype from its parameters and a seed. */
    (
      params: Record<string, unknown>,
      seed?: number | string,
    ): Archetype<string, string>;

    /** The kinds, where the producer has kinds. */
    KINDS?: readonly string[];

    /** The frames, where the producer's variants are frames. */
    FRAMES?: readonly string[];

    /** The band of each free dimension, by variant where the producer has variants. */
    BANDS?: Readonly<Record<string, unknown>>;
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
    return { key: "", list: [] };
  }

  /**
   * The rows of a producer's band table: one record of bands per dimension
   * for each form the producer draws.
   *
   * A producer with one form carries one flat record. A producer with
   * several carries one record per form, keyed by whatever decides the
   * bands: usually the kind, but a door's are keyed by its hardware.
   *
   * @param made The producer.
   * @returns Every row; empty when the producer carries no bands.
   */
  export function bands(made: IProducer): Record<string, IArchetypeBand>[] {
    const band = (value: unknown): value is IArchetypeBand =>
      typeof value === "object" &&
      value !== null &&
      typeof (value as IArchetypeBand).minimum === "number" &&
      typeof (value as IArchetypeBand).maximum === "number";
    const row = (record: object): Record<string, IArchetypeBand> =>
      Object.fromEntries(
        Object.entries(record).filter(([, value]: [string, unknown]): boolean =>
          band(value),
        ),
      ) as Record<string, IArchetypeBand>;

    const table: Readonly<Record<string, unknown>> = made.BANDS ?? {};
    if (Object.values(table).some(band)) return [row(table)];
    return Object.values(table)
      .filter(
        (value: unknown): value is object =>
          typeof value === "object" && value !== null,
      )
      .map(row);
  }

  /**
   * Everything the gallery can show.
   *
   * @returns The catalogue: every family's producers with their variants.
   */
  export function catalogue(): IGalleryCatalogue {
    return {
      groups: [
        ...Object.entries(FAMILIES).map(
          ([name, family]): IGalleryCatalogue.IGroup => ({
            name,
            subjects: Object.entries(producers(family)).map(
              ([id, made]): IGalleryCatalogue.ISubject => {
                const { key, list } = variants(made);
                return {
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
                };
              },
            ),
          }),
        ),
      ],
    };
  }
}
