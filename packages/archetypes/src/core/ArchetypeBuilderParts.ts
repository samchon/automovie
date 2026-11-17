import { srgbHexToLinearColor } from "@automovie/engine";
import type {
  IAutoMovieGeometry,
  IAutoMovieMaterial,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { ArchetypeBuilderTypes } from "./ArchetypeBuilderTypes";
import type { ArchetypeConvexCell } from "./ArchetypeConvexCell";
import { ArchetypeFrame } from "./ArchetypeFrame";
import type { ArchetypeFriction } from "./ArchetypeFriction";

/**
 * One builder's actual parts and the shared material/mass records they use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States builder ownership and the handover at build, with each record's purpose.
 * @evidence contracts/development/design.md#principled-representation Geometry, optical material, relative mass and declared surface remain separate records over the same unique part ids. Explicit convex-cell records bind to the exact mesh geometry they generated.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Primitive and convex builder calls use one recorder; public fields are internal assembly state consumed by that builder's existing build/span/contact paths.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No producer identity selects geometry or physical behavior. Duplicate ids are refused across all representation kinds.
 */
export class ArchetypeBuilderParts {
  /** The existing default optical swatch, shared by the public builder alias. */
  public static readonly NEUTRAL: string = "#9a9a9a";
  /** Actual local parts, handed to the built archetype. */
  public readonly parts: IAutoMovieModelPart[] = [];
  /** One optical material per normalized colour. */
  public readonly materials: Map<string, IAutoMovieMaterial> = new Map();
  /** Authored relative densities by part id. */
  public readonly density: Record<string, number> = {};
  /** Authored mass weights by part id. */
  public readonly shares: Record<string, number> = {};
  /** Declared physical surfaces by part id. */
  public readonly surfaces: Record<string, ArchetypeFriction.Material> = {};
  /** Explicit actual convex cells; primitive parts need no extra record. */
  public readonly cells: Map<string, ArchetypeConvexCell.ICell> = new Map();

  /** @param archetype Producer name used only in duplicate-id diagnostics. */
  public constructor(private readonly archetype: string) {}

  /**
   * Record a real primitive or admitted convex-cell geometry and its material.
   * @param id Unique part id.
   * @param geometry Actual local geometry; no bounding representation is substituted.
   * @param at Local origin in model metres.
   * @param rotation Unit local-to-model quaternion, or identity when absent.
   * @param options Optical colour, relative density/weight and physical surface.
   * @throws {Error} For a repeated part id.
   * @evidence contracts/development/common.md#meaningful-documentation Defines geometry ownership, rigid placement and optional appearance/mass inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the builder's existing exact colour normalization, unit scale and explicit density/share/surface semantics for both primitive and actual convex parts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Refuse duplicate id, share its colour material, record optional physical data, then append the placed part.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never renames ids, adds a proxy solid or derives a physical material from colour.
   * @evidence contracts/development/implementation.md#efficient-algorithms Duplicate-id scan is linear in the existing P parts; the remaining work is constant and geometry is retained without cloning.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The colour-keyed map shares exactly equal normalized optical materials within this builder. Geometry and mass facts are shared with the built model.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The builder owns these finite part/material/data records and hands them over at build. No process, external handle or cross-model cache is acquired.
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
    const material: string = `flat-${hex.slice(1)}`;
    if (!this.materials.has(material))
      this.materials.set(material, {
        id: material,
        name: null,
        baseColor: srgbHexToLinearColor(hex),
        metallic: 0,
        roughness: 0.8,
        emissive: null,
        opacity: 1,
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
        scale: { ...ArchetypeFrame.UNIT },
      },
    });
  }
}
