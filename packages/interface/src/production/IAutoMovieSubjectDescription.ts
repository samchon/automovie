import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import { IAutoMovieSubjectBounds } from "./IAutoMovieSubjectBounds";
import { IAutoMovieSubjectMaterial } from "./IAutoMovieSubjectMaterial";
import { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/**
 * Renderer-independent structural description of one stable compiled subject.
 *
 * @evidence contracts/common.md#principled-implementation Subject describers project compiled model, placement, building, space and compact instance records into namespaced identity, ownership, transforms, extents, materials and bounded member pages, regenerating addressed members through the engine's exact placement law.
 * @evidence contracts/common.md#clear-and-simple-design Shared structural fields allow one inspection and diff vocabulary while semanticKind preserves the compiled domain label; formations use a separate review description because their crowd motion semantics are distinct.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown references stay null or empty where the projection contract permits them rather than guessed geometry or materials; revision is caller-qualified and instance-set bounds are positions, not a full mesh envelope.
 * @evidence contracts/common.md#meaningful-documentation Defines namespaced identity, revision, semantic role, prototype versus placement and owner relations, transform and extent basis, material ordering and bounded member population.
 */
export interface IAutoMovieSubjectDescription {
  /** Description schema version. */
  version: 1;

  /** Revision of the compiled artifact that supplied this answer. */
  revision: string;

  /** Namespaced stable subject id. */
  id: string;

  /** Structural role of this subject. */
  kind: AutoMovieSubjectKind;

  /** Open compiled semantic label such as a building-element or space kind. */
  semanticKind: string;

  /** Human-readable compiled name, or null when unnamed. */
  name: string | null;

  /** Reusable prototype subject used by this placement, or null. */
  prototype: string | null;

  /**
   * Placement subject represented by this record, or null for reusable data.
   */
  placement: string | null;

  /** Immediate owning subject, or null for a root subject. */
  owner: string | null;

  /** Compiled runtime model id supplying geometry, or null. */
  model: string | null;

  /** Owning logical-space subject, or null. */
  space: string | null;

  /**
   * Model- or world-placement transform when the subject has one, otherwise null.
   */
  transform: IAutoMovieTransform | null;

  /** Declared and measured spatial extent. */
  bounds: IAutoMovieSubjectBounds;

  /** Code-unit-sorted declared model materials, narrowed to the cited material for a part; whole-model entries need not be visibly used. */
  materials: IAutoMovieSubjectMaterial[];

  /** Exact member count and bounded stable-id sample. */
  members: IAutoMovieSubjectMemberSummary;
}
