import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieTransform,
} from "@automovie/interface";
import { HumanAidWalk, HumanObject } from "@automovie/motions";
import * as motions from "@automovie/motions";

import { SceneArchetype } from "../../scenes/package/SceneArchetype";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";
import { playgroundAidWalkAction } from "./playgroundAidWalkAction";
import { playgroundVehicleCourse } from "./playgroundVehicleCourse";

/**
 * The archetypes a composition places, as the props and seats its actions
 * read, through `HumanObject` of `@automovie/motions`.
 *
 * A composition is plain data, so an action names a seat or an opening by
 * the object that carries it: a parameter value `{ "$seat": "<object
 * subject>" }` or `{ "$aperture": "<object subject>" }`, with an optional
 * `"id"` for the affordance, is replaced by that object's seat or opening
 * before the chain is built. A release without `HumanObject` cannot
 * place objects, and a composition that does is refused with that reason.
 */
export namespace PlaygroundObjects {
  /** `HumanObject` as this module calls it, present only where the installed package has it. */
  interface IHumanObject {
    /** The prop of a model placed in the world. */
    prop(
      subject: string,
      model: object,
      placement: IPlacement,
      motion?: (seconds: number) => IPlacement,
      contact?: (id: string, seconds: number) => IAutoMovieTransform,
      tracks?: readonly IAutoMovieMotionHumanProp.ITrack[],
    ): IAutoMovieMotionHumanProp;

    /** The seat of a model placed in the world. */
    seat(model: object, placement: IPlacement, id?: string): unknown;
  }

  /** A placement as `HumanObject.Placement` takes it: a heading on a floor point, or a world frame, either as a fixture or not. */
  type IPlacement = (
    | { at: { x: number; y: number; z: number }; yaw: number }
    | {
        position: { x: number; y: number; z: number };
        rotation: IPlaygroundComposition.IQuaternion;
      }
  ) & { fixed?: boolean };

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
   * @param performers The performers who author floor-aid routes.
   * @returns One prop per object; undefined when there are none.
   * @throws {Error} When objects are placed but the installed package cannot place them, or a producer is not exported.
   */
  export function props(
    objects: readonly IPlaygroundComposition.IObject[],
    performers: readonly IPlaygroundComposition.IPerformer[],
  ): IAutoMovieMotionHumanProp[] | undefined {
    if (objects.length === 0) return undefined;
    const human: IHumanObject = attach();
    // An object worn at the start rides the wearer's bone until a hand
    // draws it, as `IAutoMovieMotionHumanProp.worn` says.
    return objects.map(
      (object: IPlaygroundComposition.IObject): IAutoMovieMotionHumanProp => {
        const rest: SceneArchetype.Model = SceneArchetype.model(object);
        const travel = playgroundVehicleCourse(object, rest);
        const placed = placement(object);
        const aid = playgroundAidWalkAction(object, performers);
        if (
          aid !== undefined &&
          (travel !== undefined || object.fixed || object.worn)
        )
          throw new Error(
            "A floor aid must be a movable placed prop with one route.",
          );
        const made: IAutoMovieMotionHumanProp = human.prop(
          object.subject,
          rest,
          placed,
          aid === undefined
            ? travel?.placement
            : HumanAidWalk.track(HumanObject.frame(placed), aid),
          travel?.contact,
          travel?.tracks,
        );
        return object.worn === undefined
          ? made
          : ({ ...made, worn: object.worn } as IAutoMovieMotionHumanProp);
      },
    );
  }

  /**
   * Replace every seat reference in an action's parameters by the seat of
   * the object it names, and every aperture reference (`{ "$aperture":
   * "<object subject>", "id"?: "<opening id>" }`) by that object's opening.
   *
   * @param params The action's parameters.
   * @param objects The composition's objects.
   * @returns The parameters with each `{ "$seat": ... }` and `{ "$aperture": ... }` resolved; the same object when it holds none.
   * @throws {Error} When a reference names no placed object, or an object no such opening.
   */
  export function resolve(
    params: Record<string, unknown>,
    objects: readonly IPlaygroundComposition.IObject[],
  ): Record<string, unknown> {
    const walk: (value: unknown) => unknown = (value: unknown): unknown => {
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
      if (typeof record["$aperture"] === "string")
        return aperture(
          record["$aperture"],
          typeof record["id"] === "string" ? record["id"] : undefined,
          objects,
        );
      return Object.fromEntries(
        Object.entries(record).map(
          ([key, inner]: [string, unknown]): [string, unknown] => [
            key,
            walk(inner),
          ],
        ),
      );
    };
    return walk(params) as Record<string, unknown>;
  }

  /**
   * The opening an object declares, placed where the composition puts it,
   * as `HumanObstacle.apertures` reads it from the archetype's own
   * `aperture` affordances.
   */
  function aperture(
    subject: string,
    id: string | undefined,
    objects: readonly IPlaygroundComposition.IObject[],
  ): unknown {
    const object: IPlaygroundComposition.IObject | undefined = objects.find(
      (o: IPlaygroundComposition.IObject): boolean => o.subject === subject,
    );
    if (object === undefined)
      throw new Error(
        `An aperture names the object ${subject}, which the composition does not place; it places ${objects.map((o: IPlaygroundComposition.IObject): string => o.subject).join(", ") || "none"}`,
      );
    const obstacle: unknown = MOTIONS["HumanObstacle"];
    const read: unknown =
      typeof obstacle === "object" && obstacle !== null
        ? (obstacle as Record<string, unknown>)["apertures"]
        : undefined;
    if (typeof read !== "function")
      throw new Error(
        "The installed @automovie/motions has no HumanObstacle.apertures, so an object's opening cannot be named yet",
      );
    const openings: { id: string }[] = (
      read as (
        model: object,
        at: ReturnType<typeof placement>,
      ) => { id: string }[]
    )(model(object), placement(object));
    const found: { id: string } | undefined =
      id === undefined
        ? openings[0]
        : openings.find((o: { id: string }): boolean => o.id === id);
    if (found === undefined)
      throw new Error(
        `The object ${subject} declares ${id === undefined ? "no opening" : `no opening ${id}`}; it declares ${openings.map((o: { id: string }): string => o.id).join(", ") || "none"}`,
      );
    return found;
  }

  /** The archetype of a placed object. */
  const model: (object: IPlaygroundComposition.IObject) => object = (
    object: IPlaygroundComposition.IObject,
  ): object => SceneArchetype.model(object);

  /** `HumanObject`, or the reason it cannot be used. */
  function attach(): IHumanObject {
    if (!available())
      throw new Error(
        "The installed @automovie/motions has no HumanObject, so objects cannot be placed in a performance yet",
      );
    return MOTIONS["HumanObject"] as IHumanObject;
  }

  /** Where an object rests: a heading on its floor point, or its whole rotation as a world frame, the two forms `HumanObject.Placement` takes, and whether it is a fixture. */
  function placement(object: IPlaygroundComposition.IObject): IPlacement {
    const fixed: { fixed?: boolean } =
      object.fixed === true ? { fixed: true } : {};
    return object.rotation === undefined
      ? {
          at: { x: object.x, y: object.y ?? 0, z: object.z },
          yaw: object.yaw,
          ...fixed,
        }
      : {
          position: { x: object.x, y: object.y ?? 0, z: object.z },
          rotation: object.rotation,
          ...fixed,
        };
  }
}
