import * as archetypes from "@automovie/archetypes";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/**
 * Builds the archetype a composition places, from `@automovie/archetypes`
 * alone, so a page that only draws a scene never loads the motion package.
 */
export namespace SceneArchetype {
  /** A scene prop, including the native articulation of its generated model. */
  export type Model = archetypes.Archetype<
    string,
    string,
    archetypes.ArchetypeMass.IProperties | null
  >;
  /** A producer as the site calls it. */
  type Producer = ((
    params: Record<string, unknown>,
    seed?: string,
  ) => Model) & {
    FRAMES?: readonly string[];
  };

  /**
   * The archetype of a placed object.
   *
   * @param object The placed object.
   * @returns The model its producer builds.
   * @throws {Error} When `@automovie/archetypes` exports no such producer.
   */
  export function model(object: IPlaygroundComposition.IObject): Model {
    const producer: unknown = (archetypes as Readonly<Record<string, unknown>>)[
      object.producer
    ];
    if (typeof producer !== "function")
      throw new Error(
        `The installed @automovie/archetypes has no producer named ${object.producer}`,
      );

    // A producer names its variants `kind`, or `frame` where they are frames.
    const made: Producer = producer as Producer;
    const key: string = Array.isArray(made.FRAMES) ? "frame" : "kind";
    return made(
      {
        ...(object.params ?? {}),
        ...(object.kind === undefined ? {} : { [key]: object.kind }),
      },
      object.seed,
    );
  }
}
