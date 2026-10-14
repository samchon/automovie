import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";
import { applyHumanFaceSkinCourseRelief } from "./applyHumanFaceSkinCourseRelief";
import { createHumanFaceSkinHost } from "./createHumanFaceSkinHost";
import { createHumanFaceSkinMaterialCourse } from "./createHumanFaceSkinMaterialCourse";
import type { IAutoMovieHumanSkinLandmark as IAutoMovieHumanSkinLandmarkImported } from "../../../common/basis/IAutoMovieHumanSkinLandmark";
import type { IAutoMovieHumanFaceNasolabialRelief as IAutoMovieHumanFaceNasolabialReliefImported } from "../../structures/IAutoMovieHumanFaceNasolabialRelief";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../../structures/IAutoMovieHumanFaceBasisSurface";
import type { IHumanFaceLipMarginPoints as IHumanFaceLipMarginPointsImported } from "../../basis/IHumanFaceLipMarginPoints";
import type { IHumanFaceLipMarginPoint as IHumanFaceLipMarginPointImported } from "../../basis/IHumanFaceLipMarginPoint";
import type { IHumanFaceSkinHost as IHumanFaceSkinHostImported } from "./IHumanFaceSkinHost";


/**
 * Add independently authored resting and smile-dependent nasolabial valleys
 * to the live connected skin. Registered alar-curvature and cheilion points
 * define the guide, which the shared course kernel seats on the skin. The
 * valley is pressed in along the skin's own normal, so its depth is the
 * authored depth on the steep cheek beside the ala as well as on skin that
 * faces forward. A squared sine fades the contribution to zero at both ends,
 * and the registered lip margin is held exactly.
 *
 * The transverse kernel and longitudinal fade are the authored smooth relief
 * conventions of `applyHumanFaceSkinCourseRelief`, not a solution of tissue
 * mechanics or a reconstruction of a person's fold. Source folds
 * remain. No clinical ordinal grade is read. The current side's source smile
 * weight scales only its performed contribution; return to zero retains the
 * authored resting depth. Values are never clamped; absent registrations,
 * degenerate guides and nonfinite or negative settings refuse by name.
 * Width must remain representable in metres and stay inside its anatomical
 * side's midsagittal boundary, as measured from the current guide. A positive
 * guide with no contributing source sample refuses rather than accepting an
 * ineffective width. Sub-Float32 active depths retain their authored values;
 * ordinary export rounding may hide their effect without refusing an otherwise
 * supported in-between performance.
 *
 * Both sides sample the same immutable input sheet and accumulate into one
 * owned copy, so one side never changes the other's reference. Both consume
 * a registered material-chart course independently of width; the alar
 * registration's published material disk retains both endpoints' native
 * identities through the current host. Missing source coverage and unsupported
 * continuation refuse. A changed course
 * representation invalidates affected relief and contact-reference derivatives.
 * The pose owner must also call this on its shape-only contact reference with neutral smile,
 * so resting relief belongs to identity while performed relief takes the same
 * contact floor and budget as the remaining tissue performance. Common normal
 * construction and whole-person source-cell admission remain downstream.
 *
 * @evidence contracts/common.md#principled-implementation Each side's authored rest plus smile-weighted depth converts from mm to metres, follows registered alar/cheilion material support and displaces along the current host normal while holding native lip support and guide anchors; the kernel is an authored interpolation, not measured fold mechanics.
 * @evidence contracts/common.md#clear-and-simple-design Side admission precedes grouping by resident skin surface; one host and output copy serve both sides while chart compilation and displacement remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Left/right smile channels and chart domains are supported anatomical roles; invalid depths, widths, landmarks or ineffective support refuse without clamping or changing the caller's input maps.
 * @evidence contracts/common.md#meaningful-documentation The prose states units, normal-direction meaning, endpoint/lip preservation, reference/performance sequencing, numerical and source-coverage refusals, regeneration and unproven clinical/visual behavior.
 * @evidence contracts/performance.md#efficient-algorithms At most two admitted courses scan resident skin vertices and their native metric spans; host construction scans vertices/triangles and chart compilation carries rational/topology cost. Each active surface is copied once and bounded two-row filters do not grow with mesh size.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides on one surface share unchanged positions, welded normals and held lip support; performed and shape-only references are separate calls because their geometry/weights differ and cannot share a changed host.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local hosts, courses and copied positions scale with the admitted skin and are abandoned on refusal; only completed changed arrays enter the returned map, with no global cache or external handle.
 *
 * @author Samchon
 */
export function applyHumanFaceNasolabialRelief(
  basis: IAutoMovieHumanFaceBasis,
  positions: ReadonlyMap<string, readonly number[]>,
  weights: ReadonlyMap<string, number>,
  relief: IAutoMovieHumanFaceSkinRelief | undefined,
  reference: ReadonlyMap<string, readonly number[]>,
): ReadonlyMap<string, readonly number[]> {
  if (relief?.nasolabial === undefined) return positions;
  const rows: { side: "left" | "right"; depth: number; width: number; ala: IAutoMovieHumanSkinLandmarkImported; corner: IAutoMovieHumanSkinLandmarkImported; }[] = (["left", "right"] as const).flatMap((side: "left" | "right"): { side: "left" | "right"; depth: number; width: number; ala: IAutoMovieHumanSkinLandmarkImported; corner: IAutoMovieHumanSkinLandmarkImported; }[]  => {
    const input: IAutoMovieHumanFaceNasolabialReliefImported | undefined = relief.nasolabial![side];
    if (input === undefined) return [];
    const rest: number = input.restDepthMm ?? 0;
    const performed: number = input.smileDepthMm ?? 0;
    if (
      ![rest, performed, input.widthMm].every(Number.isFinite) ||
      rest < 0 ||
      performed < 0 ||
      input.widthMm <= 0
    )
      throw new Error(
        `Nasolabial ${side} relief needs nonnegative finite depths and a positive finite width.`,
      );
    const smile: number =
      weights.get(side === "left" ? "mouthSmileLeft" : "mouthSmileRight") ?? 0;
    if (!Number.isFinite(smile) || smile < 0 || smile > 1)
      throw new Error(
        `Nasolabial ${side} relief needs its source smile weight in [0,1].`,
      );
    const activeMm: number = rest + performed * smile;
    const depth: number = activeMm / 1000;
    const width: number = input.widthMm / 1000;
    if (!Number.isFinite(activeMm) || !Number.isFinite(depth) || !(width > 0))
      throw new Error(
        `Nasolabial ${side} depth and width must be representable in metres.`,
      );
    if (depth === 0) return [];
    const ala: IAutoMovieHumanSkinLandmarkImported | undefined = findHumanSkinLandmark(basis, `alar-curvature-${side}`);
    const corner: IAutoMovieHumanSkinLandmarkImported | undefined = findHumanSkinLandmark(basis, `cheilion-${side}`);
    if (
      ala === undefined ||
      corner === undefined ||
      ala.surface !== corner.surface
    )
      throw new Error(
        `Nasolabial ${side} relief needs registered alar-curvature and cheilion on one skin surface.`,
      );
    return [{ side, depth, width, ala, corner }];
  });
  if (rows.length === 0) return positions;
  const output: Map<string, readonly number[]> = new Map(positions);
  for (const index of new Set(rows.map((row: { side: "left" | "right"; depth: number; width: number; ala: IAutoMovieHumanSkinLandmarkImported; corner: IAutoMovieHumanSkinLandmarkImported; }): number  => row.ala.surface))) {
    const surface: IAutoMovieHumanFaceBasisSurfaceImported = basis.surfaces[index];
    const source: readonly number[] | undefined =
      surface === undefined ? undefined : positions.get(surface.id);
    if (source === undefined)
      throw new Error(
        "Nasolabial relief needs its registered resident skin surface.",
      );
    if (
      basis.contact?.lips.surface !== surface.id ||
      basis.contact.margin === undefined
    )
      throw new Error(
        "Nasolabial relief needs the same skin's registered complete lip margin.",
      );
    const margin: IHumanFaceLipMarginPointsImported = readHumanFaceLipMarginPoints(surface, basis.contact.margin, source);
    // Holding actual nonzero native support keeps the material contact course
    // invariant under this separately authored persistent relief field.
    const held: Set<number> = new Set([...margin.upper, ...margin.lower].flatMap((point: IHumanFaceLipMarginPointImported): number[]  =>
      point.vertices.filter((_: number, axis: number): boolean  => point.weights[axis] !== 0)));
    for (const row of rows.filter((item: { side: "left" | "right"; depth: number; width: number; ala: IAutoMovieHumanSkinLandmarkImported; corner: IAutoMovieHumanSkinLandmarkImported; }): boolean  => item.ala.surface === index)) {
      held.add(row.ala.vertex);
      held.add(row.corner.vertex);
    }
    const host: IHumanFaceSkinHostImported = createHumanFaceSkinHost(surface.indices, source);
    const changed: number[] = source.slice();
    for (const row of rows.filter((item: { side: "left" | "right"; depth: number; width: number; ala: IAutoMovieHumanSkinLandmarkImported; corner: IAutoMovieHumanSkinLandmarkImported; }): boolean  => item.ala.surface === index)) {
      const a: number[] = source.slice(3 * row.ala.vertex, 3 * row.ala.vertex + 3);
      const b: number[] = source.slice(3 * row.corner.vertex, 3 * row.corner.vertex + 3);
      if (
        a.length !== 3 ||
        b.length !== 3 ||
        ![...a, ...b].every(Number.isFinite)
      )
        throw new Error(
          `Nasolabial ${row.side} relief endpoints are not finite resident points.`,
        );
      const sign: -1 | 1 = row.side === "left" ? 1 : -1;
      const sideReach: number = Math.min(sign * a[0], sign * b[0]);
      if (!(sideReach > 0) || row.width > sideReach)
        throw new Error(
          `Nasolabial ${row.side} width exceeds its current guide's ${sideReach * 1000} mm reach to the midsagittal boundary.`,
        );
      // The admission of a guide keeps its original frontal-projection measure.
      const projectedLength: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!(projectedLength > 0) || !Number.isFinite(projectedLength))
        throw new Error(
          `Nasolabial ${row.side} relief guide has no finite projected length.`,
        );
      const supported: boolean = applyHumanFaceSkinCourseRelief({
        host,
        source,
        changed,
        course: createHumanFaceSkinMaterialCourse({
          host,
          surface,
          referencePositions: reference.get(surface.id) ?? [],
          domain: row.side === "left" ? "nasolabialLeft" : "nasolabialRight",
          supportVertices: [row.ala.vertex, row.corner.vertex],
          guide: [{ vertex: row.ala.vertex }, { vertex: row.corner.vertex }],
        }),
        widthMetres: row.width,
        offsetMetres: -row.depth,
        held,
        side: sign,
      });
      if (!supported)
        throw new Error(
          `Nasolabial ${row.side} width has no contributing sample on the current source skin.`,
        );
    }
    if (!changed.every(Number.isFinite))
      throw new Error("Nasolabial relief produced a nonfinite skin position.");
    output.set(surface.id, changed);
  }
  return output;
}
