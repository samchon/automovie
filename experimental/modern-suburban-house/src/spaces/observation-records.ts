/**
 * Records returned by the house observation derivation, and the opening-frame
 * resolver shared by threshold stations and route checks. The derived census
 * and five reference selectors use these addresses; a nullable pose keeps
 * exterior camera ownership with settings and failed interior poses visible
 * to the caller. Opening geometry comes from the built wall face and void,
 * without moving either. World coordinates are right-handed Y-up metres.
 */
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A camera pose inside its own space: where the eye is and what it looks at.
 * @evidence spaces/04-observations.md The spatial observation design locates a station inside its subject space.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Position and look target are recorded together for each accepted station.
 * @evidence principles/core/source-units.md#source-scope-preservation This type describes derived camera data and does not make a new room or opening.
 * @evidence principles/core/source-units.md#source-substantive-completion Both vectors needed to inspect a station are present.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires each room's centre, inset corners, and thresholds to keep a pose inside that room; the paired eye and target carry those existing stations.
 */
export interface IObservationPose {
  /**
   * @evidence spaces/04-observations.md A camera eye adjusted to an authored standing floor can retain its height-correction reason.
   * @evidence spaces/04-observations.md#spatial-observation-derivation A derived inward move records its boundary reason alongside the pose.
   * @evidence principles/core/source-units.md#source-scope-preservation The explanation records a derived camera correction and leaves the place unchanged.
   * @evidence principles/core/source-units.md#source-substantive-completion A vertically corrected eye can report its standing floor and 1.60 m offset; inward fallbacks can report their displacement.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires reasons for inward station moves, while `settings/20-verification.md#frame-condition` supplies the 1.60 m eye; this field carries both corrections without changing either parent.
   */
  reason?: string;
  /**
   * @evidence spaces/04-observations.md The observation camera records a world-space eye.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The eye remains at a position in its subject space.
   * @evidence principles/core/source-units.md#source-scope-preservation This point is a derived camera station, not a new room point.
   * @evidence principles/core/source-units.md#source-substantive-completion A concrete position makes station containment testable.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation keeps every centre, corner, and threshold eye inside its subject room; position records the tested world point.
   */
  position: IAutoMovieVector3;
  /**
   * @evidence spaces/04-observations.md The observation camera records its aim.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The station looks toward its observed boundary or room interior.
   * @evidence principles/core/source-units.md#source-scope-preservation The aim describes inspection and does not move a space boundary.
   * @evidence principles/core/source-units.md#source-substantive-completion A concrete target makes the station view reproducible.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires four centre directions and inward corner or threshold looks within each room; target stores that existing aim.
   */
  target: IAutoMovieVector3;
}

/**
 * One derived spatial question.
 * @evidence spaces/04-observations.md Every inspection question has a role, subject, and optional self-space pose.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Interior stations and exterior census questions share a stable record shape.
 * @evidence principles/core/source-units.md#source-scope-preservation A question observes authored geometry instead of adding geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion The record exposes station identity, role, subject and camera ownership.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation adds room centre, corner, and threshold poses alongside exposed facade, roof, and entrance questions; this record carries both populations.
 */
export interface IHouseObservation {
  /**
   * @evidence spaces/04-observations.md Questions need stable addresses for reference comparison.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons Stable ids let each reference selection address its derived spatial questions.
   * @evidence principles/core/source-units.md#source-scope-preservation The address names an observation, not another geometry owner.
   * @evidence principles/core/source-units.md#source-substantive-completion It lets failures and references identify the same question.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` requires derived observation ids from compiled boundaries, while `spatial-observation-derivation` supplies the questions; this field carries the actual station or building id into both acceptance and selection.
   */
  id: string;
  /**
   * @evidence spaces/04-observations.md The inspection census distinguishes station and building questions.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Centre, corner, threshold and building roles identify the question.
   * @evidence principles/core/source-units.md#source-scope-preservation These roles classify derived observations only.
   * @evidence principles/core/source-units.md#source-substantive-completion The explicit union prevents an unclassified question from entering the result.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation calls for centre, inset corner, and opening threshold views, plus whole-building exterior questions; role distinguishes those named observation families.
   */
  role:
    | "center"
    | "corner"
    | "threshold"
    | "reflex-corner"
    | "facade"
    | "roof"
    | "underside"
    | "envelope-corner"
    | "entrance";
  /**
   * @evidence spaces/04-observations.md Interior station ownership is by subject space.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The pose stands in this space; exterior census questions have none.
   * @evidence principles/core/source-units.md#source-scope-preservation The string refers to an existing built space.
   * @evidence principles/core/source-units.md#source-substantive-completion The derivation can check pose containment against this id.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation places each interior eye in its own room, while whole-building facade and roof questions have no room id; space records that distinction.
   */
  space: string | null;
  /**
   * @evidence spaces/04-observations.md Questions identify the feature under inspection.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Opening, boundary or corner under inspection, when applicable.
   * @evidence principles/core/source-units.md#source-scope-preservation This is an existing subject id rather than a created feature.
   * @evidence principles/core/source-units.md#source-substantive-completion The subject connects a threshold or building question to its opening, boundary, corner, entrance, or roof part.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation ties threshold questions to their opening and building questions to their exterior element; subject retains the compiled id being inspected.
   */
  subject: string | null;
  /**
   * @evidence spaces/04-observations.md Interior inspection stations carry a camera pose.
   * @evidence spaces/04-observations.md#engine-render-handoff Interior questions carry a pose; settings supplies the exterior census camera.
   * @evidence principles/core/source-units.md#source-scope-preservation A null exterior pose leaves camera selection to settings.
   * @evidence principles/core/source-units.md#source-substantive-completion The camera handoff can distinguish self-space and exterior questions.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation accepts a pose inside each inhabited space and leaves exterior camera selection to frame-condition; pose is nullable when that engine station has no valid self-space eye.
   */
  pose: IObservationPose | null;
}

/**
 * What one reference comparison reads.
 * @evidence spaces/04-observations.md The five references select derived observations and records.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons Each comparison names the questions it uses.
 * @evidence principles/core/source-units.md#source-scope-preservation The comparison selects existing observations without authoring a second house.
 * @evidence principles/core/source-units.md#source-substantive-completion Reference identity, station ids and record ids are explicit.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons enumerates 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this type carries those five addresses.
 */
export interface IReferenceComparison {
  /**
   * @evidence spaces/04-observations.md Five source references drive the comparison map.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The key identifies one of the five given reference views.
   * @evidence principles/core/source-units.md#source-scope-preservation The union does not introduce a sixth reference.
   * @evidence principles/core/source-units.md#source-substantive-completion Each comparison has a known reference identity.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons fixes the 01–05 set; this union refuses a sixth reference key.
   */
  reference: "01" | "02" | "03" | "04" | "05";
  /**
   * @evidence spaces/04-observations.md Comparisons use the derived station census.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons References with spatial questions list their accepted observation ids; the cutaway may use compiled records instead.
   * @evidence principles/core/source-units.md#source-scope-preservation These ids refer to accepted questions rather than cloned views.
   * @evidence principles/core/source-units.md#source-substantive-completion The selector lists each observation it needs.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` assigns extra comparison questions for 01–05; this field selects existing derived observation ids where they apply, while the 02 cutaway reads compiled records without an invented pose.
   */
  observations: string[];
  /**
   * @evidence spaces/04-observations.md The cutaway may compare compiled records directly.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The cutaway can read storey records without inventing a camera pose.
   * @evidence principles/core/source-units.md#source-scope-preservation These names select existing records, not new geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The comparison records non-camera inputs explicitly.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons assigns 02 to a two-storey cutaway and allows it to read compiled storey records without inventing an interior camera.
   */
  records: string[];
}

/**
 * The derivation result.
 * @evidence spaces/04-observations.md It returns accepted questions, failed stations and reference selections.
 * @evidence spaces/04-observations.md#engine-render-handoff Null, outside, or coincident stations remain failures instead of counting as successful observations.
 * @evidence principles/core/source-units.md#source-scope-preservation The result is computed from the built house record.
 * @evidence principles/core/source-units.md#source-substantive-completion Both the accepted census and rejected stations reach the caller.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `spatial-observation-derivation` supplies the compiled question census, `engine-render-handoff` separates invalid station poses, and `reference-spatial-comparisons` assigns five comparisons; this type returns those three populations.
 */
export interface IObservationDerivation {
  /**
   * @evidence spaces/04-observations.md The result exposes its observation census.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Accepted stations and building questions.
   * @evidence principles/core/source-units.md#source-scope-preservation Entries derive from the compiled house rather than new source geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The caller can inspect every accepted question.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation adds centre, corner, threshold, and building questions to the compiled station denominator; observations carries the accepted entries of that census.
   */
  observations: IHouseObservation[];
  /**
   * @evidence spaces/04-observations.md Failed stations remain audit data.
   * @evidence spaces/04-observations.md#engine-render-handoff Invalid or coincident stations retain an id and cause outside the accepted census.
   * @evidence principles/core/source-units.md#source-scope-preservation Failed questions do not create substitute rooms or cameras.
   * @evidence principles/core/source-units.md#source-substantive-completion Every rejected station has a reason for review.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `engine-render-handoff` requires unresolved own-space stations to remain outside the successful census; this list records their id and cause after the inward fallbacks.
   */
  failures: { id: string; cause: string }[];
  /**
   * @evidence spaces/04-observations.md The result carries the comparison selectors.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons Five selections reference observations and records.
   * @evidence principles/core/source-units.md#source-scope-preservation Selectors reuse the derived census.
   * @evidence principles/core/source-units.md#source-substantive-completion All five views have an explicit comparison route.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons requires separate selections for 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this list retains all five.
   */
  references: IReferenceComparison[];
}

/**
 * World centre and face normal of one opening's void, and the reach from the
 * wall's mid-plane to 0.05 m beyond either face: the one place route checks and
 * observations read which outside zone an envelope opening opens on to.
 * Throws when the opening, its host face or its void is missing.
 */
/**
 * @evidence spaces/06-openings.md openingAxis resolves an authored wall void to a world-space centre, local face normal, and beyond-face reach.
 * @evidence spaces/06-openings.md#external-opening-interface The helper reads the host face origin, rotation and wall thickness to locate an opening through its assigned boundary.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the existing opening profile and boundary face, without assigning a new door or window frame.
 * @evidence principles/core/source-units.md#source-substantive-completion Missing opening, face, or profile throws; otherwise quaternion rotation and origin yield world coordinates.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The external-opening-interface parent supplies the host wall and through-thickness void; this helper's bidirectional beyond-face probe adds no opening coordinate.
 */
export const openingAxis = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): { centre: IAutoMovieVector3; normal: IAutoMovieVector3; reach: number } => {
  const opening = environment.openings.find((o) => o.id === openingId);
  const face =
    opening === undefined
      ? undefined
      : environment.boundaries.find((b) => b.id === opening.boundary)?.face;
  if (
    opening === undefined ||
    face === undefined ||
    opening.profile === undefined
  )
    throw new Error(`opening "${openingId}" has no host face or void`);
  const n = opening.profile.outline.length;
  const cx = opening.profile.outline.reduce((s, q) => s + q.x, 0) / n;
  const cy = opening.profile.outline.reduce((s, q) => s + q.y, 0) / n;
  const r = face.rotation;
  const rotate = (v: IAutoMovieVector3): IAutoMovieVector3 => {
    const t = {
      x: 2 * (r.y * v.z - r.z * v.y),
      y: 2 * (r.z * v.x - r.x * v.z),
      z: 2 * (r.x * v.y - r.y * v.x),
    };
    return {
      x: v.x + r.w * t.x + (r.y * t.z - r.z * t.y),
      y: v.y + r.w * t.y + (r.z * t.x - r.x * t.z),
      z: v.z + r.w * t.z + (r.x * t.y - r.y * t.x),
    };
  };
  const local = rotate({ x: cx, y: cy, z: 0 });
  return {
    centre: {
      x: face.origin.x + local.x,
      y: face.origin.y + local.y,
      z: face.origin.z + local.z,
    },
    normal: rotate({ x: 0, y: 0, z: 1 }),
    reach: face.thickness / 2 + 0.05,
  };
};
