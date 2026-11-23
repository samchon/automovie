import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { AutoMovieSubjectKind } from "./AutoMovieSubjectKind";
import type { IAutoMovieSubjectBounds } from "./IAutoMovieSubjectBounds";
import type { IAutoMovieSubjectMaterial } from "./IAutoMovieSubjectMaterial";
import type { IAutoMovieSubjectMemberSummary } from "./IAutoMovieSubjectMemberSummary";

/** Renderer-independent structural description of one stable compiled subject. */
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

  /** Placement subject represented by this record, or null for reusable data. */
  placement: string | null;

  /** Immediate owning subject, or null for a root subject. */
  owner: string | null;

  /** Compiled runtime model id supplying geometry, or null. */
  model: string | null;

  /** Owning logical-space subject, or null. */
  space: string | null;

  /**
   * Model- or world-placement transform when the subject has one, otherwise
   * null.
   */
  transform: IAutoMovieTransform | null;

  /** Declared and measured spatial extent. */
  bounds: IAutoMovieSubjectBounds;

  /**
   * Code-unit-sorted declared model materials, narrowed to the cited material
   * for a part; whole-model entries need not be visibly used.
   */
  materials: IAutoMovieSubjectMaterial[];

  /** Exact member count and bounded stable-id sample. */
  members: IAutoMovieSubjectMemberSummary;
}
