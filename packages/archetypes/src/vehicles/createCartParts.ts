import { AutoMovieArchetypeUnits } from "../core";

/** The model dimensions of the cart family's three frame assemblies. */
export namespace createCartParts {
/**
 * A limber's frame, read and derived from The Ordnance Manual (1861), p. 74
 * and p. 77 (https://archive.org/details/cu31924031187887/page/74).
 */
export const LIMBER: Readonly<{
  /**
   * The frame's rear end behind the axle, metres: the 57 in wheel's 28.5 in
   * radius less the 11.88 in the wheels add to the limber's length (173.08 in
   * with wheels and pole, 161.2 in without wheels), since only the wheels'
   * rims stand behind the frame.
   */
  rear: number;

  /**
   * The ammunition chest's inside length across the limber, width along it
   * and depth, metres: 40, 18 and 14.75 in (p. 77).
   */
  chest: Readonly<{ length: number; width: number; depth: number }>;

  /**
   * The chest's boards, metres: a construction estimate, not read, which sets
   * the chest's outside and so its lid's height, the gunners' seat.
   */
  board: number;

  /**
   * The pintle hook above the ground, metres, a provisional value: taken at
   * the axle's height, not read. The source to read is the Ordnance Manual's
   * limber plate or the Instruction for Field Artillery (1864).
   */
  pintle: number;
}> = {
  rear: (28.5 - 11.88) * AutoMovieArchetypeUnits.INCH,
  chest: {
    length: 40 * AutoMovieArchetypeUnits.INCH,
    width: 18 * AutoMovieArchetypeUnits.INCH,
    depth: 14.75 * AutoMovieArchetypeUnits.INCH,
  },
  board: 0.025,
  pintle: 28.5 * AutoMovieArchetypeUnits.INCH,
};

/**
 * A wagon's places beyond its bands, from the Army's specification
 * (https://archive.org/details/specificationsf02deptgoog/page/n13) where
 * read.
 */
export const WAGON: Readonly<{
  /**
   * The tongue's front end above the ground at rest, metres: it is "to hang
   * within 2 feet of the ground" (p. 1).
   */
  drop: number;

  /**
   * The body's floor above the hind axle, metres, a provisional value: not
   * read. It rests on the hind bolster, 3.5 in deep (p. 2), over the
   * axle-tree, whose depth the specification gives elsewhere; the source to
   * read is its axle-tree clause.
   */
  bed: number;

  /**
   * The front axle's lock to either side, degrees, a provisional value: not
   * read. The four-horse wagon's specification gives iron plates for the
   * front wheels to strike in turning (pp. 9-16) but no angle; the source to
   * read is a drawing of the running gear.
   */
  lock: number;
}> = { drop: 24 * AutoMovieArchetypeUnits.INCH, bed: 0.15, lock: 35 };

/**
 * A carriage's places no museum record read gives, each a provisional value:
 * the source to read is a carriage builder's draft of a brougham (The Hub,
 * the Carriage Journal's drafts) or a museum record with these measurements.
 */
export const CARRIAGE: Readonly<{
  /**
   * The wheels' track short of the overall width, metres: the hubs'
   * projection, taken from the width because no record gives the track.
   */
  hubs: number;

  /** The body's floor above the ground, metres. */
  floor: number;

  /** The inside seat above the floor, metres. */
  seat: number;

  /** The driver's box seat above the ground, metres. */
  box: number;

  /** A door's width and height, metres, and its widest opening, degrees. */
  door: Readonly<{ width: number; height: number; swing: number }>;

  /** The pole from the front axle to its end, metres. */
  pole: number;

  /** The front axle's lock to either side, degrees. */
  lock: number;
}> = {
  hubs: 0.25,
  floor: 0.55,
  seat: 0.4,
  box: 1.6,
  door: { width: 0.6, height: 1.2, swing: 90 },
  pole: 2.8,
  lock: 40,
};
}
