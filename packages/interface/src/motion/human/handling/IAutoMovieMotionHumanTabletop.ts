import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Tabletop handling composed from pickups and placements: moving a chess
 * piece, dealing and revealing cards, merging two held packets, pushing a
 * chip stack, counting out notes and rolling a die. Every prop keeps its own
 * subject from start to rest, and each step hands it from its support to the
 * hand and from the hand to its next support, so one owner holds it at
 * every instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each tabletop composition and the identity rule they share.
 * @evidence contracts/development/design.md#principled-representation Props by subject, places as world points and squares by name; the composer owns the refusals.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters `HumanTabletop` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop is duplicated or replaced; every step names a real subject.
 */
export namespace IAutoMovieMotionHumanTabletop {
  /**
   * One chess move by one hand, as FIDE's laws have it, with an optional capture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the board, the piece, the target square, the capture and where it goes.
   * @evidence contracts/development/design.md#principled-representation Square names, subjects and a world point; the occupancy is the board state before the move.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.chessMove` reads to compose and to refuse.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A capture names its piece; an occupied target without it is refused.
   */
  export interface IChessMove {
    /** The board's subject; its squares are sockets named like `e4`. */
    board: string;

    /** The moving piece's subject. */
    piece: string;

    /** The target square's name. */
    to: string;

    /** The board before the move: each occupied square's piece subject. */
    occupancy: Readonly<Record<string, string>>;

    /** The captured piece's subject, which must stand on `to`. */
    capture?: string;

    /** Where a captured piece is set beside the board, world metres; required with `capture`. */
    aside?: IAutoMovieVector3;

    /** The moving hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * Cards taken one at a time from the top of a deck and set at each seat in turn.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cards in dealing order, the seats and the hand.
   * @evidence contracts/development/design.md#principled-representation Subjects and world points; cards land at their declared face-down attitude.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.deal` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each card is a real subject; a seat beyond the arm is refused by the placement.
   */
  export interface IDeal {
    /** The cards, top of the deck first. */
    cards: readonly string[];

    /** Each seat's place for its card, world metres, dealt round in order. */
    seats: readonly IAutoMovieVector3[];

    /** The dealing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * Cards taken up and laid at given places and attitudes, such as face up.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the cards and each one's place and resting attitude.
   * @evidence contracts/development/design.md#principled-representation Subjects with world points and world unit quaternions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.lay` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Each place pairs with one card.
   */
  export interface ILay {
    /** The cards, in laying order. */
    cards: readonly string[];

    /** Each card's resting place and attitude. */
    places: readonly IPlace[];

    /** The laying hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * A resting place and attitude.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the point and the attitude.
   * @evidence contracts/development/design.md#principled-representation World metres and a world unit quaternion.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What a laid card's placement reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both members are required.
   */
  export interface IPlace {
    /** Where the card's origin goes, world metres. */
    at: IAutoMovieVector3;

    /** Its whole resting attitude, a world unit quaternion. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * A shuffle's two packets, each lifted by its bottom card with the rest
   * mounted on it, held one in each hand, then joined: the left packet set
   * down and the right one set on its top card.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two packets' carrying cards, the left packet's top card and where the deck is squared.
   * @evidence contracts/development/design.md#principled-representation Subjects and one world point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.shuffle` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The packets keep their own cards; none is copied.
   */
  export interface IShuffle {
    /** The left packet's bottom card, carrying the rest of it. */
    left: string;

    /** The left packet's top card, where the right packet is set. */
    leftTop: string;

    /** The right packet's bottom card, carrying the rest of it. */
    right: string;

    /** Where the joined deck is squared, world metres. */
    at: IAutoMovieVector3;
  }

  /**
   * A stacked or bundled prop carried by its bottom one to a new place: a
   * chip stack pushed to the pot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the carrying prop and the destination.
   * @evidence contracts/development/design.md#principled-representation A subject and a world point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.push` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The stack moves whole on its bottom prop.
   */
  export interface IPush {
    /** The stack's bottom prop, which carries the rest. */
    stack: string;

    /** Where it goes, world metres. */
    to: IAutoMovieVector3;

    /** The pushing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * A die taken up and rolled onto the table toward a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the die and where it comes to rest.
   * @evidence contracts/development/design.md#principled-representation A subject and a world point on the table.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `HumanTabletop.roll` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The die keeps its subject.
   */
  export interface IRoll {
    /** The die. */
    die: string;

    /** Where it comes to rest on the table, world metres. */
    to: IAutoMovieVector3;

    /** The rolling hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }
}
