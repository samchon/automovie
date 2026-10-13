import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";

/** Enforce the kind-discriminated scalar tuple of one render-manifest row. */
export const assertProductionRenderedDeliverableFacts = (props: {
  kind: "feature" | "guide-pass" | "preview" | "captions" | "audio-mix";
  runtimeSeconds: number | null;
  frameCount: number | null;
  codec: string | null;
  expectedCaptionRuntimeSeconds: number | null;
  probe: IAutoMovieProductionMediaProbe;
}): void => {
  const video =
    props.kind === "feature" && props.probe.kind === "feature"
      ? props.probe.video
      : props.kind === "guide-pass" && props.probe.kind === "video"
        ? props.probe
        : null;
  const audio =
    props.kind === "audio-mix" && props.probe.kind === "audio"
      ? props.probe
      : null;
  const associationValid =
    video !== null ||
    audio !== null ||
    (props.kind === "audio-mix" && props.probe.kind === "sound-evidence") ||
    (props.kind === "preview" && props.probe.kind === "png") ||
    (props.kind === "captions" && props.probe.kind === "webvtt");
  if (associationValid === false)
    throw new Error(
      `Render manifest ${props.kind} cannot carry parser facts of kind ${props.probe.kind}.`,
    );
  const expected =
    video !== null
      ? {
          runtimeSeconds: video.runtimeSeconds,
          frameCount: video.frameCount,
          codec: video.codec,
        }
      : audio !== null
        ? {
            runtimeSeconds: audio.runtimeSeconds,
            frameCount: null,
            codec: audio.codec,
          }
        : props.kind === "captions"
          ? {
              runtimeSeconds: props.expectedCaptionRuntimeSeconds,
              frameCount: null,
              codec: null,
            }
          : { runtimeSeconds: null, frameCount: null, codec: null };
  const comparisons: Array<[string, unknown, unknown]> = [
    ["runtimeSeconds", expected.runtimeSeconds, props.runtimeSeconds],
    ["frameCount", expected.frameCount, props.frameCount],
    ["codec", expected.codec, props.codec],
  ];
  const mismatch = comparisons.find(
    ([, wanted, observed]) => wanted !== observed,
  );
  if (mismatch !== undefined)
    throw new Error(
      `Render manifest ${props.kind}.${mismatch[0]} must equal its parser-derived media fact: expected ${String(mismatch[1])}, observed ${String(mismatch[2])}.`,
    );
};
