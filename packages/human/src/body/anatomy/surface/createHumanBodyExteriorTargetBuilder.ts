import typia from "typia";

import { float32MeshBuffers } from "../../../common/mesh/float32MeshBuffers";
import { createHumanBodyBasisBuilder } from "../../basis/createHumanBodyBasisBuilder";
import { admitHumanBodyAnatomicalDocument } from "../../document/admitHumanBodyAnatomicalDocument";
import { invertHumanBodyMeasurement } from "../../measure/invertHumanBodyMeasurement";
import { readHumanBodyShapedMeasurement } from "../../measure/readHumanBodyShapedMeasurement";
import type { IAutoMovieHumanBodyAnatomicalDocument } from "../../structures/IAutoMovieHumanBodyAnatomicalDocument";
import type { IAutoMovieHumanBodyBasis } from "../../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyExteriorCandidateBuild } from "../generated/IAutoMovieHumanBodyExteriorCandidateBuild";
import type { IAutoMovieHumanBodyGeneratedAnatomy } from "../generated/IAutoMovieHumanBodyGeneratedAnatomy";
import type { AutoMovieHumanBodyPartId } from "../identity/AutoMovieHumanBodyPartId";
import { liftHumanBodySimpleAnatomicalTargets } from "../measurements/liftHumanBodySimpleAnatomicalTargets";
import type { IAutoMovieHumanBodyExteriorReference } from "./IAutoMovieHumanBodyExteriorReference";

/**
 * Compile one source-rest skin response into an absolute fictional bust target.
 * Each inverse reading builds and admits the actual static body, quantizes its
 * unsplit final skin through the existing Float32 owner, then reads the source
 * instrument. No rest-only surrogate or clinical tissue inference supplies the
 * answer. The existing inverse owns endpoints, tolerance and convergence.
 * Other provided context survives unchanged and is explicitly unfulfilled.
 *
 * @evidence contracts/common.md#principled-implementation The actual body builder, Float32 boundary, shared instrument and bounded inverse each retain their sole responsibility.
 * @evidence contracts/common.md#clear-and-simple-design One compiled source binding produces one physical candidate beside unchanged anatomical availability.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unregistered observations refuse and no population mean or unknown tissue is fabricated.
 * @evidence contracts/common.md#meaningful-documentation States the final-surface reading, reference convention and unsupported context.
 * @evidence contracts/modeling.md#parameter-channels Named absolute girth targets condition only the bound source response; private weights are not authored inputs.
 * @evidence contracts/modeling.md#spatial-conventions Both final and Float32 readings use the same source-rest metre frame and source witness.
 * @evidence contracts/modeling.md#emitted-geometry The admitted basis builder supplies the actual shared exterior and every trial crosses the real Float32 admission.
 * @evidence contracts/modeling.md#shared-boundaries Unsplit final skin and rendered regions come from one compiled body evaluation.
 * @evidence contracts/modeling.md#part-identity-and-grouping Existing source regions retain their identities; anatomical parts remain individually unavailable.
 * @evidence contracts/modeling.md#rendered-observation The connected exterior runtime consumes this physical model and qualification together.
 * @evidence contracts/anatomy.md#anatomical-source The explicit source instrument conditions a fictional candidate and supplies no held-out individual tissue validation.
 * @evidence contracts/anatomy.md#permitted-range Existing actual source endpoint readings and inverse tolerance refuse unsupported targets without extrapolation.
 * @evidence contracts/anatomy.md#parametric-authority The complete numerical document supplies only named physical targets, never vertex or morph edits.
 */
export function createHumanBodyExteriorTargetBuilder(input: {
  basis: IAutoMovieHumanBodyBasis;
  reference: IAutoMovieHumanBodyExteriorReference;
}) {
  const basis = structuredClone(input.basis);
  const reference = structuredClone(typia.assertEquals<IAutoMovieHumanBodyExteriorReference>(input.reference));
  const build = createHumanBodyBasisBuilder(basis, { physicalSource: reference.incidence });
  if (reference.basis !== basis.id)
    throw new Error("Exterior instrument must belong to the exact compiled source basis.");
  if (reference.measurement.kind !== "girth" || !("level" in reference.measurement) || !reference.measurement.horizontal)
    throw new Error("Exterior instrument requires a horizontal source-witness girth rule.");
  const channel = basis.channels.find((entry) => entry.id === reference.channel);
  if (channel === undefined)
    throw new Error("Exterior instrument needs an existing source shape response.");
  return (inputDocument: IAutoMovieHumanBodyAnatomicalDocument): IAutoMovieHumanBodyExteriorCandidateBuild => {
    const document = admitHumanBodyAnatomicalDocument(inputDocument);
    if (document.generatorRevision !== "source-conditioned-exterior/1" || document.basis !== basis.id)
      throw new Error("Exterior request must name the concrete generator and exact compiled source.");
    const targets = document.tier === "simple" ? liftHumanBodySimpleAnatomicalTargets(document.targets) : document.targets;
    const target = targets.surface.trunk?.bustGirth;
    if (target === undefined)
      throw new Error("missing-anatomical-input:targets.surface.trunk.bustGirth");
    if (target.kind === "observed")
      throw new Error("acquisition-not-registered:targets.surface.trunk.bustGirth (posture, plane and site)");
    const evaluate = (weight: number) => {
      const built = build({ id: document.id, name: document.name, basis: basis.id, shape: weight === 0 ? {} : { [channel.id]: weight } });
      const final = { surfaces: built.posedSurfaces.map((surface) => surface.positions), landmarks: built.landmarks };
      const float32 = { ...final, surfaces: built.posedSurfaces.map((surface, index) => Array.from(float32MeshBuffers({
        positions: surface.positions, normals: surface.normals, indices: basis.surfaces[index].indices, uvs: null, skin: null,
      }).positions)) };
      const finalMetres = readHumanBodyShapedMeasurement(basis, final, reference.measurement);
      let section: IAutoMovieHumanBodyExteriorCandidateBuild["exterior"]["fulfilled"]["section"] | undefined;
      const float32Metres = readHumanBodyShapedMeasurement(basis, float32, reference.measurement, (witness) => { section = witness; });
      if (finalMetres === null || float32Metres === null)
        throw new Error("missing-tissue-boundary:source bust instrument has no closed final section");
      // Admitted level-girth rules have one station. A nonnull reading passed
      // that station's section to the observer, so no second site is invented.
      return { built, finalMetres, float32Metres, section: section! };
    };
    const solved = invertHumanBodyMeasurement({
      range: [channel.minimum, channel.maximum], current: 0, targetMetres: target.metres,
      label: "source-rest nipple-level bust", read: (weight) => evaluate(weight).float32Metres,
    });
    const actual = evaluate(solved.weight);
    const path = document.tier === "simple" ? "targets.bustAtNippleLevelMetres" : "targets.surface.trunk.bustGirth";
    // Walk the original request, not its lifted expansion: paired controls and
    // the complete context keep their caller-visible paths.
    const provided = (value: unknown, at: string): string[] => {
      // Exact document admission excludes null measurement nodes. Optional
      // undefined fields retain omission rather than becoming fulfilled input.
      if (typeof value !== "object" || Object.hasOwn(value!, "kind")) return [at];
      return Object.entries(value!).filter(([, child]) => child !== undefined).flatMap(([key, child]) => provided(child, at + "." + key));
    };
    const anatomy: IAutoMovieHumanBodyGeneratedAnatomy = {
      skin: { id: "skin", status: "unavailable", reason: "geometry-not-validated" },
      parts: typia.assertEquals<IAutoMovieHumanBodyGeneratedAnatomy["parts"]>(Object.fromEntries(
        typia.reflect.literals<AutoMovieHumanBodyPartId>().map((id) => [id, { id, status: "unavailable", reason: "geometry-not-validated" }]),
      )),
    };
    return {
      model: actual.built.model,
      exterior: {
        generatorRevision: "source-conditioned-exterior/1", status: "candidate-only",
        reference: { basis: basis.id, evaluation: reference.evaluation, protocol: reference.protocol },
        requested: structuredClone(document),
        fulfilled: { path, targetMetres: target.metres, finalMetres: actual.finalMetres, float32Metres: actual.float32Metres, residualMetres: actual.float32Metres - target.metres, section: actual.section },
        unfulfilledContext: provided(document.targets, "targets").filter((entry) => entry !== path),
        anatomy,
      },
    };
  };
}
