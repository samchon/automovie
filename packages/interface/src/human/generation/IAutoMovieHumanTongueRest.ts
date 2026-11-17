/** The tongue at rest. All values are millimetres in the registered figure
 * frame: forward positions use +X, heights use +Y, and width is a lateral
 * half-extent rather than a coordinate or angle.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The tongue at rest.
 * @evidence contracts/development/design.md#principled-representation `tip`: Forward place of the tip, behind the lower incisors. `back`: Forward place of the back, inside the pharynx. `tipTop`: Height of the tip's upper face.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanMouth.tongue.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `tip`, `back`, `tipTop`, `dorsum`, `floor`, `width`, `molars`; callers supply the complete record.
 */
export interface IAutoMovieHumanTongueRest {
  /** Forward place of the tip, behind the lower incisors. */
  tip: number;

  /** Forward place of the back, inside the pharynx. */
  back: number;

  /** Height of the tip's upper face. */
  tipTop: number;

  /** Height of the dorsum's top, over the molars. */
  dorsum: number;

  /** Height of the floor it rests on. */
  floor: number;

  /** Half width over the molars, inside the lower arch. */
  width: number;

  /** Forward place of the molars, where the dorsum is highest. */
  molars: number;
}
