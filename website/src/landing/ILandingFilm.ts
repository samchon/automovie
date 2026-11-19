import type { IScene } from "../scenes/structures/IScene";

/** The scene the landing page follows, and the documents a production holds for it. */
export interface ILandingFilm {
  /** The scene record whose baked take plays. */
  scene: string;

  /** The view the figures are drawn from. */
  view: IScene.ICamera["view"];

  /** Each performer's name in the screenplay, by subject id. */
  cast: Record<string, string>;

  /** The screenplay scene file's path in a production. */
  file: string;

  /** The scene file's H1. */
  heading: string;

  /** The section the beats belong to, its H2. */
  section: { anchor: string; title: string };

  /** The beats, H3s, in order. */
  beats: ILandingFilm.IBeat[];

  /** A brief file the beats cite. */
  brief: { file: string; text: string[] };

  /** The brief decisions the beats cite, as the graph labels them, such as `ren.md#stance`. */
  decisions: string[];

  /** The scene modules, each with the beats it cites; the first is the one the code panel shows. */
  modules: { file: string; beats: string[] }[];

  /** The first beat's record, as the screenplay writes it. */
  record: string[];

  /** The first module's source, which cites its beats. */
  code: { text: string[] };

  /** The check's report with one beat left unrealized, and with it realized. */
  report: { failing: string[]; passing: string[] };
}
export namespace ILandingFilm {
  /** One beat and the actions of the take that perform it. */
  export interface IBeat {
    /** Its anchor. */
    anchor: string;

    /** Its heading. */
    title: string;

    /** What happens, as the screenplay says it. */
    text: string;

    /** The brief decisions the beat's record cites, by their labels in `decisions`. */
    cites: string[];

    /**
     * For each performer, the first and last index of its actions in the
     * take's timeline that the beat covers, so the page lights the beat
     * while they play.
     */
    spans: Record<string, [number, number]>;
  }
}
