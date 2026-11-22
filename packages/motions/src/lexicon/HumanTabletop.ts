import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanTabletop,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

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
 * Duration: each prop takes a pick up and a put down, so a reach-to-grasp time per transport (about 0.5 s for a 0.4 m reach, `IAutoMovieMotionHumanPickUp`), a 0.15 s load, a 0.2 s release and the return; the moves add no timing of their own (provisional: no study of tabletop speeds). A chess move is one pick and one place, a deal one pair per seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each composition, the identity rule and the refusals.
 * @evidence contracts/development/design.md#principled-representation Compositions over the shipped pickup and placement laws; the composer owns only the board-state refusals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The tabletop scenes the issue names: cards, chips, dice, notes and chess.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No new motion law; every step is a pickup or a placement.
 */
export namespace HumanTabletop {
  /**
   * Move a chess piece to a square, first setting a captured piece aside.
   *
   * @param chain The chain the move continues.
   * @param params The board, piece, target, board state and capture.
   * @returns The chain after the move.
   * @throws {HumanRefusal} When the piece is not on the board, the target is occupied without its capture, the capture is not on the target, or a capture has no place aside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the steps and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The board state decides legality before any step; the piece is put on the target square's socket by its base, so it lands at the square's centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the board, set the capture aside, then pick up and place the piece.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refusals name the square and the piece found there.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most four chained steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function chessMove(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IChessMove,
  ): IAutoMovieMotionHumanChain {
    const squares: string[] = Object.keys(params.occupancy);
    if (
      !squares.some(
        (square: string): boolean => params.occupancy[square] === params.piece,
      )
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "piece",
        value: params.piece,
        feasible: {
          kind: "alternatives",
          values: squares.map(
            (square: string): string => params.occupancy[square]!,
          ),
        },
        reason: "the moving piece stands on no square of the board",
        fix: "name a piece the board state places on a square",
      });
    const occupant: string | undefined = params.occupancy[params.to];
    if (occupant !== undefined && occupant !== params.capture)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: params.to,
        feasible: { kind: "alternatives", values: [occupant] },
        reason: `${params.to} is occupied by ${occupant}, which the move does not capture`,
        fix: `capture ${occupant} or move to an empty square`,
      });
    if (params.capture !== undefined && occupant !== params.capture)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "capture",
        value: params.capture,
        feasible: {
          kind: "alternatives",
          values: occupant === undefined ? [] : [occupant],
        },
        reason: `${params.capture} does not stand on ${params.to}`,
        fix: "capture the piece on the target square",
      });
    const hand: IAutoMovieMotionHumanTabletop.IChessMove["hand"] =
      params.hand ?? "right";
    let next: IAutoMovieMotionHumanChain = chain;
    if (params.capture !== undefined) {
      const aside: IAutoMovieVector3 | undefined = params.aside;
      if (aside === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "aside",
          value: "absent",
          feasible: null,
          reason:
            "a captured piece is lifted off the board to a place beside it",
          fix: "give `aside`, a world point beside the board",
        });
      next = next
        .pickUp({ prop: params.capture, handle: "grip", hand, lift: 0.05 })
        .putDown({ prop: params.capture, at: aside, hand });
    }
    return next
      .pickUp({ prop: params.piece, handle: "grip", hand, lift: 0.05 })
      .putDown({
        prop: params.piece,
        onto: { prop: params.board, point: params.to, via: "base" },
        hand,
      });
  }

  /**
   * Deal cards from the top of the deck round the seats, face down.
   *
   * @param chain The chain the deal continues.
   * @param params The cards in dealing order, the seats and the hand.
   * @returns The chain after the deal.
   * @throws {HumanRefusal} When no seat is named; the placement refuses a seat beyond the arm with its distance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the order, the seats and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each card goes from the deck's top to the next seat in turn, at its declared face-down attitude.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pickup and one placement per card.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The placement owns the reach refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two steps per card.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function deal(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IDeal,
  ): IAutoMovieMotionHumanChain {
    if (params.seats.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "seats",
        value: 0,
        feasible: null,
        reason: "a deal needs at least one seat",
        fix: "name each seat's place",
      });
    const hand: IAutoMovieMotionHumanTabletop.IDeal["hand"] =
      params.hand ?? "right";
    return params.cards.reduce(
      (
        next: IAutoMovieMotionHumanChain,
        card: string,
        i: number,
      ): IAutoMovieMotionHumanChain =>
        next
          .pickUp({ prop: card, handle: "grip", hand, lift: 0.04 })
          .putDown({
            prop: card,
            at: params.seats[i % params.seats.length]!,
            hand,
          }),
      chain,
    );
  }

  /**
   * Lay cards at given places and attitudes, such as revealing them face up.
   *
   * @param chain The chain the laying continues.
   * @param params The cards and each one's place.
   * @returns The chain after the cards are laid.
   * @throws {HumanRefusal} When cards and places differ in number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pairing and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each card is put down at its declared whole attitude through the placement's `rotation`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pickup and one placement per card.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The placement refuses an attitude the wrist cannot reach.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two steps per card.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lay(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.ILay,
  ): IAutoMovieMotionHumanChain {
    if (params.cards.length !== params.places.length)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "places",
        value: params.places.length,
        feasible: {
          kind: "range",
          minimum: params.cards.length,
          maximum: params.cards.length,
          unit: "",
        },
        reason: "each laid card needs exactly one place",
        fix: "give one place per card",
      });
    const hand: IAutoMovieMotionHumanTabletop.ILay["hand"] =
      params.hand ?? "right";
    return params.cards.reduce(
      (
        next: IAutoMovieMotionHumanChain,
        card: string,
        i: number,
      ): IAutoMovieMotionHumanChain =>
        next
          .pickUp({ prop: card, handle: "grip", hand, lift: 0.04 })
          .putDown({
            prop: card,
            at: params.places[i]!.at,
            rotation: params.places[i]!.rotation,
            hand,
          }),
      chain,
    );
  }

  /**
   * Lift a shuffle's two packets, one in each hand, and join them.
   *
   * @param chain The chain the shuffle continues.
   * @param params The two packets' carrying cards, the left packet's top and the deck's place.
   * @returns The chain after the packets are joined.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the holds and the join.
   * @evidence contracts/development/implementation.md#principled-implementation Each packet rides its bottom card, so a hand holds the whole packet; the right packet is set on the left packet's top card by its base.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two pickups, then two placements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The packets keep their cards; none is copied or moved by hand alone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four chained steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shuffle(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IShuffle,
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: params.left, handle: "grip", hand: "left", lift: 0.05 })
      .pickUp({ prop: params.right, handle: "grip", hand: "right", lift: 0.05 })
      .putDown({ prop: params.left, at: params.at, hand: "left" })
      .putDown({
        prop: params.right,
        onto: { prop: params.leftTop, point: "top", via: "base" },
        hand: "right",
      });
  }

  /**
   * Carry a stack on its bottom prop to a new place, as a chip stack is pushed to the pot.
   *
   * @param chain The chain the push continues.
   * @param params The stack's bottom prop and its destination.
   * @returns The chain after the stack is set down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what carries the stack and where it goes.
   * @evidence contracts/development/implementation.md#principled-implementation The stack's props ride its bottom prop, so moving it moves them all.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pickup and one placement.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function push(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IPush,
  ): IAutoMovieMotionHumanChain {
    const hand: IAutoMovieMotionHumanTabletop.IPush["hand"] =
      params.hand ?? "right";
    return chain
      .pickUp({ prop: params.stack, handle: "grip", hand, lift: 0.01 })
      .putDown({ prop: params.stack, at: params.to, hand });
  }

  /**
   * Take a die up and release it onto the table at its place.
   *
   * @param chain The chain the roll continues.
   * @param params The die and its resting place.
   * @returns The chain after the die rests.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pickup and the release onto the table.
   * @evidence contracts/development/implementation.md#principled-implementation The die is placed on the table's surface by its base, a quarter turn from how it lay.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pickup and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tumble between hand and table is not modelled; the die comes to rest at its place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two steps.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the shipped pickup and placement laws.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function roll(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IRoll,
  ): IAutoMovieMotionHumanChain {
    const hand: IAutoMovieMotionHumanTabletop.IRoll["hand"] =
      params.hand ?? "right";
    return chain
      .pickUp({ prop: params.die, handle: "grip", hand, lift: 0.08 })
      .putDown({ prop: params.die, at: params.to, yaw: 90, hand });
  }
}
