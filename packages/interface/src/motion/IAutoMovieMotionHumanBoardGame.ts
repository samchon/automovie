import type { IAutoMovieMotionHumanTabletop } from "./IAutoMovieMotionHumanTabletop";

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
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanBoardGame` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanBoardGame<Chain> {
  /**
   * Move a chess piece to a square, first setting a captured piece aside. The
   * piece is picked up from its square and put down on the target square, so it
   * has one owner at every instant; an occupied target without its capture is
   * refused before anything moves (FIDE laws, article 3.1). It ends when the
   * piece rests on the target square.
   *
   * Registered law: `registered("chessMove", params)`; not a chain method.
   *
   * @param params The `board`, `piece`, `to`, `occupancy`, `capture`, `aside`
   *   and `hand` of `IAutoMovieMotionHumanTabletop.IChessMove`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the piece is not on the board, the target is
   *   occupied without its capture, the capture is not on the target, or a
   *   capture has no place aside.
   */
  chessMove(
    params: IAutoMovieMotionHumanTabletop.IChessMove,
    anchor?: string,
  ): Chain;

  /**
   * Deal cards from the top of the deck round the seats, face down, one pick up
   * and one put down per seat. It ends when the last card rests at its seat.
   *
   * Registered law: `registered("deal", params)`; not a chain method.
   *
   * @param params The `cards`, `seats` and `hand` of
   *   `IAutoMovieMotionHumanTabletop.IDeal`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When no seat is named; the placement refuses a seat
   *   beyond the arm with its distance.
   */
  deal(params: IAutoMovieMotionHumanTabletop.IDeal, anchor?: string): Chain;

  /**
   * Lay cards at given places and attitudes, such as revealing them face up.
   * Each card is picked up and put down at its own place. It ends when the last
   * card rests.
   *
   * Registered law: `registered("lay", params)`; not a chain method.
   *
   * @param params The `cards`, `places` and `hand` of
   *   `IAutoMovieMotionHumanTabletop.ILay`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When cards and places differ in number.
   */
  lay(params: IAutoMovieMotionHumanTabletop.ILay, anchor?: string): Chain;

  /**
   * Lift a shuffle two packets, one in each hand, and join them: the left
   * packet set down and the right one set on its top card. It ends when the
   * joined deck rests squared.
   *
   * Registered law: `registered("shuffle", params)`; not a chain method.
   *
   * @param params The `left`, `leftTop`, `right` and `at` of
   *   `IAutoMovieMotionHumanTabletop.IShuffle`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the deck place is beyond the arm.
   */
  shuffle(
    params: IAutoMovieMotionHumanTabletop.IShuffle,
    anchor?: string,
  ): Chain;

  /**
   * Carry a stack on its bottom prop to a new place, as a chip stack is pushed
   * to the pot. It ends when the stack rests at the destination.
   *
   * Registered law: `registered("push", params)`; not a chain method.
   *
   * @param params The `stack`, `to` and `hand` of
   *   `IAutoMovieMotionHumanTabletop.IPush`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the destination is beyond the arm.
   */
  push(params: IAutoMovieMotionHumanTabletop.IPush, anchor?: string): Chain;

  /**
   * Take a die up and release it onto the table at its place. It ends when the
   * die rests there.
   *
   * Registered law: `registered("roll", params)`; not a chain method.
   *
   * @param params The `die`, `to` and `hand` of
   *   `IAutoMovieMotionHumanTabletop.IRoll`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the place is beyond the arm.
   */
  roll(params: IAutoMovieMotionHumanTabletop.IRoll, anchor?: string): Chain;
}
