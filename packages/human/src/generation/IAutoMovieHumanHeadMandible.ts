/** The person's mandible, calibration millimetres. */
export interface IAutoMovieHumanHeadMandible {
  /** Arch's front apex on the midline. */
  front: number;

  /** Gonion's place along the face's forward axis. */
  gonion: number;

  /** Gonion's height. */
  gonionY: number;

  /** Arch's half-width at the gonion. */
  width: number;

  /** Arch's half-length behind the gonion. */
  back: number;

  /** Radius of the chin's turn in plan. */
  radius: number;

  /** Point on the midline behind the gonions the arch is read from, along the forward axis. */
  origin: number;

  /** Outward unit normal of the arch's left side in plan, `[x, z]`. */
  side: [number, number];

  /** Where that side leaves the arch's back, `[x, z]`. */
  start: [number, number];

  /** Where it meets the chin's turn, `[x, z]`. */
  end: [number, number];

  /**
   * Share of the half-width the jaw's side gains per millimetre over its
   * border: the line from the gonion up to the cheek at the zygomatic arch.
   */
  spread: number;

  /** The chin's skin along the forward axis, where the plane passes the menton. */
  chin: number;

  /** Menton's height. */
  menton: number;

  /** Mandibular plane's rise toward the back per millimetre. */
  slope: number;

  /** Cosine of the mandibular plane's angle. */
  cos: number;

  /** Cosine and sine of the ramus's lean back from the vertical. */
  lean: [number, number];

  /** Body's height over its border, where it ends inside the face. */
  height: number;

  /** Inward run of the skin under the border per millimetre of fall. */
  draft: number;

  /** Soft tissue's rounding of the turn under the border. */
  round: number;

  /** Share of that rounding at the jaw's side; its inverse square at the underside. */
  taper: number;

  /** Width of the blend with the face and neck. */
  blend: number;

  /** Width of that blend under the border, where the jaw meets the neck. */
  throat: number;
}
