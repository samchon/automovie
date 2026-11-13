/**
 * What the gallery is asked to show: one subject, its variant, the seed and
 * the state of its articulations. The address carries exactly this.
 */
export interface IGalleryRequest {
  /** The subject's id in the catalogue. */
  subject: string;

  /** The variant's id; empty for a subject with one form only. */
  variant: string;

  /** The seed that draws an archetype's dimensions; empty takes the middle of every band. The polygon man ignores it. */
  seed: string;

  /** The travel of each articulation by affordance id; one not listed is at rest. */
  state: Record<string, number>;

  /** Whether the affordances are drawn on the model. */
  affordances: boolean;
}
