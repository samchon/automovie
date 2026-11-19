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

  /** The first beat's record, as the screenplay writes it. */
  record: string[];

  /** The scene module that cites the beats. */
  code: { file: string; text: string[] };

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

    /**
     * For each performer, the first and last index of its actions in the
     * take's timeline that the beat covers, so the page lights the beat
     * while they play.
     */
    spans: Record<string, [number, number]>;
  }
}
