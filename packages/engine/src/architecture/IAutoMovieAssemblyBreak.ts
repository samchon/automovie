/** One construction role that stops at a junction. */
export interface IAutoMovieAssemblyBreak {
  /** The role only one side declares. */
  role: string;
  /** Which build-up carries it. */
  side: "left" | "right";
  /** Summed thickness the carrying side gives the role, in metres. */
  thickness: number;
}
