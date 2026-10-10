import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
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
  const ids = channels.map((channel) => channel.id);
  let last: IHumanFacePoseCacheEntry<T> | undefined;
  return (state, shape, geometry, progress) => {
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
    } = geometry ?? {};
    const weights = ids.map((id) => state.weights.get(id) ?? 0);
    const dimensions =
      eyes === undefined
        ? null
        : (["left", "right"] as const).map((side) => [
            eyes[side].globeRadiusMm,
            eyes[side].limbusRadiusMm,
            eyes[side].apexCurvatureRadiusMm,
            eyes[side].centralThicknessMicrometres,
            eyes[side].irisOuterRadiusMm,
            eyes[side].irisApertureRadiusMm,
            eyes[side].irisDepthFromAnteriorSupportMm,
          ]);
    const relief =
      skinRelief === undefined
        ? null
        : (["left", "right"] as const).map((side) => {
            const one = skinRelief.nasolabial?.[side];
            return one === undefined
              ? null
              : [one.restDepthMm ?? 0, one.smileDepthMm ?? 0, one.widthMm];
          });
    const regionalValues = Object.values(skinRelief?.regions ?? {}).flatMap(
      (region) =>
        region === undefined
          ? []
          : Object.values(region).filter((value) => value !== undefined),
    );
    if (
      [
        ...weights,
        ...(dimensions?.flat() ?? []),
        ...(relief?.flatMap((one) => one ?? []) ?? []),
        ...regionalValues,
      ].some((value) => !Number.isFinite(value))
    )
      throw new Error(
        "Pose cache keys need finite admitted geometric inputs; nonfinite values cannot alias an omitted optional value.",
      );
    const oralValues = Object.values(oral?.teeth ?? {}).flatMap((tooth) =>
      tooth === undefined
        ? []
        : [tooth.widthMm, tooth.heightMm, tooth.depthMm].filter(
            (value) => value !== undefined,
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
    if (oralValues.some((value) => !Number.isFinite(value)))
      throw new Error(
        "Oral pose keys need finite numerical dimensions and performance.",
      );
    const tissueValues = [
      periocularTissues?.left,
      periocularTissues?.right,
    ].flatMap((side) =>
      Object.values(side ?? {}).flatMap((section) =>
        section === undefined
          ? []
          : [section.inwardOffsetMm, section.thicknessMm],
      ),
    );
    if (tissueValues.some((value) => !Number.isFinite(value)))
      throw new Error("Periocular tissue pose keys need finite dimensions.");
    // Generated brow and lash geometry is composed downstream from these skin
    // arrays. Their profiles still invalidate the pose identity used by model AO.
    const lidValues = [eyelids?.left, eyelids?.right].flatMap((side) =>
      Object.values(side ?? {}).flatMap((section) =>
        section === undefined
          ? []
          : [section.elevationMm, section.projectionMm],
      ),
    );
    if (lidValues.some((value) => !Number.isFinite(value)))
      throw new Error("Lid section pose keys need finite dimensions.");
    const ocularValues = [ocularSurfaces?.left, ocularSurfaces?.right].flatMap(
      (side) =>
        Object.values(side ?? {}).filter((value) => value !== undefined),
    );
    if (ocularValues.some((value) => !Number.isFinite(value)))
      throw new Error("Ocular surface pose keys need finite dimensions.");
    const key = JSON.stringify([
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
