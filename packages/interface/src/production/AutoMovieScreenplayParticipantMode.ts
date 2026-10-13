/**
 * Closed participation modes a screenplay scene may declare.
 *
 * A cast entry is not automatically an on-screen performer. The mode keeps presence, speech, crowds, objects, environmental agency and reference-only mentions distinct without asking the builder to infer prose.
 *
 * @evidence contracts/common.md#principled-implementation Explicit participation modes separate visual performers, offscreen speech, crowds, objects, environmental actors and mentions; screenplay cross-record validation can judge scene attribution without inferring presence from prose or cast membership.
 * @evidence contracts/common.md#clear-and-simple-design One closed mode belongs to a screenplay participant, independently of the compiled shot's actor and formation representations and the participant's evidence citations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A cast listing alone never establishes an on-screen performance, and a reference-only mention cannot silently acquire the execution obligations of an on-screen actor.
 * @evidence contracts/common.md#meaningful-documentation Explains why presence, speech, crowds, objects, environmental agency and reference-only mentions need distinct declared modes rather than prose inference.
 * @author Samchon
 */
export type AutoMovieScreenplayParticipantMode =
  | "on-screen"
  | "off-screen"
  | "crowd"
  | "object"
  | "environmental"
  | "referenced";
