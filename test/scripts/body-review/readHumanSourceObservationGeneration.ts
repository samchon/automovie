/** Read one existing published source pair and its exact compressed bytes. */
import { joinHumanPersonGeneration } from "@automovie/human/human/build/joinHumanPersonGeneration";
import type { IAutoMovieHumanPersonBodyView } from "@automovie/human/human/structures/IAutoMovieHumanPersonBodyView";
import type { IAutoMovieHumanPersonHeadView } from "@automovie/human/human/structures/IAutoMovieHumanPersonHeadView";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import type { IHumanSourceObservationGenerationInput } from "./IHumanSourceObservationGenerationInput";

/** Preserve the generation join's original mixed-pair refusal conditions. */
export function readHumanSourceObservationGeneration(
  directory: string,
): IHumanSourceObservationGenerationInput {
  const files: Record<string, string> = {};
  const read = <T>(name: string): T => {
    const bytes = fs.readFileSync(path.join(directory, name));
    files[name] = createHash("sha256").update(bytes).digest("hex");
    return JSON.parse(gunzipSync(bytes).toString("utf8")) as T;
  };
  const generation = joinHumanPersonGeneration(
    read<IAutoMovieHumanPersonHeadView>("head.json.gz"),
    read<IAutoMovieHumanPersonBodyView>("body.json.gz"),
  );
  return { generation, files };
}
