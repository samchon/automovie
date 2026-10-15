import type { HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** Translucent diffuser of the flush ceiling lights. */
export const fixtureDiffuser = { material: houseMaterial("light-diffuser", "#F4F1E9", .36, { transmission: .35, ior: 1.5, thickness: .012 }), faces: ["fixture-diffuser"], modelBindings: [{ model: "fitting:flush-", faces: ["fixture-diffuser"] }, { model: "fitting:pendant-", faces: ["fixture-diffuser"] }, { model: "fitting:vanity-light", faces: ["fixture-diffuser"] }] } satisfies HouseFinish;
