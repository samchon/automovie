import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
import { readHumanFaceLipMarginPoints } from "../../basis/readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceSkinRelief } from "../../structures/IAutoMovieHumanFaceSkinRelief";
import { applyHumanFaceSkinCourseRelief } from "./applyHumanFaceSkinCourseRelief";
import { createHumanFaceSkinHost } from "./createHumanFaceSkinHost";
import { createHumanFaceSkinMaterialCourse } from "./createHumanFaceSkinMaterialCourse";

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
  const rows = (["left", "right"] as const).flatMap((side) => {
    const input = relief.nasolabial![side];
    if (input === undefined) return [];
    const rest = input.restDepthMm ?? 0;
    const performed = input.smileDepthMm ?? 0;
    if (
      ![rest, performed, input.widthMm].every(Number.isFinite) ||
      rest < 0 ||
      performed < 0 ||
      input.widthMm <= 0
    )
      throw new Error(
        `Nasolabial ${side} relief needs nonnegative finite depths and a positive finite width.`,
      );
    const smile =
      weights.get(side === "left" ? "mouthSmileLeft" : "mouthSmileRight") ?? 0;
    if (!Number.isFinite(smile) || smile < 0 || smile > 1)
      throw new Error(
        `Nasolabial ${side} relief needs its source smile weight in [0,1].`,
      );
    const activeMm = rest + performed * smile;
    const depth = activeMm / 1000;
    const width = input.widthMm / 1000;
    if (!Number.isFinite(activeMm) || !Number.isFinite(depth) || !(width > 0))
      throw new Error(
        `Nasolabial ${side} depth and width must be representable in metres.`,
      );
    if (depth === 0) return [];
    const ala = findHumanSkinLandmark(basis, `alar-curvature-${side}`);
    const corner = findHumanSkinLandmark(basis, `cheilion-${side}`);
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
  const output = new Map(positions);
  for (const index of new Set(rows.map((row) => row.ala.surface))) {
    const surface = basis.surfaces[index];
    const source =
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
    const margin = readHumanFaceLipMarginPoints(surface, basis.contact.margin, source);
    // Holding actual nonzero native support keeps the material contact course
    // invariant under this separately authored persistent relief field.
    const held = new Set([...margin.upper, ...margin.lower].flatMap((point) =>
      point.vertices.filter((_, axis) => point.weights[axis] !== 0)));
    for (const row of rows.filter((item) => item.ala.surface === index)) {
      held.add(row.ala.vertex);
      held.add(row.corner.vertex);
    }
    const host = createHumanFaceSkinHost(surface.indices, source);
    const changed = source.slice();
    for (const row of rows.filter((item) => item.ala.surface === index)) {
      const a = source.slice(3 * row.ala.vertex, 3 * row.ala.vertex + 3);
      const b = source.slice(3 * row.corner.vertex, 3 * row.corner.vertex + 3);
      if (
        a.length !== 3 ||
        b.length !== 3 ||
        ![...a, ...b].every(Number.isFinite)
      )
        throw new Error(
          `Nasolabial ${row.side} relief endpoints are not finite resident points.`,
        );
      const sign: -1 | 1 = row.side === "left" ? 1 : -1;
      const sideReach = Math.min(sign * a[0], sign * b[0]);
      if (!(sideReach > 0) || row.width > sideReach)
        throw new Error(
          `Nasolabial ${row.side} width exceeds its current guide's ${sideReach * 1000} mm reach to the midsagittal boundary.`,
        );
      // The admission of a guide keeps its original frontal-projection measure.
      const projectedLength = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!(projectedLength > 0) || !Number.isFinite(projectedLength))
        throw new Error(
          `Nasolabial ${row.side} relief guide has no finite projected length.`,
        );
      const supported = applyHumanFaceSkinCourseRelief({
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
