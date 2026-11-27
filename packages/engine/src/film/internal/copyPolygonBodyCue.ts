import type { IAutoMoviePolygonBodyCue } from "@automovie/interface";

/*
 * Copy an admitted cue into a compiled shot. Each vector component belongs to
 * the compiled shot even when the caller later edits its authoring program.
 */
export function copyPolygonBodyCue(
  cue: IAutoMoviePolygonBodyCue,
): IAutoMoviePolygonBodyCue {
  const common: Omit<IAutoMoviePolygonBodyCue, "kind"> = {
    subject: cue.subject,
    bone: cue.bone,
    at: cue.at,
    duration: cue.duration,
    rotation: {
      x: cue.rotation.x,
      y: cue.rotation.y,
      z: cue.rotation.z,
      w: cue.rotation.w,
    },
  };
  return cue.kind === "detach"
    ? {
        ...common,
        kind: "detach",
        translation: {
          x: cue.translation.x,
          y: cue.translation.y,
          z: cue.translation.z,
        },
      }
    : { ...common, kind: "bend" };
}
