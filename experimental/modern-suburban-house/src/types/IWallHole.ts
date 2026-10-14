/**
 * A caller-authored rectangular rough void in its assigned wall's running/world-height metre frame. The stable opening id and four bounds travel into wall and room bindings; door/window frame, leaf and glazing models retain their separate owners. This erased record does not validate ordering, clearance or structural support.
 *
 * @author Samchon
 */
export interface IWallHole {
  /** House-wide rough-opening address shared by the host wall and room bindings. */
  id: string;

  /** First running coordinate in metres; the caller fixes the opening's left edge. */
  from: number;

  /** Second running coordinate in metres; together with from it defines the caller's width. */
  to: number;

  /** World sill or threshold height in metres; floor-reaching cuts may become bottom notches. */
  bottom: number;

  /** World head height in metres retained for comparison with the assigned wall top. */
  top: number;
}
