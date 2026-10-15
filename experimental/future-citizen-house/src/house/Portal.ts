/** A doorway or open passage between two rooms through one shared or exterior wall. */
export type Portal = {
  /** Opening identity; door, leaf and connector ids derive from it. */
  id: string;
  /** Identity of the wall frame the portal cuts through. */
  wall: string;
  /** Room or site space on the side the route starts. */
  from: string;
  /** Room the leaf and frame belong to and the route arrives in. */
  to: string;
  /** Centre of the clear opening along the wall's run, in world metres. */
  center: number;
  /** Clear opening width. */
  width: number;
  /** Clear opening height above the wall's floor. */
  height: number;
  /** Whether the leaf slides into a wall pocket instead of swinging on hinges. */
  pocket?: boolean;
  /** Whether the opening has no leaf at all. */
  passage?: boolean;
};
