/**
 * Closed participation modes a screenplay scene may declare.
 *
 * A cast entry is not automatically an on-screen performer. The mode keeps
 * presence, speech, crowds, objects, environmental agency and reference-only
 * mentions distinct without asking the builder to infer prose.
 *
 * @author Samchon
 */
export type AutoMovieScreenplayParticipantMode =
  | "on-screen"
  | "off-screen"
  | "crowd"
  | "object"
  | "environmental"
  | "referenced";
