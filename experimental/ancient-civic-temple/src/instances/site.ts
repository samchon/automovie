/** Places the local setting outside the temple, retaining authored site surfaces. */
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
} from "@automovie/interface";
import { identityTransform } from "../geometry/model-parts";
import { TempleLandscape } from "../models/landscape";
import { templeSiteGrade } from "../spaces/site/extent";
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
