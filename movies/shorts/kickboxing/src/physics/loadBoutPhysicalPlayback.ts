import { AutoMoviePhysicalPlayback } from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import { readBoutPhysicalManifest } from "./readBoutPhysicalManifest";

/** Load a completed scene archive; current-source and sampled-input identities are both required. */
export async function loadBoutPhysicalPlayback(
  base: string,
  sourceIdentity: string,
): Promise<{
  playback: AutoMoviePhysicalPlayback;
  startSeconds: number;
  mode: "simulated" | "kinematic";
  profiles: Record<"a" | "b" | "referee", P>;
  formulaResponses: BoutFormulaResponse.IContact[];
}> {
  const manifestResponse: Response = await fetch(`${base}.json`);
  if (!manifestResponse.ok)
    throw new Error(
      "Missing bout physics: run the production's physics command before viewing",
    );
  const manifest: readBoutPhysicalManifest.IManifest = readBoutPhysicalManifest(
    await manifestResponse.json(),
    sourceIdentity,
  );
  const response: Response = await fetch(base);
  if (!response.ok)
    throw new Error(`Bout archive could not load: ${response.status}`);
  const bytes: Uint8Array = new Uint8Array(await response.arrayBuffer());
  if (bytes.length !== manifest.bytes)
    throw new Error("Bout archive does not match manifest byte length");
  const playback: AutoMoviePhysicalPlayback =
    await AutoMoviePhysicalPlayback.decode(bytes, manifest.identity, {
      maximumBytes: 536870912,
      maximumFrames: 21601,
      maximumSegments: 78,
    });
  if (
    playback.duration !== manifest.duration ||
    playback.rate !== manifest.rate
  )
    throw new Error("Bout archive timing differs from manifest");
  return {
    playback,
    startSeconds: manifest.startSeconds,
    mode: manifest.mode,
    profiles: manifest.profiles,
    formulaResponses: manifest.formulaResponses ?? [],
  };
}
