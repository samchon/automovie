import { AutoMovieHumanHandVector } from "./AutoMovieHumanHandVector";

type Vec3 = AutoMovieHumanHandVector.Vec3;
const { sub, plus, scale, dot }: typeof AutoMovieHumanHandVector = AutoMovieHumanHandVector;

/**
 * A hand web's two crests: the dorsal crest, where neighbouring fingers part
 * on the back of the hand, and the palmar crest, where they part on the palm,
 * its own piece for each face of the web patch.
 *
 * The two differ in station: the palmar web reaches the middle of the
 * proximal phalanges (Gray 1918, `docs/anatomy/hand.md`, Joint centres and
 * creases: the palmar crease at a finger base lies over the proximal
 * phalanx), so fingers look shorter from the palm than from the back. The
 * dorsal crest is the one the form's webs give (`AutoMovieHumanHandWeb.crestOf`:
 * half the pinches' chord past their middle); the palmar crest is the same
 * point moved along the hand to {@link PALMAR_SHARE} of the proximal phalanx
 * from the knuckle, keeping its place across and through the hand. Each
 * crest is the top side of its own web patch (`AutoMovieHumanWebPatch`).
 *
 * {@link PALMAR_SHARE} is a CONVENTION (Gray's "the middle of the proximal
 * phalanges"), to be read on the references' palmar web margins.
 */
export namespace AutoMovieHumanHandWebCrest {
  /** Where the palmar web stands along the proximal phalanx from the knuckle: Gray 1918, conventional. */
  export const PALMAR_SHARE: number = 0.5;

  /** A web's fixed inputs. */
  export interface IInput {
    /** The dorsal crest, left frame, mm. */
    dorsal: Vec3;

    /** The knuckle of the finger whose phalanx the palmar crest reads, mm. */
    mcp: Vec3;

    /** Unit direction along the finger's proximal phalanx. */
    along: Vec3;

    /** Length of that phalanx, mm. */
    phalanx: number;
  }

  /** The two crests. */
  export interface IPair {
    /** The dorsal crest, mm. */
    dorsal: Vec3;

    /** The palmar crest, mm, distal of the dorsal one. */
    palmar: Vec3;
  }

  /**
   * The web's two crests.
   *
   * @param input The web's inputs.
   */
  export function pair(input: IInput): IPair {
    const at: number = dot(sub(input.dorsal, input.mcp), input.along);
    const move: number = PALMAR_SHARE * input.phalanx - at;

    return { dorsal: input.dorsal, palmar: plus(input.dorsal, scale(input.along, move)) };
  }
}
