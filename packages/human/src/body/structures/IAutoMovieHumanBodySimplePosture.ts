/**
 * The table a body's standing posture follows with age: how much the
 * thoracic kyphosis grows past the source body's own, which spine joints
 * carry it, and which joint turns the head back so the gaze stays level.
 *
 * @evidence contracts/common.md#principled-implementation Age and sex curves specify an authored kyphosis increment distributed over named spine joints with a separate gaze compensation joint.
 * @evidence contracts/common.md#clear-and-simple-design The posture table groups its baseline, age response and joint shares.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The table represents an authored standing-posture response, without proving an individual's clinical capacity.
 * @evidence contracts/common.md#meaningful-documentation Members state Cobb degrees, interpolation, unit-sum shares and compensation limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The simple posture table declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The simple posture table schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The simple posture table type acquires no handles, tasks or retained storage.
 *
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
