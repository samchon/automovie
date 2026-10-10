import { Vector3 } from "@automovie/engine";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { buildHumanFacePeriocularTissues } from "../anatomy/eye/buildHumanFacePeriocularTissues";
import { createHumanFacePeriocularDefaults } from "../anatomy/eye/createHumanFacePeriocularDefaults";
import { readHumanFacePeriocularTissueSpace } from "../anatomy/eye/readHumanFacePeriocularTissueSpace";
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
import { assertHumanFaceSourceClosurePlan } from "./assertHumanFaceSourceClosurePlan";
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
 * closure-zero and, for a nonzero request, closure-one native stages with the
 * same other inputs, forms its endpoint after replay and applies the request
 * once. Zero requests retain structural source-plan admission and owned map
 * and array copies without solving an unrequested endpoint. Native closure scales its rows by
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
 */
export function createHumanFaceBasisPoseEvaluator(
  basis: IAutoMovieHumanFaceBasis,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
  geometry?: IHumanFacePoseGeometry,
  progress?: (owner: string) => void,
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
  return (state, shape, geometry, progress) => {
    const checks: IHumanFacePoseResult["checks"][number][] = [];
    const { skinRelief, oral } = geometry ?? {};
    const periocularTissues = createHumanFacePeriocularDefaults(
      basis,
      geometry,
    );
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
      progress,
    );
    const closureWeight = contact === undefined ? 0 : (state.weights.get(contact.closure.channel) ?? 0);
    const posed =
      sourceSpan === undefined
        ? native.posed
        : closureWeight === 0
          ? (() => {
              assertHumanFaceSourceClosurePlan(sourceSpan, native.posed);
              return new Map([...native.posed].map(([id, positions]) => [id, [...positions]]));
            })()
          : applyHumanFaceSourceClosure(
            sourceSpan,
            native.posed,
            poseNative(fixed(1), geometry, progress === undefined ? undefined :
              (owner) => progress("closure-endpoint:" + owner)).posed,
            closureWeight,
          );
    if (sourceSpan !== undefined)
      progress?.(closureWeight === 0 ? "pose:source-closure-zero" : "pose:source-closure-endpoint");
    const preparation = prepareHumanFaceReference({
      basis,
      state,
      geometry,
      native,
      progress,
    });
    progress?.("pose:reference-preparation");
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
      progress?.("pose:lid-seat:" + eye.side + ":" + cage.surface);
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
    if (oralAssembly !== undefined) progress?.("pose:oral-assembly");
    if (skinRelief !== undefined) {
      if (preparation.materialReference === undefined)
        throw new Error("Skin relief needs its same shape-only material reference.");
      const relieved = applyHumanFaceRegionalRelief(
        basis,
        applyHumanFaceNasolabialRelief(basis, posed, state.weights, skinRelief, preparation.materialReference),
        skinRelief,
        preparation.materialReference,
      );
      for (const [id, positions] of relieved)
        if (positions !== posed.get(id)) posed.set(id, [...positions]);
      progress?.("pose:skin-relief");
    }
    const reference = preparation.complete();
    progress?.("pose:reference-complete");
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
                basis.surfaces.find((surface) => surface.id === contact.lips.surface)!,
              ),
            }),
        ...(sourceSpan === undefined
          ? {}
          : {
              sourceNativeInterlabialMetres: authoredLips.gap,
            }),
      };
      progress?.("pose:contact-passage");
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
    if (finalOral !== undefined) progress?.("pose:oral-ports");
    const normals = new Map(
      basis.surfaces.map((surface) => [
        surface.id,
        areaWeightedNormals(posed.get(surface.id)!, surface.indices),
      ]),
    );
    progress?.("pose:normals");
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
              progress === undefined ? undefined : (owner) => progress("rest:" + owner),
            );
            progress?.("pose:periocular-rest");
            checks.push(
              createHumanFaceClearanceCheck(
                "periocular-rest",
                "Periocular rest shell exceeds its lid or intersects its optical exterior or another shell",
                () =>
                  readHumanFacePeriocularTissueSpace(
                    basis,
                    reference,
                    resting,
                    optics,
                    "rest",
                  ),
              ),
            );
            const performed = buildHumanFacePeriocularTissues(
              basis,
              posed,
              normals,
              exteriors("posed"),
              periocularTissues,
              progress === undefined ? undefined : (owner) => progress("posed:" + owner),
            );
            progress?.("pose:periocular-performed");
            checks.push(
              createHumanFaceClearanceCheck(
                "periocular-performed",
                "Periocular performed shell exceeds its lid or intersects its optical exterior or another shell",
                () =>
                  readHumanFacePeriocularTissueSpace(
                    basis,
                    posed,
                    performed,
                    optics,
                    "performed",
                  ),
              ),
            );
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
