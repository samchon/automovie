/**
 * What one admission person document names: the face and body revisions it
 * is built on, each side's shape weights, and the population when the person
 * is drawn from a one-skin generation.
 *
 * @author Samchon
 */
export interface IHumanSourceAdmissionDocumentInput {
  /** Face basis or head view face id. */
  face: string;

  /** Body basis or body view body id. */
  body: string;

  /** Body channel weights. */
  bodyShape: Record<string, number>;

  /** Face channel weights. */
  faceShape: Record<string, number>;

  /** `linked` for a generation person; absent for the P1 pair. */
  population?: "linked";
}
