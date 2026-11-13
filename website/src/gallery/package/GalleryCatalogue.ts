import type { Archetype, IArchetypeBand } from "@automovie/archetypes";
import * as animals from "@automovie/archetypes/animals";
import * as architecture from "@automovie/archetypes/architecture";
import * as furniture from "@automovie/archetypes/furniture";
import * as gym from "@automovie/archetypes/gym";
import * as props from "@automovie/archetypes/props";
import * as vehicles from "@automovie/archetypes/vehicles";
import * as weapons from "@automovie/archetypes/weapons";

import { PLAYGROUND_BODIES } from "../../playground/data/PLAYGROUND_BODIES";
import type { IGalleryCatalogue } from "../structures/IGalleryCatalogue";

/**
 * The gallery's catalogue, read from the packages.
 *
 * An archetype family is one subpath of `@automovie/archetypes`. A producer
 * is every function a family exports whose name starts with `create`. Its
 * variants are the closed list it carries beside it, `KINDS` or `FRAMES`,
 * and its bands are its `BANDS`. Nothing here names a producer or a kind, so
 * one a package adds appears without a change to the site.
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

  /** The id of the polygon man in the catalogue. */
  export const HUMAN: string = "human";

  /** The archetype families: the subpaths of `@automovie/archetypes`, in the order its README lists them. */
  export const FAMILIES: Readonly<
    Record<string, Readonly<Record<string, unknown>>>
  > = {
    props,
    furniture,
    architecture,
    vehicles,
    animals,
    weapons,
    gym,
  };

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
   * @returns The catalogue: the polygon man with the site's bodies, then every family's producers with their variants.
   */
  export function catalogue(): IGalleryCatalogue {
    return {
      groups: [
        {
          name: HUMAN,
          subjects: [
            {
              id: HUMAN,
              label: "Polygon man",
              group: HUMAN,
              variantKey: "body",
              variants: Object.entries(PLAYGROUND_BODIES).map(
                ([id, entry]): { id: string; label: string } => ({
                  id,
                  label: entry.label,
                }),
              ),
            },
          ],
        },
        ...Object.entries(FAMILIES).map(
          ([name, family]): IGalleryCatalogue.IGroup => ({
            name,
            subjects: Object.entries(producers(family)).map(
              ([id, made]): IGalleryCatalogue.ISubject => {
                const { key, list } = variants(made);
                return {
                  id,
                  // `createLongTool` reads as "Long tool".
                  label: id
                    .slice("create".length)
                    .replace(
                      /(?!^)[A-Z]/g,
                      (letter: string): string => ` ${letter.toLowerCase()}`,
                    ),
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
