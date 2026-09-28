/** Bare hairline stainless steel on appliance, faucet and garage-door rail faces. */
import { houseMaterial, type HouseFinish } from "../finish";

export const stainlessSteel = {
  material: houseMaterial("stainless-steel", "#C0C2C4", 0.3, { metallic: 1 }),
  faces: [
    "rail",
    "rod",
    "appliance-body",
    "leaf",
    "drawer-front",
    "handle",
    "faucet",
    "basin",
    "post",
    "shelf",
    "tool-steel",
    "door-ring",
    "drum",
  ],
  modelBindings: [
    { model: "closet:", faces: ["rod", "rail"] },
    { model: "fitting:bedroom-sliding-closet", faces: ["rod", "rail"] },
    { model: "fitting:wardrobe-hanging", faces: ["rod"] },
    { model: "garage-door:garage-front-door", faces: ["rail"] },
    { model: "fitting:kitchen-island", faces: ["basin", "faucet"] },
    { model: "fitting:vanity-", faces: ["faucet"] },
    { model: "fitting:shower-booth", faces: ["rail", "faucet"] },
    { model: "fitting:bathtub", faces: ["faucet"] },
    { model: "fitting:toilet", faces: ["handle"] },
    { model: "fitting:towel-bar-", faces: ["rod", "bracket"] },
  ],
} satisfies HouseFinish;
