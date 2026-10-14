

/** Production-owned albedo asset names and physical tile dimensions in meters, used by the texture binding's reciprocal UV scale. */
export const textureTiles: { wood: { file: string; metres: number[]; }; stone: { file: string; metres: number[]; }; plaster: { file: string; metres: number[]; }; tile: { file: string; metres: number[]; }; cloth: { file: string; metres: number[]; }; bark: { file: string; metres: number[]; }; soil: { file: string; metres: number[]; }; } = {
 wood:{file:'oak-albedo-v1.png',metres:[.4,1]},
 stone:{file:'limestone-albedo-v1.png',metres:[.6,.6]},
 plaster:{file:'lime-plaster-albedo-v1.png',metres:[.8,.8]},
 tile:{file:'terracotta-albedo-v1.png',metres:[.3,.3]},
 cloth:{file:'linen-albedo-v1.png',metres:[.04,.04]},
 bark:{file:'apple-bark-albedo-v1.png',metres:[.55,.9]},
 soil:{file:'garden-soil-albedo-v1.png',metres:[1.2,1.2]},
};
