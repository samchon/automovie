import type { IAutoMovieMotionHumanTabletop } from "../handling/IAutoMovieMotionHumanTabletop";

/**
 * Tabletop handling composed from pickups and placements: a chess move with its capture, a deal round the seats, cards laid face up, a shuffle's two held packets joined, a chip stack pushed to the pot and a die released onto the table. Every prop keeps its own subject from start to rest, and each step hands it from its support to the hand and from the hand to its next support, so one owner holds it at every instant. A seat or square beyond the arm is refused with its distance. No timing is defined by the family: each prop takes the pickup and the placement laws' own (provisional: no study of tabletop speeds).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per composition of the BoardGame behaviour, each taking its own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tabletop compositions and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its composition; nothing is redefined.
 */
export interface IAutoMovieMotionHumanBoardGame<Chain> {
  /**
   * Move a chess piece to a square, first setting a captured piece aside. The piece is picked up from its square and put down on the target square, so it has one owner at every instant; an occupied target without its capture is refused before anything moves (FIDE laws, article 3.1). It ends when the piece rests on the target square.
   *
   * @param params The `board`, `piece`, `to`, `occupancy`, `capture`, `aside` and `hand` of `IAutoMovieMotionHumanTabletop.IChessMove`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the piece is not on the board, the target is occupied without its capture, the capture is not on the target, or a capture has no place aside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.chessMove is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  chessMove(
    params: IAutoMovieMotionHumanTabletop.IChessMove,
    anchor?: string,
  ): Chain;

  /**
   * Deal cards from the top of the deck round the seats, face down, one pick up and one put down per seat. It ends when the last card rests at its seat.
   *
   * @param params The `cards`, `seats` and `hand` of `IAutoMovieMotionHumanTabletop.IDeal`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When no seat is named; the placement refuses a seat beyond the arm with its distance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.deal is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  deal(params: IAutoMovieMotionHumanTabletop.IDeal, anchor?: string): Chain;

  /**
   * Lay cards at given places and attitudes, such as revealing them face up. Each card is picked up and put down at its own place. It ends when the last card rests.
   *
   * @param params The `cards`, `places` and `hand` of `IAutoMovieMotionHumanTabletop.ILay`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When cards and places differ in number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.lay is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  lay(params: IAutoMovieMotionHumanTabletop.ILay, anchor?: string): Chain;

  /**
   * Lift a shuffle two packets, one in each hand, and join them: the left packet set down and the right one set on its top card. It ends when the joined deck rests squared.
   *
   * @param params The `left`, `leftTop`, `right` and `at` of `IAutoMovieMotionHumanTabletop.IShuffle`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the deck place is beyond the arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.shuffle is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  shuffle(
    params: IAutoMovieMotionHumanTabletop.IShuffle,
    anchor?: string,
  ): Chain;

  /**
   * Carry a stack on its bottom prop to a new place, as a chip stack is pushed to the pot. It ends when the stack rests at the destination.
   *
   * @param params The `stack`, `to` and `hand` of `IAutoMovieMotionHumanTabletop.IPush`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the destination is beyond the arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.push is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  push(params: IAutoMovieMotionHumanTabletop.IPush, anchor?: string): Chain;

  /**
   * Take a die up and release it onto the table at its place. It ends when the die rests there.
   *
   * @param params The `die`, `to` and `hand` of `IAutoMovieMotionHumanTabletop.IRoll`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the actions appended.
   * @throws {HumanRefusal} When the place is beyond the arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the composition does, its parameters, its anchor, its return and its refusals.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBoardGame.roll is provided by the chain that implements IAutoMovieMotionHumanBoardGame.
   */
  roll(params: IAutoMovieMotionHumanTabletop.IRoll, anchor?: string): Chain;
}
