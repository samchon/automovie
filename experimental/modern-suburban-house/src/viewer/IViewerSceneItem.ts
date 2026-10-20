import type { HousePartRole } from "../types/HousePartRole";

/**
 * One triangle mesh placed in world space by translation only.
 */
export interface IViewerSceneItem {
  /** Stable id used in inspection output and capture records. */
  id: string;

  /** What the item is: a calibration role or a spaces part role. */
  role: "ground" | "axis" | "tick" | "reference" | "model" | HousePartRole;

  /** Source owner under `src/spaces`, when the item is a house part. */
  owner?: string;

  /** Model prototype and stable surface partition for an authored model part. */
  modelId?: string;

  /** Stable authored surface partition used by inspection and capture records. */
  faceId?: string;

  /** Producer-issued assembly member, independent of render batching. */
  assemblyMember?: string;

  /** Identification pass draws every face opaquely, including mirror/glass. */
  inspectionFace?: boolean;

  /** A real source intersection cap, for inspection only. */
  inspectionSection?: boolean;

  /** Exact source partitions contributing to a joined physical-shell section. */
  sectionSourceFaces?: string[];

  /** Base color as an sRGB hex integer, for example 0xd94a3a. */
  color: number;

  /** Material response, when an active source branch supplies it. */
  opacity?: number;

  /** Optional Three material roughness, defaulting to 0.8 in the mesh uploader. */
  roughness?: number;

  /** Optional Three material metallic response, defaulting to zero in the mesh uploader. */
  metalness?: number;

  /** Physical plate-glass response supplied by an authored material owner. */
  transmission?: number;

  /** Optional dimensionless glass index of refraction, defaulting to 1.5 when transmission selects the physical material. */
  ior?: number;

  /** Optional physical glass thickness in meters, defaulting to zero when transmission selects the physical material. */
  thickness?: number;

  /** Whether the uploaded material draws both faces; absence retains Three's front-face rendering. */
  doubleSided?: boolean;

  /** Authored sRGB tile URL and UV repeat coordinates; color is the fallback. */
  texture?: string;

  /** Preserve the model fallback hue under a greyscale weave map. */
  textureTint?: boolean;

  /** Optional flat UV pairs in authored repeat coordinates, installed as the mesh texture coordinates. */
  uvs?: number[];

  /** World translation of the mesh origin, meters. */
  position: [number, number, number];

  /** Flat vertex positions from the engine mesh, meters. */
  positions: number[];

  /** Flat per-vertex normals from the engine mesh. */
  normals: number[];

  /** Triangle indices into the vertex arrays. */
  indices: number[];

  /** Whether the item throws a shadow onto other items. */
  castShadow: boolean;

  /** Whether the item shows shadows thrown onto it. */
  receiveShadow: boolean;
}
