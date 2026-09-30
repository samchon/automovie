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
 * @evidence contracts/common.md#principled-implementation The observed radius is derived from the observation's own millimetres and a supplied radius is used as given, so the provenance record and the rendered radius come from one value; the sphere itself is delegated to `placeHumanBodyArticularSphere`, which owns the finite-positive radius and posed-centre checks.
 * @evidence contracts/common.md#clear-and-simple-design One function that maps the three provenance kinds onto one shared placement helper and adds only the provenance record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case is special-cased by subject, and no foreign state is mutated: the observation is copied and the result owns its position record.
 * @evidence contracts/common.md#meaningful-documentation The comment states what the sphere is, that the rig centre is not a CT head centre, and that radius and provenance cannot disagree.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration places one humeral articular head of one named upper arm; the shaft, tubercles and skin are other structures.
 * @evidence contracts/modeling.md#spatial-conventions The input is a radius in millimetres (observed) or metres (supplied), converted once by `/ 1000`; the centre and result are metres in the body basis frame (Y up, Z forward) taken from the posed bone.
 * @evidenceExclude contracts/modeling.md#parameter-channels The radius is an absolute measured or target quantity, not an offset from a neutral.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits a sphere record (centre and radius), not vertices or triangles.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; whether the sphere has room inside the skin is judged by the caller against the current skin.
 * @evidence contracts/anatomy.md#parametric-authority The only input is a named articular-head radius (a sphere fit or a target) for a named upper arm; nothing addresses a vertex, curve or patch.
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
