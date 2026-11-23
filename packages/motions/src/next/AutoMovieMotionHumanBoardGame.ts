import { HumanTabletop as HumanTabletopSource } from "../lexicon/HumanTabletop";

/**
 * Tabletop handling composed from pickups and placements: a chess move with its
 * capture, a deal round the seats, cards laid face up, a shuffle's two held
 * packets joined, a chip stack pushed to the pot and a die released onto the
 * table. Every prop keeps its own subject from start to rest, and each step
 * hands it from its support to the hand and from the hand to its next support,
 * so one owner holds it at every instant. A seat or square beyond the arm is
 * refused with its distance. No timing is defined by the family: each prop
 * takes the pickup and the placement laws' own (provisional: no study of
 * tabletop speeds).
 *
 * Lexicon rows and tables, the shipped data the laws and the chain read:
 *
 * - `HumanTabletop`: Tabletop handling composed from `pickUp` and `putDown`: a
 *   chess move with its capture, a deal round the seats, cards laid face up, a
 *   shuffle's two held packets joined, a chip stack pushed to the pot, notes
 *   counted out and a die released onto the table.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanBoardGame} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanBoardGame {
  /**
   * Tabletop handling composed from `pickUp` and `putDown`: a chess move with
   * its capture, a deal round the seats, cards laid face up, a shuffle's two
   * held packets joined, a chip stack pushed to the pot, notes counted out and
   * a die released onto the table. Each prop is picked up from its support and
   * put down on its next one, so its subject has exactly one owner at every
   * instant, and placement does the reach check: a seat or square beyond the
   * arm is refused with its distance. A move names its board state, so an
   * occupied target square without its capture is refused before anything
   * moves, as FIDE's laws forbid it (article 3.1).
   *
   * Duration: each prop takes a pick up and a put down, so a reach-to-grasp
   * time per transport (about 0.5 s for a 0.4 m reach,
   * `IAutoMovieMotionHumanPickUp`), a 0.15 s load, a 0.2 s release and the
   * return; the moves add no timing of their own (provisional: no study of
   * tabletop speeds). A chess move is one pick and one place, a deal one pair
   * per seat.
   */
  export import HumanTabletop = HumanTabletopSource;
}
