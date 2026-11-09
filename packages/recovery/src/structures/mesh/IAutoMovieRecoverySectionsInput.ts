import type { IAutoMovieRecoveryInput } from "@automovie/interface";

import type { IAutoMovieRecoverySlabPair } from "./IAutoMovieRecoverySlabPair";
import type { IAutoMovieRecoveryTerminalSeed } from "./IAutoMovieRecoveryTerminalSeed";

/**
 * A named collection of fixed physical cuts through one registered mesh. Coordinates are signed distances along the normalized axis from the registered origin; the caller establishes their feature meaning. Every mesh component intersecting each plane remains admitted.
 *
 * @evidence contracts/development/design.md#principled-representation Explicit physical plane coordinates and the existing registered mesh and fit policy define observations without automatic station generation or inferred correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One input selects only the mesh, frame and fitting fields consumed by finite named sections.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No part selection, specimen controls, source normals, mesh fallback or assumed continuation is accepted.
 * @evidence contracts/development/common.md#meaningful-documentation States physical coordinates, input ordering, component coverage and borrowed source lifetime; inherited fields retain the registered observation contract.
 */
export interface IAutoMovieRecoverySectionsInput extends Pick<
  IAutoMovieRecoveryInput,
  | "verticesMm"
  | "triangles"
  | "axis"
  | "reference"
  | "toleranceMm"
  | "maxSpans"
  | "exactCoordinateAliases"
  | "sourceOrientationSign"
  | "cornerDegrees"
> {
  /** Stable collection name prefixed to every resulting contour curve. */
  name: string;

  /** Nonempty finite distinct signed millimetre coordinates; input order is retained. Optional terminal observations append their source-observed event and bracket planes. */
  coordinatesMm: readonly number[];

  /** Optional existing closed loops to follow toward increasing coordinates; omitted preserves exactly the requested plane collection. Source-observed critical planes and brackets are appended while retaining all intersecting source components. */
  terminalSeeds?: readonly IAutoMovieRecoveryTerminalSeed[];

  /** Optional finite source-slab observations. Both increasing bounds must occur in coordinatesMm; all source components remain present and exact port/critical evidence is delivered through onSourceSlab. Omitted preserves ordinary curve-only observation. */
  slabPairs?: readonly IAutoMovieRecoverySlabPair[];

  /** Retain exact cutter-emitted source faces for lineage even without a slab pair. These acquisition-only copies do not enter returned curve coefficients. Omitted preserves ordinary lineage retention. */
  includeExactSourceLineage?: boolean;
}
