/**
 * What an archetype's page is asked to show: one subject, its variant, the
 * seed and the state of its articulations. The address carries exactly this.
 */
export interface IGalleryRequest {
  /** The subject's id in the catalogue, a producer's name such as `createSeat`. */
  subject: string;

  /** The variant's id; empty for a subject with one form only. */
  variant: string;

  /** The seed that draws the archetype's dimensions; empty takes the middle of every band. */
  seed: string;

  /** The travel of each articulation by affordance id; one not listed is at rest. */
  state: Record<string, number>;

  /** Whether the affordances are drawn on the model. */
  affordances: boolean;
}
