import type {
  IAutoMovieDialogueMouth,
  IAutoMovieDrawnMouth,
} from "@automovie/interface";

/**
 * A figure representation that draws a speaking actor's dialogue mouth over its
 * authored expression.
 *
 * The draw page finds it under the actor's scene node, the object named by the
 * speaker binding's `actor`, and calls `show` right after every placement it
 * draws: with the actor's mouth at the film second while one of the actor's
 * lines speaks, and with null otherwise, which restores the authored mouth.
 * `AutoMoviePlayer` binds one for a VRM, imported or generated model, which
 * takes the viseme weights, and `createAutoMovieHumanPolygonFigure` one for the
 * polygon man, which takes the jaw opening; `bindAutoMovieDialogueMouth` binds
 * any other figure, such as a Human mesh driven by its own pose.
 */
export interface IAutoMovieDialogueMouthFigure {
  /**
   * Layer `mouth` over the figure's authored expression as last placed, or show
   * the authored mouth alone when it is null.
   *
   * @returns What the figure now shows of the dialogue mouth, the jaw opening
   *   or the viseme weights its representation draws; null when it shows none,
   *   because `mouth` is null or the figure has no part to show it on.
   */
  show(
    mouth: IAutoMovieDialogueMouth | null,
  ): IAutoMovieDialogueMouthFigure.IShown | null;
}

/** Types of `IAutoMovieDialogueMouthFigure`. */
export namespace IAutoMovieDialogueMouthFigure {
  /**
   * The dialogue mouth a figure shows: the jaw opening in millimetres at the
   * incisors, or the MPEG-4 viseme weights, each present exactly when the
   * figure draws that form.
   */
  export type IShown = Pick<IAutoMovieDrawnMouth, "jaw" | "visemes">;
}
