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
  * @evidenceReview spaces/04-observations.md #696e544 `IObservationPose` pairs a world eye with a look target, and `deriveHouseObservations` accepts it only when the eye remains inside its named built space.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Position and look target are recorded together for each accepted station.
  * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea Required `position` and `target` keep a station's eye and aim together; the observation derivation records only accepted non-null station poses in its interior census.
 * @evidence principles/core/source-units.md#source-scope-preservation This type describes derived camera data and does not make a new room or opening.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The type has two vectors and an optional explanation for a derived camera pose; it declares no room, opening, or building geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Both vectors needed to inspect a station are present.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Both eye and aim are required world vectors, allowing the observation consumer to reproduce a station direction while `reason` records corrections when present.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires each room's centre, inset corners, and thresholds to keep a pose inside that room; the paired eye and target carry those existing stations.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` calls for room-centre, inward-corner, and threshold poses; this paired eye and aim record carries those derived stations without inventing another place.
 */
export interface IObservationPose {
  /**
    * @evidence spaces/04-observations.md A camera eye adjusted to an authored standing floor can retain its height-correction reason.
    * @evidenceReview spaces/04-observations.md #696e544 `accept` appends a reason when it raises or lowers a station to standing floor plus 1.60 m, preserving the earlier explanation if an inset or threshold fallback supplied one.
    * @evidence spaces/04-observations.md#spatial-observation-derivation A derived inward move records its boundary reason alongside the pose.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea `insetCorner` and threshold fallback create explicit inward-move reasons; an unchanged engine station is copied with no added explanation, while `accept` can append a floor-height reason.
   * @evidence principles/core/source-units.md#source-scope-preservation The explanation records a derived camera correction and leaves the place unchanged.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The optional string explains a derived camera correction; `accept` may replace the pose but does not modify the built space that it observes.
    * @evidence principles/core/source-units.md#source-substantive-completion A vertically corrected eye can report its standing floor and 1.60 m offset; inward fallbacks can report their displacement.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `accept` writes floor and eye height into `reason` for vertical corrections, while `insetCorner` and threshold fallback provide displacement text for their moved station poses.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires reasons for inward station moves, while settings/20-verification.md#frame-condition supplies the 1.60 m eye; this field carries both corrections without changing either parent.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` requires the cause of inward pose moves, and `frame-condition` supplies 1.60 m eye height; this field carries explicit inward or standing-floor correction text from the derivation.
   */
  reason?: string;
  /**
   * @evidence spaces/04-observations.md The observation camera records a world-space eye.
    * @evidenceReview spaces/04-observations.md #696e544 `position` is the world-space eye that each accepted room, stair, storage, or exterior station places inside its named built space.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The eye remains at a position in its subject space.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea `accept` tests this point with `builtSpaceContainsPoint` for its own space and records an outside-space failure rather than counting it.
   * @evidence principles/core/source-units.md#source-scope-preservation This point is a derived camera station, not a new room point.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The field carries a camera station derived from compiled cells or an authored outline; environment space construction never reads it as a new room corner.
   * @evidence principles/core/source-units.md#source-substantive-completion A concrete position makes station containment testable.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `accept` reads the concrete X/Y/Z point for self-space containment, eye-height correction, and duplicate-station checks.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation keeps every centre, corner, and threshold eye inside its subject room; position records the tested world point.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` requires centre, corner, and threshold eyes inside their own space; the derivation tests this world point before accepting each such station.
   */
  position: IAutoMovieVector3;
  /**
   * @evidence spaces/04-observations.md The observation camera records its aim.
    * @evidenceReview spaces/04-observations.md #696e544 `target` stores where a self-space station looks, keeping its inspection direction alongside the world eye instead of relying on a reference image camera.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The station looks toward its observed boundary or room interior.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea Engine centre stations retain their four aims, threshold fallback aims at the opening centre, and reflex-corner stations aim along each incident wall through this field.
   * @evidence principles/core/source-units.md#source-scope-preservation The aim describes inspection and does not move a space boundary.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This aim vector changes only a derived inspection pose; it does not move a built cell, wall face, or opening profile.
   * @evidence principles/core/source-units.md#source-substantive-completion A concrete target makes the station view reproducible.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f A required world target lets a consumer compute the station's viewing direction from its required position.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires four centre directions and inward corner or threshold looks within each room; target stores that existing aim.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` assigns centre directions, inward corners, and threshold looks; this field holds their engine or fallback aim without creating a new boundary.
   */
  target: IAutoMovieVector3;
}

/**
 * One derived spatial question.
 * @evidence spaces/04-observations.md Every inspection question has a role, subject, and optional self-space pose.
  * @evidenceReview spaces/04-observations.md #696e544 `IHouseObservation` carries a named question, its role and subject, and either an own-space pose or a null exterior camera handoff.
 * @evidence spaces/04-observations.md#spatial-observation-derivation Interior stations and exterior census questions share a stable record shape.
  * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea `deriveHouseObservations` appends accepted room, stair, storage, and zone stations and exterior building questions to the same typed observation list.
 * @evidence principles/core/source-units.md#source-scope-preservation A question observes authored geometry instead of adding geometry.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The record points to an existing space or feature and optional camera pose; it adds no room surface, roof part, or opening geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion The record exposes station identity, role, subject and camera ownership.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Required id, role, space, subject, and nullable pose let consumers identify each question, locate its own-space camera when present, and distinguish exterior camera ownership.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation adds room centre, corner, and threshold poses alongside exposed facade, roof, and entrance questions; this record carries both populations.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` assigns room centre/corner/threshold poses and facade, roof, corner, and entrance questions; this record carries both populations without inventing a new inspection place.
 */
export interface IHouseObservation {
  /**
   * @evidence spaces/04-observations.md Questions need stable addresses for reference comparison.
    * @evidenceReview spaces/04-observations.md #696e544 `reference-spatial-comparisons` selects actual derived observation ids, and this field retains each station or building-question address for that selection.
    * @evidence spaces/04-observations.md#reference-spatial-comparisons Stable ids let each reference selection address its derived spatial questions.
    * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 Interior ids combine space and station identity, while building ids combine role and feature identity; the five `references` select those exact ids.
   * @evidence principles/core/source-units.md#source-scope-preservation The address names an observation, not another geometry owner.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 This string identifies a question built from existing records and is never used as a new geometry owner or room id.
   * @evidence principles/core/source-units.md#source-substantive-completion It lets failures and references identify the same question.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `accept` records rejected station ids in `failures`, and reference selections retain accepted question ids, giving both consumers a stable address.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` requires derived observation ids from compiled boundaries, while `spatial-observation-derivation` supplies the questions; this field carries the actual station or building id into both acceptance and selection.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 Room station ids and exterior question ids are produced from compiled records, then accepted or reported as failures and selected by the five references, so the cited design needs no new question address rule.
   */
  id: string;
  /**
   * @evidence spaces/04-observations.md The inspection census distinguishes station and building questions.
    * @evidenceReview spaces/04-observations.md #696e544 The `role` union distinguishes centre, corner, threshold, and reflex stations from facade, roof, underside, envelope-corner, and entrance questions.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Centre, corner, threshold and building roles identify the question.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea The derivation assigns one of the nine role literals when it accepts a station, adds a reflex corner, or appends the compiled building census.
   * @evidence principles/core/source-units.md#source-scope-preservation These roles classify derived observations only.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The literal classifies an inspection question but does not create the cell, boundary, roof face, or opening it describes.
   * @evidence principles/core/source-units.md#source-substantive-completion The explicit union prevents an unclassified question from entering the result.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The closed role union covers engine stations and added reflex or building questions, giving reference filters a finite typed classification.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation calls for centre, inset corner, and opening threshold views, plus whole-building exterior questions; role distinguishes those named observation families.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` specifies centre, inward corner, threshold, hidden concave corner, and exterior feature questions; these role literals preserve those families without inventing a view count.
   */
  role: "center" | "corner" | "threshold" | "reflex-corner" | "facade" | "roof" | "underside" | "envelope-corner" | "entrance";
  /**
   * @evidence spaces/04-observations.md Interior station ownership is by subject space.
    * @evidenceReview spaces/04-observations.md #696e544 Interior station builders put their own built space id here, while building questions use null because their exterior cameras have no room to stand in.
   * @evidence spaces/04-observations.md#spatial-observation-derivation The pose stands in this space; exterior census questions have none.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea `accept` checks station poses against this id; facade, roof, underside, corner, and entrance questions carry `space:null` and no own-space pose.
   * @evidence principles/core/source-units.md#source-scope-preservation The string refers to an existing built space.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Non-null values refer to compiled room, stair, storage, or exterior space ids; the observation record does not create a new space.
   * @evidence principles/core/source-units.md#source-substantive-completion The derivation can check pose containment against this id.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f `accept` resolves this id in its compiled space map and tests the eye with `builtSpaceContainsPoint`, recording a failure if the pose leaves it.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation places each interior eye in its own room, while whole-building facade and roof questions have no room id; space records that distinction.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` assigns self-space poses to indoor and walkable places and exterior questions to the building census; this nullable id keeps that distinction without a new room.
   */
  space: string | null;
  /**
   * @evidence spaces/04-observations.md Questions identify the feature under inspection.
    * @evidenceReview spaces/04-observations.md #696e544 `subject` names the opening at a threshold or the boundary, corner, entrance, or roof part a building question inspects; centre stations can leave it null.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Opening, boundary or corner under inspection, when applicable.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea Threshold stations retain `station.opening`; census questions retain boundary, corner, or entrance ids, and roof-part questions retain the emitted part id.
   * @evidence principles/core/source-units.md#source-scope-preservation This is an existing subject id rather than a created feature.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 The id comes from an existing opening, boundary, corner, entrance, or emitted roof part; this field creates no feature.
    * @evidence principles/core/source-units.md#source-substantive-completion The subject connects a threshold or building question to its opening, boundary, corner, entrance, or roof part.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Thresholds identify opening ids, census questions identify compiled exterior features, and emitted roof questions identify part ids, allowing each feature to be located.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation ties threshold questions to their opening and building questions to their exterior element; subject retains the compiled id being inspected.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` requires threshold and exterior feature questions; this field retains their compiled opening, boundary, corner, entrance, or roof-part identity.
   */
  subject: string | null;
  /**
   * @evidence spaces/04-observations.md Interior inspection stations carry a camera pose.
    * @evidenceReview spaces/04-observations.md #696e544 Accepted self-space stations carry a concrete `IObservationPose`; `accept` places a null or outside-space station in `failures` instead of the observation list.
   * @evidence spaces/04-observations.md#engine-render-handoff Interior questions carry a pose; settings supplies the exterior census camera.
    * @evidenceReview spaces/04-observations.md#engine-render-handoff #330fc4a Building census and roof-part questions carry `pose:null`; the source records their inspection subject and leaves exterior camera/render conditions to settings.
   * @evidence principles/core/source-units.md#source-scope-preservation A null exterior pose leaves camera selection to settings.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 A null building pose does not invent an exterior camera; a non-null station pose remains data, not house geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The camera handoff can distinguish self-space and exterior questions.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f The nullable field lets the caller distinguish a contained interior eye from an exterior question whose camera is supplied during rendering.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation accepts a pose inside each inhabited space and leaves exterior camera selection to frame-condition; pose is nullable when that engine station has no valid self-space eye.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 `spatial-observation-derivation` supplies own-space poses and exterior questions, while `engine-render-handoff` leaves exterior camera choice to settings; this field keeps interior data and exterior null distinct.
   */
  pose: IObservationPose | null;
}

/**
 * What one reference comparison reads.
 * @evidence spaces/04-observations.md The five references select derived observations and records.
 * @evidenceReview spaces/04-observations.md #696e544 v-141 references (L569-612) select ids and record names.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons Each comparison names the questions it uses.
 * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 v-141 Each entry lists the ids it reads (02 lists none).
 * @evidence principles/core/source-units.md#source-scope-preservation The comparison selects existing observations without authoring a second house.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Selectors filter existing observations (L563-568).
 * @evidence principles/core/source-units.md#source-substantive-completion Reference identity, station ids and record ids are explicit.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Explicit fields: reference, observations, records.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons enumerates 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this type carries those five addresses.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:129-133: references 01 exterior, 02 cutaway, 03 rear common room, 04 entry/living/stair, 05 upper private hall. Type has reference/observations/records (observations.ts:137-162).
 */
export interface IReferenceComparison {
  /**
   * @evidence spaces/04-observations.md Five source references drive the comparison map.
   * @evidenceReview spaces/04-observations.md #696e544 v-141 Union "01".."05"; 04:127-133.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The key identifies one of the five given reference views.
   * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 v-141 04:129-133.
   * @evidence principles/core/source-units.md#source-scope-preservation The union does not introduce a sixth reference.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 The union has exactly five literals.
   * @evidence principles/core/source-units.md#source-substantive-completion Each comparison has a known reference identity.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 The reference key is required.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons fixes the 01–05 set; this union refuses a sixth reference key.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:127-133 has exactly 01-05; union '01'|'02'|'03'|'04'|'05' (observations.ts:145).
   */
  reference: "01" | "02" | "03" | "04" | "05";
  /**
   * @evidence spaces/04-observations.md Comparisons use the derived station census.
   * @evidenceReview spaces/04-observations.md #696e544 v-141 Selectors read derived observations (L573-608); 04:131 derives interior viewpoints from the same record.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The comparison reads these accepted observation ids.
   * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 v-141 The ids come from the accepted observations set (L562-568).
   * @evidence principles/core/source-units.md#source-scope-preservation These ids refer to accepted questions rather than cloned views.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Strings reference existing ids; no pose is copied.
   * @evidence principles/core/source-units.md#source-substantive-completion The selector lists each observation it needs.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 pick() (L563-565) silently drops wanted ids that are absent or failed; only a wholly empty list throws (L613). A needed id such as kitchen-dining-family/threshold-garden-door could disappear from 03 with no diagnostic.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation names five additional reference questions; this id list selects their current station addresses without changing those questions.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 B holds: 04:41 '01–05의 참조 질문은 이 분모에 추가한다'. The host lists existing census ids (pick/ofSpace over observations, observations.ts:564-613); no reference question gets its own id or camera (04:125) or joins the denominator, and 02 selects none. 'their current station addresses' presents census proxies as the added questions' addresses.
   */
  observations: string[];
  /**
   * @evidence spaces/04-observations.md The cutaway may compare compiled records directly.
   * @evidenceReview spaces/04-observations.md #696e544 v-141 02 has observations [] and records the storeys plus the stair connection (L579-583). 04:130: 02 compares the two storeys' plans/sections, room connections and the stair hole.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The cutaway can read storey records without inventing a camera pose.
   * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 v-141 02 has no pose. 04:130 gives inspection-mode plans/sections of the two storeys; 04:125 forbids leaving rooms to imitate a reference camera.
   * @evidence principles/core/source-units.md#source-scope-preservation These names select existing records, not new geometry.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Record names only.
   * @evidence principles/core/source-units.md#source-substantive-completion The comparison records non-camera inputs explicitly.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 The records field lists the non-camera inputs.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons assigns 02 to a two-storey cutaway and allows it to read compiled storey records without inventing an interior camera.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:130: 02 = two-storey plan and cutaway in inspection mode only; 04:125 forbids imitating the camera. Host 02: observations [], records ground-storey/upper-storey/main-stair-connection (observations.ts:581-585).
   */
  records: string[];
}

/**
 * The derivation result.
 * @evidence spaces/04-observations.md It returns accepted questions, failed stations and reference selections.
 * @evidenceReview spaces/04-observations.md #696e544 v-141 Returns {observations, failures, references} (L616).
 * @evidence spaces/04-observations.md#spatial-observation-derivation Failed poses remain visible and are not counted as observations.
 * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea v-141 A holds: failures are kept separate (L387-402). But the not-counted rule is in #engine-render-handoff (04:171 "null이나 같은 장소로 모인 시점을 성공한 관찰로 세지 않는다"), not in the #spatial-observation-derivation body (04:41-79).
 * @evidence principles/core/source-units.md#source-scope-preservation The result is computed from the built house record.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Computed from environment + house (L320-616).
 * @evidence principles/core/source-units.md#source-substantive-completion Both the accepted census and rejected stations reach the caller.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 failures and observations are both returned (L616).
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires a complete station census with explicit failures and five reference comparisons; IObservationDerivation returns those three populations from one environment.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:41 full census plus 01–05 reference questions holds; the failure rule (null or coincident poses not counted) is only in sibling 04:171, not 04:41-79. Host: IObservationDerivation {observations, failures, references} (observations.ts:172-197) from one environment.
 */
export interface IObservationDerivation {
  /**
   * @evidence spaces/04-observations.md The result exposes its observation census.
   * @evidenceReview spaces/04-observations.md #696e544 v-141 observations array (L321/616).
   * @evidence spaces/04-observations.md#spatial-observation-derivation Accepted stations and building questions.
   * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea v-141 Accepted stations (L402) plus building questions (L535-559).
   * @evidence principles/core/source-units.md#source-scope-preservation Entries derive from the compiled house rather than new source geometry.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Entries derive from environment stations/census and house outlines; no new source geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The caller can inspect every accepted question.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 All accepted questions are returned.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation adds centre, corner, threshold, and building questions to the compiled station denominator; observations carries the accepted entries of that census.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:41 applies the compiled denominator and derives exterior plus per-room centre/corner/threshold questions. observations holds accepted entries (observations.ts:403) plus building questions (:537-562).
   */
  observations: IHouseObservation[];
  /**
   * @evidence spaces/04-observations.md Failed stations remain audit data.
   * @evidenceReview spaces/04-observations.md #696e544 v-141 failures list (L322); 04:171.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Invalid or coincident stations retain an id and cause.
   * @evidenceReview spaces/04-observations.md#spatial-observation-derivation #86f0eea v-141 A holds: null gives "no pose inside its space", plus the outside and "coincides with" causes (L387-401). But the null/coincident rule is in 04:171 (#engine-render-handoff), not in the cited #spatial-observation-derivation body.
   * @evidence principles/core/source-units.md#source-scope-preservation Failed questions do not create substitute rooms or cameras.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 Failure entries are id+cause only. No substitute is made after failing; the insetCorner/threshold fallbacks run before accept (L439-458).
   * @evidence principles/core/source-units.md#source-substantive-completion Every rejected station has a reason for review.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 Every failure has a cause string (L389, 392, 400).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation requires unresolved self-space stations to stay visible as failures; this list records their id and concrete cause instead of inventing a replacement pose.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 'Unresolved stations stay visible as failures' is literal only in sibling 04:171 ('null이나 같은 장소로 모인 시점을 성공한 관찰로 세지 않는다'), not in 04:41-79. Host part holds: failures {id, cause} (observations.ts:388-402), after the insetCorner and threshold fallbacks (:441-461).
   */
  failures: { id: string; cause: string }[];
  /**
   * @evidence spaces/04-observations.md The result carries the comparison selectors.
   * @evidenceReview spaces/04-observations.md #696e544 references field (observations.ts:196) is returned (:618).
   * @evidence spaces/04-observations.md#reference-spatial-comparisons Five selections reference observations and records.
   * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons #367a7d1 Five entries, each with observations and records (observations.ts:571-614); 04:127-133 five references.
   * @evidence principles/core/source-units.md#source-scope-preservation Selectors reuse the derived census.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 Selectors are built from existing observation ids via pick/ofSpace/filter (observations.ts:564-613); no new question.
   * @evidence principles/core/source-units.md#source-substantive-completion All five views have an explicit comparison route.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f Five entries; an empty selection for any reference other than 02 throws (observations.ts:615-617).
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons requires separate selections for 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this list retains all five.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 04:129-133 give separate rows for 01-05; references has five entries in that order (observations.ts:571-614).
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
 * @evidenceReview spaces/06-openings.md #bad6451 environment.ts:430-455: centre = face.origin + rotate(profile vertex mean); normal = rotate({0,0,1}) (:453) is the face's local +Z in world axes (not outward; consumers routes.ts:182 and observations.ts:412 test both signs); reach = thickness/2+0.05 (:454). 06-openings.md:27 authors world-coordinate rough voids; 06:31 names the boundary local +Z frame. The old 'outward normal' error is fixed.
 * @evidence spaces/06-openings.md#external-opening-interface The reach includes half the host wall thickness plus 0.05 m for checking an exterior zone beyond the void.
 * @evidenceReview spaces/06-openings.md#external-opening-interface #457149c v-141 A holds: L430 reach = face.thickness/2 + 0.05. a15c1dd1 changed only the partition witness at L635 (0.05->0.001); this 0.05 is untouched. B: the 06-openings.md:27-37 body gives the inner->outer face passage but no reach, no 0.05 m and no exterior-zone probe, so the margin is the source's own. The half-thickness assumes the source's mid-plane origin (L655-657), while 06:31 says thickness runs along local +Z.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the existing opening profile and boundary face, without assigning a new door or window frame.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 v-141 L399-405 reads environment.openings, the boundary face and opening.profile and returns only centre/normal/reach. No door/window frame or fill is created.
 * @evidence principles/core/source-units.md#source-substantive-completion Missing opening, face, or profile throws; otherwise quaternion rotation and origin yield world coordinates.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f v-141 L403-405 throws when the opening, host face or profile is missing. L410-421 is the quaternion rotation (v + w*t + q x t) and L424-429 adds face.origin to the rotated profile centroid, giving world coords.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The external-opening-interface parent supplies the host wall and through-thickness void; this helper's bidirectional beyond-face probe adds no opening coordinate.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 06-openings.md:27 rough void passes through the wall from the inner to the outer face; 06:29 elevation owners own the host-wall voids. Helper adds no coordinate: centre from compiled profile/face (environment.ts:430-452). The +/-(t/2+0.05) reach is its own symmetric probe distance (:454); consumers test both signs (routes.ts:182, observations.ts:412). Old 'sided exterior test' attribution removed.
 */
export const openingAxis = (environment: IAutoMovieBuiltEnvironment, openingId: string): { centre: IAutoMovieVector3; normal: IAutoMovieVector3; reach: number } => {
  const opening = environment.openings.find((o) => o.id === openingId);
  const face = opening === undefined
    ? undefined
    : environment.boundaries.find((b) => b.id === opening.boundary)?.face;
  if (opening === undefined || face === undefined || opening.profile === undefined) throw new Error(
    `opening "${openingId}" has no host face or void`,
  );
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
