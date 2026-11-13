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
  ): IPlaygroundComposition.IObject {
    return {
      subject,
      producer,
      ...(kind === undefined ? {} : { kind }),
      x,
      z,
      ...(y === 0 ? {} : { y }),
      yaw,
    };
  }

  /**
   * A seat, named by the object that carries it, which the adapter resolves.
   *
   * @param subject The object's id.
   * @returns The seat reference.
   */
  export function seat(subject: string): Record<string, string> {
    return { $seat: subject };
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
  }

  /**
   * A scene record with the standard takes.
   *
   * @param about What the record says of the scene.
   * @param seed The seed every draw starts from.
   * @param performers Who does what.
   * @param objects What is placed.
   * @returns The record.
   */
  export function scene(
    about: IAbout,
    seed: string,
    performers: IPlaygroundComposition.IPerformer[],
    objects: IPlaygroundComposition.IObject[] = [],
  ): IScene {
    const composition: IPlaygroundComposition = {
      version: objects.length === 0 ? 1 : 2,
      seed,
      performers,
      mutuals: [],
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
