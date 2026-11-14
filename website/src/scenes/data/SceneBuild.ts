import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import { SceneTakes } from "./SceneTakes";

/**
 * Shorthands the scene records are written with, so each record reads as
 * who stands where and what they do.
 */
export namespace SceneBuild {
  /** An action: a name, its parameters, and the optional members. */
  export type Action = IPlaygroundComposition.IAction;

  /** A performer: a body at a place, with its actions. */
  export type Performer = IPlaygroundComposition.IPerformer;

  /**
   * A floor point, world metres.
   *
   * @param x To the left of a person facing +Z.
   * @param z Forward.
   * @returns The point.
   */
  export function to(x: number, z: number): Record<string, number> {
    return { x, y: 0, z };
  }

  /**
   * A region of a person, as a motion target.
   *
   * @param subject The person.
   * @param region The region.
   * @returns The target.
   */
  export function at(subject: string, region: string): Record<string, unknown> {
    return { kind: "person", subject, region };
  }

  /**
   * An action.
   *
   * @param name Its name in the vocabulary or the lexicon.
   * @param params Its parameters.
   * @param more Its anchor, cut, timing or overlays.
   * @returns The action.
   */
  export function act(
    name: string,
    params: Record<string, unknown> = {},
    more: Partial<Omit<Action, "name" | "params">> = {},
  ): Action {
    return { name, params, ...more };
  }

  /**
   * A performer.
   *
   * @param subject Its id.
   * @param body Its body's id.
   * @param x Starting floor point, metres.
   * @param z Starting floor point, metres.
   * @param yaw Starting heading, degrees; 0 faces +Z.
   * @param actions What it does, in order.
   * @param proficiency Its skill.
   * @returns The performer.
   */
  export function person(
    subject: string,
    body: string,
    x: number,
    z: number,
    yaw: number,
    actions: Action[],
    proficiency: IPlaygroundComposition.Proficiency = "trained",
  ): IPlaygroundComposition.IPerformer {
    return { subject, body, x, z, yaw, proficiency, actions };
  }

  /**
   * A placed archetype.
   *
   * @param subject Its id, by which actions name it.
   * @param producer The producer's export name.
   * @param kind Its kind, when the producer has kinds.
   * @param x Floor point, metres.
   * @param z Floor point, metres.
   * @param yaw Heading, degrees.
   * @param y Height above the floor, metres, for an object resting on another.
   * @param params Dimensions stated outright by the producer's own names, each within its band, for an object an action must match exactly; drawn when absent.
   * @returns The object.
   */
  export function object(
    subject: string,
    producer: string,
    kind: string | undefined,
    x: number,
    z: number,
    yaw: number = 0,
    y: number = 0,
    params?: Record<string, number>,
  ): IPlaygroundComposition.IObject {
    return {
      subject,
      producer,
      ...(kind === undefined ? {} : { kind }),
      x,
      z,
      ...(y === 0 ? {} : { y }),
      yaw,
      ...(params === undefined ? {} : { params }),
    };
  }

  /** A counter's top above the floor, metres: the middle of its band, where an object waits to be taken up. */
  export const COUNTER_TOP: number = 0.914;

  /**
   * A counter in front of a person facing +Z and the thing lying on it: the
   * counter's front toward the person, 0.53 m ahead of their feet, and the
   * thing near its front edge in line with the right shoulder, where the
   * standing arm of every body reaches its grip without a bend (a pick up
   * from an upright stance refuses a grip beyond the straight arm).
   *
   * @param stand The counter's id.
   * @param thing The thing's id.
   * @param producer The thing's producer.
   * @param kind The thing's kind.
   * @param x The person's floor point, metres.
   * @param z The person's floor point, metres.
   * @returns The counter and the thing.
   */
  export function counter(
    stand: string,
    thing: string,
    producer: string,
    kind: string,
    x: number,
    z: number,
  ): IPlaygroundComposition.IObject[] {
    return [
      object(stand, "createTable", "counter", x, z + 0.53, 180),
      object(thing, producer, kind, x - 0.18, z + 0.3, 0, COUNTER_TOP),
    ];
  }

  /**
   * A blade worn sheathed at a hip from the start, until a hand takes it up
   * by its grip: a sword or a knife is modelled standing along +Y from its
   * guard, so it is turned half about +X to hang point down, the hilt up at
   * the side of the hips (`left` for a cross draw by the right hand).
   *
   * @param blade The blade's id.
   * @param kind The blade's kind (`createSword`).
   * @param wearer The person who wears it.
   * @param side The hip it hangs at.
   * @returns The blade.
   */
  export function sheathed(
    blade: string,
    kind: string,
    wearer: string,
    side: "left" | "right",
  ): IPlaygroundComposition.IObject {
    return {
      subject: blade,
      producer: "createSword",
      kind,
      x: 0,
      z: 0,
      yaw: 0,
      worn: {
        subject: wearer,
        bone: "hips",
        offset: {
          position: { x: side === "left" ? 0.17 : -0.17, y: 0.05, z: 0.08 },
          rotation: { x: 1, y: 0, z: 0, w: 0 },
        },
      },
    };
  }

  /**
   * A seat, named by the object that carries it, which the adapter resolves.
   *
   * @param subject The object's id.
   * @param id The seat's affordance id, for an object with several seats; its only seat when absent.
   * @returns The seat reference.
   */
  export function seat(subject: string, id?: string): Record<string, string> {
    return id === undefined ? { $seat: subject } : { $seat: subject, id };
  }

  /**
   * A mutual action: what several performers do together.
   *
   * @param name The mutual action's name.
   * @param cast The performer cast in each role.
   * @param params The shared parameters.
   * @returns The mutual action.
   */
  export function mutual(
    name: string,
    cast: Record<string, string>,
    params: Record<string, unknown> = {},
  ): IPlaygroundComposition.IMutual {
    return { name, cast, params };
  }

  /** What a scene record needs beside its composition. */
  export interface IAbout {
    /** The route segment. */
    id: string;

    /** Its title. */
    title: string;

    /** One sentence. */
    summary: string;

    /** Its setting. */
    setting: IScene.Setting;

    /** Each performer's role, by subject. */
    roles: Record<string, string>;

    /** The issues it waits on while it cannot play. */
    needs: number[];

    /** The camera's view. */
    view?: IScene.ICamera["view"];

    /** The skill of the last take. */
    skill?: IPlaygroundComposition.Proficiency;

    /** Its place in the landing page's hero. */
    featured?: number;

    /** The issue that fixes the refusal the installed packages give this scene today; it is written as it should play and baked as that refusal until then. */
    refusedUntil?: number;
  }

  /**
   * A scene record with the standard takes.
   *
   * @param about What the record says of the scene.
   * @param seed The seed every draw starts from.
   * @param performers Who does what.
   * @param objects What is placed.
   * @param mutuals What several of them do together, each after every performer's own actions.
   * @returns The record.
   */
  export function scene(
    about: IAbout,
    seed: string,
    performers: IPlaygroundComposition.IPerformer[],
    objects: IPlaygroundComposition.IObject[] = [],
    mutuals: IPlaygroundComposition.IMutual[] = [],
  ): IScene {
    const composition: IPlaygroundComposition = {
      version: objects.length === 0 ? 1 : 2,
      seed,
      performers,
      mutuals,
      ...(objects.length === 0 ? {} : { objects }),
    };
    return {
      id: about.id,
      title: about.title,
      summary: about.summary,
      setting: about.setting,
      cast: performers.map(
        (p: IPlaygroundComposition.IPerformer): IScene.ICast => ({
          subject: p.subject,
          role: about.roles[p.subject] ?? p.subject,
        }),
      ),
      composition,
      takes: SceneTakes.of(composition, about.skill),
      camera: { view: about.view ?? "three-quarter" },
      needs: about.needs,
      ...(about.featured === undefined ? {} : { featured: about.featured }),
      ...(about.refusedUntil === undefined
        ? {}
        : { refusedUntil: about.refusedUntil }),
    };
  }

  /**
   * A planned scene: what it will compose and the issues it waits on.
   *
   * @param about What the record says of the scene.
   * @param planned Its cast and objects, and its pieces, in words.
   * @returns The record.
   */
  export function planned(
    about: Omit<IAbout, "roles">,
    planned: IScene.IPlanned,
  ): IScene {
    return {
      id: about.id,
      title: about.title,
      summary: about.summary,
      setting: about.setting,
      cast: [],
      composition: null,
      takes: [],
      camera: { view: about.view ?? "three-quarter" },
      needs: about.needs,
      planned,
    };
  }
}
