import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 as IAutoMovieVector3Imported } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type {
  IAutoMovieHumanConstructionClearanceReading as IAutoMovieHumanConstructionClearanceReadingImported,
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceBasisContact as IAutoMovieHumanFaceBasisContactImported,
  IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported,
  IAutoMovieHumanFaceContactCollider as IAutoMovieHumanFaceContactColliderImported,
  IAutoMovieHumanFaceContactResolutionSummary as IAutoMovieHumanFaceContactResolutionSummaryImported,
  IAutoMovieHumanFaceMidlinePair as IAutoMovieHumanFaceMidlinePairImported,
  IAutoMovieHumanFaceRigidMotion as IAutoMovieHumanFaceRigidMotionImported,
  IAutoMovieHumanFaceSourceClosurePlan as IAutoMovieHumanFaceSourceClosurePlanImported,
  IAutoMovieHumanFaceTonguePassageSummary as IAutoMovieHumanFaceTonguePassageSummaryImported,
  IHumanConstructionCheck as IHumanConstructionCheckImported,
  IHumanFaceOralAssembly as IHumanFaceOralAssemblyImported,
} from "../../index";
import { buildHumanFacePeriocularTissues } from "../anatomy/eye/buildHumanFacePeriocularTissues";
import { createHumanFacePeriocularDefaults } from "../anatomy/eye/createHumanFacePeriocularDefaults";
import { readHumanFacePeriocularTissueSpace } from "../anatomy/eye/readHumanFacePeriocularTissueSpace";
import { seatHumanFaceLidCage } from "../anatomy/eye/seatHumanFaceLidCage";
import type { IHumanFaceOcularSurface as IHumanFaceOcularSurfaceImported } from "../anatomy/eye/structures/IHumanFaceOcularSurface";
import type { IHumanFaceOpticalAssembly as IHumanFaceOpticalAssemblyImported } from "../anatomy/eye/structures/IHumanFaceOpticalAssembly";
import type { IHumanFacePeriocularTissuePart as IHumanFacePeriocularTissuePartImported } from "../anatomy/eye/structures/IHumanFacePeriocularTissuePart";
import { buildHumanFaceOralAssembly } from "../anatomy/oral/buildHumanFaceOralAssembly";
import { connectHumanFaceOralLipPorts } from "../anatomy/oral/connectHumanFaceOralLipPorts";
import { evaluateHumanFaceOralPassage } from "../anatomy/oral/evaluateHumanFaceOralPassage";
import { poseHumanFaceOralAssembly } from "../anatomy/oral/poseHumanFaceOralAssembly";
import { applyHumanFaceNasolabialRelief } from "../anatomy/skin/applyHumanFaceNasolabialRelief";
import { applyHumanFaceRegionalRelief } from "../anatomy/skin/applyHumanFaceRegionalRelief";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";
import type { IAutoMovieHumanFacePeriocularCage as IAutoMovieHumanFacePeriocularCageImported } from "../structures/IAutoMovieHumanFacePeriocularCage";
import type { IAutoMovieHumanFacePeriocularTissues as IAutoMovieHumanFacePeriocularTissuesImported } from "../structures/IAutoMovieHumanFacePeriocularTissues";
import type { IHumanFaceApertureDirections } from "./IHumanFaceApertureDirections";
import type { IHumanFaceDynamicCollider } from "./IHumanFaceDynamicCollider";
import type { IHumanFaceNativePose as IHumanFaceNativePoseImported } from "./IHumanFaceNativePose";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import type { IHumanFacePoseResult } from "./IHumanFacePoseResult";
import type { IHumanFaceReferencePreparation as IHumanFaceReferencePreparationImported } from "./IHumanFaceReferencePreparation";
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
import { resolveHumanFaceApertureDirections } from "./resolveHumanFaceApertureDirections";
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
 * Passage projections use the shared orthonormal opening directions, so an
 * admitted nearly unit jaw axis does not scale metre distances or slab widths.
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
 * @evidence contracts/common.md#principled-implementation The admitted fixed basis and current state drive native rest/articulation, optional fixed-zero/one source closure replay, matched shape references, generated exteriors and unchanged rigid contact/passage predicates. Passage receives the shared normalized opening frame, preserving metre projections for jaw axes admitted within the existing unit-length tolerance. Normals and summaries read the final delivered coordinates; numerical constraints and source-authored motion do not establish a clinical trajectory or full visual correctness.
 * @evidence contracts/common.md#clear-and-simple-design One geometry stage coordinates native pose, reference completion, generated contact and final derivative order independently of downstream materials/hair/AO. Owner callbacks identify real completed work and deferred tissue checks preserve their original physical producers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Compiler generations must agree; missing source, jaw motion, generated contact registration or required references refuse. Zero source closure still admits its plan and copies arrays, while an unrequested closure endpoint is not solved; no absent source is substituted.
 * @evidence contracts/common.md#meaningful-documentation Prose states basis-frame metre units, reference versus performed ordering, zero/nonzero closure semantics, caller-owned read-only results, downstream appearance boundary and authored-motion/contact limitations.
 * @evidence contracts/performance.md#efficient-algorithms Each miss pays native sparse deformation and replay, optional second native closure endpoint, reference preparation, source-normal relief, generated assemblies, spatial contact and O(V+T) normal work. Rest/performed tissue generation is separate because both states are measured; complete source costs are not reduced to channel count.
 * @evidence contracts/performance.md#reuse-equivalent-work One compiled native evaluator and registered source span serve requests; within a request one completed reference and corrected pose feed assemblies, summaries and normals. The outer pose cache owns cross-request equivalence, and progress remains an effect of work that actually ran.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compiled closure retains the fixed basis/native evaluator; per-request maps, references, optical/oral/tissue meshes and check closures transfer in the result or become collectible on failure. No request history or viewer task is owned, and callers must preserve cached result immutability.
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
  const contact: IAutoMovieHumanFaceBasisContactImported | undefined =
    basis.contact;
  const sourceSpan: IAutoMovieHumanFaceSourceClosurePlanImported | undefined =
    contact?.closure.sourceSpan;
  if (sourceSpan !== undefined) {
    const source: IAutoMovieHumanFaceBasisSurfaceImported | undefined =
      basis.surfaces.find(
        (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
          surface.id === sourceSpan.surface,
      );
    if (source === undefined)
      throw new Error("Face source closure names an absent basis surface.");
    if (
      [
        source.sourcePosePlan?.generation,
        source.sourcePartition?.generation,
      ].some(
        (generation: string | undefined): boolean =>
          generation !== undefined && generation !== sourceSpan.generation,
      )
    )
      throw new Error(
        "Face source closure needs the same compiler generation.",
      );
  }
  const poseNative: (
    state: ReturnType<typeof humanFaceBasisWeights>,
    geometry?: IHumanFacePoseGeometry,
    progress?: (owner: string) => void,
  ) => IHumanFaceNativePoseImported = createHumanFaceNativePose(basis);
  return (
    state: {
      weights: Map<string, number>;
      activations: { target: string; activation: number; shapeOnly: boolean }[];
    },
    shape: Record<string, number>,
    geometry: IHumanFacePoseGeometry | undefined,
    progress: ((owner: string) => void) | undefined,
  ): {
    oral?: IHumanFaceOralAssemblyImported | undefined;
    jawMotion?: IAutoMovieHumanFaceRigidMotionImported | undefined;
    periocularTissues?: IHumanFacePeriocularTissuePartImported[] | undefined;
    reference?: Map<string, number[]> | undefined;
    optics?: IHumanFaceOpticalAssemblyImported[] | undefined;
    checks: IHumanConstructionCheckImported[];
    positions: Map<string, number[]>;
    normals: Map<string, number[]>;
    summary: IAutoMovieHumanFaceContactSummary | null;
  } => {
    const checks: IHumanFacePoseResult["checks"][number][] = [];
    const { skinRelief, oral }: IHumanFacePoseGeometry = geometry ?? {};
    const periocularTissues:
      | IAutoMovieHumanFacePeriocularTissuesImported
      | undefined = createHumanFacePeriocularDefaults(basis, geometry);
    const fixed: (weight: number) => {
      weights: Map<string, number>;
      activations: { target: string; activation: number; shapeOnly: boolean }[];
    } = (
      weight: number,
    ): {
      weights: Map<string, number>;
      activations: { target: string; activation: number; shapeOnly: boolean }[];
    } =>
      humanFaceBasisWeights(basis, {
        shape,
        expression: Object.fromEntries(
          basis.channels
            .filter(
              (channel: IAutoMovieHumanFaceBasisChannelImported): boolean =>
                channel.kind === "expression",
            )
            .map(
              (
                channel: IAutoMovieHumanFaceBasisChannelImported,
              ): [string, number] => [
                channel.id,
                channel.id === contact!.closure.channel
                  ? weight
                  : (state.weights.get(channel.id) ?? 0),
              ],
            ),
        ),
      });
    const native: IHumanFaceNativePoseImported = poseNative(
      sourceSpan === undefined ? state : fixed(0),
      geometry,
      progress,
    );
    const closureWeight: number =
      contact === undefined
        ? 0
        : (state.weights.get(contact.closure.channel) ?? 0);
    const posed: Map<string, number[]> =
      sourceSpan === undefined
        ? native.posed
        : closureWeight === 0
          ? ((): Map<string, number[]> => {
              assertHumanFaceSourceClosurePlan(sourceSpan, native.posed);
              return new Map(
                [...native.posed].map(
                  ([id, positions]: [string, number[]]): [string, number[]] => [
                    id,
                    [...positions],
                  ],
                ),
              );
            })()
          : applyHumanFaceSourceClosure(
              sourceSpan,
              native.posed,
              poseNative(
                fixed(1),
                geometry,
                progress === undefined
                  ? undefined
                  : (owner: string): void =>
                      progress("closure-endpoint:" + owner),
              ).posed,
              closureWeight,
            );
    if (sourceSpan !== undefined)
      progress?.(
        closureWeight === 0
          ? "pose:source-closure-zero"
          : "pose:source-closure-endpoint",
      );
    const preparation: IHumanFaceReferencePreparationImported =
      prepareHumanFaceReference({
        basis,
        state,
        geometry,
        native,
        progress,
      });
    progress?.("pose:reference-preparation");
    const shaped:
      | {
          surfaces: number[][];
          landmarks: Record<string, IAutoMovieVector3Imported>;
        }
      | undefined = preparation.shaped;
    // The lid margin is seated on the generated ocular exterior before any
    // stage reads the skin, so contact, tissue and every measurement see one
    // rest and one performed lid.
    const optics: IHumanFaceOpticalAssemblyImported[] | undefined =
      preparation.optics;
    for (const eye of optics ?? []) {
      const cage: IAutoMovieHumanFacePeriocularCageImported | undefined =
        basis.periocular?.[eye.side].cage;
      if (cage === undefined) continue;
      assertHumanFacePeriocularCage(basis, cage);
      const host: number = basis.surfaces.findIndex(
        (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
          surface.id === cage.surface,
      );
      const samples: readonly number[] =
        basis.surfaces[host].sourcePartition!.samples;
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
    const oralAssembly: IHumanFaceOralAssemblyImported | undefined =
      oral === undefined
        ? undefined
        : shaped === undefined
          ? ((): never => {
              throw new Error(
                "Oral assembly needs its shape-only source reference.",
              );
            })()
          : ((): IHumanFaceOralAssemblyImported => {
              const reference: Map<string, number[]> = new Map(
                basis.surfaces.map(
                  (
                    surface: IAutoMovieHumanFaceBasisSurfaceImported,
                    at: number,
                  ): [string, number[]] => [surface.id, shaped.surfaces[at]],
                ),
              );
              const jaw: IAutoMovieHumanFaceRigidMotionImported | undefined =
                native.motions?.get("jaw");
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
        throw new Error(
          "Skin relief needs its same shape-only material reference.",
        );
      const relieved: ReadonlyMap<string, readonly number[]> =
        applyHumanFaceRegionalRelief(
          basis,
          applyHumanFaceNasolabialRelief(
            basis,
            posed,
            state.weights,
            skinRelief,
            preparation.materialReference,
          ),
          skinRelief,
          preparation.materialReference,
        );
      for (const [id, positions] of relieved)
        if (positions !== posed.get(id)) posed.set(id, [...positions]);
      progress?.("pose:skin-relief");
    }
    const reference: Map<string, number[]> | undefined = preparation.complete();
    progress?.("pose:reference-complete");
    let summary: IAutoMovieHumanFaceContactSummary | null = null;
    const generated: Map<string, IHumanFaceDynamicCollider[]> = new Map<
      string,
      IHumanFaceDynamicCollider[]
    >();
    for (const eye of optics ?? []) {
      const entries: IHumanFaceDynamicCollider[] =
        generated.get(eye.surface) ?? [];
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
          (id: string): boolean =>
            !contact.colliders.some(
              (c: IAutoMovieHumanFaceContactColliderImported): boolean =>
                c.surface === id,
            ),
        ))
    )
      throw new Error(
        "Independent optics need their registered exterior in the source contact assembly.",
      );
    if (contact !== undefined) {
      const resolved: IAutoMovieHumanFaceContactResolutionSummaryImported[] =
        resolveHumanFaceContact(
          basis,
          contact,
          posed,
          new Map(
            basis.surfaces.map(
              (
                surface: IAutoMovieHumanFaceBasisSurfaceImported,
                index: number,
              ): [string, number[]] => [surface.id, shaped!.surfaces[index]],
            ),
          ),
          generated,
        );
      const pair: (entry: IAutoMovieHumanFaceMidlinePairImported) => {
        upper: IAutoMovieVector3Imported;
        lower: IAutoMovieVector3Imported;
        gap: number;
      } = (
        entry: typeof contact.lips,
      ): {
        upper: IAutoMovieVector3Imported;
        lower: IAutoMovieVector3Imported;
        gap: number;
      } => {
        const positions: number[] = posed.get(entry.surface)!;
        const point: (vertex: number) => IAutoMovieVector3Imported = (
          vertex: number,
        ): IAutoMovieVector3Imported =>
          Vector3.create(
            positions[3 * vertex],
            positions[3 * vertex + 1],
            positions[3 * vertex + 2],
          );
        const upper: IAutoMovieVector3Imported = point(entry.upper);
        const lower: IAutoMovieVector3Imported = point(entry.lower);
        return {
          upper,
          lower,
          gap: measureHumanFaceApertureGap(upper, lower, native.up!),
        };
      };
      const authoredLips: {
        upper: IAutoMovieVector3Imported;
        lower: IAutoMovieVector3Imported;
        gap: number;
      } = pair(contact.lips);
      const lips: {
        upper: IAutoMovieVector3Imported;
        lower: IAutoMovieVector3Imported;
        gap: number;
      } =
        sourceSpan === undefined
          ? authoredLips
          : pair({
              surface: sourceSpan.surface,
              upper: sourceSpan.representativePair[0],
              lower: sourceSpan.representativePair[1],
            });
      const missingIncisor: boolean =
        oralAssembly !== undefined &&
        contact.incisors.surface === oralAssembly.dentalSurface &&
        [contact.incisors.upper, contact.incisors.lower].some(
          (vertex: number): boolean =>
            oralAssembly.absentDentalVertices.has(vertex),
        );
      const incisors:
        | {
            upper: IAutoMovieVector3Imported;
            lower: IAutoMovieVector3Imported;
            gap: number;
          }
        | undefined = missingIncisor ? undefined : pair(contact.incisors);
      const { up, forward }: IHumanFaceApertureDirections =
        resolveHumanFaceApertureDirections(basis.articulation!.jaw.axis);
      const passage: {
        protrudingMetres: number;
        thicknessMetres: number;
      } | null =
        oralAssembly === undefined
          ? evaluateHumanFacePassage(
              contact,
              posed.get(contact.passage.surface)!,
              { up, forward, lips, incisors: incisors! },
              basis.surfaces.find(
                (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
                  surface.id === contact.passage.surface,
              )!.indices,
            )
          : ((): IAutoMovieHumanFaceTonguePassageSummaryImported | null => {
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
                basis.surfaces.find(
                  (surface: IAutoMovieHumanFaceBasisSurfaceImported): boolean =>
                    surface.id === contact.lips.surface,
                )!,
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
    const finalOral: IHumanFaceOralAssemblyImported | undefined =
      oralAssembly === undefined
        ? undefined
        : connectHumanFaceOralLipPorts(
            basis,
            oralAssembly,
            posed,
            native.motions!.get("jaw")!,
          );
    if (finalOral !== undefined) progress?.("pose:oral-ports");
    const normals: Map<string, number[]> = new Map(
      basis.surfaces.map(
        (
          surface: IAutoMovieHumanFaceBasisSurfaceImported,
        ): [string, number[]] => [
          surface.id,
          areaWeightedNormals(posed.get(surface.id)!, surface.indices),
        ],
      ),
    );
    progress?.("pose:normals");
    const tissues: IHumanFacePeriocularTissuePartImported[] | undefined =
      periocularTissues === undefined
        ? undefined
        : ((): IHumanFacePeriocularTissuePartImported[] => {
            if (reference === undefined)
              throw new Error(
                "Periocular tissues need their actual shape-only source reference.",
              );
            const exteriors: (
              state: "rest" | "posed",
            ) => Map<"left" | "right", IHumanFaceOcularSurfaceImported> = (
              state: "rest" | "posed",
            ): Map<"left" | "right", IHumanFaceOcularSurfaceImported> =>
              new Map(
                (optics ?? []).map(
                  (
                    eye: IHumanFaceOpticalAssemblyImported,
                  ): ["left" | "right", IHumanFaceOcularSurfaceImported] => [
                    eye.side,
                    eye.exterior[state],
                  ],
                ),
              );
            const resting: IHumanFacePeriocularTissuePartImported[] =
              buildHumanFacePeriocularTissues(
                basis,
                reference,
                new Map(
                  basis.surfaces.map(
                    (
                      surface: IAutoMovieHumanFaceBasisSurfaceImported,
                    ): [string, number[]] => [
                      surface.id,
                      areaWeightedNormals(
                        [...reference.get(surface.id)!],
                        surface.indices,
                      ),
                    ],
                  ),
                ),
                exteriors("rest"),
                periocularTissues,
                progress === undefined
                  ? undefined
                  : (owner: string): void => progress("rest:" + owner),
              );
            progress?.("pose:periocular-rest");
            checks.push(
              createHumanFaceClearanceCheck(
                "periocular-rest",
                "Periocular rest shell exceeds its lid or intersects its optical exterior or another shell",
                (): IAutoMovieHumanConstructionClearanceReadingImported[] =>
                  readHumanFacePeriocularTissueSpace(
                    basis,
                    reference,
                    resting,
                    optics,
                    "rest",
                  ),
              ),
            );
            const performed: IHumanFacePeriocularTissuePartImported[] =
              buildHumanFacePeriocularTissues(
                basis,
                posed,
                normals,
                exteriors("posed"),
                periocularTissues,
                progress === undefined
                  ? undefined
                  : (owner: string): void => progress("posed:" + owner),
              );
            progress?.("pose:periocular-performed");
            checks.push(
              createHumanFaceClearanceCheck(
                "periocular-performed",
                "Periocular performed shell exceeds its lid or intersects its optical exterior or another shell",
                (): IAutoMovieHumanConstructionClearanceReadingImported[] =>
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
