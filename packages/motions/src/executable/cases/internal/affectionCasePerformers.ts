import type { IAutoMovieMotionHumanPerformance } from "@automovie/interface";

/*
 * The two performers of an affection case, trained: `a` at the origin heading
 * +Z and `b` the gap ahead, facing `a` or turned the same way.
 * Parameter body: The body both carry.
 * Parameter facing: Whether `b` turns to face `a`.
 * Parameter gap: Metres from `a` to `b` along +Z.
 * Returns: The performers, `a` first.
 */
export function affectionCasePerformers<Body>(
  body: Body,
  facing: boolean,
  gap: number,
): affectionCasePerformers.IPerformer<Body>[] {
  return [
    {
      subject: "a",
      body,
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      proficiency: { level: "trained" },
    },
    {
      subject: "b",
      body,
      at: { x: 0, y: 0, z: gap },
      yaw: facing ? 180 : 0,
      proficiency: { level: "trained" },
    },
  ];
}

/*
 * An affection case's performer.
 */
export namespace affectionCasePerformers {
  /*
   * A performance's performer, carrying the given body.
   */
  export type IPerformer<Body> = Omit<
    IAutoMovieMotionHumanPerformance.IInput["performers"][number],
    "body"
  > & {
    /*
     * The body it carries.
     */
    body: Body;
  };
}
