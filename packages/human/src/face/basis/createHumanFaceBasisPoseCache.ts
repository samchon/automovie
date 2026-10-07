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
 *
 * @evidence contracts/common.md#principled-implementation Retains ordered admitted weights and named geometric profiles read by pose and downstream generated parts; omitted and explicit zero channel weights compare equal because both evaluate as zero, while profile changes replace the shared geometric identity.
 * @evidence contracts/common.md#clear-and-simple-design One retained entry keyed by ordered weights and the actual geometric document members; no eviction policy or alternative evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No test-only or subject-specific logic; a changed weight always recomputes.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes admitted channel weights from geometric profiles and requires downstream consumers to treat retained outputs as read-only.
 * @evidence contracts/modeling.md#parameter-channels Preserves the channel owner's neutral-zero weights and document member identities without reinterpreting their measurement or motion meaning.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping createHumanFaceBasisPoseCache is a pure computation and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry createHumanFaceBasisPoseCache decides no primitive population of a form.
 * @evidenceExclude contracts/modeling.md#shared-boundaries createHumanFaceBasisPoseCache constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation createHumanFaceBasisPoseCache owns no part, group or joint that a viewer displays; its consumers own the observation.
 * @evidenceExclude contracts/modeling.md#spatial-conventions createHumanFaceBasisPoseCache keeps the caller's unit and frame and converts nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source createHumanFaceBasisPoseCache carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range createHumanFaceBasisPoseCache admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority createHumanFaceBasisPoseCache defines no input through which a caller shapes a human form.
 */
export function createHumanFaceBasisPoseCache<T>(
  channels: readonly Pick<IAutoMovieHumanFaceBasis["channels"][number], "id">[],
  evaluate: (
    state: ReturnType<typeof humanFaceBasisWeights>,
    shape: IAutoMovieHumanFaceBasisDocument["shape"],
    geometry?: IHumanFacePoseGeometry,
  ) => T,
): (
  state: ReturnType<typeof humanFaceBasisWeights>,
  shape: IAutoMovieHumanFaceBasisDocument["shape"],
  geometry?: IHumanFacePoseGeometry,
) => T {
  const ids = channels.map((channel) => channel.id);
  let last: IHumanFacePoseCacheEntry<T> | undefined;
  return (state, shape, geometry) => {
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
      last = { key, result: evaluate(state, shape, geometry) };
    return last.result;
  };
}
