import type { DuelActorFrame } from "./DuelActorFrame";

/**
 * Restore an explicitly adopted fixed playback input after exact-byte verification.
 * @evidence contracts/common.md#implementation-and-ownership This reads existing local deterministic samples rather than solving them again or claiming a new source epoch produced them. SHA, format, rate, count and recorded admission must agree. The producer records model/source compatibility separately and final capture preflight checks those files; changed geometry requires a new input.
 * @evidence contracts/common.md#authoring-interface Supply a same-origin path, exact64hexSHA and expected25/48/60second duration. The promise returns original actor records and their source map. No network provider or paid generation is invoked. Missing or unadmitted bytes refuse; diagnostic candidates cannot become an accepted prefix through this loader.
 */
export async function loadDuelFrames(url: string, sha256: string, durationSeconds: number): Promise<{ frames: { carina: DuelActorFrame; harry: DuelActorFrame }[]; source: { production: Record<string, string>; human: Record<string, string> }; observations?: { rescue: Record<string, unknown> } }> {
  const address: URL = new URL(url, window.location.href);
  if (address.origin !== window.location.origin || !/^[a-f0-9]{64}$/.test(sha256)) throw new Error("A same-origin fixed input and exactSHA are required");
  const response: Response = await fetch(address);
  if (!response.ok) throw new Error(`Fixed motion input unavailable:${response.status}`);
  const bytes: ArrayBuffer = await response.arrayBuffer();
  const digest: ArrayBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const actual: string = Array.from(new Uint8Array(digest)).map((value: number): string => value.toString(16).padStart(2, "0")).join("");
  if (actual !== sha256) throw new Error("Fixed motion input bytes changed");
  const input: { format: string; admitted: boolean; fps: number; durationSeconds: number; frames: { carina: DuelActorFrame; harry: DuelActorFrame }[]; source: { production: Record<string, string>; human: Record<string, string> }; observations?: { rescue: Record<string, unknown> } } = JSON.parse(new TextDecoder().decode(bytes)) as typeof input;
  if (input.format !== "look-at-me-duel-motion-bake-v2" || !input.admitted || input.fps !== 24 || input.durationSeconds !== durationSeconds || input.frames.length !== durationSeconds * 24 + 1) throw new Error("Fixed motion input lacks the required admitted complete interval");
  for (let index: number = 0; index < input.frames.length; index++) for (const role of ["carina", "harry"] as const) {
    const frame: DuelActorFrame = input.frames[index]![role];
    if (frame.index !== index || frame.supportStatus !== "admitted" || frame.supportError > 0.003 || frame.floorMinimum < -0.00001 || frame.aimError > 0.002 || frame.gripError > 0.003 || frame.output.clamped.length !== 0) throw new Error("Fixed input contains an unadmitted actor sample");
  }
  return { frames: input.frames, source: input.source, observations: input.observations };
}
