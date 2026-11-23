import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * Tabletop handling composed from pickups and placements: moving a chess piece,
 * dealing and revealing cards, merging two held packets, pushing a chip stack,
 * counting out notes and rolling a die. Every prop keeps its own subject from
 * start to rest, and each step hands it from its support to the hand and from
 * the hand to its next support, so one owner holds it at every instant.
 */
export namespace IAutoMovieMotionHumanTabletop {
  /**
   * One chess move by one hand, as FIDE's laws have it, with an optional
   * capture.
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

    /**
     * Where a captured piece is set beside the board, world metres; required
     * with `capture`.
     */
    aside?: IAutoMovieVector3;

    /** The moving hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /**
   * Cards taken one at a time from the top of a deck and set at each seat in
   * turn.
   */
  export interface IDeal {
    /** The cards, top of the deck first. */
    cards: readonly string[];

    /** Each seat's place for its card, world metres, dealt round in order. */
    seats: readonly IAutoMovieVector3[];

    /** The dealing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** Cards taken up and laid at given places and attitudes, such as face up. */
  export interface ILay {
    /** The cards, in laying order. */
    cards: readonly string[];

    /** Each card's resting place and attitude. */
    places: readonly IPlace[];

    /** The laying hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** A resting place and attitude. */
  export interface IPlace {
    /** Where the card's origin goes, world metres. */
    at: IAutoMovieVector3;

    /** Its whole resting attitude, a world unit quaternion. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * A shuffle's two packets, each lifted by its bottom card with the rest
   * mounted on it, held one in each hand, then joined: the left packet set down
   * and the right one set on its top card.
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
   * A stacked or bundled prop carried by its bottom one to a new place: a chip
   * stack pushed to the pot.
   */
  export interface IPush {
    /** The stack's bottom prop, which carries the rest. */
    stack: string;

    /** Where it goes, world metres. */
    to: IAutoMovieVector3;

    /** The pushing hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }

  /** A die taken up and rolled onto the table toward a place. */
  export interface IRoll {
    /** The die. */
    die: string;

    /** Where it comes to rest on the table, world metres. */
    to: IAutoMovieVector3;

    /** The rolling hand; `right` when absent. */
    hand?: AutoMovieHumanSide;
  }
}
