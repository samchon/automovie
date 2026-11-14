/**
 * What the bake writes beside the tracks, `baked/manifest.json`: every baked
 * take of every scene, and every body a track names.
 *
 * A track file holds little-endian signed 16-bit values (`SceneTrack` says how each is scaled), frame after frame; in a
 * frame, figure after figure in `figures` order, then prop after prop in
 * `props` order; in a figure, bone after bone in its body's `order`, and a
 * prop is one entry, its frame; and for each entry its world position in
 * metres (x, y, z) then its rotation as a unit quaternion (x, y, z, w): from
 * the bind for a bone, from the prop's own axes for a prop. That is
 * `frames × (Σ bones + props) × 7` values.
 */
export interface ISceneManifest {
  /** The format's version; a page refuses any other. */
  version: 1;

  /**
   * The matrix, column-major, that puts a figure's own frame in the world the
   * stage draws, as `@automovie/human` states it.
   */
  reflection: number[];

  /** Every baked body, by body id. */
  bodies: Record<string, ISceneManifest.IBody>;

  /** Every baked scene, by scene id. */
  scenes: Record<string, ISceneManifest.IScene>;
}
export namespace ISceneManifest {
  /** One body as the polygon man is drawn from it. */
  export interface IBody {
    /** The file, under `baked/`, of its rest bones. */
    file: string;

    /** The bones a track gives for this body, in the track's order. */
    order: string[];

    /** What a picker calls the body, such as "Woman, 1.70 m". */
    label: string;

    /** The body's measures by name: lengths and heights in metres, mass in kilograms. */
    measures: Record<string, number>;
  }

  /** One scene's baked takes. */
  export interface IScene {
    /** Each take, in the scene's order. */
    takes: ITake[];
  }

  /** One baked take. */
  export interface ITake {
    /** The take's label. */
    label: string;

    /** The file, under `baked/`, of its track. */
    file: string;

    /** Frames a second. */
    fps: number;

    /** Frames in the track, one every `1 / fps` seconds from 0 s; the last is the last such instant within `duration`, so a player holds it to the end. */
    frames: number;

    /** The film's length, seconds. */
    duration: number;

    /** The figures, in the track's order. */
    figures: IFigure[];

    /** The subject ids of the props, in the track's order after the figures. */
    props: string[];

    /** Each figure's placed actions, in the figures' order. */
    timeline: ISpan[][];

    /** The digest of everything the take was computed from, so an unchanged take is not baked again. */
    digest: string;

    /** The packages' refusal, in their words, for a take of a scene its record says is refused until an issue lands; then `file` is empty and nothing is drawn. Absent for a baked take. */
    refusal?: string;
  }

  /** One placed action of a figure. */
  export interface ISpan {
    /** The action's name. */
    name: string;

    /** Its first second on the film clock. */
    from: number;

    /** Its last second on the film clock. */
    to: number;

    /** Whether it is performed over another action. */
    overlay: boolean;
  }

  /** One figure of a take. */
  export interface IFigure {
    /** The performer's subject id. */
    subject: string;

    /** Its body id, a key of `bodies`. */
    body: string;
  }
}
