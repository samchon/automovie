import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import { placeHumanBodyArticularSphere } from "../articulation/placeHumanBodyArticularSphere";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";

/**
 * Place one spherical articular head at the body's posed humeral joint centre.
 *
 * CT/MRI sphere fitting supplies an articular radius; this helper shares the
 * same geometry and finite-joint admission between legacy and typed inputs.
 * An observed input derives metres from its own millimetre value so the
 * provenance record and rendered radius cannot silently disagree.
 * The existing rig centre is not an observed individual CT head centre, so
 * even a measured radius does not validate full humeral geometry or contact.
 *
 * @author Samchon
 */
export function placeHumanBodyHumeralHead(
  input: {
    bone: IAutoMovieHumanBodyHumeralHead["bone"];
    bones: IAutoMovieHumanBodyBuild["bones"];
  } & (
    | {
        source: "observed";
        observation: Extract<
          IAutoMovieHumanBodyTomographicLength,
          { kind: "observed" }
        >;
        radiusMetres?: never;
      }
    | {
        source: "measured" | "target" | "adult-ct-prior";
        radiusMetres: number;
        observation?: never;
      }
  ),
): IAutoMovieHumanBodyHumeralHead {
  const radiusMetres =
    input.source === "observed"
      ? input.observation.millimetres / 1000
      : input.radiusMetres;
  const sphere = placeHumanBodyArticularSphere({
    bone: input.bone,
    radiusMetres,
    bones: input.bones,
  });
  const provenance =
    input.source === "observed"
      ? { source: "observed" as const, observation: { ...input.observation } }
      : { source: input.source };
  return {
    ...provenance,
    ...sphere,
  };
}
