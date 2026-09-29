import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";

/**
 * Place one spherical articular head at the body's posed humeral joint centre.
 *
 * CT/MRI sphere fitting supplies an articular radius; this helper shares the
 * same geometry and finite-joint admission between legacy and typed inputs.
 * The existing rig centre is not an observed individual CT head centre, so
 * even a measured radius does not validate full humeral geometry or contact.
 * @author Samchon
 */
export function placeHumanBodyHumeralHead(input: {
  bone: IAutoMovieHumanBodyHumeralHead["bone"];
  radiusMetres: number;
  source: IAutoMovieHumanBodyHumeralHead["source"];
  bones: IAutoMovieHumanBodyBuild["bones"];
}): IAutoMovieHumanBodyHumeralHead {
  if (!Number.isFinite(input.radiusMetres) || input.radiusMetres <= 0)
    throw new Error("A humeral-head radius must be finite and positive.");
  const posed = input.bones.find((entry) => entry.bone === input.bone)?.posed.position;
  if (posed === undefined || ![posed.x, posed.y, posed.z].every(Number.isFinite))
    throw new Error("A humeral head needs its posed glenohumeral joint: " + input.bone);
  return {
    bone: input.bone,
    center: { ...posed },
    radiusMetres: input.radiusMetres,
    source: input.source,
  };
}
