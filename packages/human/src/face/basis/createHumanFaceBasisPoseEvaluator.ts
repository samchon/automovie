import { Vector3 } from "@automovie/engine";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { readHumanFacePeriocularTissueSpace } from "../anatomy/eye/readHumanFacePeriocularTissueSpace";
import { buildHumanFacePeriocularTissues } from "../anatomy/eye/buildHumanFacePeriocularTissues";
import { createHumanFacePeriocularDefaults } from "../anatomy/eye/createHumanFacePeriocularDefaults";
import { seatHumanFaceLidCage } from "../anatomy/eye/seatHumanFaceLidCage";
import { buildHumanFaceOralAssembly } from "../anatomy/oral/buildHumanFaceOralAssembly";
import { connectHumanFaceOralLipPorts } from "../anatomy/oral/connectHumanFaceOralLipPorts";
import { evaluateHumanFaceOralPassage } from "../anatomy/oral/evaluateHumanFaceOralPassage";
import { poseHumanFaceOralAssembly } from "../anatomy/oral/poseHumanFaceOralAssembly";
import { applyHumanFaceNasolabialRelief } from "../anatomy/skin/applyHumanFaceNasolabialRelief";
import { applyHumanFaceRegionalRelief } from "../anatomy/skin/applyHumanFaceRegionalRelief";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import type { IHumanFaceDynamicCollider } from "./IHumanFaceDynamicCollider";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";
import { applyHumanFaceSourceClosure } from "./applyHumanFaceSourceClosure";
import { assertHumanFacePeriocularCage } from "./assertHumanFacePeriocularCage";
import { createHumanFaceClearanceCheck } from "./createHumanFaceClearanceCheck";
import { createHumanFaceNativePose } from "./createHumanFaceNativePose";
import { evaluateHumanFacePassage } from "./evaluateHumanFacePassage";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";
import { measureHumanFaceApertureGap } from "./measureHumanFaceApertureGap";
import { measureHumanFaceMarginGaps } from "./measureHumanFaceMarginGaps";
import { prepareHumanFaceReference } from "./prepareHumanFaceReference";
import { resolveHumanFaceContact } from "./resolveHumanFaceContact";

/**
 * Compile the connected basis's geometry stage, independent of appearance.
 * One call receives admitted channel weights and the matching identity shape,
 * and owns native rest deformation, shaped joints, companion scaling, attached
 * posing and source refinement replay. With independent optics, the lid cage of
 * each eye is then seated on that eye's analytic exterior in the rest and the
 * performed state (`seatHumanFaceLidCage`). A compiled source span reads fixed
 * closure-zero/one native stages with the same other inputs, forms its endpoint
 * after replay and applies the request once. Native closure scales its rows by
 * `measureHumanFaceClosureRatio`, so closure weight one brings the central lip
 * pair to margin contact and a fraction closes that fraction of the current
 * aperture. Rigid contact, final aperture/passage and normals then read the
 * resulting performed geometry. Native scaling reads the pre-closure aperture, while the
 * admission and summary read the corrected geometry the renderer receives.
 * All positions remain basis metres in the Y-up, +Z-anterior head frame.
 * The returned arrays are owned by the caller and must not be modified by a
 * renderer or hair producer if a later appearance edit reuses them. Material
 * colours, iris pixels, scalp hair and ambient occlusion remain downstream.
 *
 * Jaw rotation and translation are source-authored endpoint interpolation;
 * Lindauer et al. observed both movements from early opening
 * (https://pubmed.ncbi.nlm.nih.gov/7771361/), but this does not turn the
 * complete endpoint path into a clinical trajectory. The rest-clearance
 * contact stage is also a deterministic authored constraint rather than
 * measured tissue mechanics; resolveHumanFaceContact owns that distinction.
 *
 * @evidence contracts/common.md#principled-implementation Reuses the native companion/pose/replay stage at fixed source closure zero and one, with the weights owner rebuilding all other identical inputs, before one requested source-span blend. Native closure scales so weight one seals the measured central lip aperture. Original rigid floors read the same shape-only rest, and final registered/native aperture diagnostics and tongue passage read the actual corrected geometry.
 * @evidence contracts/common.md#clear-and-simple-design One native stage feeds the legacy path or the compiled source endpoint owner; contact, final measurements and normals remain their named downstream responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second requested gain, source index clamp or forced zero gap enters the source path. Contact still owns its rest-clearance rule and budget, while source registration selects the actual final representative and retains the authored native diagnostic.
 * @evidence contracts/common.md#meaningful-documentation States the order, the frame and units, who owns the returned arrays and cites the jaw source with the limits of endpoint interpolation.
 * @evidence contracts/modeling.md#spatial-conventions Positions in basis metres in the Y-up +Z-anterior head frame, as the docs state; no conversion happens.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createHumanFaceBasisPoseEvaluator is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceBasisPoseEvaluator emits no primitive.
 * @evidence contracts/modeling.md#parameter-channels The closure channel keeps one meaning: weight one brings the central pair and the whole registered lip margin to contact, scaled per vertex by createHumanFaceClosureGain.
 * @evidenceExclude contracts/modeling.md#shared-boundaries resolveHumanFaceContact owns the boundary between soft and rigid surfaces; the evaluator sequences it.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder observes the emitted model; the evaluator returns positions, normals and the contact summary it reports.
 * @evidence contracts/anatomy.md#anatomical-source Jaw motion is source-authored endpoint interpolation with coupled translation (Lindauer et al.), and closure follows the requirement that weight one seals the lips.
 * @evidence contracts/anatomy.md#permitted-range A closure that cannot seal a pair, or would exceed the lips' tissue budget, refuses through createHumanFaceClosureGain; contact refusals come from resolveHumanFaceContact.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Channel weights are admitted upstream by humanFaceBasisWeights; the evaluator adds no input.
 */
export function createHumanFaceBasisPoseEvaluator(
  basis: IAutoMovieHumanFaceBasis,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
  geometry?: IHumanFacePoseGeometry,
) => IHumanFacePoseResult {
  for (const surface of basis.surfaces)
    if (
      surface.sourcePosePlan !== undefined &&
      surface.sourcePartition !== undefined &&
      surface.sourcePosePlan.generation !== surface.sourcePartition.generation
    )
      throw new Error(
        "Face source pose and normal partitions need the same compiler generation.",
      );
  const contact = basis.contact;
  const sourceSpan = contact?.closure.sourceSpan;
  if (sourceSpan !== undefined) {
    const source = basis.surfaces.find(
      (surface) => surface.id === sourceSpan.surface,
    );
    if (source === undefined)
      throw new Error("Face source closure names an absent basis surface.");
    if (
      [
        source.sourcePosePlan?.generation,
        source.sourcePartition?.generation,
      ].some(
        (generation) =>
          generation !== undefined && generation !== sourceSpan.generation,
      )
    )
      throw new Error(
        "Face source closure needs the same compiler generation.",
      );
  }
  const poseNative = createHumanFaceNativePose(basis);
  return (state, shape, geometry) => {
    const checks: IHumanFacePoseResult["checks"][number][] = [];
    const { skinRelief, oral } = geometry ?? {};
    const periocularTissues = createHumanFacePeriocularDefaults(basis, geometry);
    const fixed = (weight: number) =>
      humanFaceBasisWeights(basis, {
        shape,
        expression: Object.fromEntries(
          basis.channels
            .filter((channel) => channel.kind === "expression")
            .map((channel) => [
              channel.id,
              channel.id === contact!.closure.channel
                ? weight
                : (state.weights.get(channel.id) ?? 0),
            ]),
        ),
      });
    const native = poseNative(
      sourceSpan === undefined ? state : fixed(0),
      geometry,
    );
    const posed =
      sourceSpan === undefined
        ? native.posed
        : applyHumanFaceSourceClosure(
            sourceSpan,
            native.posed,
            poseNative(fixed(1), geometry).posed,
            state.weights.get(contact!.closure.channel) ?? 0,
          );
    const preparation = prepareHumanFaceReference({ basis, state, geometry, native });
    const shaped = preparation.shaped;
    // The lid margin is seated on the generated ocular exterior before any
    // stage reads the skin, so contact, tissue and every measurement see one
    // rest and one performed lid.
    const optics = preparation.optics;
    for (const eye of optics ?? []) {
      const cage = basis.periocular?.[eye.side].cage;
      if (cage === undefined) continue;
      assertHumanFacePeriocularCage(basis, cage);
      const host = basis.surfaces.findIndex(
        (surface) => surface.id === cage.surface,
      );
      const samples = basis.surfaces[host].sourcePartition!.samples;
      posed.set(
        cage.surface,
        seatHumanFaceLidCage(
          cage,
          samples,
          posed.get(cage.surface)!,
          eye.exterior.posed,
          basis.surfaces[host].indices,
        ),
      );
    }
    const oralAssembly =
      oral === undefined
        ? undefined
        : shaped === undefined
          ? (() => {
              throw new Error(
                "Oral assembly needs its shape-only source reference.",
              );
            })()
          : (() => {
              const reference = new Map(
                basis.surfaces.map((surface, at) => [
                  surface.id,
                  shaped.surfaces[at],
                ]),
              );
              const jaw = native.motions?.get("jaw");
              if (jaw === undefined)
                throw new Error(
                  "Oral assembly needs its actual source jaw motion.",
                );
              return poseHumanFaceOralAssembly(
                basis,
                reference,
                buildHumanFaceOralAssembly(basis, reference, oral),
                jaw,
              );
            })();
    if (skinRelief !== undefined) {
      const relieved = applyHumanFaceRegionalRelief(
        basis,
        applyHumanFaceNasolabialRelief(basis, posed, state.weights, skinRelief),
        skinRelief,
      );
      for (const [id, positions] of relieved)
        if (positions !== posed.get(id)) posed.set(id, [...positions]);
    }
    const reference = preparation.complete();
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    const generated = new Map<string, IHumanFaceDynamicCollider[]>();
    for (const eye of optics ?? []) {
      const entries = generated.get(eye.surface) ?? [];
      entries.push(eye.collider);
      generated.set(eye.surface, entries);
    }
    if (oralAssembly !== undefined) {
      if (contact === undefined || oralAssembly.colliders === undefined)
        throw new Error(
          "Oral assembly needs its actual generated contact exterior.",
        );
      generated.set(oralAssembly.dentalSurface, [...oralAssembly.colliders]);
    }
    if (
      optics !== undefined &&
      (contact === undefined ||
        [...generated.keys()].some(
          (id) => !contact.colliders.some((c) => c.surface === id),
        ))
    )
      throw new Error(
        "Independent optics need their registered exterior in the source contact assembly.",
      );
    if (contact !== undefined) {
      const resolved = resolveHumanFaceContact(
        basis,
        contact,
        posed,
        new Map(
          basis.surfaces.map((surface, index) => [
            surface.id,
            shaped!.surfaces[index],
          ]),
        ),
        generated,
      );
      const pair = (entry: typeof contact.lips) => {
        const positions = posed.get(entry.surface)!;
        const point = (vertex: number) =>
          Vector3.create(
            positions[3 * vertex],
            positions[3 * vertex + 1],
            positions[3 * vertex + 2],
          );
        const upper = point(entry.upper);
        const lower = point(entry.lower);
        return {
          upper,
          lower,
          gap: measureHumanFaceApertureGap(upper, lower, native.up!),
        };
      };
      const authoredLips = pair(contact.lips);
      const lips =
        sourceSpan === undefined
          ? authoredLips
          : pair({
              surface: sourceSpan.surface,
              upper: sourceSpan.representativePair[0],
              lower: sourceSpan.representativePair[1],
            });
      const missingIncisor =
        oralAssembly !== undefined &&
        contact.incisors.surface === oralAssembly.dentalSurface &&
        [contact.incisors.upper, contact.incisors.lower].some((vertex) =>
          oralAssembly.absentDentalVertices.has(vertex),
        );
      const incisors = missingIncisor ? undefined : pair(contact.incisors);
      const up = native.up!,
        forward = Vector3.cross(
          Vector3.create(...basis.articulation!.jaw.axis),
          up,
        );
      const passage =
        oralAssembly === undefined
          ? evaluateHumanFacePassage(
              contact,
              posed.get(contact.passage.surface)!,
              { up, forward, lips, incisors: incisors! },
              basis.surfaces.find(
                (surface) => surface.id === contact.passage.surface,
              )!.indices,
            )
          : (() => {
              if (reference === undefined)
                throw new Error(
                  "Actual oral passage needs its matching shape-only source reference.",
                );
              return evaluateHumanFaceOralPassage({
                basis,
                assembly: oralAssembly,
                reference,
                positions: posed,
                up,
                forward,
              });
            })();
      summary = {
        interlabialMetres: lips.gap,
        interincisalMetres: incisors?.gap ?? null,
        closureRatio: native.closureRatio,
        passage,
        resolved,
        ...(contact.margin === undefined
          ? {}
          : {
              marginInterlabialMetres: measureHumanFaceMarginGaps(
                posed.get(contact.lips.surface)!,
                contact.margin,
                basis.articulation!.jaw.axis,
                native.up!,
              ),
            }),
        ...(sourceSpan === undefined
          ? {}
          : {
              sourceNativeInterlabialMetres: authoredLips.gap,
            }),
      };
    }
    const finalOral =
      oralAssembly === undefined
        ? undefined
        : connectHumanFaceOralLipPorts(
            basis,
            oralAssembly,
            posed,
            native.motions!.get("jaw")!,
          );
    const normals = new Map(
      basis.surfaces.map((surface) => [
        surface.id,
        areaWeightedNormals(posed.get(surface.id)!, surface.indices),
      ]),
    );
    const tissues =
      periocularTissues === undefined
        ? undefined
        : (() => {
            if (reference === undefined)
              throw new Error(
                "Periocular tissues need their actual shape-only source reference.",
              );
            const exteriors = (state: "rest" | "posed") =>
              new Map(
                (optics ?? []).map((eye) => [eye.side, eye.exterior[state]]),
              );
            const resting = buildHumanFacePeriocularTissues(
              basis,
              reference,
              new Map(
                basis.surfaces.map((surface) => [
                  surface.id,
                  areaWeightedNormals(
                    [...reference.get(surface.id)!],
                    surface.indices,
                  ),
                ]),
              ),
              exteriors("rest"),
              periocularTissues,
            );
            checks.push(createHumanFaceClearanceCheck("periocular-rest", "Periocular rest shell exceeds its lid or intersects its optical exterior or another shell", () => readHumanFacePeriocularTissueSpace(basis, reference, resting, optics, "rest")));
            const performed = buildHumanFacePeriocularTissues(
              basis,
              posed,
              normals,
              exteriors("posed"),
              periocularTissues,
            );
            checks.push(createHumanFaceClearanceCheck("periocular-performed", "Periocular performed shell exceeds its lid or intersects its optical exterior or another shell", () => readHumanFacePeriocularTissueSpace(basis, posed, performed, optics, "performed")));
            return performed;
          })();
    return {
      checks,
      positions: posed,
      normals,
      summary,
      ...(optics === undefined ? {} : { optics }),
      ...(reference === undefined ? {} : { reference }),
      ...(tissues === undefined ? {} : { periocularTissues: tissues }),
      ...(finalOral === undefined
        ? {}
        : { oral: finalOral, jawMotion: native.motions?.get("jaw") }),
    };
  };
}
