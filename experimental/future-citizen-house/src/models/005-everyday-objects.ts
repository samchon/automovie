/** Static coordinates copied from reviewed docs/models/005-everyday-objects.md @part and @inventory. */
import { ModelRepresentation, ModelPrototype } from "./representation";
import { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
const prototypes: ModelPrototype[] = [
  { "anchor": "household-textiles", "name": "직물과 출입 매트", "states": [
    { "state": "sofa-cushion", "parts": [
      {"id":"body","shape":"curved","x":[-0.24,0.24],"y":[0.0,0.16],"z":[-0.21,0.21]},
    ],
      "envelope": {"x":[-0.24,0.24],"y":[0.0,0.16],"z":[-0.21,0.21]},
    },
    { "state": "pillow", "parts": [
      {"id":"body","shape":"curved","x":[-0.34,0.34],"y":[0.0,0.14],"z":[-0.215,0.215]},
    ],
      "envelope": {"x":[-0.34,0.34],"y":[0.0,0.14],"z":[-0.215,0.215]},
    },
    { "state": "blanket", "parts": [
      {"id":"body","shape":"curved","x":[-0.7,0.7],"y":[0.0,0.045],"z":[-0.9,0.9]},
    ],
      "envelope": {"x":[-0.7,0.7],"y":[0.0,0.045],"z":[-0.9,0.9]},
    },
    { "state": "bedding-set", "parts": [
      {"id":"body","shape":"curved","x":[-0.275,0.275],"y":[0.0,0.16],"z":[-0.21,0.21]},
    ],
      "envelope": {"x":[-0.275,0.275],"y":[0.0,0.16],"z":[-0.21,0.21]},
    },
    { "state": "folded-sheet", "parts": [
      {"id":"body","shape":"curved","x":[-0.21,0.21],"y":[0.0,0.09],"z":[-0.165,0.165]},
    ],
      "envelope": {"x":[-0.21,0.21],"y":[0.0,0.09],"z":[-0.165,0.165]},
    },
    { "state": "placemat", "parts": [
      {"id":"body","shape":"box","x":[-0.22,0.22],"y":[0.0,0.006],"z":[-0.155,0.155]},
    ],
      "envelope": {"x":[-0.22,0.22],"y":[0.0,0.006],"z":[-0.155,0.155]},
    },
    { "state": "dishcloth", "parts": [
      {"id":"body","shape":"curved","x":[-0.17,0.17],"y":[0.0,0.018],"z":[-0.14,0.14]},
    ],
      "envelope": {"x":[-0.17,0.17],"y":[0.0,0.018],"z":[-0.14,0.14]},
    },
    { "state": "bath-mat", "parts": [
      {"id":"body","shape":"box","x":[-0.375,0.375],"y":[0.0,0.012],"z":[-0.24,0.24]},
    ],
      "envelope": {"x":[-0.375,0.375],"y":[0.0,0.012],"z":[-0.24,0.24]},
    },
    { "state": "entry-mat", "parts": [
      {"id":"body","shape":"box","x":[-0.45,0.45],"y":[0.0,0.014],"z":[-0.275,0.275]},
    ],
      "envelope": {"x":[-0.45,0.45],"y":[0.0,0.014],"z":[-0.275,0.275]},
    },
    { "state": "outdoor-mat", "parts": [
      {"id":"body","shape":"box","x":[-0.45,0.45],"y":[0.0,0.014],"z":[-0.275,0.275]},
    ],
      "envelope": {"x":[-0.45,0.45],"y":[0.0,0.014],"z":[-0.275,0.275]},
    },
  ] },
  { "anchor": "kitchen-extractor", "name": "주방 상부장 부착 배기 후드", "states": [
    { "state": "default", "parts": [
      {"id":"body","shape":"box","x":[-0.32,0.32],"y":[-0.09,0.0],"z":[-0.24,0.24]},
      {"id":"filter-left","shape":"box","x":[-0.27,-0.01],"y":[-0.097,-0.09],"z":[-0.18,0.18]},
      {"id":"filter-right","shape":"box","x":[0.01,0.27],"y":[-0.097,-0.09],"z":[-0.18,0.18]},
    ],
      "envelope": {"x":[-0.32,0.32],"y":[-0.097,0.0],"z":[-0.24,0.24]},
    },
  ] },
  { "anchor": "personal-articles", "name": "신발·의복·우산", "states": [
    { "state": "shoe", "parts": [
      {"id":"body","shape":"curved","x":[-0.055,0.055],"y":[0.0,0.13],"z":[-0.145,0.145]},
    ],
      "envelope": {"x":[-0.055,0.055],"y":[0.0,0.13],"z":[-0.145,0.145]},
    },
    { "state": "coat", "parts": [
      {"id":"body","shape":"hollow","x":[-0.31,0.31],"y":[-1.12,0.0],"z":[-0.075,0.075]},
    ],
      "bores": {"body":{"axis":"-z","args":["0","-0.07","0.025","-0.075..-0.05"]}},
      "envelope": {"x":[-0.31,0.31],"y":[-1.12,0.0],"z":[-0.075,0.075]},
    },
    { "state": "garment", "parts": [
      {"id":"body","shape":"hollow","x":[-0.24,0.24],"y":[-0.72,0.0],"z":[-0.055,0.055]},
    ],
      "bores": {"body":{"axis":"-z","args":["0","-0.045","0.0125","-0.055..0.055"]}},
      "envelope": {"x":[-0.24,0.24],"y":[-0.72,0.0],"z":[-0.055,0.055]},
    },
    { "state": "hanger", "parts": [
      {"id":"body","shape":"curved","x":[-0.21,0.21],"y":[-0.2,0.0],"z":[-0.0175,0.0175]},
    ],
      "envelope": {"x":[-0.21,0.21],"y":[-0.2,0.0],"z":[-0.0175,0.0175]},
    },
    { "state": "umbrella", "parts": [
      {"id":"body","shape":"curved","x":[-0.045,0.045],"y":[0.0,0.88],"z":[-0.045,0.045]},
    ],
      "envelope": {"x":[-0.045,0.045],"y":[0.0,0.88],"z":[-0.045,0.045]},
    },
    { "state": "umbrella-stand", "parts": [
      {"id":"body","shape":"hollow","x":[-0.13,0.13],"y":[0.0,0.55],"z":[-0.13,0.13]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.115","0.031..0.55"]}},
      "envelope": {"x":[-0.13,0.13],"y":[0.0,0.55],"z":[-0.13,0.13]},
    },
  ] },
  { "anchor": "dining-wares", "name": "식탁 식기와 용기", "states": [
    { "state": "plate", "parts": [
      {"id":"body","shape":"hollow","x":[-0.135,0.135],"y":[0.0,0.032],"z":[-0.135,0.135]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.106","0.008..0.032"]}},
      "envelope": {"x":[-0.135,0.135],"y":[0.0,0.032],"z":[-0.135,0.135]},
    },
    { "state": "fork", "parts": [
      {"id":"body","shape":"curved","x":[-0.0125,0.0125],"y":[0.0,0.012],"z":[-0.105,0.105]},
    ],
      "envelope": {"x":[-0.0125,0.0125],"y":[0.0,0.012],"z":[-0.105,0.105]},
    },
    { "state": "spoon", "parts": [
      {"id":"body","shape":"curved","x":[-0.0225,0.0225],"y":[0.0,0.017],"z":[-0.1025,0.1025]},
    ],
      "envelope": {"x":[-0.0225,0.0225],"y":[0.0,0.017],"z":[-0.1025,0.1025]},
    },
    { "state": "table-knife", "parts": [
      {"id":"body","shape":"curved","x":[-0.0115,0.0115],"y":[0.0,0.012],"z":[-0.1125,0.1125]},
    ],
      "envelope": {"x":[-0.0115,0.0115],"y":[0.0,0.012],"z":[-0.1125,0.1125]},
    },
    { "state": "water-bottle", "parts": [
      {"id":"body","shape":"hollow","x":[-0.0475,0.0475],"y":[0.0,0.285],"z":[-0.0475,0.0475]},
    ],
      "profiles": {"body":["round","12","2/3","18","0.011"]},
      "envelope": {"x":[-0.0475,0.0475],"y":[0.0,0.285],"z":[-0.0475,0.0475]},
    },
    { "state": "flower-vase", "parts": [
      {"id":"body","shape":"hollow","x":[-0.07,0.07],"y":[0.0,0.3],"z":[-0.07,0.07]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.061","0.025..0.3"]}},
      "envelope": {"x":[-0.07,0.07],"y":[0.0,0.3],"z":[-0.07,0.07]},
    },
  ] },
  { "anchor": "kitchen-smallwares", "name": "조리 도구와 소형 기기", "states": [
    { "state": "pot", "parts": [
      {"id":"body","shape":"hollow","x":[-0.175,0.175],"y":[0.0,0.17],"z":[-0.14,0.14]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.124","0.014..0.17"]}},
      "envelope": {"x":[-0.175,0.175],"y":[0.0,0.17],"z":[-0.14,0.14]},
    },
    { "state": "pan", "parts": [
      {"id":"body","shape":"hollow","x":[-0.15,0.15],"y":[0.0,0.095],"z":[-0.15,0.24]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.13","0.012..0.095"]}},
      "envelope": {"x":[-0.15,0.15],"y":[0.0,0.095],"z":[-0.15,0.24]},
    },
    { "state": "cutting-board", "parts": [
      {"id":"body","shape":"box","x":[-0.155,0.155],"y":[0.0,0.018],"z":[-0.21,0.21]},
    ],
      "envelope": {"x":[-0.155,0.155],"y":[0.0,0.018],"z":[-0.21,0.21]},
    },
    { "state": "knife-block", "parts": [
      {"id":"body","shape":"box","x":[-0.08,0.08],"y":[0.0,0.23],"z":[-0.09,0.09]},
    ],
      "envelope": {"x":[-0.08,0.08],"y":[0.0,0.23],"z":[-0.09,0.09]},
    },
    { "state": "utensil-crock", "parts": [
      {"id":"body","shape":"hollow","x":[-0.065,0.065],"y":[0.0,0.19],"z":[-0.065,0.065]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.057","0.016..0.19"]}},
      "envelope": {"x":[-0.065,0.065],"y":[0.0,0.19],"z":[-0.065,0.065]},
    },
    { "state": "utensil", "parts": [
      {"id":"body","shape":"curved","x":[-0.0225,0.0225],"y":[0.0,0.022],"z":[-0.155,0.155]},
    ],
      "envelope": {"x":[-0.0225,0.0225],"y":[0.0,0.022],"z":[-0.155,0.155]},
    },
    { "state": "kettle", "parts": [
      {"id":"body","shape":"hollow","x":[-0.11,0.11],"y":[0.0,0.25],"z":[-0.135,0.135]},
    ],
      "profiles": {"body":["round","12","2/3","18","0.024"]},
      "envelope": {"x":[-0.11,0.11],"y":[0.0,0.25],"z":[-0.135,0.135]},
    },
    { "state": "toaster", "parts": [
      {"id":"body","shape":"box","x":[-0.145,0.145],"y":[0.0,0.21],"z":[-0.095,0.095]},
    ],
      "envelope": {"x":[-0.145,0.145],"y":[0.0,0.21],"z":[-0.095,0.095]},
    },
    { "state": "coffee-brewer", "parts": [
      {"id":"body","shape":"hollow","x":[-0.12,0.12],"y":[0.0,0.34],"z":[-0.15,0.15]},
    ],
      "profiles": {"body":["round","12","2/3","18","0.027"]},
      "envelope": {"x":[-0.12,0.12],"y":[0.0,0.34],"z":[-0.15,0.15]},
    },
    { "state": "drying-rack", "parts": [
      {"id":"body","shape":"curved","x":[-0.21,0.21],"y":[0.0,0.16],"z":[-0.155,0.155]},
    ],
      "envelope": {"x":[-0.21,0.21],"y":[0.0,0.16],"z":[-0.155,0.155]},
    },
    { "state": "glass-jar", "parts": [
      {"id":"body","shape":"hollow","x":[-0.055,0.055],"y":[0.0,0.19],"z":[-0.055,0.055]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.048","0.016..0.19"]}},
      "envelope": {"x":[-0.055,0.055],"y":[0.0,0.19],"z":[-0.055,0.055]},
    },
  ] },
  { "anchor": "bath-accessories", "name": "욕실 위생 소품", "states": [
    { "state": "soap-dispenser", "parts": [
      {"id":"body","shape":"hollow","x":[-0.0375,0.0375],"y":[0.0,0.17],"z":[-0.0375,0.0375]},
    ],
      "profiles": {"body":["ellipse","12","4/5","18","0.014"]},
      "envelope": {"x":[-0.0375,0.0375],"y":[0.0,0.17],"z":[-0.0375,0.0375]},
    },
    { "state": "tissue-holder", "parts": [
      {"id":"body","shape":"box","x":[-0.085,0.085],"y":[0.0,0.075],"z":[0.0,0.09]},
    ],
      "envelope": {"x":[-0.085,0.085],"y":[0.0,0.075],"z":[0.0,0.09]},
    },
    { "state": "tissue-roll", "parts": [
      {"id":"body","shape":"hollow","x":[-0.0525,0.0525],"y":[0.0,0.1],"z":[-0.0525,0.0525]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.013125","0..0.1"]}},
      "radial": {"body":[0.0,0.0,0.013125,0.0525]},
      "envelope": {"x":[-0.0525,0.0525],"y":[0.0,0.1],"z":[-0.0525,0.0525]},
    },
    { "state": "tissue-pack", "parts": [
      {"id":"body","shape":"curved","x":[-0.105,0.105],"y":[0.0,0.2],"z":[-0.105,0.105]},
    ],
      "envelope": {"x":[-0.105,0.105],"y":[0.0,0.2],"z":[-0.105,0.105]},
    },
    { "state": "toothbrush-cup", "parts": [
      {"id":"body","shape":"hollow","x":[-0.0425,0.0425],"y":[0.0,0.115],"z":[-0.0425,0.0425]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.037","0.01..0.115"]}},
      "envelope": {"x":[-0.0425,0.0425],"y":[0.0,0.115],"z":[-0.0425,0.0425]},
    },
    { "state": "toothbrush", "parts": [
      {"id":"body","shape":"curved","x":[-0.008,0.008],"y":[0.0,0.19],"z":[-0.011,0.011]},
    ],
      "envelope": {"x":[-0.008,0.008],"y":[0.0,0.19],"z":[-0.011,0.011]},
    },
    { "state": "shampoo-bottle", "parts": [
      {"id":"body","shape":"hollow","x":[-0.041,0.041],"y":[0.0,0.23],"z":[-0.0325,0.0325]},
    ],
      "profiles": {"body":["ellipse","12","4/5","18","0.013"]},
      "envelope": {"x":[-0.041,0.041],"y":[0.0,0.23],"z":[-0.0325,0.0325]},
    },
    { "state": "detergent-bottle", "parts": [
      {"id":"body","shape":"hollow","x":[-0.065,0.065],"y":[0.0,0.28],"z":[-0.045,0.045]},
    ],
      "profiles": {"body":["ellipse","12","4/5","18","0.018"]},
      "envelope": {"x":[-0.065,0.065],"y":[0.0,0.28],"z":[-0.045,0.045]},
    },
    { "state": "waste-bin", "parts": [
      {"id":"body","shape":"hollow","x":[-0.135,0.135],"y":[0.0,0.34],"z":[-0.135,0.135]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.12","0.029..0.34"]}},
      "envelope": {"x":[-0.135,0.135],"y":[0.0,0.34],"z":[-0.135,0.135]},
    },
    { "state": "laundry-basket", "parts": [
      {"id":"body","shape":"hollow","x":[-0.24,0.24],"y":[0.0,0.4],"z":[-0.175,0.175]},
    ],
      "voids": {"body":[{"x":[-0.22,0.22],"y":[0.033,0.4],"z":[-0.155,0.155]}]},
      "envelope": {"x":[-0.24,0.24],"y":[0.0,0.4],"z":[-0.175,0.175]},
    },
  ] },
  { "anchor": "household-boxes", "name": "생활 수납 상자", "states": [
    { "state": "file-box", "parts": [
      {"id":"body","shape":"hollow","x":[-0.155,0.155],"y":[0.0,0.31],"z":[-0.195,0.195]},
    ],
      "voids": {"body":[{"x":[-0.142,0.142],"y":[0.018,0.31],"z":[-0.182,0.182]}]},
      "envelope": {"x":[-0.155,0.155],"y":[0.0,0.31],"z":[-0.195,0.195]},
    },
    { "state": "toy-box", "parts": [
      {"id":"body","shape":"hollow","x":[-0.3,0.3],"y":[0.0,0.39],"z":[-0.21,0.21]},
    ],
      "voids": {"body":[{"x":[-0.282,0.282],"y":[0.022,0.39],"z":[-0.192,0.192]}]},
      "envelope": {"x":[-0.3,0.3],"y":[0.0,0.39],"z":[-0.21,0.21]},
    },
    { "state": "storage-box", "parts": [
      {"id":"body","shape":"box","x":[-0.23,0.23],"y":[0.0,0.33],"z":[-0.18,0.18]},
    ],
      "envelope": {"x":[-0.23,0.23],"y":[0.0,0.33],"z":[-0.18,0.18]},
    },
    { "state": "recycling-box", "parts": [
      {"id":"body","shape":"hollow","x":[-0.2,0.2],"y":[0.0,0.51],"z":[-0.175,0.175]},
    ],
      "voids": {"body":[{"x":[-0.185,0.185],"y":[0.029,0.51],"z":[-0.16,0.16]}]},
      "envelope": {"x":[-0.2,0.2],"y":[0.0,0.51],"z":[-0.175,0.175]},
    },
    { "state": "parcel-locker", "parts": [
      {"id":"body","shape":"box","x":[-0.31,0.31],"y":[0.0,0.84],"z":[-0.24,0.24]},
    ],
      "envelope": {"x":[-0.31,0.31],"y":[0.0,0.84],"z":[-0.24,0.24]},
    },
  ] },
  { "anchor": "household-tools", "name": "청소·수선·설비 도구", "states": [
    { "state": "tool-box", "parts": [
      {"id":"body","shape":"box","x":[-0.215,0.215],"y":[0.0,0.22],"z":[-0.12,0.12]},
    ],
      "envelope": {"x":[-0.215,0.215],"y":[0.0,0.22],"z":[-0.12,0.12]},
    },
    { "state": "vacuum", "parts": [
      {"id":"body","shape":"curved","x":[-0.155,0.155],"y":[0.0,1.05],"z":[-0.14,0.14]},
    ],
      "envelope": {"x":[-0.155,0.155],"y":[0.0,1.05],"z":[-0.14,0.14]},
    },
    { "state": "folded-ladder", "parts": [
      {"id":"body","shape":"curved","x":[-0.255,0.255],"y":[0.0,1.55],"z":[-0.065,0.065]},
    ],
      "envelope": {"x":[-0.255,0.255],"y":[0.0,1.55],"z":[-0.065,0.065]},
    },
    { "state": "cleaning-tool", "parts": [
      {"id":"body","shape":"curved","x":[-0.09,0.09],"y":[0.0,1.23],"z":[-0.075,0.075]},
    ],
      "envelope": {"x":[-0.09,0.09],"y":[0.0,1.23],"z":[-0.075,0.075]},
    },
    { "state": "spare-light", "parts": [
      {"id":"body","shape":"cylinder","x":[-0.06,0.06],"y":[0.0,0.08],"z":[-0.06,0.06]},
    ],
      "envelope": {"x":[-0.06,0.06],"y":[0.0,0.08],"z":[-0.06,0.06]},
    },
    { "state": "garden-tool", "parts": [
      {"id":"body","shape":"curved","x":[-0.095,0.095],"y":[0.0,1.14],"z":[-0.075,0.075]},
    ],
      "envelope": {"x":[-0.095,0.095],"y":[0.0,1.14],"z":[-0.075,0.075]},
    },
    { "state": "hose-reel", "parts": [
      {"id":"body","shape":"cylinder","x":[-0.23,0.23],"y":[0.0,0.49],"z":[-0.15,0.15]},
    ],
      "envelope": {"x":[-0.23,0.23],"y":[0.0,0.49],"z":[-0.15,0.15]},
    },
  ] },
  { "anchor": "exterior-furnishings", "name": "현관과 외부 비품", "states": [
    { "state": "mailbox", "parts": [
      {"id":"body","shape":"hollow","x":[-0.19,0.19],"y":[0.0,0.48],"z":[-0.12,0.12]},
    ],
      "voids": {"body":[{"x":[-0.16,0.16],"y":[0.05,0.45],"z":[-0.09,0.09]},{"x":[-0.15,0.15],"y":[0.45,0.48],"z":[-0.015,0.015]}]},
      "envelope": {"x":[-0.19,0.19],"y":[0.0,0.48],"z":[-0.12,0.12]},
    },
    { "state": "outdoor-bench", "parts": [
      {"id":"body","shape":"curved","x":[-0.76,0.76],"y":[0.0,0.8],"z":[-0.29,0.29]},
    ],
      "envelope": {"x":[-0.76,0.76],"y":[0.0,0.8],"z":[-0.29,0.29]},
    },
    { "state": "outdoor-chair", "parts": [
      {"id":"body","shape":"curved","x":[-0.29,0.29],"y":[0.0,0.78],"z":[-0.29,0.29]},
    ],
      "envelope": {"x":[-0.29,0.29],"y":[0.0,0.78],"z":[-0.29,0.29]},
    },
    { "state": "outdoor-table", "parts": [
      {"id":"body","shape":"curved","x":[-0.36,0.36],"y":[0.0,0.73],"z":[-0.36,0.36]},
    ],
      "envelope": {"x":[-0.36,0.36],"y":[0.0,0.73],"z":[-0.36,0.36]},
    },
    { "state": "garden-light", "parts": [
      {"id":"body","shape":"cylinder","x":[-0.06,0.06],"y":[0.0,0.7],"z":[-0.06,0.06]},
    ],
      "envelope": {"x":[-0.06,0.06],"y":[0.0,0.7],"z":[-0.06,0.06]},
    },
    { "state": "rain-barrel", "parts": [
      {"id":"body","shape":"hollow","x":[-0.32,0.32],"y":[0.0,0.91],"z":[-0.32,0.32]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.293","0.051..0.91"]}},
      "envelope": {"x":[-0.32,0.32],"y":[0.0,0.91],"z":[-0.32,0.32]},
    },
    { "state": "bike-rack", "parts": [
      {"id":"body","shape":"curved","x":[-0.46,0.46],"y":[0.0,0.64],"z":[-0.21,0.21]},
    ],
      "envelope": {"x":[-0.46,0.46],"y":[0.0,0.64],"z":[-0.21,0.21]},
    },
    { "state": "bicycle", "parts": [
      {"id":"body","shape":"curved","x":[-0.885,0.885],"y":[0.0,1.12],"z":[-0.235,0.235]},
    ],
      "envelope": {"x":[-0.885,0.885],"y":[0.0,1.12],"z":[-0.235,0.235]},
    },
    { "state": "outdoor-waste-bin", "parts": [
      {"id":"body","shape":"hollow","x":[-0.21,0.21],"y":[0.0,0.65],"z":[-0.21,0.21]},
    ],
      "bores": {"body":{"axis":"-y","args":["0.18","0.036..0.65"]}},
      "envelope": {"x":[-0.21,0.21],"y":[0.0,0.65],"z":[-0.21,0.21]},
    },
  ] },
  { "anchor": "wall-accessories", "name": "현관 거울·벽등·코트 걸이", "states": [
    { "state": "entry-mirror", "parts": [
      {"id":"body","shape":"box","x":[-0.28,0.28],"y":[0.0,1.22],"z":[0.0,0.035]},
    ],
      "envelope": {"x":[-0.28,0.28],"y":[0.0,1.22],"z":[0.0,0.035]},
    },
    { "state": "wall-sconce", "parts": [
      {"id":"body","shape":"curved","x":[-0.095,0.095],"y":[0.0,0.24],"z":[0.0,0.16]},
    ],
      "envelope": {"x":[-0.095,0.095],"y":[0.0,0.24],"z":[0.0,0.16]},
    },
    { "state": "coat-hook", "parts": [
      {"id":"body","shape":"curved","x":[-0.4,0.4],"y":[0.0,0.12],"z":[0.0,0.12]},
    ],
      "envelope": {"x":[-0.4,0.4],"y":[0.0,0.12],"z":[0.0,0.12]},
    },
  ] },
  { "anchor": "desk-controls", "name": "작업실 소형 장치", "states": [
    { "state": "pointing-device", "parts": [
      {"id":"body","shape":"curved","x":[-0.0325,0.0325],"y":[0.0,0.035],"z":[-0.055,0.055]},
    ],
      "envelope": {"x":[-0.0325,0.0325],"y":[0.0,0.035],"z":[-0.055,0.055]},
    },
  ] },
  { "anchor": "under-cabinet-light", "name": "주방 상부장 밑면 선형등", "states": [
    { "state": "default", "parts": [
      {"id":"body","shape":"box","x":[-0.4,0.4],"y":[-0.03,0.0],"z":[-0.025,0.025]},
    ],
      "envelope": {"x":[-0.4,0.4],"y":[-0.03,0.0],"z":[-0.025,0.025]},
    },
  ] },
];
/** Reviewed model owners in 005-everyday-objects.md. */
export class Models005 {
  static catalog(): readonly ModelPrototype[] { return prototypes; }
  static build(anchor: string, state: string, materialFor: (anchor: string, state: string, part: string) => IAutoMovieMaterial): IAutoMovieModel {
    const prototype = prototypes.find(item => item.anchor === anchor);
    if (!prototype) throw Error(`unknown model ${anchor} in Models005`);
    return ModelRepresentation.build(prototype, state, materialFor);
  }
}
