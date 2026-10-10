/**
 * Provenance of authored atlas charts and their actual acquired attachments.
 * Additional source metadata survives; invalidated derivative observations
 * remain in historical parent fields. Source ordinals refer to the byte-bound
 * acquired OBJ, not target skin or clinical insertions.
 * @author Samchon
 */
export interface IHumanTrunkSourcePacket extends Record<string, unknown> {
  /** Source frame; this producer only accepts the common atlas frame. */
  frame: string;

  /** Original historical recipe and its immutable byte identity. */
  recipe: string;
  recipeSha256: string;

  /** Original rights and anatomical qualifications, preserved as data. */
  rights: unknown;

  /** Every original member, including unaffected source families. */
  parts: IHumanTrunkSourcePart[];

  /** Actual acquired attachment locators shared with the source rig. */
  proposedSharedSites: IHumanTrunkSourceSite[];

  /** Acquired source resources with original rights and acquisition metadata. */
  sourceReferences: IHumanTrunkSourceReference[];
}

/**
 * Original per-part record; authored dimensions remain original metadata.
 * @author Samchon
 */
interface IHumanTrunkSourcePart extends Record<string, unknown> {
  id: string;
  mesh: string;
  meshSha256: string;
  vertices: number;
  triangles: number;
  volumeCubicMetres: number;
  attachments: IHumanTrunkSourceAttachment[];
}

/**
 * One anatomical role in the original attachment schedule.
 * @author Samchon
 */
interface IHumanTrunkSourceAttachment extends Record<string, unknown> {
  bone: string;
  site: string;
  role: string;
}

/**
 * One pinned actual acquired source vertex in atlas metres.
 * @author Samchon
 */
interface IHumanTrunkSourceSite extends Record<string, unknown> {
  bone: string;
  site: string;
  world: number[];
  sourceFile: string;
  sourceVertex: number;
  sourceSha256: string;
}

/**
 * Byte-bound acquired resource; its notices survive in the original record.
 * @author Samchon
 */
interface IHumanTrunkSourceReference extends Record<string, unknown> {
  file: string;
  uri: string;
  sha256: string;
}
