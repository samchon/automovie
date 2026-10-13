import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";

import { parseProductionMp4Output } from "./parseProductionMp4Output";
import { probeParsedProductionVideoMp4 } from "./probeParsedProductionVideoMp4";

/** Parse one H.264-only intermediate production video. */
export const probeProductionVideoMp4 = (
  bytes: Uint8Array,
): Extract<IAutoMovieProductionMediaProbe, { kind: "video" }> =>
  probeParsedProductionVideoMp4(bytes, parseProductionMp4Output(bytes));
