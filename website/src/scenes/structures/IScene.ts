import type { IPlaygroundComposition } from "../../playground/structures/IPlaygroundComposition";

/**
 * One applied scene the site plays: who is in it, what is placed in it, what
 * they do, and the takes that replay it with other seeds, bodies or skill.
 *
 * A scene is data. The build computes every take of a scene that plays into
 * a baked track, the gallery lists it, its page plays it, and the playground
 * opens its composition. A scene marked `refusedUntil` is baked with each
 * refused take's refusal in place of its track, and its page shows that
 * refusal; neither the playground nor a reference page's trial opens it. A
 * scene whose pieces the installed packages lack still lists, with the
 * issues it waits on, so it turns playable the day those pieces land
 * without a change to any page.
 */
export interface IScene {
  /** The route segment of its page, unique among scenes. */
  id: string;

  /** The title a card and the page show. */
  title: string;

  /** One sentence saying what happens. */
  summary: string;

  /** The setting the gallery groups it under. */
  setting: IScene.Setting;

  /** Who is in it: one entry per performer of the composition, in the same order. */
  cast: IScene.ICast[];

  /**
   * What it composes, with every person's starting place and body; null for
   * a planned scene, which the packages cannot compose yet.
   */
  composition: IPlaygroundComposition | null;

  /** The takes, the first one being the scene itself; empty for a planned scene. */
  takes: IScene.ITake[];

  /** Where the camera stands when the scene opens. */
  camera: IScene.ICamera;

  /**
   * The issues it waits on while the installed packages cannot play it;
   * empty for a scene written against what master exports.
   */
  needs: number[];

  /**
   * The issue whose fix lets the packages perform this scene, when they
   * refuse or fail on it today. The scene is built exactly as it should
   * play; the bake keeps each refused take's refusal in place of its track
   * and the page shows it, so a motion the code cannot perform yet is on
   * the site with its reason. An unmarked refusal still fails the bake.
   */
  refusedUntil?: number;

  /** For a planned scene: the pieces it will compose and what it will show. */
  planned?: IScene.IPlanned;

  /** Its place in the landing page's hero, lowest first; not featured when absent. */
  featured?: number;

  /** Baked and played by a page, but not listed in the gallery. */
  hidden?: boolean;
}
export namespace IScene {
  /** A setting the gallery groups scenes under. */
  export type Setting =
    | "everyday"
    | "street"
    | "sport"
    | "gym"
    | "combat"
    | "partner"
    | "ride"
    | "work"
    | "troops";

  /** The settings the gallery groups scenes under, in its order; each label of `SETTING_LABELS` names one. */
  export const SETTINGS: readonly Setting[] = [
    "everyday",
    "street",
    "sport",
    "gym",
    "combat",
    "partner",
    "ride",
    "work",
    "troops",
  ];

  /** What the gallery's chips call each setting. */
  export const SETTING_LABELS: Readonly<Record<Setting, string>> = {
    everyday: "Everyday",
    street: "Street",
    sport: "Sport",
    gym: "Gym",
    combat: "Combat",
    partner: "Partner",
    ride: "Riding and vehicles",
    work: "Work",
    troops: "Troops and crowds",
  };

  /** One person of the cast. */
  export interface ICast {
    /** The performer's subject id in the composition. */
    subject: string;

    /** What the person is in the scene, such as "barista" or "fencer". */
    role: string;
  }

  /**
   * One take: the scene's composition with some of its choices changed. A
   * member left out keeps the scene's own choice.
   */
  export interface ITake {
    /** What the take changes, as its label says it: "Seed 2", "Novices". */
    label: string;

    /** The seed every draw starts from. */
    seed?: string;

    /** The body of each named performer, by subject id. */
    bodies?: Record<string, string>;

    /** The skill of each named performer, by subject id. */
    proficiency?: Record<string, IPlaygroundComposition.Proficiency>;
  }

  /** The camera a scene opens with. */
  export interface ICamera {
    /** The named view. */
    view: "three-quarter" | "front" | "side" | "top";

    /** Metres from the middle of the action; framed to fit when absent. */
    distance?: number;
  }

  /** What a planned scene will compose. */
  export interface IPlanned {
    /** The cast and the objects, in words. */
    cast: string;

    /** The pieces the planned issues add, in words. */
    pieces: string;
  }
}
