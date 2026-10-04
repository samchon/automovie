/**
 * How an attached part follows the skin when a body control reshapes the head.
 *
 * `surface`: each part vertex is bound to one head skin triangle
 * (`triangles[v]`, a one-skin triangle id) with barycentric `weights` (three
 * per vertex) of the triangle point nearest to it in the neutral; the part row
 * is that point's skin row, so a deforming part (eyebrow, eyelash card) moves
 * with the skin it lies on. `rigid`: each part vertex belongs to one rigid
 * frame (`frames[v]`) that moves as a single translation, so a rigid part
 * (globe, dentition, tongue) is carried without being stretched;
 * `frameSources` says what moves each frame: a body joint cube, or the mean
 * row of the skin points nearest to that frame's vertices (the least-squares
 * translation of the skin the rigid body sits in). Both kinds are computed from
 * the published neutral; nothing is authored per person.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationPartBinding {
  kind: "surface" | "rigid";
  triangles: number[];
  weights: number[];
  frames: string[];
  frameSources: Record<string, string>;
  reason: string;
}
