import { AutoMovieArchetypeHolster } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";
import type { IScene } from "../structures/IScene";
import type { SceneBuildTypes } from "./SceneBuildTypes";
import { SceneTakes } from "./SceneTakes";

/** A region of another performer, as a motion target. */
type PersonTarget = Extract<IAutoMovieMotionTarget, { kind: "person" }>;

/**
 * Shorthands the scene records are written with, so each record reads as
 * who stands where and what they do.
 */
export namespace SceneBuild {
  /** An action: a name, its parameters, and the optional members. */
  export type Action = SceneBuildTypes.AuthoredAction;

  /** A performer: a body at a place, with its actions. */
  export type Performer = SceneBuildTypes.IAuthoredPerformer;

  /** A plain composition with law-checked action inputs. */
  export type Composition = SceneBuildTypes.IAuthoredComposition;

  /** A point targeted by a law, with its declared coordinate frame. */
  export type PointTarget = Extract<IAutoMovieMotionTarget, { kind: "point" }>;

  /** A named point of a placed prop, as a motion target. */
  export type PropTarget = Extract<IAutoMovieMotionTarget, { kind: "prop" }>;

  /**
   * A floor point, world metres.
   *
   * @param x To the left of a person facing +Z.
   * @param z Forward.
   * @returns The point.
   */
  export function to(x: number, z: number): IAutoMovieVector3 {
    return { x, y: 0, z };
  }

  /**
   * A region of a person, as a motion target.
   *
   * @param subject The person.
   * @param region The region.
   * @returns The target.
   */
  export function at(
    subject: string,
    region: PersonTarget["region"],
  ): PersonTarget {
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
    name: SceneBuildTypes.OptionalActionName,
    params?: undefined,
    more?: SceneBuildTypes.IActionOptions,
  ): Action;
  export function act<N extends SceneBuildTypes.ActionName>(
    name: N,
    params: SceneBuildTypes.ActionParams<NoInfer<N>>,
    more?: SceneBuildTypes.IActionOptions,
  ): Action;
  export function act(
    name: string,
    params: Record<string, unknown> = {},
    more: SceneBuildTypes.IActionOptions = {},
  ): IPlaygroundComposition.IAction {
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
  ): Performer {
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
    params?: Record<string, number | string>,
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

  /** How a blade is taken up for its use, as the package's own blade tests take it: its point the working tip, its line rising across the palm as a cutting grip holds it. */
  export const BLADE_USE: IAutoMovieMotionHumanGraspUse.IUse = {
    tip: "point",
    line: "oblique",
  };

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
    kind: string | undefined,
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

  /** How far a drawn blade's point clears its carrier's mouth, metres: an authored margin. */
  export const SHEATH_CLEARANCE: number = 0.03;

  /**
   * A scabbard or a sheath (`createHolster`) made to one blade and worn at a
   * hip from the start: its mouth just above the hip joint, 0.2 m to the
   * side and 0.12 m ahead of it in the hips' frame, tilted forward about
   * the hip's lateral axis by `cant` degrees, the scene's authored hang.
   *
   * @param subject The carrier's id.
   * @param kind A scabbard or a sheath.
   * @param blade The blade it is made to (`createHolster`'s `blade`).
   * @param wearer The person who wears it.
   * @param side The hip it hangs at.
   * @param cant The forward tilt of its mouth from plumb, degrees.
   * @returns The carrier.
   */
  export function carrier(
    subject: string,
    kind: "scabbard" | "sheath",
    blade: string,
    wearer: string,
    side: "left" | "right",
    cant: number,
  ): IPlaygroundComposition.IObject {
    const length: number = AutoMovieArchetypeHolster.create({
      kind,
      blade: blade as AutoMovieArchetypeHolster.Blade,
    }).affordance("mouth").frame.translation.y;
    const half: number = (cant * Math.PI) / 360;
    return {
      subject,
      producer: "createHolster",
      kind,
      params: { blade },
      x: 0,
      z: 0,
      yaw: 0,
      worn: {
        subject: wearer,
        bone: "hips",
        offset: {
          // The carrier stands on its tip, so its origin lies the length
          // down the tilted axis from the mouth.
          position: {
            x: side === "left" ? 0.2 : -0.2,
            y: 0.05 - length * Math.cos(2 * half),
            z: 0.12 - length * Math.sin(2 * half),
          },
          rotation: { x: Math.sin(half), y: 0, z: 0, w: Math.cos(half) },
        },
      },
    };
  }

  /**
   * A blade (`createSword`) seated in a carrier object from the start, its
   * shoulder on the carrier's mouth (`HumanSheath.of`), drawn by `drawn` and
   * returned by `sheathe`.
   *
   * @param blade The blade's id.
   * @param kind The blade's kind.
   * @param holder The carrier's id.
   * @param model The blade's read model, when the kind has them.
   * @returns The blade.
   */
  export function seated(
    blade: string,
    kind: string,
    holder: string,
    model?: string,
  ): IPlaygroundComposition.IObject {
    return {
      subject: blade,
      producer: "createSword",
      kind,
      ...(model === undefined ? {} : { params: { model } }),
      x: 0,
      z: 0,
      yaw: 0,
      sheath: {
        carrier: holder,
        mouth: "mouth",
        tip: "point",
        handle: "grip",
        clearance: SHEATH_CLEARANCE,
      },
    };
  }

  /**
   * Grip a seated blade and draw it out along its carrier's line: the
   * carrier pickup with no lift, then `drawFromCarrier`.
   *
   * @param blade The blade's id.
   * @param holder The carrier's id.
   * @param handle The blade's handle the hand grips.
   * @returns The two actions.
   */
  export function drawn(
    blade: string,
    holder: string,
    handle: string = "grip",
  ): Action[] {
    return [
      act("takeFromCarrier", { prop: blade, handle, lift: 0 }),
      act("drawFromCarrier", {
        prop: blade,
        from: {
          prop: holder,
          aperture: "sheathEntry",
          point: "sheathSeat",
          slider: "sheathSlider",
          slide: "sheathSlide",
        },
      }),
    ];
  }

  /**
   * Return a held blade through its carrier's entry to its seat
   * (`putDownAperture`).
   *
   * @param blade The blade's id.
   * @param holder The carrier's id.
   * @returns The action.
   */
  export function sheathe(blade: string, holder: string): Action {
    return act("putDownAperture", {
      prop: blade,
      onto: {
        prop: holder,
        aperture: "sheathEntry",
        point: "sheathSeat",
        guide: { slider: "sheathSlider", slide: "sheathSlide" },
      },
    });
  }

  /**
   * A thing worn on a person's bone from the start, until a hand takes it
   * up by a grip, such as a camera hanging from a strap at the chest.
   *
   * @param thing The thing's id.
   * @param producer Its producer.
   * @param kind Its kind.
   * @param wearer The person who wears it.
   * @param bone The bone it rides.
   * @param position Its place in the bone's frame, metres.
   * @returns The thing.
   */
  export function worn(
    thing: string,
    producer: string,
    kind: string | undefined,
    wearer: string,
    bone: string,
    position: { x: number; y: number; z: number },
  ): IPlaygroundComposition.IObject {
    return {
      subject: thing,
      producer,
      ...(kind === undefined ? {} : { kind }),
      x: 0,
      z: 0,
      yaw: 0,
      worn: {
        subject: wearer,
        bone,
        offset: { position, rotation: { x: 0, y: 0, z: 0, w: 1 } },
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
  export function seat(
    subject: string,
    id?: string,
  ): SceneBuildTypes.ISeatReference {
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
    ...args: SceneBuildTypes.MutualArguments
  ): SceneBuildTypes.AuthoredMutual;
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

    /** Metres from the camera to the framed action. Omit to fit the whole set. */
    distance?: IScene.ICamera["distance"];

    /** The skill of the last take. */
    skill?: IPlaygroundComposition.Proficiency;

    /** Whether the same stage marks admit the standard body-swapped take. */
    bodySwap?: boolean;

    /** Its place in the landing page's hero. */
    featured?: number;

    /** Emitters switched on by the scene's named action events. */
    practicalLights?: IScene.IPracticalLight[];

    /** The issue that fixes the refusal the installed packages give this scene today; it is written as it should play and shows that refusal until then. */
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
   * @param forces Authored impulses on the performers, at film seconds; none by default.
   * @param cues Named cue tracks the actions sync to or read, such as a trumpet's `charge`; none by default. Each ridden animal adds its own `<subject>:gaits` track.
   * @returns The record.
   */
  export function scene(
    about: IAbout,
    seed: string,
    performers: Performer[],
    objects: IPlaygroundComposition.IObject[] = [],
    mutuals: SceneBuildTypes.AuthoredMutual[] = [],
    forces: NonNullable<IPlaygroundComposition["forces"]> = [],
    cues: NonNullable<IPlaygroundComposition["cues"]> = {},
  ): IScene {
    const composition: IPlaygroundComposition = {
      version: forces.length !== 0 ? 3 : objects.length === 0 ? 1 : 2,
      seed,
      performers,
      mutuals,
      ...(objects.length === 0 ? {} : { objects }),
      ...(forces.length === 0 ? {} : { forces }),
      ...(Object.keys(cues).length === 0 ? {} : { cues }),
    };
    const takes: IScene.ITake[] = SceneTakes.of(composition, about.skill);
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
      takes:
        about.bodySwap === false
          ? takes.filter(
              (take: IScene.ITake): boolean => take.bodies === undefined,
            )
          : takes,
      camera: {
        view: about.view ?? "three-quarter",
        ...(about.distance === undefined ? {} : { distance: about.distance }),
      },
      needs: about.needs,
      ...(about.practicalLights === undefined
        ? {}
        : { practicalLights: about.practicalLights }),
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
