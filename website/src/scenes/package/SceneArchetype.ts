import { ArchetypeRegistry } from "../../archetypes/ArchetypeRegistry";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/**
 * Builds the archetype a composition places, from `@automovie/archetypes`
 * alone, so a page that only draws a scene never loads the motion package.
 */
export namespace SceneArchetype {
  /** A scene prop, including the native articulation of its generated model. */
  export type Model = ArchetypeRegistry.Model;

  /**
   * The archetype of a placed object.
   *
   * @param object The placed object.
   * @returns The model its producer builds.
   * @throws {Error} When `@automovie/archetypes` exports no such producer.
   */
  export function model(object: IPlaygroundComposition.IObject): Model {
    const producer: ArchetypeRegistry.IFactory | undefined =
      ArchetypeRegistry.get(object.producer);
    if (producer === undefined)
      throw new Error(
        `The installed @automovie/archetypes has no producer named ${object.producer}`,
      );

    // Saved compositions store the selector under `kind`.
    const key: string = producer.variant.key || "kind";
    return producer.call(
      {
        ...(object.params ?? {}),
        ...(object.kind === undefined ? {} : { [key]: object.kind }),
      },
      object.seed,
    );
  }
}
