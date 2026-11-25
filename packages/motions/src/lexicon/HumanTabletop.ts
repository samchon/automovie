import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanTabletop,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * Tabletop handling composed from `pickUp` and `putDown`: a chess move with its
 * capture, a deal round the seats, cards laid face up, a shuffle's two held
 * packets joined, a chip stack pushed to the pot, notes counted out and a die
 * released onto the table. Each prop is picked up from its support and put down
 * on its next one, so its subject has exactly one owner at every instant, and
 * placement does the reach check: a seat or square beyond the arm is refused
 * with its distance. A move names its board state, so an occupied target square
 * without its capture is refused before anything moves, as FIDE's laws forbid
 * it (article 3.1).
 *
 * Duration: each prop takes a pick up and a put down, so a reach-to-grasp time
 * per transport (about 0.5 s for a 0.4 m reach, `IAutoMovieMotionHumanPickUp`),
 * a 0.15 s load, a 0.2 s release and the return; the moves add no timing of
 * their own (provisional: no study of tabletop speeds). A chess move is one
 * pick and one place, a deal one pair per seat.
 */
export namespace HumanTabletop {
  /**
   * Move a chess piece to a square, first setting a captured piece aside.
   *
   * @param chain The chain the move continues.
   * @param params The board, piece, target, board state and capture.
   * @returns The chain after the move.
   * @throws {HumanRefusal} When the piece is not on the board, the target is
   *   occupied without its capture, the capture is not on the target, or a
   *   capture has no place aside.
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
        .putDown({ prop: params.capture, to: aside, hand });
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
   * @throws {HumanRefusal} When no seat is named; the placement refuses a seat
   *   beyond the arm with its distance.
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
        next.pickUp({ prop: card, handle: "grip", hand, lift: 0.04 }).putDown({
          prop: card,
          to: params.seats[i % params.seats.length]!,
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
        next.pickUp({ prop: card, handle: "grip", hand, lift: 0.04 }).putDown({
          prop: card,
          to: params.places[i]!.at,
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
   * @param params The two packets' carrying cards, the left packet's top and
   *   the deck's place.
   * @returns The chain after the packets are joined.
   */
  export function shuffle(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IShuffle,
  ): IAutoMovieMotionHumanChain {
    return chain
      .pickUp({ prop: params.left, handle: "grip", hand: "left", lift: 0.05 })
      .pickUp({ prop: params.right, handle: "grip", hand: "right", lift: 0.05 })
      .putDown({ prop: params.left, to: params.at, hand: "left" })
      .putDown({
        prop: params.right,
        onto: { prop: params.leftTop, point: "top", via: "base" },
        hand: "right",
      });
  }

  /**
   * Carry a stack on its bottom prop to a new place, as a chip stack is pushed
   * to the pot.
   *
   * @param chain The chain the push continues.
   * @param params The stack's bottom prop and its destination.
   * @returns The chain after the stack is set down.
   */
  export function push(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IPush,
  ): IAutoMovieMotionHumanChain {
    const hand: IAutoMovieMotionHumanTabletop.IPush["hand"] =
      params.hand ?? "right";
    return chain
      .pickUp({ prop: params.stack, handle: "grip", hand, lift: 0.01 })
      .putDown({ prop: params.stack, to: params.to, hand });
  }

  /**
   * Take a die up and release it onto the table at its place.
   *
   * @param chain The chain the roll continues.
   * @param params The die and its resting place.
   * @returns The chain after the die rests.
   */
  export function roll(
    chain: IAutoMovieMotionHumanChain,
    params: IAutoMovieMotionHumanTabletop.IRoll,
  ): IAutoMovieMotionHumanChain {
    const hand: IAutoMovieMotionHumanTabletop.IRoll["hand"] =
      params.hand ?? "right";
    return chain
      .pickUp({ prop: params.die, handle: "grip", hand, lift: 0.08 })
      .putDown({ prop: params.die, to: params.to, yaw: 90, hand });
  }
}
