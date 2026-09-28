/** Powder-coated black steel on rails, hardware, and slim interior frames. */
import { houseMaterial, type HouseFinish } from "../finish";

export const blackMetal = {
  material: houseMaterial("black-coated-metal", "#1F1F20", 0.4),
  faces: [
    "baluster",
    "bottom-rail",
    "handle",
    "hinge",
    "rod",
    "bracket",
    "mirror-frame",
    "towel-rail",
    "shower-handle",
    "curtain-rail",
    "hook",
  ],
  modelBindings: [
    { model: "stair-infill", faces: ["baluster", "bottom-rail"] },
    { model: "interior-door:", faces: ["handle", "hinge"] },
    { model: "exterior-door:front-door", faces: ["handle", "hinge"] },
    { model: "exterior-door:garden-door", faces: ["handle", "hinge"] },
    { model: "gate:side-yard-gate", faces: ["handle", "hinge"] },
    { model: "closet:", faces: ["handle"] },
    { model: "fitting:bedroom-sliding-closet", faces: ["handle"] },
    { model: "fitting:kitchen-", faces: ["handle"] },
    { model: "fitting:vanity-", faces: ["handle"] },
    { model: "fitting:shower-booth", faces: ["handle"] },
    { model: "fitting:flush-", faces: ["fixture-housing"] },
    { model: "fitting:pendant-", faces: ["fixture-canopy", "fixture-stem"] },
    { model: "fitting:vanity-light", faces: ["fixture-housing"] },
    { model: "fitting:porch-sconce", faces: ["fixture-housing", "fixture-stem"] },
    { model: "fitting:mirror-", faces: ["mirror-frame"] },
    { model: "fitting:tub-curtain-rail", faces: ["rod", "rail"] },
    { model: "fitting:mudroom-hooks", faces: ["hook"] },
  ],
} satisfies HouseFinish;
