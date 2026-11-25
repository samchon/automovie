import * as archetypes from "@automovie/archetypes";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/**
 * Builds the archetype a composition places, from `@automovie/archetypes`
 * alone, so a page that only draws a scene never loads the motion package.
 */
export namespace SceneArchetype {
  /** A scene prop, including the native articulation of its generated model. */
  export type Model = archetypes.AutoMovieArchetype<
    string,
    string,
    archetypes.AutoMovieArchetypeMass.IProperties | null
  >;

  /**
   * A producer as the site calls it, with the variant list that names its
   * selector.
   */
  export interface IProducer {
    /** Build the model from its parameters and an optional seed. */
    (params: Record<string, unknown>, seed?: number): Model;

    /** The frames, when the producer's selector is `frame`. */
    FRAMES?: readonly string[];

    /** The formats, when the producer's selector is `format`. */
    FORMATS?: readonly string[];
  }

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

    // Saved compositions store the selector under `kind`.
    const made: IProducer = producer as IProducer;
    const key: string = Array.isArray(made.FRAMES)
      ? "frame"
      : Array.isArray(made.FORMATS)
        ? "format"
        : "kind";
    return made(
      {
        ...(object.params ?? {}),
        ...(object.kind === undefined ? {} : { [key]: object.kind }),
      },
      object.seed,
    );
  }
}
