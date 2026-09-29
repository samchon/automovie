/** White glazed ceramic on fixed basins, shower tray and bathtub. */
import { houseMaterial, type HouseFinish } from "../finish";

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

/** Silver-backed plate; the live viewer realizes its authored planar reflection. */
export const mirrorSilver = {
  material:houseMaterial("mirror-silver","#EDEDED",.02,{metallic:1}),
  faces:["mirror"],
  modelBindings:[{model:"fitting:mirror-",faces:["mirror"]}],
} satisfies HouseFinish;
