/**
 * The selection record of one head skin region, written to the generation
 * manifest: how its boundary was read, that the boundary closes and
 * separates, and how many vertices the region holds.
 *
 * @author Samchon
 */
export interface IHumanSourceHeadRegion {
  /** Region name the head view declares. */
  name: string;

  /** What the region is. */
  definition: string;

  /** How the region was determined. */
  status: "definition, read from renders";

  /** The rule as applied. */
  rule: string;

  /** Base-mesh vertices of the bounding loop, closed order. */
  loop: number[];

  /** Whether every loop step is a base-mesh edge (always true; an open loop refuses). */
  closed: boolean;

  /** Base-mesh vertex inside the region. */
  seed: number;

  /** Base-mesh vertex outside the region the fill was proved not to reach. */
  outside: number;

  /** Base-mesh vertices in the region. */
  baseVertices: number;

  /** Head view skin vertices in the region. */
  viewVertices: number;

  /** Local frames the reading was made on (never published). */
  frames: string;

  /** Where the definition and the reading come from. */
  citation: string;

  /** What the reading leaves open. */
  ambiguity: string;

  /** Index space, frame and side convention of the rows. */
  convention: string;
}
