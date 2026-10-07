import { findHumanSkinLandmark } from "../../../common/basis/findHumanSkinLandmark";
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
 * @evidence contracts/common.md#principled-implementation Smooth compact transverse and endpoint kernels displace the actual anterior sheet, sampled from immutable live geometry; contributions sum once into owned positions.
 * @evidence contracts/common.md#clear-and-simple-design One source-relative regional producer; depth sampling remains the shared engine instrument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered anatomical endpoints and lip margin are required; no guessed vertex or clinical-grade conversion stands in.
 * @evidence contracts/common.md#meaningful-documentation States the guide and displacement conventions, identity/performance distinction, ownership, refusal and contact-reference responsibility.
 * @evidence contracts/modeling.md#part-identity-and-grouping Shapes the nasolabial region of the existing skin and adds no separate layer part.
 * @evidence contracts/modeling.md#parameter-channels Left and right resting depths are independent from their own smile amplitude; width changes compact support rather than the requested depth.
 * @evidence contracts/modeling.md#emitted-geometry Preserves every source vertex and triangle; fine relief resolution remains limited by the source's sampling.
 * @evidence contracts/modeling.md#spatial-conventions Converts millimetres once to Y-up +Z-anterior head-frame metres; valleys displace along the host's negative outward normal.
 * @evidence contracts/modeling.md#shared-boundaries Registered lip-margin vertices are untouched and the guide contribution vanishes at its alar and oral endpoints; other neighboring geometry still requires coupled contact observation.
 * @evidence contracts/anatomy.md#anatomical-source Uses the source's registered alar-curvature and cheilion identities; the constructed course and relief kernels are conventions, not measured tissue or a photonumeric inverse.
 * @evidence contracts/anatomy.md#permitted-range Nonfinite, negative or degenerate numerical inputs refuse unchanged; contact and source-cell guards judge geometric combinations, without claiming a clinical physiological envelope.
 * @evidence contracts/anatomy.md#parametric-authority Only named regional depths and width enter; source identities stay in the basis and personal vertices or curves cannot be authored.
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
    const held = new Set([
      ...basis.contact.margin.upper,
      ...basis.contact.margin.lower,
    ]);
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
