import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Clear glass of the porch and pendant fixtures. */
export const fixtureGlass = { material: houseMaterial("light-glass", "#F4F1E9", .06, { transmission: .78, ior: 1.5, thickness: .004, doubleSided: true }), faces: ["fixture-glass"], modelBindings: [{ model: "fitting:porch-sconce", faces: ["fixture-glass"] }] } satisfies HouseFinish;
