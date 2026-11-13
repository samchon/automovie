import type { IHumanProp } from "@automovie/motions";
import * as motions from "@automovie/motions";

import { SceneArchetype } from "../../scenes/package/SceneArchetype";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * The archetypes a composition places, as the props and seats its actions
 * read, through `HumanObject` of `@automovie/motions`.
 *
 * A composition is plain data, so an action names a seat by the object that
 * carries it: a parameter value `{ "$seat": "<object subject>" }`, with an
 * optional `"id"` for the seat's affordance, is replaced by that object's
 * seat before the chain is built. A release without `HumanObject` cannot
 * place objects, and a composition that does is refused with that reason.
 */
export namespace PlaygroundObjects {
  /** `HumanObject` as this module calls it, present only where the installed package has it. */
  interface IHumanObject {
    /** The prop of a model placed in the world. */
    prop(
      subject: string,
      model: object,
      placement: { at: { x: number; y: number; z: number }; yaw: number },
    ): IHumanProp;

    /** The seat of a model placed in the world. */
    seat(
      model: object,
      placement: { at: { x: number; y: number; z: number }; yaw: number },
      id?: string,
    ): unknown;
  }

  /** The packages' exports by name, for the members only some releases have. */
  const MOTIONS: Readonly<Record<string, unknown>> = motions as Readonly<
    Record<string, unknown>
  >;

  /**
   * Whether the installed packages can place objects.
   *
   * @returns Whether `HumanObject` is exported.
   */
  export function available(): boolean {
    return typeof MOTIONS["HumanObject"] === "object";
  }

  /**
   * The props of a composition's objects.
   *
   * @param objects The placed objects.
   * @returns One prop per object; undefined when there are none.
   * @throws {Error} When objects are placed but the installed package cannot place them, or a producer is not exported.
   */
  export function props(
    objects: readonly IPlaygroundComposition.IObject[],
  ): IHumanProp[] | undefined {
    if (objects.length === 0) return undefined;
    const human: IHumanObject = attach();
    return objects.map(
      (object: IPlaygroundComposition.IObject): IHumanProp =>
        human.prop(object.subject, model(object), placement(object)),
    );
  }

  /**
   * Replace every seat reference in an action's parameters by the seat of
   * the object it names.
   *
   * @param params The action's parameters.
   * @param objects The composition's objects.
   * @returns The parameters with each `{ "$seat": ... }` resolved; the same object when it holds none.
   * @throws {Error} When a reference names no placed object.
   */
  export function resolve(
    params: Record<string, unknown>,
    objects: readonly IPlaygroundComposition.IObject[],
  ): Record<string, unknown> {
    const walk = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(walk);
      if (typeof value !== "object" || value === null) return value;
      const record: Record<string, unknown> = value as Record<string, unknown>;
      if (typeof record["$seat"] === "string") {
        const subject: string = record["$seat"];
        const object: IPlaygroundComposition.IObject | undefined = objects.find(
          (o: IPlaygroundComposition.IObject): boolean => o.subject === subject,
        );
        if (object === undefined)
          throw new Error(
            `A seat names the object ${subject}, which the composition does not place; it places ${objects.map((o: IPlaygroundComposition.IObject): string => o.subject).join(", ") || "none"}`,
          );
        return attach().seat(
          model(object),
          placement(object),
          typeof record["id"] === "string" ? record["id"] : undefined,
        );
      }
      return Object.fromEntries(
        Object.entries(record).map(([key, inner]: [string, unknown]) => [
          key,
          walk(inner),
        ]),
      );
    };
    return walk(params) as Record<string, unknown>;
  }

  /** The archetype of a placed object. */
  const model = (object: IPlaygroundComposition.IObject): object =>
    SceneArchetype.model(object);

  /** `HumanObject`, or the reason it cannot be used. */
  function attach(): IHumanObject {
    if (!available())
      throw new Error(
        "The installed @automovie/motions has no HumanObject, so objects cannot be placed in a performance yet",
      );
    return MOTIONS["HumanObject"] as IHumanObject;
  }

  /** Where an object rests. */
  function placement(object: IPlaygroundComposition.IObject): {
    at: { x: number; y: number; z: number };
    yaw: number;
  } {
    return { at: { x: object.x, y: 0, z: object.z }, yaw: object.yaw };
  }
}
