/**
 * Derive the observation population in docs/spaces/observations.md#geometry-observations
 * from the current built environment. Engine stations cover four central directions,
 * four inside corners and opening thresholds; their eyes are raised 1.6 m above
 * actual supports. Add four central directions for each of six colonnade regions.
 * Exterior views cover the setting, exposed census facades and corners, roofs in
 * four directions, undersides and openings. Site views cover its layout, two
 * approaches, lane grade and distant ridge. Further views cover inside colonnade
 * corners, entrance corners, valleys, floating eaves, parapet junctions and corner
 * stone bands, exact vertical sections and five reference comparisons. Diagonal
 * valley sections unavailable on X/Z planes remain unverified without poses.
 * Unavailable or colliding stations and invalid former window thresholds remain
 * with null poses and reasons. These are observation locations, not visual verdicts.
 */
import { builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { exteriorObservations, openingFacingObservations } from "./perimeter-observations";
import { roofStepClosures } from "../geometry/roof-solids";
import { templeExteriorSettingView, templeObservationEye as eye } from "../geometry/observation-datum";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeThresholdTarget } from "../geometry/threshold-view";
import { templeRoofEnvelope, templeRoofRules } from "./roofs/assembly";
import { templeColonnadeRegions } from "./rooms/colonnade";
import { templeSiteIds } from "./site/assembly";

/**
 * Inspection view enabled with an observation: exact server-cut solids in an
 * orthographic vertical section, or a roof-off overhead view hiding roof and ceiling.
 * @evidence spaces/observations.md Types the roof-off and X/Z section inspection views enabled with an observation.
 * @evidence spaces/observations.md#viewer-path Delivers inspection mode, section position, projection and half-height to the viewer.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains view settings without rebuilding geometry.
 * @evidence principles/core/source-units.md#source-substantive-completion Five fields reproduce the view without client guesswork.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the viewer-path inspection and cutting rules.
 */
export interface TempleView {
  /**
   * @evidence spaces/observations.md Selects the roof-off overhead cutaway or an X/Z vertical section.
   * @evidence principles/core/source-units.md#source-scope-preservation Restricts cuts to three designed modes, excluding diagonal sections.
   * @evidence principles/core/source-units.md#source-substantive-completion The union excludes unknown modes and maps cut-x/cut-z directly to server axes.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the roof-off and X/Z methods in viewer-path.
   */
  section: "roof-off" | "cut-x" | "cut-z";
  /**
   * @evidence spaces/observations.md Gives the vertical cutting plane's world coordinate in meters.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains one position without adding thickness or range.
   * @evidence principles/core/source-units.md#source-substantive-completion A number places the plane used to cut current-source solids on the server.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the exact plane section rule in viewer-path.
   */
  offset: number;
  /**
   * @evidence spaces/observations.md Selects an orthographic view normal to the section plane.
   * @evidence principles/core/source-units.md#source-scope-preservation Only chooses between perspective and orthographic projection.
   * @evidence principles/core/source-units.md#source-substantive-completion A boolean enables the viewer's orthographic section camera.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents orthographic section reading in viewer-path.
   */
  ortho: boolean;
  /**
   * @evidence spaces/observations.md Gives the orthographic frame's half-height in meters.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only half-height; camera position comes from the observation pose.
   * @evidence principles/core/source-units.md#source-substantive-completion A numeric frame size reproduces the same section scale.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the viewer-path section frame rule.
   */
  span: number;
  /**
   * @evidence spaces/observations.md Chooses the greater-coordinate or lesser-coordinate side of the cutting plane.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the retained-side choice.
   * @evidence principles/core/source-units.md#source-substantive-completion A boolean controls which side the viewer's clipping plane retains.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents reading both section sides in viewer-path.
   */
  flip: boolean;
}

/**
 * @evidence spaces/observations.md Types an observation's ID, group, space, role, label, pose, view and note.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains observation locations and reasons without visual verdicts.
 * @evidence principles/core/source-units.md#source-substantive-completion Position and target are null for unavailable poses, with a note explaining why.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the geometry-observations item structure.
 */
export interface TempleObservation {
  /**
   * @evidence spaces/observations.md Stable ID incorporates the observation's group, space and role.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains an ID string without copying an input numbering scheme.
   * @evidence principles/core/source-units.md#source-substantive-completion Viewer selection and self-check reports refer to the same string ID.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents per-item identification in geometry-observations.
   */
  id: string;
  /**
   * @evidence spaces/observations.md Chooses among space, exterior, site, junction, section and reference groups.
   * @evidence principles/core/source-units.md#source-scope-preservation Excludes groups outside those six values.
   * @evidence principles/core/source-units.md#source-substantive-completion The string union lets the viewer divide lists by group.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the six geometry-observations groups.
   */
  group: "exterior" | "space" | "site" | "junction" | "section" | "reference";
  /**
   * @evidence spaces/observations.md Identifies an interior observation's space; exterior, section and reference views use null.
   * @evidence principles/core/source-units.md#source-scope-preservation Does not invent spaces for exterior or section observations.
   * @evidence principles/core/source-units.md#source-substantive-completion A nullable string supports the viewer's space filter.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents per-space stations in geometry-observations.
   */
  space: string | null;
  /**
   * @evidence spaces/observations.md Gives the observation role, such as threshold, corner, center or facade.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains a role name without a verdict.
   * @evidence principles/core/source-units.md#source-substantive-completion Carries engine station roles and the census facade role as strings.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents station roles in geometry-observations.
   */
  role: string;
  /**
   * @evidence spaces/observations.md Provides the English operating label.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the English label.
   * @evidence principles/core/source-units.md#source-substantive-completion The string displays the observation in the operating language.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents operating-language names in geometry-observations under the full-English instruction.
   */
  label: string;
  /**
   * @evidence spaces/observations.md Camera position is null when no pose is available.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the camera location, using null for unavailable poses.
   * @evidence principles/core/source-units.md#source-substantive-completion The viewer and buried-pose self-check use the same nullable vector.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents eye placement 1.6 m above the floor in geometry-observations.
   */
  position: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/observations.md Camera target is null when no pose is available.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the viewed point, using null for unavailable poses.
   * @evidence principles/core/source-units.md#source-substantive-completion The nullable vector defines the viewer camera direction.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents view direction in geometry-observations.
   */
  target: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/observations.md Explains missing poses, height adjustments or invalid stations.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains reasons without visual verdicts.
   * @evidence principles/core/source-units.md#source-substantive-completion A nullable string preserves unavailable, adjusted and invalid items with their reasons.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents preservation of unavailable items in geometry-observations.
   */
  note: string | null;
  /**
   * @evidence spaces/observations.md Optional inspection view enabled with this observation.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the observation's view, omitted when absent.
   * @evidence principles/core/source-units.md#source-substantive-completion The optional TempleView field enables inspection when the observation is selected.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents per-observation inspection views in viewer-path.
   */
  view?: TempleView;
}

/**
 * Space names in the English operating language.
 * @evidence spaces/observations.md Names the nine spaces and site used in observation labels.
 * @evidence principles/core/source-units.md#source-scope-preservation Names existing IDs without adding spaces.
 * @evidence principles/core/source-units.md#source-substantive-completion Observations and viewer share the same ID-to-name record.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Represents the observation UI names under the full-English instruction.
 */
export const templeSpaceNames: Record<string, string> = {
  entrance: "Entrance", courtyard: "Courtyard", colonnade: "Colonnade", sanctuary: "Sanctuary",
  offering: "Offering room", administration: "Administration", records: "Records", storage: "Storage",
  "service-yard": "Service yard", [templeSiteIds.space]: "Site",
};

const directionNames: Record<string, string> = {
  "center-x-minus": "Center→west", "center-x-plus": "Center→east",
  "center-z-minus": "Center→north", "center-z-plus": "Center→south",
  "corner-x-minus-z-minus": "Northwest corner", "corner-x-minus-z-plus": "Southwest corner",
  "corner-x-plus-z-minus": "Northeast corner", "corner-x-plus-z-plus": "Southeast corner",
};

/**
 * @evidence spaces/observations.md Derives all space, exterior, site, junction, section and reference observations from the current environment.
 * @evidence spaces/observations.md#geometry-observations Raises stations 1.6 m above floors; adds six colonnade regions, corners, census facades, roofs, undersides, openings, junctions, sections and five references; preserves unavailable and invalid poses with reasons.
 * @evidence principles/core/source-units.md#source-scope-preservation Reads the environment without creating geometry or copying observation counts.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns the observation list used by self-check to count buried poses.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the population rules and groups in geometry-observations.
 */
export const templeObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const result: TempleObservation[] = [];
  for (const space of environment.spaces.filter((s) => s.cells.length > 0)) {
    const name = templeSpaceNames[space.id] ?? space.id;
    for (const station of builtSpaceObservationStations(environment, space.id)) {
      const label = station.role === "threshold"
        ? `${name} · threshold(${station.opening ?? "?"})`
        : `${name} · ${directionNames[station.id] ?? station.id}`;
      if (station.pose === null) {
        result.push({ id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role,
          label, position: null, target: null, note: "Engine station returned no pose inside the space (unverified)" });
        continue;
      }
      const floor = supportHeight(environment, space.id, station.pose.position);
      const raised = floor === null ? station.pose.position : { ...station.pose.position, y: floor + eye };
      const lift = raised.y - station.pose.position.y;
      const door = station.role === "threshold" ? templeDoorPassages.find((entry) => entry.id === station.opening) : undefined;
      result.push({
        id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role, label,
        position: raised,
        target: door === undefined ? { ...station.pose.target, y: station.role === "corner" ? station.pose.target.y + lift : raised.y }
          : templeThresholdTarget(door, raised),
        note: station.role === "threshold" && station.opening?.startsWith("window-")
          ? "The engine threshold faces the interior arrival direction; use the same ID's opening-facing observation to inspect the window"
          : floor === null ? "No support: retain engine height (eye height unverified)"
          : Math.abs(lift) > 1e-6 ? `engine y=${station.pose.position.y.toFixed(3)} → floor+1.6m` : null,
      });
    }
  }
  // Former offering/sanctuary and sanctuary/colonnade window bindings produced invalid
  // thresholds that could not see the windows. Windows now use upper exterior-facing
  // boundaries. Retain these questions with null poses; exterior.opening and section.clerestory inspect them.
  for (const [space, window] of [
    ["offering", "window-sanctuary-west-north"], ["offering", "window-sanctuary-west-south"],
    ["colonnade", "window-sanctuary-south-west"], ["colonnade", "window-sanctuary-south-east"],
  ] as const) {
    result.push({
      id: `${space}.threshold-${window}`, group: "space", space, role: "threshold",
      label: `${templeSpaceNames[space]} · threshold(${window}) invalid`, position: null, target: null,
      note: "Invalid threshold: the window opens outside above this room's roof and is invisible from inside (unverified)",
    });
  }
  for (const region of templeColonnadeRegions) {
    const center = { x: (region.west + region.east) / 2, y: eye, z: (region.north + region.south) / 2 };
    for (const [id, dx, dz, text] of [
      ["x-minus", -1, 0, "west"], ["x-plus", 1, 0, "east"], ["z-minus", 0, -1, "north"], ["z-plus", 0, 1, "south"],
    ] as const) {
      result.push({
        id: `colonnade.region-${region.id}.${id}`, group: "space", space: "colonnade", role: "region-center",
        label: `Colonnade region ${region.id} · center→${text}`, position: center,
        target: { x: center.x + dx * 6, y: eye, z: center.z + dz * 6 }, note: null,
      });
    }
  }
  result.push(...colonnadeCornerObservations(), ...junctionObservations(), ...sectionObservations(), ...referenceObservations());
  result.push(...exteriorObservations(environment), ...openingFacingObservations(environment), ...siteObservations(environment));
  return result;
};

/**
 * Additional colonnade corners from geometry-observations. The four engine corners
 * lie near the bounding box, so add four courtyard inside corners and two outer
 * entrance-body corners, viewed from 1.05 m inside the colonnade region.
 */
const colonnadeCornerObservations = (): TempleObservation[] => {
  const inner: Array<[string, number, number, number, number, string]> = [
    ["inner-northwest", p.westCourt, p.courtBack, -1, -1, "Courtyard northwest inside corner"],
    ["inner-northeast", p.eastCourt, p.courtBack, 1, -1, "Courtyard northeast inside corner"],
    ["inner-southwest", p.westCourt, p.courtFront, -1, 1, "Courtyard southwest inside corner"],
    ["inner-southeast", p.eastCourt, p.courtFront, 1, 1, "Courtyard southeast inside corner"],
    ["entrance-body-west", p.westPorchOuter, p.entranceBack, -1, -1, "Entrance body west corner"],
    ["entrance-body-east", p.eastPorchOuter, p.entranceBack, 1, -1, "Entrance body east corner"],
  ];
  return inner.map(([id, x, z, dx, dz, label]) => ({
    id: `colonnade.corner-${id}`, group: "space", space: "colonnade", role: "corner", label: `Colonnade · ${label}`,
    position: { x: x + dx * 1.05, y: eye, z: z + dz * 1.05 }, target: { x, y: 1.0, z }, note: null,
  }));
};

/**
 * Junction views cover four valleys, gaps under sanctuary eaves, their passage
 * above the offering parapet, roof/parapet meetings, the east gable's south end
 * below coping and four corner coping/plinth joints. sectionObservations handles
 * vertical sections; diagonal valley sections remain unverified with null poses.
 * The exhaustive envelope scan in self-check measures volumetric overlaps.
 */
const junctionObservations = (): TempleObservation[] => {
  const pose = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: id.split(".")[0]!, label, position, target, note: null,
  });
  const section = (id: string, label: string): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: "section", label, position: null, target: null,
    note: "No diagonal section tool: the envelope scan measures volumetric overlaps only; full-length valley section reading remains unverified",
  });
  return [
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      pose(`valley.${id}`, `Roof valley · ${id}`, { x: sx * 1.2, y: 6.2, z: sz > 0 ? 3.6 : 0.8 },
        { x: sx * p.eastCourt, y: 3.4, z: sz > 0 ? p.courtFront : p.courtBack })),
    pose("eave.sanctuary-west", "Gap beneath sanctuary west eave", { x: -8.4, y: 4.9, z: -7.0 }, { x: -6.0, y: 4.8, z: -7.0 }),
    pose("eave.sanctuary-east", "Sanctuary east eave and yard", { x: 8.2, y: 2.2, z: -6.0 }, { x: 6.0, y: 4.6, z: -6.0 }),
    pose("eave.sanctuary-south", "Gap beneath sanctuary south eave", { x: -2.0, y: 4.6, z: -1.2 }, { x: -2.0, y: 4.9, z: -3.9 }),
    pose("eave.sanctuary-northwest-parapet", "Sanctuary west eave above offering-room parapet", { x: -6.1, y: 5.0, z: -13.2 }, { x: -6.1, y: 4.9, z: -10.25 }),
    pose("parapet.west", "West parapet and shed roof", { x: -7.6, y: 5.4, z: 0 }, { x: p.westInner, y: 4.6, z: 0 }),
    pose("parapet.north-offering", "Offering-room north parapet and shed roof", { x: -8.0, y: 5.4, z: -7.6 }, { x: -8.0, y: 4.6, z: p.northInner }),
    pose("parapet.south", "South parapet and colonnade shed roof", { x: -4.0, y: 5.4, z: 7.6 }, { x: -4.0, y: 4.2, z: p.southInner }),
    pose("parapet.east-gable-ridge", "East gable south ridge and south coping", { x: 7.36, y: 5.6, z: 6.6 }, { x: 7.36, y: 4.6, z: p.southInner }),
    ...([["northwest", p.westOuter, p.northOuter], ["northeast", p.eastOuter, p.northOuter],
      ["southwest", p.westOuter, p.southOuter], ["southeast", p.eastOuter, p.southOuter]] as const).map(([id, x, z]) =>
      pose(`trim.${id}`, `Outer corner coping/plinth · ${id}`, { x: x + Math.sign(x) * 3.2, y: 2.4, z: z + Math.sign(z) * 3.2 }, { x, y: eye, z })),
    section("section.valleys", "Both sides along each full roof valley (the four diagonal valleys cannot be followed by X/Z vertical cuts)"),
  ];
};

/**
 * Vertical section questions from geometry-observations, using exact orthographic
 * cuts: longitudinal/transverse sections through doors and ridges, door thresholds,
 * gable ends, clerestories, wing roof steps, eave projections, outer corners and T
 * junctions, wall bases on four facades, and parallel entrance sections.
 */
const sectionObservations = (): TempleObservation[] => {
  const cut = (id: string, label: string, axis: "x" | "z", offset: number, at: { u: number; y: number }, span: number): TempleObservation => {
    const target = axis === "x" ? { x: offset, y: at.y, z: at.u } : { x: at.u, y: at.y, z: offset };
    return {
      id: `section.${id}`, group: "section", space: null, role: "section", label: `Section · ${label}`,
      // Derive the orthographic camera from target; perspective starts outside, 40 m along the plane normal.
      position: axis === "x" ? { ...target, x: offset + 40 } : { ...target, z: offset + 40 }, target, note: null,
      view: { section: axis === "x" ? "cut-x" : "cut-z", offset, ortho: true, span, flip: false },
    };
  };
  const mid = (a: number, b: number) => (a + b) / 2;
  const doors = templeDoorPassages.map((door) => cut(
    `threshold.${door.id}`, `${door.id} longitudinal threshold section`, door.axis === "x" ? "x" : "z", door.center,
    { u: mid(door.wallLow, door.wallHigh), y: 1.2 }, 1.8,
  ));
  const steps = roofStepClosures(templeRoofEnvelope()).map((face, i) => {
    const xs = face.corners.map((c) => c.x);
    const zs = face.corners.map((c) => c.z);
    const ys = face.corners.map((c) => c.y);
    const alongX = Math.max(...xs) - Math.min(...xs) > Math.max(...zs) - Math.min(...zs);
    const cx = mid(Math.min(...xs), Math.max(...xs));
    const cz = mid(Math.min(...zs), Math.max(...zs));
    return cut(`roof-step.${i}`, `Wing roof step end ${i}`, alongX ? "x" : "z", alongX ? cx : cz,
      { u: alongX ? cz : cx, y: mid(Math.min(...ys), Math.max(...ys)) }, 1.2);
  });
  const eave = templeRoofRules.courtEave;
  return [
    cut("longitudinal-axis", "Longitudinal X=0 (entry, entrance, courtyard, sanctuary door/ridge, porch)", "x", 0, { u: 0, y: 3.2 }, 7),
    cut("transverse-sanctuary", "Transverse Z=-6.9 (sanctuary ridge, both spines, offering roof, yard)", "z", -6.9, { u: 0, y: 3.5 }, 7),
    cut("transverse-east-wing", "Transverse Z=3.7 (east gable/eave, colonnade, courtyard, west wing)", "z", 3.7, { u: 0, y: 3 }, 7),
    cut("longitudinal-east-ridge", "Longitudinal X=7.36 (east ridge, yard end, end below south coping)", "x", 7.36, { u: 3.5, y: 3.5 }, 6),
    ...doors,
    cut("gable.sanctuary-north", "Below sanctuary north gable end", "z", p.northInner + 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.sanctuary-south", "Below sanctuary south gable end", "z", p.sanctuaryFront - 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.east-north", "Below east gable yard end", "z", p.yardFront + 0.2, { u: 7.36, y: 3.5 }, 2.5),
    cut("gable.east-south", "Below east gable south parapet end", "z", p.southInner - 0.2, { u: 7.36, y: 4 }, 2.5),
    cut("gable.porch-front", "Porch gable front (triangular closure)", "z", p.southOuter - 0.1, { u: 0, y: 4 }, 2),
    cut("gable.porch-back", "Porch gable back (above recessed wall)", "z", p.entranceBack + 0.15, { u: 0, y: 3.8 }, 2),
    ...[-1, 1].flatMap((x) => [
      cut(`clerestory.north-${x < 0 ? "west" : "east"}`, `North gable clerestory X=${x}`, "x", x, { u: mid(p.northOuter, p.northInner), y: 4.8 }, 1.5),
      cut(`clerestory.south-${x < 0 ? "west" : "east"}`, `South gable clerestory X=${x}`, "x", x, { u: mid(p.sanctuaryFront, p.northRing), y: 4.8 }, 1.5),
    ]),
    ...[-8, -5.8].flatMap((z) => [
      cut(`clerestory.west-${z < -7 ? "north" : "south"}`, `West spine clerestory Z=${z}`, "z", z, { u: mid(p.westRoom, p.westRing), y: 4.2 }, 1.5),
      cut(`clerestory.east-${z < -7 ? "north" : "south"}`, `East spine clerestory Z=${z}`, "z", z, { u: mid(p.eastRing, p.eastRoom), y: 4.2 }, 1.5),
    ]),
    ...steps,
    cut("eave.court-north", "Courtyard north eave projection", "x", 0, { u: p.courtBack, y: eave }, 1.2),
    cut("eave.court-south", "Courtyard south eave projection", "x", 0, { u: p.courtFront, y: eave }, 1.2),
    cut("eave.court-west", "Courtyard west eave projection", "z", 2.2, { u: p.westCourt, y: eave }, 1.2),
    cut("eave.court-east", "Courtyard east eave projection", "z", 2.2, { u: p.eastCourt, y: eave }, 1.2),
    cut("eave.east-wall", "East outer wall eave projection", "z", 3.7, { u: p.eastOuter, y: 3.4 }, 1.2),
    cut("eave.east-gable-yard", "East gable yard-end projection", "x", 8, { u: p.yardFront, y: 3.6 }, 1.2),
    cut("eave.north-canopy-yard", "North colonnade roof yard-end projection", "z", -2.6, { u: p.eastRoom, y: 3.5 }, 1.2),
    cut("eave.sanctuary-north", "Sanctuary north-end projection", "x", 0, { u: p.northOuter, y: 7.2 }, 1.2),
    cut("eave.sanctuary-south", "Sanctuary south-end projection", "x", 0, { u: p.northRing, y: 7.2 }, 1.2),
    cut("eave.sanctuary-west", "Sanctuary west eave projection", "z", -6.9, { u: p.westRoom, y: 5 }, 1.2),
    cut("eave.sanctuary-east", "Sanctuary east eave projection", "z", -6.9, { u: p.eastRoom, y: 5 }, 1.2),
    cut("eave.porch-front", "Porch front-end projection", "x", 0, { u: p.southOuter, y: 4.4 }, 1.2),
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      cut(`corner.${id}`, `Outer corner L junction ${id}`, "x", sx * 10.2, { u: sz * 10.0, y: eye }, 2)),
    ...([[-1, "west"], [1, "east"]] as const).flatMap(([sx, side]) => [
      cut(`tee.${side}-spine-north`, `${side} spine / north outer wall T junction`, "x", sx * 5.75, { u: p.northInner, y: 2 }, 2),
      cut(`tee.${side}-spine-south`, `${side} spine / south outer wall T junction`, "x", sx * 5.75, { u: p.southInner, y: 2 }, 2),
      cut(`tee.sanctuary-south-${side}`, `Sanctuary south wall / ${side} spine T junction`, "z", mid(p.sanctuaryFront, p.northRing), { u: sx * 5.75, y: 2 }, 2),
    ]),
    ...([["yard-storage", mid(p.yardFront, p.storageBack)], ["storage-records", mid(p.storageFront, p.recordsBack)],
      ["records-office", mid(p.recordsFront, p.officeBack)]] as const).flatMap(([id, z]) => [
      cut(`tee.${id}-east-wall`, `${id} cross wall / east outer wall T junction`, "z", z, { u: p.eastInner, y: 1.8 }, 2),
      cut(`tee.${id}-east-spine`, `${id} cross wall / east spine T junction`, "z", z, { u: p.eastRoom, y: 1.8 }, 2),
    ]),
    cut("tee.entry-back-returns", "Entrance recessed wall and two return walls", "z", mid(p.entranceBack, p.entranceFront), { u: 0, y: 2 }, 2.5),
    cut("wall-bottom.west", "West outer wall base and ground", "z", 0, { u: p.westOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.east", "East outer wall base and ground", "z", 0, { u: p.eastOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.north", "North outer wall base and ground", "x", 0, { u: p.northOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.south", "South outer wall base and ground", "x", -6, { u: p.southOuter, y: 0.1 }, 1.2),
    ...[-1.35, -0.9, 0.9, 1.35].map((x) => cut(`entrance.x${x}`, `Parallel entrance section X=${x} (${Math.abs(x) > 1 ? "column base" : "step end"})`,
      "x", x, { u: mid(p.entranceFront, p.southOuter), y: 0.8 }, 1.5)),
  ];
};

/**
 * Five reference comparison questions use poses near each image's composition
 * to ask whether this reads as the same building or room. Reference 02 hides roof
 * and ceiling for an inspection cutaway, not a delivery frame. Verdicts are separate.
 */
const referenceObservations = (): TempleObservation[] => {
  const ref = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3, view?: TempleView): TempleObservation => ({
    id: `reference.${id}`, group: "reference", space: null, role: "reference", label: `Reference comparison · ${label}`,
    position, target, note: "Visual question: does this read as the same building or room? Unverified until judged", ...(view === undefined ? {} : { view }),
  });
  return [
    ref("01-exterior", "01 Exterior (front-left overhead)", templeExteriorSettingView.position, templeExteriorSettingView.target),
    ref("02-section-axonometric", "02 Overhead cutaway (roof and ceiling hidden)", { x: -17, y: 24, z: 24 }, { x: 0, y: 0, z: 0 },
      { section: "roof-off", offset: 0, ortho: false, span: 4, flip: false }),
    ref("03-courtyard-fountain", "03 Courtyard and fountain (northward beside a south colonnade column)", { x: -0.35, y: 1.8, z: 7.8 }, { x: 0, y: 0.6, z: -1.0 }),
    ref("04-worship-hall", "04 Sanctuary (from the north toward its door)", { x: 0, y: eye, z: -9.2 }, { x: 0, y: 1.4, z: -2.0 }),
    ref("05-records-service-wing", "05 Work wing (northward from the east colonnade's south end, three room doors on the right)", { x: 4.3, y: eye, z: 8.6 }, { x: 5.2, y: 1.4, z: 1.0 }),
  ];
};

/**
 * Site observations inspect the layout, curb ring and placement zones from above;
 * curb gaps and contact heights on two approaches; grade in the west lane; and
 * the low distant ridge behind the temple from the front street. Eyes stand 1.6 m above supports.
 */
const siteObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const standing = (x: number, z: number): IAutoMovieVector3 => {
    const floor = supportHeight(environment, templeSiteIds.space, { x, y: 0, z });
    if (floor === null) throw new Error(`temple/observations: no support at site observation (${x}, ${z}).`);
    return { x, y: floor + eye, z };
  };
  const entries: [string, string, IAutoMovieVector3, IAutoMovieVector3][] = [
    ["site.aerial", "Site · layout from above", { x: 0, y: 62, z: 16 }, { x: 0, y: 0, z: 1 }],
    ["site.approach-entry", "Site · entry paving and curb gap", standing(4.5, 17.5), { x: 0, y: 0, z: 11.5 }],
    ["site.approach-service", "Site · service door from east lane", standing(13.3, 0.5), { x: 10.5, y: 1.0, z: -6.4 }],
    ["site.lane-west", "Site · west lane grade", standing(-13.3, 12.5), { x: -12.5, y: 0.6, z: -12 }],
    ["site.ridge-front", "Site · distant ridge from west front street", standing(-26, 18), { x: -4, y: 4, z: -80 }],
  ];
  return entries.map(([id, label, position, target]) => ({
    id, group: "site", space: templeSiteIds.space, role: id.split(".")[1]!, label, position, target, note: null,
  }));
};

/** Height of the highest horizontal support containing the point in this space. */
const supportHeight = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3,
): number | null => {
  const heights = environment.surfaces.filter((entry) => entry.space === space).flatMap((entry) => {
    const surface = entry.surface;
    const inside = (ring: readonly IAutoMovieVector3[]) => ring.reduce((odd, a, i) => {
      const b = ring[(i + 1) % ring.length]!;
      return (a.z > at.z) !== (b.z > at.z) && at.x < (b.x - a.x) * (at.z - a.z) / (b.z - a.z) + a.x ? !odd : odd;
    }, false);
    if (!inside(surface.polygon) || (surface.holes ?? []).some(inside)) return [];
    const rule = surface.height;
    if (rule?.kind === "constant") return [rule.value];
    if (rule?.kind === "plane") return [rule.originHeight + rule.slopeX * at.x + rule.slopeZ * at.z];
    return [];
  });
  return heights.length === 0 ? null : Math.max(...heights);
};
