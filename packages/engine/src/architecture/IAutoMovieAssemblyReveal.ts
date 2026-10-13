/** What a build-up does to an opening cut through its host. */
export interface IAutoMovieAssemblyReveal {
  /** Finished clear width in metres once the lining runs reach the jamb. */
  width: number;
  /** Finished clear height in metres. */
  height: number;
  /** Lining thickness taken off each side of the opening, in metres. */
  inset: number;
  /** Lining depth measured inward from the first face, in metres. */
  first: number;
  /** Lining depth measured inward from the last face, in metres. */
  last: number;
  /** Jamb depth left bare between the two linings, in metres. */
  bare: number;
  /** Ids of the layers that line the jamb, in stack order. */
  layers: string[];
}
