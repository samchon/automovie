/**
 * The table a body's standing posture follows with age: how much the
 * thoracic kyphosis grows past the source body's own, which spine joints
 * carry it, and which joint turns the head back so the gaze stays level.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Types the posture the simple tier derives from a body's age and sex, as data a user can read.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Declares the posture table: the kyphosis by sex and age, the thoracic joints' shares and the compensating joint.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimplePosture {
  /** Thoracic kyphosis, the Cobb angle in degrees. */
  kyphosis: {
    /** The source body's own kyphosis: it stands as a young adult. */
    youngDegrees: number;

    /** The kyphosis of old age by sex, `[sex, degrees]`, linear in sex. */
    oldDegrees: [number, number][];

    /**
     * How far a body of an age has come from the young to the old kyphosis,
     * `[years, fraction]`, piecewise linear and held at the ends.
     */
    ageYears: [number, number][];
  };

  /** The spine joints that carry the added kyphosis as flexion, `[bone, share]`, the shares summing to one. */
  thoracic: [string, number][];

  /** The joint that extends by the added kyphosis, as far as its range allows, so the head keeps its orientation. */
  compensation: string;
}
