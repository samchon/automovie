/**
 * Bhagat 2022 Table 2, 2614 working Kathani bullocks; means in metres, mass
 * absent.
 */
export const OX_BODY_MEASURES: Readonly<IOxBodyMeasures> = {
  withers: 1.1932,
  girth: 1.5061,
  body: 1.229,
  head: 0.4292,
  headWidth: 0.1693,
  tail: 0.9595,
  ear: 0.1903,
  horn: 0.1757,
};

interface IOxBodyMeasures {
  /** Ground to withers. */
  withers: number;

  /** Chest circumference. */
  girth: number;

  /** Reported body length; this article does not specify exact landmarks. */
  body: number;

  /** Face length, not cleaned skull length. */
  head: number;

  /** Forehead width. */
  headWidth: number;

  /** Reported tail length. */
  tail: number;

  /** External ear length. */
  ear: number;

  /** Reported horn length, without a curvature measurement. */
  horn: number;
}
