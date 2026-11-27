import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import type { crawlFeet } from "./crawlFeet";

/*
 * What the way down onto all fours (`crawlDown`) is built from.
 */
export interface ICrawlDownProps {
  /*
   * The body.
   */
  body: IAutoMovieMotionHumanBody;

  /*
   * The standing posture the body gets down from, its feet on their goals.
   */
  standing: IAutoMovieMotionHumanPosture;

  /*
   * The pose the entry displays, whose arms the way down starts from.
   */
  entry: IAutoMoviePose;

  /*
   * Seconds the sit onto the knees takes; the rest of the way down goes at its
   * pace.
   */
  sit: number;

  /*
   * The crawl's posture where the way down ends, its hips `back` metres behind
   * their place over the knees and its trunk at `lean` of its pitch, the feet
   * tucked on their goals and the palms on theirs.
   * Parameter base: The posture the row is written over.
   * Parameter back: Metres the hips sit back along the heading.
   * Parameter lean: The share of the crawl's pitch the trunk leans by.
   * Parameter palms: Whether the palms are laid on their places; true when absent,
   * and false where only the trunk and the legs are read.
   * Returns: The posture.
   */
  kneeling(
    base: IAutoMovieMotionHumanPosture,
    back: number,
    lean: number,
    palms?: boolean,
  ): IAutoMovieMotionHumanPosture;

  /*
   * The crawl's trunk pitch, degrees.
   */
  pitch: number;

  /*
   * Each foot tucked behind its knee where the way down ends.
   */
  tucks: Record<AutoMovieHumanSide, crawlFeet.ITuck>;

  /*
   * Whether the knees hover and the tucked toes bear before the palms land.
   */
  hover: boolean;

  /*
   * Whether the hips own a balance window over the way down, so its balanced
   * keys are solved as it is built (`crawlDown`).
   */
  balanced: boolean;
}
