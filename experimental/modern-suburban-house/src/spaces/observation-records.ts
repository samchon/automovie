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
  * @evidenceReview spaces/04-observations.md `IReferenceComparison` keeps each of the five reference keys beside derived question ids and compiled record ids, preserving the design's separate comparison assignments.
 * @evidence spaces/04-observations.md#reference-spatial-comparisons Each comparison names the questions it uses.
  * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons Each returned comparison names its reference and the observations or records it reads; 02 uses storey and stair records with no own observation id.
 * @evidence principles/core/source-units.md#source-scope-preservation The comparison selects existing observations without authoring a second house.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation The type holds only identifiers for existing derived questions and house records; it creates no second room or imitation camera.
 * @evidence principles/core/source-units.md#source-substantive-completion Reference identity, station ids and record ids are explicit.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion Required `reference`, `observations`, and `records` fields make each comparison's source key and two input sets explicit to its consumer.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons enumerates 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this type carries those five addresses.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` assigns 01 to exterior, 02 to the cutaway, 03 to the common room, 04 to entry/living/stair, and 05 to upper hall; this type carries those five keyed selections.
 */
export interface IReferenceComparison {
  /**
   * @evidence spaces/04-observations.md Five source references drive the comparison map.
    * @evidenceReview spaces/04-observations.md The `reference` literal union confines each comparison to the five supplied images in their authored order.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The key identifies one of the five given reference views.
    * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons The five table rows 01 through 05 correspond exactly to this field's allowed keys, and the derivation returns one entry for each.
   * @evidence principles/core/source-units.md#source-scope-preservation The union does not introduce a sixth reference.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation The union contains only `01` through `05`; it cannot assign a sixth source image or change the production's reference set.
   * @evidence principles/core/source-units.md#source-substantive-completion Each comparison has a known reference identity.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion The key is required on every `IReferenceComparison`, so consumers can associate its observations and records with one known reference.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons fixes the 01–05 set; this union refuses a sixth reference key.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` contains exactly the five source references; this literal union preserves that set without adding another visual brief.
   */
  reference: "01" | "02" | "03" | "04" | "05";
  /**
   * @evidence spaces/04-observations.md Comparisons use the derived station census.
    * @evidenceReview spaces/04-observations.md References 01, 03, 04, and 05 select derived question ids here, while the inspection-mode cutaway 02 uses records with an empty observation-id list.
    * @evidence spaces/04-observations.md#reference-spatial-comparisons References with spatial questions list their accepted observation ids; the cutaway may use compiled records instead.
    * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons `ofSpace`, role filters, and checked `pick` return ids already in the derived census; 02 intentionally has none and names both storeys and the stair connector in `records`.
   * @evidence principles/core/source-units.md#source-scope-preservation These ids refer to accepted questions rather than cloned views.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation This string list refers to accepted observation questions; it does not duplicate their camera poses or construct a second view.
   * @evidence principles/core/source-units.md#source-substantive-completion The selector lists each observation it needs.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion `pick` now throws if a named required observation is absent; the other selectors reuse the current census, and only the cutaway's explicit record-only selection is empty.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` assigns extra comparison questions for 01–05; this field selects existing derived observation ids where they apply, while the 02 cutaway reads compiled records without an invented pose.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The reference table assigns each comparison to its space and counterexample; four selections list actual census ids and 02 uses storey/stair records, preserving the separate reference questions without replacing the observation denominator.
   */
  observations: string[];
  /**
   * @evidence spaces/04-observations.md The cutaway may compare compiled records directly.
    * @evidenceReview spaces/04-observations.md Reference 02 uses `ground-storey`, `upper-storey`, and `main-stair-connection` in `records` for its inspection-mode plan and cutaway; other references name their relevant house or room records.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons The cutaway can read storey records without inventing a camera pose.
    * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons The cutaway's `observations` list is empty while this field selects both storeys and their stair connector, avoiding an invented interior reference-camera pose.
   * @evidence principles/core/source-units.md#source-scope-preservation These names select existing records, not new geometry.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation The strings refer to assembled house, room, storage, storey, or connector records; this field does not duplicate their geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The comparison records non-camera inputs explicitly.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion This required list gives the comparison consumer explicit non-camera inputs, including the cutaway's storeys and stair connector.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons assigns 02 to a two-storey cutaway and allows it to read compiled storey records without inventing an interior camera.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `reference-spatial-comparisons` assigns 02 to two storeys and a stair cutaway in inspection mode; its records name those compiled inputs without fabricating a room camera.
   */
  records: string[];
}

/**
 * The derivation result.
 * @evidence spaces/04-observations.md It returns accepted questions, failed stations and reference selections.
  * @evidenceReview spaces/04-observations.md `IObservationDerivation` returns the accepted question list, a separate station-failure list, and five reference selections from one built house.
  * @evidence spaces/04-observations.md#engine-render-handoff Null, outside, or coincident stations remain failures instead of counting as successful observations.
  * @evidenceReview spaces/04-observations.md#engine-render-handoff `accept` adds a null, outside-space, or duplicate pose to `failures`; only accepted stations enter `observations`, while exterior building questions are appended without an own-space pose.
 * @evidence principles/core/source-units.md#source-scope-preservation The result is computed from the built house record.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation The result is produced by `deriveHouseObservations(environment, house)` from compiled space and house records, without a second house geometry source.
 * @evidence principles/core/source-units.md#source-substantive-completion Both the accepted census and rejected stations reach the caller.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion All three required arrays are returned, preserving accepted observations, diagnosed failures, and reference inputs for the caller.
  * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `spatial-observation-derivation` supplies the compiled question census, `engine-render-handoff` separates invalid station poses, and `reference-spatial-comparisons` assigns five comparisons; this type returns those three populations.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The derivation returns question, failure, and reference arrays from the same environment and house; the named parents supply census, failure handling, and comparison roles without an extra spatial decision.
 */
export interface IObservationDerivation {
  /**
   * @evidence spaces/04-observations.md The result exposes its observation census.
    * @evidenceReview spaces/04-observations.md `observations` carries the accepted station census together with building census and emitted roof-part questions for later spatial inspection.
   * @evidence spaces/04-observations.md#spatial-observation-derivation Accepted stations and building questions.
    * @evidenceReview spaces/04-observations.md#spatial-observation-derivation `accept` appends contained, distinct station poses, then the derivation adds exterior facade, roof, underside, corner, and entrance questions to this list.
   * @evidence principles/core/source-units.md#source-scope-preservation Entries derive from the compiled house rather than new source geometry.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation Entries derive from compiled stations, building census, roof parts, and house outlines; the array does not instantiate new geometry.
   * @evidence principles/core/source-units.md#source-substantive-completion The caller can inspect every accepted question.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion The required array exposes all accepted questions and their ids to reference selection and later inspection consumers.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Spatial-observation-derivation adds centre, corner, threshold, and building questions to the compiled station denominator; observations carries the accepted entries of that census.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `spatial-observation-derivation` requires room and exterior questions from the built record; this array carries accepted stations and appended building questions without fixing a view count.
   */
  observations: IHouseObservation[];
  /**
   * @evidence spaces/04-observations.md Failed stations remain audit data.
    * @evidenceReview spaces/04-observations.md `failures` keeps rejected station ids and causes separate from accepted questions so a null or repeated eye cannot inflate the inspection count.
    * @evidence spaces/04-observations.md#engine-render-handoff Invalid or coincident stations retain an id and cause outside the accepted census.
    * @evidenceReview spaces/04-observations.md#engine-render-handoff `accept` records no-pose, outside-space, and coincident causes in this list, following the handoff's rule against counting such stations as successful observations.
   * @evidence principles/core/source-units.md#source-scope-preservation Failed questions do not create substitute rooms or cameras.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation Each failure has only id and cause; inward corner and threshold fallbacks are attempted before `accept`, and a rejected pose creates no substitute room or camera.
   * @evidence principles/core/source-units.md#source-substantive-completion Every rejected station has a reason for review.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion Every pushed failure includes its station id and a concrete no-pose, outside-space, or coincident cause for review.
    * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work `engine-render-handoff` requires unresolved own-space stations to remain outside the successful census; this list records their id and cause after the inward fallbacks.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The derivation tries its corner and threshold fallbacks before `accept`; any remaining invalid pose gets an id/cause entry here instead of an invented successful camera or spatial boundary.
   */
  failures: { id: string; cause: string }[];
  /**
   * @evidence spaces/04-observations.md The result carries the comparison selectors.
    * @evidenceReview spaces/04-observations.md `references` returns the five comparison selections beside the shared observation census and station failures.
   * @evidence spaces/04-observations.md#reference-spatial-comparisons Five selections reference observations and records.
    * @evidenceReview spaces/04-observations.md#reference-spatial-comparisons The derivation constructs entries 01 through 05 with explicit observation-id and record-id arrays, including the record-only cutaway 02.
   * @evidence principles/core/source-units.md#source-scope-preservation Selectors reuse the derived census.
    * @evidenceReview principles/core/source-units.md#source-scope-preservation The selections use accepted observation ids through role filters, `ofSpace`, and checked `pick`; they do not create a new room or camera pose.
   * @evidence principles/core/source-units.md#source-substantive-completion All five views have an explicit comparison route.
    * @evidenceReview principles/core/source-units.md#source-substantive-completion Five ordered entries are returned, and the derivation rejects an empty observation selection for any reference except the deliberately record-only 02.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Reference-spatial-comparisons requires separate selections for 01 exterior, 02 cutaway, 03 common room, 04 entry/living, and 05 upper hall; this list retains all five.
    * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work The design's five reference rows assign exterior, cutaway, common, entry/living, and upper-hall comparisons; this array keeps all five ordered selections separate from the overall question list.
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
  * @evidenceReview spaces/06-openings.md `openingAxis` resolves an existing profile and host face, rotating its local centre and +Z normal into world coordinates so route and threshold consumers can test either side of the authored wall void.
  * @evidence spaces/06-openings.md#external-opening-interface The helper reads the host face origin, rotation and wall thickness to locate an opening through its assigned boundary.
  * @evidenceReview spaces/06-openings.md#external-opening-interface The profile vertex mean is rotated from the boundary's local frame and added to `face.origin`; its local +Z normal is rotated likewise, while a source-local half-thickness plus 0.05 m probe reaches beyond the face.
 * @evidence principles/core/source-units.md#source-scope-preservation It reads the existing opening profile and boundary face, without assigning a new door or window frame.
  * @evidenceReview principles/core/source-units.md#source-scope-preservation The function reads the compiled opening profile and its boundary face, returning centre, normal, and reach without constructing a door, window, or new opening coordinate.
 * @evidence principles/core/source-units.md#source-substantive-completion Missing opening, face, or profile throws; otherwise quaternion rotation and origin yield world coordinates.
  * @evidenceReview principles/core/source-units.md#source-substantive-completion Missing opening, host face, or profile throws; otherwise the quaternion rotation maps the profile mean and local +Z into world space and returns a symmetric probe distance.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work The external-opening-interface parent supplies the host wall and through-thickness void; this helper's bidirectional beyond-face probe adds no opening coordinate.
  * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work `external-opening-interface` assigns the through-wall rough void to its elevation owner; this helper computes centre and axis from that compiled profile and face, while route and threshold callers probe both signs without a new opening placement.
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
