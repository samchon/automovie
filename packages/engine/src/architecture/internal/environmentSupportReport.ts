import {
  type IAutoMovieBuiltElement,
  type IAutoMovieBuiltFloatingBody,
  type IAutoMovieBuiltPlacementBodyLocator,
  type IAutoMovieBuiltSupportSweepReport,
  type IAutoMovieEnvironmentSupportReport,
  type IAutoMovieModel,
  type IAutoMoviePropBox,
  type IAutoMoviePropSpec,
  type IAutoMoviePropSupportFace,
  type IAutoMovieSetPieceSupport,
  type IAutoMovieStageSetPiece,
  type IAutoMovieSubjectBox,
  type IAutoMovieSurface,
  type IAutoMovieVector3,
  type IAutoMovieWallMount,
} from "@automovie/interface";

import { computeModelRestExtent } from "../../film/internal/computeModelRestExtent";
import { propSupportGap } from "../../film/internal/propSupportGap";
import { setPieceMatrix } from "../../film/staging/internal/setPieceMatrix";
import { Matrix4 } from "../../math/Matrix4";
import { transformedBoxBounds } from "../../math/internal/transformedBoxBounds";
import { AutoMovieEngineSpace } from "../../space/index";
import { builtEnvironmentSupportSweep } from "./builtEnvironmentSupportSweep";
import { builtFootprintsOverlap } from "./builtFootprintsOverlap";
import { AUTOMOVIE_SUPPORT_TOLERANCE } from "../AUTOMOVIE_SUPPORT_TOLERANCE";

/**
 * Report the support of every staged set piece of a composed environment,
 * without refusing any.
 *
 * Each piece's world box is its runtime model's rest extent carried through its
 * staged transform. Its candidate supports are the walkable surfaces of the
 * stage space, read by `propSupportGap`'s footprint probes, and the box tops of
 * the other pieces whose plan footprints share area with it. As the building
 * sweep does, the support is the highest candidate whose top is at most the
 * underside plus the tolerance, so a chair tucked under a table rests on the
 * floor; when there is none, the lowest candidate above the underside, which
 * makes the piece `sunk`. A gap within the tolerance is `resting`. A piece that
 * does not rest but whose back face (its corners' least distance out along the
 * mount's inward normal) lies within the tolerance of its mounted wall is
 * `wall-borne`. A prop with a declared placement is `declared`, a model with no
 * rest extent `unresolved`, and a piece with no candidate `floating` with no
 * gap. The bodies of each composed building take the verdict
 * `builtEnvironmentSupportSweep` gives that building alone at its placement
 * height: grounded and borne bodies rest, floating ones float with the sweep's
 * clearance and support, and unresolved ones stay unresolved.
 *
 * @param props The staged set, runtime models, props, stage space, wall mounts,
 *   composed buildings and tolerance.
 * @returns One finding per staged piece, in set order.
 * @throws {RangeError} When the tolerance is negative or not finite.
 */
export function environmentSupportReport(
  props: IAutoMovieEnvironmentSupportReport.IProps,
): IAutoMovieSetPieceSupport[] {
  const tolerance: number = props.tolerance ?? AUTOMOVIE_SUPPORT_TOLERANCE;
  if (tolerance < 0)
    throw new RangeError(
      `environment support tolerance must be finite and non-negative, but was ${String(tolerance)}`,
    );
  const built: Map<string, IAutoMovieSetPieceSupport> = buildingFindings(
    props.buildings ?? [],
    tolerance,
  );
  const models: Map<string, IAutoMovieModel> = new Map(
    props.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const declared: Set<string> = new Set(
    props.props
      .filter(
        (prop: IAutoMoviePropSpec): boolean => prop.placement !== undefined,
      )
      .map((prop: IAutoMoviePropSpec): string => prop.node),
  );
  const mounts: Map<string, IAutoMovieWallMount> = new Map(
    (props.mounts ?? []).map(
      (mount: IAutoMovieWallMount): [string, IAutoMovieWallMount] => [
        mount.node,
        mount,
      ],
    ),
  );
  const walkable: Set<string> = new Set(props.space?.walkable ?? []);
  const faces: { id: string; face: IAutoMoviePropSupportFace }[] = (
    props.space?.surfaces ?? []
  )
    .filter((surface: IAutoMovieSurface): boolean => walkable.has(surface.id))
    .map(
      (
        surface: IAutoMovieSurface,
      ): { id: string; face: IAutoMoviePropSupportFace } => ({
        id: surface.id,
        face: { polygon: AutoMovieEngineSpace.surfaceFootprint(surface), height: surface },
      }),
    );

  // Every measurable piece once, so each is both a subject and a candidate.
  const measured: Map<string, IMeasured> = new Map();
  for (const piece of props.set) {
    const model: IAutoMovieModel | undefined = models.get(piece.model);
    const rest: IAutoMoviePropBox | null =
      model === undefined ? null : computeModelRestExtent(model);
    if (rest === null) continue;
    const matrix: number[] = setPieceMatrix(piece);
    const corners: IAutoMovieVector3[] = [];
    for (const x of [rest.min.x, rest.max.x])
      for (const y of [rest.min.y, rest.max.y])
        for (const z of [rest.min.z, rest.max.z])
          corners.push(Matrix4.transformPoint(matrix, { x, y, z }));
    measured.set(piece.node, {
      node: piece.node,
      box: transformedBoxBounds(rest, matrix),
      corners,
    });
  }
  const tops: IMeasured[] = [...measured.values()];

  return props.set.map(
    (piece: IAutoMovieStageSetPiece): IAutoMovieSetPieceSupport => {
      const node: string = piece.node;
      const building: IAutoMovieSetPieceSupport | undefined = built.get(node);
      if (building !== undefined) return building;
      if (declared.has(node))
        return { node, status: "declared", gap: null, support: null };
      const subject: IMeasured | undefined = measured.get(node);
      if (subject === undefined)
        return { node, status: "unresolved", gap: null, support: null };

      // The highest candidate at or below the underside plus the tolerance,
      // and the lowest one above it.
      const candidates: ICandidate[] = [];
      for (const { id, face } of faces) {
        const gap: number | null = propSupportGap({
          face,
          bounds: subject.box,
        });
        if (gap !== null) candidates.push({ id, gap });
      }
      for (const other of tops)
        if (other !== subject && builtFootprintsOverlap(subject.box, other.box))
          candidates.push({
            id: other.node,
            gap: subject.box.min.y - other.box.max.y,
          });
      let below: ICandidate | null = null;
      let above: ICandidate | null = null;
      for (const candidate of candidates)
        if (candidate.gap >= -tolerance) {
          if (below === null || candidate.gap < below.gap) below = candidate;
        } else if (above === null || candidate.gap > above.gap)
          above = candidate;

      const chosen: ICandidate | null = below ?? above;
      if (chosen !== null && Math.abs(chosen.gap) <= tolerance)
        return { node, status: "resting", gap: chosen.gap, support: chosen.id };
      const mount: IAutoMovieWallMount | undefined = mounts.get(node);
      if (mount !== undefined) {
        const back: number = Math.min(
          ...subject.corners.map(
            (corner: IAutoMovieVector3): number =>
              (corner.x - mount.point.x) * mount.normal.x +
              (corner.y - mount.point.y) * mount.normal.y +
              (corner.z - mount.point.z) * mount.normal.z,
          ),
        );
        if (Math.abs(back) <= tolerance)
          return {
            node,
            status: "wall-borne",
            gap: back,
            support: mount.wall,
          };
      }
      if (chosen === null)
        return { node, status: "floating", gap: null, support: null };
      return {
        node,
        status: below !== null ? "floating" : "sunk",
        gap: chosen.gap,
        support: chosen.id,
      };
    },
  );
}

/** One measured piece: its node, world box and model-local corners in world. */
interface IMeasured {
  /** The staged node. */
  node: string;

  /** The world-axis-aligned box of its rest extent under its staged transform. */
  box: IAutoMovieSubjectBox;

  /** The eight corners of its rest extent in world metres. */
  corners: IAutoMovieVector3[];
}

/** One candidate support: its id and the height of its top under a piece. */
interface ICandidate {
  /** Surface id or staged node. */
  id: string;

  /** Signed gap of the piece's underside above the candidate's top, metres. */
  gap: number;
}

/**
 * Each composed building's bodies with the verdict its own sweep gives, keyed
 * by the staged node `lowerBuiltEnvironment` names them by.
 */
function buildingFindings(
  buildings: readonly IAutoMovieEnvironmentSupportReport.IBuilding[],
  tolerance: number,
): Map<string, IAutoMovieSetPieceSupport> {
  const findings: Map<string, IAutoMovieSetPieceSupport> = new Map();
  for (const { environment, groundY } of buildings) {
    const report: IAutoMovieBuiltSupportSweepReport =
      builtEnvironmentSupportSweep({ environment, groundY, tolerance });
    const floating: Map<string, IAutoMovieBuiltFloatingBody> = new Map(
      report.floating
        .filter(
          (body: IAutoMovieBuiltFloatingBody): boolean =>
            body.body.kind === "element",
        )
        .map(
          (
            body: IAutoMovieBuiltFloatingBody,
          ): [string, IAutoMovieBuiltFloatingBody] => [body.body.id, body],
        ),
    );
    const unresolved: Set<string> = new Set(
      report.unresolved
        .filter(
          (body: IAutoMovieBuiltPlacementBodyLocator): boolean =>
            body.kind === "element",
        )
        .map((body: IAutoMovieBuiltPlacementBodyLocator): string => body.id),
    );
    for (const element of environment.elements) {
      if (element.model === null) continue;
      const node: string = `${environment.id}/${element.id}`;
      findings.set(node, buildingFinding(node, element, floating, unresolved));
    }
  }
  return findings;
}

/** One building body's finding from its sweep's floating and unresolved lists. */
function buildingFinding(
  node: string,
  element: IAutoMovieBuiltElement,
  floating: ReadonlyMap<string, IAutoMovieBuiltFloatingBody>,
  unresolved: ReadonlySet<string>,
): IAutoMovieSetPieceSupport {
  if (unresolved.has(element.id))
    return { node, status: "unresolved", gap: null, support: null };
  const body: IAutoMovieBuiltFloatingBody | undefined = floating.get(
    element.id,
  );
  if (body === undefined)
    return { node, status: "resting", gap: null, support: null };
  return {
    node,
    status: "floating",
    gap: body.below?.clearance ?? null,
    support: body.below?.body.id ?? null,
  };
}
