/** Original acquired atlas file, before registration or personal fitting. @author Samchon */
export interface IHumanBodyPartSourceInventoryFile {
  file: string;
  tree: string;
  uri: string;
  sha256: string;
  vertices: number;
  triangles: number;
  sourceHeader: string[];
}
