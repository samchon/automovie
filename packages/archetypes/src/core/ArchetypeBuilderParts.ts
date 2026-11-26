import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieGeometry,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { ArchetypeBuilderTypes } from "./ArchetypeBuilderTypes";
import type { AutoMovieArchetypeConvexCell } from "./AutoMovieArchetypeConvexCell";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import type { AutoMovieArchetypeFriction } from "./AutoMovieArchetypeFriction";

/** One builder's parts and the shared material/mass records they use. */
export class ArchetypeBuilderParts {
  /** The existing default optical swatch, shared by the public builder alias. */
  public static readonly NEUTRAL: string = "#9a9a9a";
  /** Local parts, handed to the built archetype. */
  public readonly parts: IAutoMovieModelPart[] = [];
  /** One optical material per normalized colour. */
  public readonly materials: Map<string, IAutoMovieMaterial> = new Map();
  /** Authored relative densities by part id. */
  public readonly density: Record<string, number> = {};
  /** Authored mass weights by part id. */
  public readonly shares: Record<string, number> = {};
  /** Declared physical surfaces by part id. */
  public readonly surfaces: Record<
    string,
    AutoMovieArchetypeFriction.Material
  > = {};
  /** Explicit convex cells; primitive parts need no extra record. */
  public readonly cells: Map<string, AutoMovieArchetypeConvexCell.ICell> =
    new Map();

  /** @param archetype Producer name used only in duplicate-id diagnostics. */
  public constructor(private readonly archetype: string) {}

  /**
   * Record a primitive, admitted convex cell or visual mesh and its material.
   *
   * @param id Unique part id.
   * @param geometry Local geometry; no bounding representation is substituted.
   * @param at Local origin in model metres.
   * @param rotation Unit local-to-model quaternion, or identity when absent.
   * @param options Optical colour and opacity, relative density/weight and
   *   physical surface.
   * @throws {Error} For a repeated part id.
   */
  public add(
    id: string,
    geometry: IAutoMovieGeometry,
    at: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
    options: ArchetypeBuilderTypes.IOptions | undefined,
  ): void {
    if (this.parts.some((part: IAutoMovieModelPart): boolean => part.id === id))
      throw new Error(`Archetype ${this.archetype} already has a part "${id}"`);
    const hex: string = (
      options?.color ?? ArchetypeBuilderParts.NEUTRAL
    ).toLowerCase();
    const opacity: number = options?.opacity ?? 1;
    if (!(opacity >= 0 && opacity <= 1))
      throw new Error(
        `Archetype ${this.archetype} part "${id}" opacity must lie in [0, 1]`,
      );
    const material: string = `flat-${hex.slice(1)}${
      opacity === 1 ? "" : opacity === 0 ? "-clear" : `-alpha${opacity}`
    }`;
    if (!this.materials.has(material))
      this.materials.set(material, {
        id: material,
        name: null,
        baseColor: AutoMovieEngineMath.srgbHexToLinearColor(hex),
        metallic: 0,
        roughness: 0.8,
        emissive: null,
        opacity,
        ...(opacity < 1 ? { alphaMode: "blend" as const } : {}),
        baseColorTexture: null,
      });
    if (options?.density !== undefined) this.density[id] = options.density;
    if (options?.share !== undefined) this.shares[id] = options.share;
    if (options?.surface !== undefined) this.surfaces[id] = options.surface;
    this.parts.push({
      id,
      name: null,
      geometry,
      material,
      attachedBone: null,
      transform: {
        translation: { ...at },
        rotation: rotation ?? { x: 0, y: 0, z: 0, w: 1 },
        scale: { ...AutoMovieArchetypeFrame.UNIT },
      },
    });
  }
}
