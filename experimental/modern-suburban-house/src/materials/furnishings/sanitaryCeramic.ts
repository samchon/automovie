import { type HouseFinish } from "../HouseFinish";
import { houseMaterial } from "../houseMaterial";

/** White glazed ceramic on fixed basins, shower tray and bathtub. */
export const sanitaryCeramic = {
  material: houseMaterial("white-sanitary-ceramic", "#F5F5F2", 0.25),
  faces: ["ceramic", "shower-tray", "toilet-seat", "lid"],
  modelBindings: [
    { model: "fitting:vanity-", faces: ["ceramic"] },
    { model: "fitting:shower-booth", faces: ["shower-tray"] },
    { model: "fitting:bathtub", faces: ["ceramic"] },
    { model: "fitting:toilet", faces: ["ceramic", "toilet-seat", "lid"] },
  ],
} satisfies HouseFinish;

