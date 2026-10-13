import type { IAutoMovieHumanBodyBuild } from "../../structures/IAutoMovieHumanBodyBuild";
import { placeHumanBodyArticularSphere } from "../articulation/placeHumanBodyArticularSphere";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";
import type { IAutoMovieHumanBodyHumeralHead } from "./IAutoMovieHumanBodyHumeralHead";

/**
 * Place one spherical articular head at the body's posed humeral joint centre.
 *
 * CT/MRI sphere fitting supplies an articular radius; this helper shares the same geometry and finite-joint admission between legacy and typed inputs. An observed input derives metres from its own millimetre value so the provenance record and rendered radius cannot silently disagree. The existing rig centre is not an observed individual CT head centre, so even a measured radius does not validate full humeral geometry or contact.
 *
 * @evidence contracts/common.md#principled-implementation Observed millimeters determine the sphere radius directly; shared articular placement admits finite positive radius and posed center, then provenance is preserved beside the copied sphere fields.
 * @evidence contracts/common.md#clear-and-simple-design A discriminated input forbids independent observed radius values, centralizing geometry admission in the common sphere helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rig-center placement remains an approximation even with measured radius and cannot certify a full humerus, cartilage or skin contact.
 * @evidence contracts/common.md#meaningful-documentation The prose explains observed unit conversion, provenance/radius agreement and the individual-center and contact limitations.
 * @evidence contracts/performance.md#efficient-algorithms Radius/provenance conversion is constant-size; shared placement performs one O(B) bone lookup for B built bones.
 * @evidence contracts/performance.md#reuse-equivalent-work Legacy and anatomical paths share geometry admission but each placement rereads current bones because pose is part of equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One result, copied center and optional shallow observation copy escape; borrowed bones acquire no retained handles or tasks.
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
  const radiusMetres: number =
    input.source === "observed"
      ? input.observation.millimetres / 1000
      : input.radiusMetres;
  const sphere: ReturnType<typeof placeHumanBodyArticularSphere<IAutoMovieHumanBodyHumeralHead["bone"]>> = placeHumanBodyArticularSphere({
    bone: input.bone,
    radiusMetres,
    bones: input.bones,
  });
  const provenance: { source: "observed"; observation: Extract<IAutoMovieHumanBodyTomographicLength, { kind: "observed" }> } | { source: "measured" | "target" | "adult-ct-prior" } =
    input.source === "observed"
      ? { source: "observed" as const, observation: { ...input.observation } }
      : { source: input.source };
  return {
    ...provenance,
    ...sphere,
  };
}
