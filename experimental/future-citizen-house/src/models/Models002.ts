import { cabinetBaseAndShelfStates } from "../common/model-data/cabinetBaseAndShelfStates";
import { cabinetTallStates } from "../common/model-data/cabinetTallStates";
import { cabinetVanityAndWallStates } from "../common/model-data/cabinetVanityAndWallStates";

/** Draft metre-coordinate records for this production; authored design records do not certify mesh realization. */
import { ModelRepresentation, type ModelPrototype } from "../common/model-geometry/representation";
import { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
const prototypes: ModelPrototype[] = [
  { "anchor": "cabinet-and-shelf", "name": "Cabinet enclosure and open bookcase", "states": [
    ...cabinetBaseAndShelfStates,
    ...cabinetTallStates,
    ...cabinetVanityAndWallStates,
  ] },
  { "anchor": "entry-bench", "name": "Entry bench and shoe storage", "states": [
    { "state": "default", "parts": [
      {"id":"cushion","shape":"box","x":[-0.575,0.575],"y":[0.44,0.52],"z":[-0.24,0.25]},
    ],
      "compose": {"anchor":"cabinet-and-shelf","state":"bench-base/1150x440x480/closed","offset":[0.0,0.0,0.0]},
      "envelope": {"x":[-0.575,0.575],"y":[0.0,0.52],"z":[-0.24,0.25]},
    },
  ] },
  { "anchor": "entry-charging-shelf", "name": "Entry charging shelf on a flat wall", "states": [
    { "state": "default", "parts": [
      {"id":"board","shape":"box","x":[-0.16,0.16],"y":[0.0,0.045],"z":[0.0,0.15]},
      {"id":"cleat","shape":"box","x":[-0.11,0.11],"y":[-0.03,0.0],"z":[0.0,0.025]},
      {"id":"bracket-left","shape":"box","x":[-0.131,-0.119],"y":[-0.08,0.0],"z":[0.0,0.12]},
      {"id":"bracket-right","shape":"box","x":[0.119,0.131],"y":[-0.08,0.0],"z":[0.0,0.12]},
    ],
      "envelope": {"x":[-0.16,0.16],"y":[-0.08,0.045],"z":[0.0,0.15]},
    },
  ] },
  { "anchor": "fixed-bed", "name": "Fixed bed and bedding", "states": [
    { "state": "1800", "parts": [
      {"id":"frame-side-left","shape":"box","x":[-0.94,-0.915],"y":[0.08,0.28],"z":[-1.03,1.03]},
      {"id":"frame-side-right","shape":"box","x":[0.915,0.94],"y":[0.08,0.28],"z":[-1.03,1.03]},
      {"id":"frame-head","shape":"box","x":[-0.94,0.94],"y":[0.08,0.28],"z":[-1.09,-1.03]},
      {"id":"frame-foot","shape":"box","x":[-0.94,0.94],"y":[0.08,0.28],"z":[1.03,1.09]},
      {"id":"support-deck","shape":"box","x":[-0.915,0.915],"y":[0.26,0.28],"z":[-1.03,1.03]},
      {"id":"leg-0","shape":"box","x":[-0.94,-0.895],"y":[0.0,0.08],"z":[-1.0525,-1.0075]},
      {"id":"leg-1","shape":"box","x":[-0.94,-0.895],"y":[0.0,0.08],"z":[1.0075,1.0525]},
      {"id":"leg-2","shape":"box","x":[0.895,0.94],"y":[0.0,0.08],"z":[-1.0525,-1.0075]},
      {"id":"leg-3","shape":"box","x":[0.895,0.94],"y":[0.0,0.08],"z":[1.0075,1.0525]},
      {"id":"mattress","shape":"box","x":[-0.9,0.9],"y":[0.28,0.5],"z":[-1.01,1.01]},
      {"id":"duvet","shape":"box","x":[-0.87,0.87],"y":[0.5,0.56],"z":[-0.4,1.02]},
      {"id":"headboard","shape":"box","x":[-0.94,0.94],"y":[0.28,1.01],"z":[-1.09,-1.03]},
      {"id":"pillow-0","shape":"box","x":[-0.83,-0.02],"y":[0.5,0.62],"z":[-0.95,-0.57]},
      {"id":"pillow-1","shape":"box","x":[0.02,0.83],"y":[0.5,0.62],"z":[-0.95,-0.57]},
    ],
      "envelope": {"x":[-0.94,0.94],"y":[0.0,1.01],"z":[-1.09,1.09]},
    },
    { "state": "1000", "parts": [
      {"id":"frame-side-left","shape":"box","x":[-0.54,-0.515],"y":[0.08,0.28],"z":[-1.03,1.03]},
      {"id":"frame-side-right","shape":"box","x":[0.515,0.54],"y":[0.08,0.28],"z":[-1.03,1.03]},
      {"id":"frame-head","shape":"box","x":[-0.54,0.54],"y":[0.08,0.28],"z":[-1.09,-1.03]},
      {"id":"frame-foot","shape":"box","x":[-0.54,0.54],"y":[0.08,0.28],"z":[1.03,1.09]},
      {"id":"support-deck","shape":"box","x":[-0.515,0.515],"y":[0.26,0.28],"z":[-1.03,1.03]},
      {"id":"leg-0","shape":"box","x":[-0.54,-0.495],"y":[0.0,0.08],"z":[-1.0525,-1.0075]},
      {"id":"leg-1","shape":"box","x":[-0.54,-0.495],"y":[0.0,0.08],"z":[1.0075,1.0525]},
      {"id":"leg-2","shape":"box","x":[0.495,0.54],"y":[0.0,0.08],"z":[-1.0525,-1.0075]},
      {"id":"leg-3","shape":"box","x":[0.495,0.54],"y":[0.0,0.08],"z":[1.0075,1.0525]},
      {"id":"mattress","shape":"box","x":[-0.5,0.5],"y":[0.28,0.5],"z":[-1.01,1.01]},
      {"id":"duvet","shape":"box","x":[-0.47,0.47],"y":[0.5,0.56],"z":[-0.4,1.02]},
      {"id":"headboard","shape":"box","x":[-0.54,0.54],"y":[0.28,1.01],"z":[-1.09,-1.03]},
      {"id":"pillow-0","shape":"box","x":[-0.41,0.41],"y":[0.5,0.62],"z":[-0.95,-0.57]},
    ],
      "envelope": {"x":[-0.54,0.54],"y":[0.0,1.01],"z":[-1.09,1.09]},
    },
  ] },
  { "anchor": "murphy-bed", "name": "Study foldaway bed", "states": [
    { "state": "work", "parts": [
      {"id":"case-back","shape":"box","x":[-0.65,0.65],"y":[0.0,2.32],"z":[-0.23,-0.205]},
      {"id":"case-side-left","shape":"hollow","x":[-0.65,-0.605],"y":[0.0,2.32],"z":[-0.205,0.23]},
      {"id":"case-side-right","shape":"hollow","x":[0.605,0.65],"y":[0.0,2.32],"z":[-0.205,0.23]},
      {"id":"case-top","shape":"box","x":[-0.65,0.65],"y":[2.32,2.36],"z":[-0.23,0.23]},
      {"id":"hinge-left","shape":"cylinder","x":[-0.65,-0.6],"y":[0.295,0.345],"z":[0.175,0.225]},
      {"id":"hinge-right","shape":"cylinder","x":[0.6,0.65],"y":[0.295,0.345],"z":[0.175,0.225]},
      {"id":"closed-panel","shape":"box","x":[-0.6,0.6],"y":[0.04,2.32],"z":[0.21,0.245]},
      {"id":"pull","shape":"box","x":[-0.16,0.16],"y":[1.0175,1.0425],"z":[0.245,0.27]},
    ],
      "bores": {"case-side-left":{"axis":"-x","args":["-0.65..-0.605","0.32","0.20","0.025"]},"case-side-right":{"axis":"-x","args":["0.605..0.65","0.32","0.20","0.025"]}},
      "envelope": {"x":[-0.65,0.65],"y":[0.0,2.36],"z":[-0.23,0.27]},
    },
    { "state": "guest", "parts": [
      {"id":"case-back","shape":"box","x":[-0.65,0.65],"y":[0.0,2.32],"z":[-0.23,-0.205]},
      {"id":"case-side-left","shape":"hollow","x":[-0.65,-0.605],"y":[0.0,2.32],"z":[-0.205,0.23]},
      {"id":"case-side-right","shape":"hollow","x":[0.605,0.65],"y":[0.0,2.32],"z":[-0.205,0.23]},
      {"id":"case-top","shape":"box","x":[-0.65,0.65],"y":[2.32,2.36],"z":[-0.23,0.23]},
      {"id":"hinge-left","shape":"cylinder","x":[-0.65,-0.6],"y":[0.295,0.345],"z":[0.175,0.225]},
      {"id":"hinge-right","shape":"cylinder","x":[0.6,0.65],"y":[0.295,0.345],"z":[0.175,0.225]},
      {"id":"bed-frame","shape":"box","x":[-0.6,0.6],"y":[0.32,0.44],"z":[0.22,2.18]},
      {"id":"mattress","shape":"box","x":[-0.55,0.55],"y":[0.44,0.6],"z":[0.27,2.09]},
      {"id":"support-left","shape":"box","x":[-0.5425,-0.4975],"y":[0.0,0.32],"z":[2.0575,2.1025]},
      {"id":"support-right","shape":"box","x":[0.4975,0.5425],"y":[0.0,0.32],"z":[2.0575,2.1025]},
      {"id":"duvet","shape":"box","x":[-0.54,0.54],"y":[0.6,0.655],"z":[0.72,2.02]},
      {"id":"pillow","shape":"curved","x":[-0.36,0.36],"y":[0.6,0.71],"z":[0.33,0.67]},
    ],
      "bores": {"case-side-left":{"axis":"-x","args":["-0.65..-0.605","0.32","0.20","0.025"]},"case-side-right":{"axis":"-x","args":["0.605..0.65","0.32","0.20","0.025"]}},
      "envelope": {"x":[-0.65,0.65],"y":[0.0,2.36],"z":[-0.23,2.18]},
    },
  ] },
];
/**
 * Own the ordered storage-and-sleep draft catalog discovered by model-source-audit through this file's Models002 export.
 *
 * Module initialization retains these mutable metre-coordinate records for the module lifetime. catalog exposes that shared data; build delegates each requested state to ModelRepresentation without a mesh cache or native resources. The catalog does not certify complete design faces, contacts or room placement.
 */
export class Models002 {
  /**
 * Return the retained ordered array in constant time without allocation. Readonly is a caller type view: the array and nested records are shared mutable identities, so external mutation affects later builds and catalog readers.
 */
static catalog(): readonly ModelPrototype[] { return prototypes; }
  /**
 * Find the first exact anchor by a linear catalog scan; absence throws this owner's unknown-model error. ModelRepresentation selects the state, invokes materialFor per part and propagates state, material or mesh failures; an effectful resolver may already have run when a later part fails.
 *
 * Each call pays the selected parts' complete geometry/material cost and returns fresh mesh arrays plus the resolver's original material objects. Catalog records stay shared; output array mutation belongs to the caller, while material identity and any resolver side effects remain the resolver's responsibility. No handles or background tasks are acquired.
 */
static build(anchor: string, state: string, materialFor: (anchor: string, state: string, part: string) => IAutoMovieMaterial): IAutoMovieModel {
    const prototype: ModelPrototype | undefined = prototypes.find((item: ModelPrototype): boolean => item.anchor === anchor);
    if (!prototype) throw new Error(`unknown model ${anchor} in Models002`);
    return ModelRepresentation.build(prototype, state, materialFor);
  }
}
