/**
 * Closed participation modes a screenplay scene may declare.
 *
 * A cast entry is not automatically an on-screen performer. The mode keeps
 * presence, speech, crowds, objects, environmental agency and reference-only
 * mentions distinct without asking the builder to infer prose.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-participant-modes Preserves every promised way a subject can participate in one scene.
 * @evidence specifications/narrative-and-intent/story-authority-and-hierarchy.md#narrative-intent-scene-prose-index Types the closed participant vocabulary used by the prose authority join.
 * @author Samchon
 */
export type AutoMovieScreenplayParticipantMode =
  | "on-screen"
  | "off-screen"
  | "crowd"
  | "object"
  | "environmental"
  | "referenced";
