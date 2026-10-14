/**
 * Closed participation modes a screenplay scene may declare.
 *
 * A cast entry is not automatically an on-screen performer. The mode keeps presence, speech, crowds, objects, environmental agency and reference-only mentions distinct without asking the builder to infer prose.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union distinguishes six authored participation roles; it restricts typed values but supplies no scene-attribution or presence validation.
 * @evidence contracts/common.md#clear-and-simple-design One closed mode accompanies the participant id without introducing actor, formation or evidence fields into that two-field record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No mode implements a staging shortcut or special case; choosing on-screen records intent without proving visible performance.
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
