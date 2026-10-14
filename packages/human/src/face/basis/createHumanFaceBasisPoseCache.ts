import type {
  IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported,
  IAutoMovieHumanFaceNasolabialRelief as IAutoMovieHumanFaceNasolabialReliefImported,
} from "../../index";
import type { AutoMovieHumanFacePeriocularTissue as AutoMovieHumanFacePeriocularTissueImported } from "../structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceLidSectionDisplacement } from "../structures/IAutoMovieHumanFaceLidSectionDisplacement";
import type { IAutoMovieHumanFaceLidSections as IAutoMovieHumanFaceLidSectionsImported } from "../structures/IAutoMovieHumanFaceLidSections";
import type { IAutoMovieHumanFaceOcularSurfaceShape as IAutoMovieHumanFaceOcularSurfaceShapeImported } from "../structures/IAutoMovieHumanFaceOcularSurfaceShape";
import type { IAutoMovieHumanFaceOralTooth } from "../structures/IAutoMovieHumanFaceOralTooth";
import type { IAutoMovieHumanFacePeriocularTissueSection } from "../structures/IAutoMovieHumanFacePeriocularTissueSection";
import type { IAutoMovieHumanFaceRegionalRelief } from "../structures/IAutoMovieHumanFaceRegionalRelief";
import type { IHumanFacePoseCacheEntry } from "./IHumanFacePoseCacheEntry";
import type { IHumanFacePoseGeometry } from "./IHumanFacePoseGeometry";
import { humanFaceBasisWeights } from "./humanFaceBasisWeights";

/**
 * Retain one posed foundation across appearance-only edits. The channel list
 * fixes comparison order; omission and an explicit zero describe the same
 * rest pose. Corrective activation, joint motion and contact are functions of
 * these admitted weights, so any changed weight replaces the retained result.
 * The evaluator receives the shape record because reference aperture closure
 * measures the same identity; it may cache only outputs that downstream
 * appearance, hair, observer and renderer consumers treat as read-only.
 * It consumes the admitted channel weights; the basis and weight admission
 * stage retain the channel identities, ranges and dependencies. Comparing
 * these values does not certify independent anatomical traits or their ranges.
 * An optional observer is forwarded only to an actual evaluation on a miss and
 * is not a cache key. Evaluation and observer exceptions leave the old entry
 * intact; a completed cached pose emits no new internal work completions.
 *
 * @evidence contracts/common.md#principled-implementation The fixed compiled basis makes ordered channel weights and the serialized optical, relief, oral, brow/lash and lid inputs determine geometry. Current builder callers supply admitted weights and treat returned geometry as read-only; this is not a cache for a replaceable basis or independently inconsistent activation records.
 * @evidence contracts/common.md#clear-and-simple-design One latest entry belongs to the builder's pose stage; appearance-only composition remains downstream and the progress callback remains an effect of actual evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted weights normalize to zero; explicit scans refuse nonfinite weights and optical/relief/oral/tissue/lid/ocular dimensions. Brow/lash/phenotype records rely on the builder's exact document and owner admission. The key's equivalence does not support arbitrary JSON objects or independently inconsistent states.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies the immutable basis and read-only output premises, omitted-zero equivalence, observer miss-only effects and preservation of the old entry on an evaluation failure.
 * @evidence contracts/performance.md#efficient-algorithms With C channels and G serialized geometry values, key construction and equality cost O(C+G), retaining that key and one full pose; misses still pay the complete pose evaluator's geometry/contact costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Channel values and every currently supported geometry section form the key; iris/material/skin colour edits do not change these positions. A changed key replaces the result only after evaluation completes, and callbacks are not replayed on hits.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains fixed channel ids, one key and one result until replacement or builder release; caller-held previous results remain outside its ownership. It owns no worker, viewer or external handle.
 */
export function createHumanFaceBasisPoseCache<T>(
  channels: readonly Pick<IAutoMovieHumanFaceBasis["channels"][number], "id">[],
  evaluate: (
    state: ReturnType<typeof humanFaceBasisWeights>,
    shape: IAutoMovieHumanFaceBasisDocument["shape"],
    geometry?: IHumanFacePoseGeometry,
    progress?: (owner: string) => void,
  ) => T,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
  geometry?: IHumanFacePoseGeometry,
  progress?: (owner: string) => void,
) => T {
  const ids: string[] = channels.map(
    (channel: Pick<IAutoMovieHumanFaceBasisChannelImported, "id">): string =>
      channel.id,
  );
  let last: IHumanFacePoseCacheEntry<T> | undefined;
  return (
    state: {
      weights: Map<string, number>;
      activations: { target: string; activation: number; shapeOnly: boolean }[];
    },
    shape: Record<string, number>,
    geometry: IHumanFacePoseGeometry | undefined,
    progress: ((owner: string) => void) | undefined,
  ): T => {
    const {
      eyes,
      skinRelief,
      oral,
      periocularTissues,
      brows,
      lashes,
      eyelids,
      eyelidPhenotypes,
      ocularSurfaces,
    }: IHumanFacePoseGeometry = geometry ?? {};
    const weights: number[] = ids.map(
      (id: string): number => state.weights.get(id) ?? 0,
    );
    const dimensions: number[][] | null =
      eyes === undefined
        ? null
        : (["left", "right"] as const).map(
            (side: "left" | "right"): number[] => [
              eyes[side].globeRadiusMm,
              eyes[side].limbusRadiusMm,
              eyes[side].apexCurvatureRadiusMm,
              eyes[side].centralThicknessMicrometres,
              eyes[side].irisOuterRadiusMm,
              eyes[side].irisApertureRadiusMm,
              eyes[side].irisDepthFromAnteriorSupportMm,
            ],
          );
    const relief: (number[] | null)[] | null =
      skinRelief === undefined
        ? null
        : (["left", "right"] as const).map(
            (side: "left" | "right"): number[] | null => {
              const one:
                | IAutoMovieHumanFaceNasolabialReliefImported
                | undefined = skinRelief.nasolabial?.[side];
              return one === undefined
                ? null
                : [one.restDepthMm ?? 0, one.smileDepthMm ?? 0, one.widthMm];
            },
          );
    const regionalValues: number[] = Object.values(
      skinRelief?.regions ?? {},
    ).flatMap(
      (region: IAutoMovieHumanFaceRegionalRelief | undefined): number[] =>
        region === undefined
          ? []
          : Object.values(region).filter(
              (value: number | undefined): boolean => value !== undefined,
            ),
    );
    if (
      [
        ...weights,
        ...(dimensions?.flat() ?? []),
        ...(relief?.flatMap((one: number[] | null): number[] => one ?? []) ??
          []),
        ...regionalValues,
      ].some((value: number): boolean => !Number.isFinite(value))
    )
      throw new Error(
        "Pose cache keys need finite admitted geometric inputs; nonfinite values cannot alias an omitted optional value.",
      );
    const oralValues: number[] = Object.values(oral?.teeth ?? {}).flatMap(
      (tooth: IAutoMovieHumanFaceOralTooth | undefined): number[] =>
        tooth === undefined
          ? []
          : [tooth.widthMm, tooth.heightMm, tooth.depthMm].filter(
              (value: number | undefined): value is number =>
                value !== undefined,
            ),
    );
    for (const group of [
      oral?.maxillary,
      oral?.mandibular,
      oral?.space,
      oral?.tongue,
      oral?.performance,
    ])
      if (group !== undefined)
        for (const value of Object.values(group))
          if (typeof value === "number") oralValues.push(value);
    if (oralValues.some((value: number): boolean => !Number.isFinite(value)))
      throw new Error(
        "Oral pose keys need finite numerical dimensions and performance.",
      );
    const tissueValues: number[] = [
      periocularTissues?.left,
      periocularTissues?.right,
    ].flatMap(
      (
        side:
          | Partial<
              Record<
                AutoMovieHumanFacePeriocularTissueImported,
                IAutoMovieHumanFacePeriocularTissueSection
              >
            >
          | undefined,
      ): number[] =>
        Object.values(side ?? {}).flatMap(
          (
            section: IAutoMovieHumanFacePeriocularTissueSection | undefined,
          ): number[] =>
            section === undefined
              ? []
              : [section.inwardOffsetMm, section.thicknessMm],
        ),
    );
    if (tissueValues.some((value: number): boolean => !Number.isFinite(value)))
      throw new Error("Periocular tissue pose keys need finite dimensions.");
    // Generated brow and lash geometry is composed downstream from these skin
    // arrays. Their profiles still invalidate the pose identity used by model AO.
    const lidValues: number[] = [eyelids?.left, eyelids?.right].flatMap(
      (side: IAutoMovieHumanFaceLidSectionsImported | undefined): number[] =>
        Object.values(side ?? {}).flatMap(
          (
            section: IAutoMovieHumanFaceLidSectionDisplacement | undefined,
          ): number[] =>
            section === undefined
              ? []
              : [section.elevationMm, section.projectionMm],
        ),
    );
    if (lidValues.some((value: number): boolean => !Number.isFinite(value)))
      throw new Error("Lid section pose keys need finite dimensions.");
    const ocularValues: number[] = [
      ocularSurfaces?.left,
      ocularSurfaces?.right,
    ].flatMap(
      (
        side: IAutoMovieHumanFaceOcularSurfaceShapeImported | undefined,
      ): number[] =>
        Object.values(side ?? {}).filter(
          (value: number | undefined): boolean => value !== undefined,
        ),
    );
    if (ocularValues.some((value: number): boolean => !Number.isFinite(value)))
      throw new Error("Ocular surface pose keys need finite dimensions.");
    const key: string = JSON.stringify([
      weights,
      dimensions,
      relief,
      skinRelief?.regions ?? null,
      oral ?? null,
      periocularTissues ?? null,
      brows ?? null,
      lashes ?? null,
      eyelids ?? null,
      eyelidPhenotypes ?? null,
      ocularSurfaces ?? null,
    ]);
    if (last === undefined || last.key !== key)
      last = { key, result: evaluate(state, shape, geometry, progress) };
    return last.result;
  };
}
