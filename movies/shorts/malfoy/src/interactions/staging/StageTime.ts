import { AutoMovieComposition, type IAutoMovieIntent } from "@automovie/engine";

import { StageAction } from "../../laws/staging/StageAction";

/**
 * Time-scoped helpers a scene uses to sit on the screenplay's anchors: a
 * scene that starts at its absolute second and fills to its end (every
 * single-subject chain is held to the end), and a marker the first-offer
 * habit reads as the scene's start. Absolute seconds appear only here and in
 * an action's own `start` or `contact` option.
 *
 * ```ts
 * StageTime.scene("s02", 15, 30, carina.offer(note, harry), harry.openPalm(carina), camera.twoShot([harry, carina], { start: 15 }));
 * ```
 *
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure composition; the laws resolve the seconds.
 * @evidence contracts/development/common.md#meaningful-documentation States what the helpers add.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two helpers over the engine's combinators.
 */
export namespace StageTime {
  /**
   * A scene: a marker at its start, its parts in parallel, and each
   * single-subject part held until the scene's end.
   *
   * @param id The screenplay scene's anchor, such as `s02`.
   * @param start Absolute start, seconds.
   * @param end Absolute end, seconds.
   * @param parts The scene's chains.
   * @returns The scene's composition.
   */
  export function scene(id: string, start: number, end: number, ...parts: AutoMovieComposition.Part[]): AutoMovieComposition {
    if (!(end > start)) throw new Error(`Scene ${id} must end after it starts`);
    return AutoMovieComposition.sequence(
      StageAction.intent("stage", { kind: "scene", id, start }, `scene:${id}`),
      AutoMovieComposition.parallel(
        ...parts.map((part: AutoMovieComposition.Part): AutoMovieComposition => {
          const node: AutoMovieComposition = AutoMovieComposition.of(part);
          const subjects: Set<string> = new Set(intents(node).map((i) => i.subject));
          if (subjects.size !== 1 || subjects.has("camera")) return node;
          const [subject] = [...subjects];
          return AutoMovieComposition.sequence(node, StageAction.intent(subject!, { kind: "until", seconds: end }));
        }),
      ),
    );
  }

  /**
   * Hold subjects until an absolute second.
   *
   * @param seconds Absolute second.
   * @param subjects Subjects or their ids.
   * @returns Their parallel holds.
   */
  export function until(seconds: number, ...subjects: (string | { readonly id: string })[]): AutoMovieComposition {
    return AutoMovieComposition.parallel(
      ...subjects.map((s) => StageAction.intent(typeof s === "string" ? s : s.id, { kind: "until", seconds })),
    );
  }

  /**
   * Place a prop at a named place or point, resting there from an absolute second (0 by default).
   *
   * @param prop The prop or its id.
   * @param at A place name or a world point.
   * @param seconds Absolute second.
   * @returns The placement intent.
   */
  export function rest(prop: string | { readonly id: string }, at: string | { x: number; y: number; z: number }, seconds: number = 0): AutoMovieComposition {
    return AutoMovieComposition.of(
      StageAction.intent(typeof prop === "string" ? prop : prop.id, {
        kind: "rest",
        at: typeof at === "string" ? { place: at } : { point: at },
        start: seconds,
      }),
    );
  }

  /** Every intent of a composition. */
  export function intents(node: AutoMovieComposition): IAutoMovieIntent[] {
    if (node.kind === "intent") return [node.intent];
    if (node.kind === "at") return intents(node.part);
    return node.parts.flatMap(intents);
  }
}
