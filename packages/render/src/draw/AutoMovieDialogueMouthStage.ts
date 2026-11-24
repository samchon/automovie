import {
  sampleAutoMovieDialogueMouth,
  speakingAutoMovieDialogueLine,
} from "@automovie/engine";
import type {
  IAutoMovieDialogueMouthTrack,
  IAutoMovieDrawnMouth,
} from "@automovie/interface";
import type * as THREE from "three";

import { AutoMovieDialogueMouthFigures } from "../scene/AutoMovieDialogueMouthFigures.js";
import type { IAutoMovieDialogueMouthFigure } from "../scene/IAutoMovieDialogueMouthFigure.js";

/**
 * The draw page's dialogue mouths: it shows each speaking actor's mouth on the
 * actor's figures after a placement, and records what they showed.
 *
 * `show` runs right after every placement the page draws, at that placement's
 * film second. For each actor of the track it finds the actor's scene node, the
 * first object named by the actor under the drawn scene, and each figure bound
 * under that node (`bindAutoMovieDialogueMouth`). While one of the actor's
 * lines speaks there (`speakingAutoMovieDialogueLine`), each figure is shown
 * the actor's mouth (`sampleAutoMovieDialogueMouth`); otherwise it is shown
 * none and keeps its authored mouth. What a figure reports showing replaces the
 * actor's recorded value of the same form, so after the drawn second's last
 * placement the record holds the mouth drawn on that picture. An actor with no
 * node, no bound figure or a figure with no part to show a mouth records
 * nothing. The page clears the record before placing a picture's second and
 * reports it after.
 */
export class AutoMovieDialogueMouthStage {
  /** What the figures showed since the last `clear`, by actor in first order. */
  private readonly shown: Map<string, IAutoMovieDrawnMouth> = new Map();

  /** The actors the track moves, each once, in track order. */
  private readonly actors: readonly string[];

  /** Show the mouths of `track`. */
  public constructor(private readonly track: IAutoMovieDialogueMouthTrack) {
    this.actors = [
      ...new Set(
        track.lines.map(
          (line: IAutoMovieDialogueMouthTrack.ILine): string => line.actor,
        ),
      ),
    ];
  }

  /**
   * Show every actor's mouth at a film second on the figures under the actor's
   * node in `root`, as the stage describes.
   */
  public show(root: THREE.Object3D, seconds: number): void {
    for (const actor of this.actors) {
      const node: THREE.Object3D | undefined = root.getObjectByName(actor);
      if (node === undefined) continue;
      const figures: IAutoMovieDialogueMouthFigure[] = [];
      node.traverse((object: THREE.Object3D): void => {
        const figure: IAutoMovieDialogueMouthFigure | undefined =
          AutoMovieDialogueMouthFigures.get(object);
        if (figure !== undefined) figures.push(figure);
      });
      if (figures.length === 0) continue;
      const mouth: ReturnType<typeof sampleAutoMovieDialogueMouth> | null =
        speakingAutoMovieDialogueLine(this.track, actor, seconds) === null
          ? null
          : sampleAutoMovieDialogueMouth({ track: this.track, actor, seconds });
      for (const figure of figures) {
        const drawn: IAutoMovieDialogueMouthFigure.IShown | null =
          figure.show(mouth);
        if (drawn === null) continue;
        const entry: IAutoMovieDrawnMouth = this.shown.get(actor) ?? { actor };
        if (drawn.jaw !== undefined) entry.jaw = drawn.jaw;
        if (drawn.visemes !== undefined) entry.visemes = { ...drawn.visemes };
        this.shown.set(actor, entry);
      }
    }
  }

  /** Forget every recorded mouth, before a picture's second is placed. */
  public clear(): void {
    this.shown.clear();
  }

  /** Copies of what the figures showed since the last `clear`, one per actor. */
  public drawn(): IAutoMovieDrawnMouth[] {
    return [...this.shown.values()].map(
      (mouth: IAutoMovieDrawnMouth): IAutoMovieDrawnMouth => ({
        actor: mouth.actor,
        ...(mouth.jaw === undefined ? {} : { jaw: mouth.jaw }),
        ...(mouth.visemes === undefined
          ? {}
          : { visemes: { ...mouth.visemes } }),
      }),
    );
  }
}
