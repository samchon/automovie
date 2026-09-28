/** Places the local setting outside the temple, retaining authored site surfaces. */
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
} from "@automovie/interface";
import { identityTransform } from "../geometry/model-parts";
import { TempleLandscape } from "../models/landscape";
import { templeSiteGrade } from "../spaces/site/extent";

/**
 * @evidence instances/site.md Neighbor envelopes, trees and wall-foot grass receive fixed role IDs, grounded transforms and no individual scale changes.
 * @evidence instances/site.md#neighbors Two gable shells and one shed shell stand across the east, west and north lanes with their fronts facing the temple.
 * @evidence instances/site.md#trees Narrow and broad crowns stand outside the building footprint, access paths and exterior inspection viewpoints.
 * @evidence instances/site.md#grass Six small tufts touch the wall-foot soil outside both access clearances.
 * @evidence principles/core/source-units.md#source-scope-preservation This assembly changes membership and transforms only; the site grade and each local landscape prototype remain parent-owned.
 * @evidence principles/core/source-units.md#source-substantive-completion Every placement uses the site grade at its root and a stable role ID; returned models are deduplicated by prototype identity.
 * @evidenceExclude upstream/design/instance-sources.md#design-revision-from-instance-source-work The three site instance H2s determine every role, coordinate, prototype and rotation used here.
 * @evidence obligations/design/instance-sources.md#instance-source-design-ownership The assembly consumes only the neighborhood, tree and grass decisions in instances/site.md.
 * @evidence obligations/design/instance-sources.md#instance-source-stable-membership The fixed row order and role IDs yield the same member set for equal source inputs.
 * @evidence obligations/design/instance-sources.md#instance-source-invalid-placement The finite source rows select existing concrete models, use a finite grade and retain unit scale; unsupported input rows are not accepted by this closed assembly.
 */
export const addTempleSiteInstances = (environment: IAutoMovieBuiltEnvironment): IAutoMovieBuiltEnvironment => {
  const landscape = new TempleLandscape();
  const gable = landscape.neighborHouse("gable");
  const shed = landscape.neighborHouse("shed");
  const cypress = landscape.cypress();
  const broad = landscape.broadTree();
  const grass = landscape.grassTuft();
  const rows: readonly [string, IAutoMovieModel, number, number, number][] = [
    ["neighbor.east", gable, 23, -8, -Math.PI / 2],
    ["neighbor.west", gable, -24, -7, Math.PI / 2],
    ["neighbor.north", shed, 8, -26, 0],
    ["tree.cypress.west", cypress, -18, -18, 0],
    ["tree.cypress.east", cypress, 18, -20, 0],
    ["tree.broad.west", broad, -27, 9, 0],
    ["tree.broad.east", broad, 27, 9, 0],
    ["grass.west.back", grass, -10.8, -8, 0],
    ["grass.west.front", grass, -10.8, 7, 0],
    ["grass.east.front", grass, 10.8, 5, 0],
    ["grass.north.west", grass, -8, -10.55, 0],
    ["grass.north.east", grass, 8, -10.55, 0],
    ["grass.south.west", grass, -8, 10.55, 0],
  ];
  return {
    ...environment,
    models: [...environment.models, gable, shed, cypress, broad, grass],
    elements: [...environment.elements, ...rows.map(([role, model, x, z, angle]) => ({
      id: `element.site.${role}`, kind: "fixture" as const, parent: "site.root",
      model: model.id, space: "temple-site",
      transform: {
        ...identityTransform(), translation: { x, y: templeSiteGrade(z), z },
        rotation: { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) },
      },
    }))],
  };
};
