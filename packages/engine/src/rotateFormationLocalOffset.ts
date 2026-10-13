import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Turn a unit-local displacement into the frame a unit's members are placed in.
 *
 * A member's offset is authored in its unit's own frame: `+x` is the unit's
 * left-to-right and `+z` its front-to-back, whichever way the unit happens to
 * be pointing. {@link transformFormationPoint} rotates a unit's interior by the
 * same total heading, so an offset joins a placed point only after this turns
 * it, and a member that stepped aside keeps stepping aside once its unit
 * turns.
 *
 * Taken as a heading in degrees rather than as a unit, because the two
 * consumers of this arithmetic hold different halves of it: a gate composing a
 * whole world placement passes the unit's designed heading plus the offset its
 * cue has turned it by, while a renderer whose scene graph already carries the
 * cue's rotation passes only the designed heading.
 */
export const rotateFormationLocalOffset = (
  offset: IAutoMovieVector3,
  headingDeg: number,
): IAutoMovieVector3 => {
  const radians = (headingDeg * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  return {
    x: offset.x * cosine + offset.z * sine,
    y: offset.y,
    z: -offset.x * sine + offset.z * cosine,
  };
};
