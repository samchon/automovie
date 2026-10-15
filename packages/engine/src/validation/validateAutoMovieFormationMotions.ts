import {
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledShotSource,
  IAutoMovieDiagnostic,
  IAutoMovieFormationLayout,
  IAutoMovieFormationMotion,
  IAutoMovieGait,
  IAutoMovieModel,
  IAutoMovieShotContract,
  IAutoMovieShotParticipant,
} from "@automovie/interface";

import { autoMovieModelGaits } from "../index";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Check bounded formation cues against participating compiled formations, runtime gait repertoire, finite state, layout and nonoverlapping intervals.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Check bounded formation cues against participating compiled formations, runtime gait repertoire, finite state, layout and nonoverlapping intervals.
 * @evidence contracts/common.md#clear-and-simple-design Request-local runtime/repertoire maps share model gait reads across cues and deterministic ordering groups each unit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 256-cue cap is a diagnostic, not truncation; unknown runtime models contribute no repertoire rather than an invented gait.
 * @evidence contracts/common.md#meaningful-documentation Paths identify cue fields; optional layout means no new reform target and supported easing names remain closed.
 * @evidence contracts/performance.md#efficient-algorithms C sorting plus formation/model repertoire scans dominate; formation find remains O(CF), with O(F+M+C) local indexes.
 * @evidence contracts/performance.md#reuse-equivalent-work The existing gait owner supplies repertoire and maps live only for this shot's current inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostics escape; local sets/maps borrow compiled records without retaining a host bake or animation task.
 */
export const validateAutoMovieFormationMotions: (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
) => IAutoMovieDiagnostic[] = (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const fail: (field: string, expectation: string) => void = (
    field: string,
    expectation: string,
  ): void => {
    diagnostics.push(engineDiagnostic(contract.id, field, expectation));
  };
  if (value.formationMotions.length > 256)
    fail(
      "formationMotions",
      "must contain at most 256 compact cues rather than per-member curves",
    );
  const ids: Set<string> = new Set<string>();
  const participating: Set<string> = new Set(
    contract.participants.flatMap(
      (participant: IAutoMovieShotParticipant): string[] =>
        participant.kind === "formation" ? [participant.id] : [],
    ),
  );
  const priorByFormation: Map<string, IAutoMovieFormationMotion> = new Map<
    string,
    IAutoMovieCompiledShotSource["formationMotions"][number]
  >();
  // What each unit's own tier figures can perform, read through the engine's
  // answer rather than a second one, so a cue this compile accepts is one the
  // viewer's bake accepts too. A unit whose figures declare nothing is a crowd
  // of props and has no repertoire to disagree with, exactly as the bake reads
  // it.
  const runtimeById: Map<string, IAutoMovieModel> = new Map(
    value.models.map((model: IAutoMovieModel): [string, IAutoMovieModel] => [
      model.id,
      model,
    ]),
  );
  const repertoire: Map<string, Set<string>> = new Map(
    value.formations.map(
      (formation: IAutoMovieCompiledFormation): [string, Set<string>] => [
        formation.id,
        new Set(
          formation.lod.flatMap(
            (tier: IAutoMovieCompiledFormationLod): string[] => {
              const model: IAutoMovieModel | undefined = runtimeById.get(
                tier.runtimeModel,
              );
              return model === undefined
                ? []
                : autoMovieModelGaits(model).map(
                    (gait: IAutoMovieGait): string => gait.name,
                  );
            },
          ),
        ),
      ],
    ),
  );
  for (const cue of [...value.formationMotions].sort(
    (
      left: IAutoMovieFormationMotion,
      right: IAutoMovieFormationMotion,
    ): number =>
      compareCodeUnits(left.formation, right.formation) ||
      left.start - right.start ||
      compareCodeUnits(left.id, right.id),
  )) {
    if (cue.id.trim().length === 0 || ids.has(cue.id))
      fail(
        `formationMotion:${cue.id || "(blank)"}`,
        "must have one non-blank id unique inside the shot",
      );
    ids.add(cue.id);
    if (
      participating.has(cue.formation) === false ||
      value.formations.some(
        (formation: IAutoMovieCompiledFormation): boolean =>
          formation.id === cue.formation,
      ) === false
    )
      fail(
        `formationMotion:${cue.id}.formation`,
        `must reference participating compiled formation "${cue.formation}"`,
      );
    // The arrangement a cue re-forms into has to be one this unit can stand
    // in. A lattice narrower than the unit is a member with no place, and a
    // lattice of zero files is a division by zero inside the placement itself
    // -- neither is a picture, and both are the author's to correct here
    // rather than the renderer's to discover.
    const target: IAutoMovieFormationLayout | undefined = cue.layout;
    const unit: IAutoMovieCompiledFormation | undefined = value.formations.find(
      (formation: IAutoMovieCompiledFormation): boolean =>
        formation.id === cue.formation,
    );
    if (target !== undefined && unit !== undefined) {
      const lattice: { ranks: number; files: number } | null =
        target.kind === "line" || target.kind === "column"
          ? { ranks: target.ranks, files: target.files }
          : null;
      if (
        lattice !== null &&
        (Number.isSafeInteger(lattice.ranks) === false ||
          Number.isSafeInteger(lattice.files) === false ||
          lattice.ranks < 1 ||
          lattice.files < 1 ||
          lattice.ranks * lattice.files < unit.count)
      )
        fail(
          `formationMotion:${cue.id}.layout`,
          `must seat all ${unit.count} members in whole ranks and files rather than ${lattice.ranks} x ${lattice.files}`,
        );
    }
    const declared: Set<string> | undefined = repertoire.get(cue.formation);
    if (
      cue.gait !== undefined &&
      declared !== undefined &&
      declared.size !== 0 &&
      declared.has(cue.gait) === false
    )
      fail(
        `formationMotion:${cue.id}.gait`,
        `must name one of the gaits this unit's figures declare (${[...declared]
          .sort(compareCodeUnits)
          .join(", ")}) rather than "${cue.gait}"`,
      );
    if (
      Number.isFinite(cue.start) === false ||
      Number.isFinite(cue.end) === false ||
      cue.start < 0 ||
      cue.end <= cue.start ||
      cue.end > contract.durationSeconds
    )
      fail(
        `formationMotion:${cue.id}.time`,
        `must be one positive interval inside 0..${contract.durationSeconds}s`,
      );
    for (const [name, state] of [
      ["from", cue.from],
      ["to", cue.to],
    ] as const) {
      if (
        [state.translation.x, state.translation.y, state.translation.z].some(
          (number: number): boolean =>
            Number.isFinite(number) === false ||
            Math.abs(number) > 1_000_000_000,
        ) ||
        Number.isFinite(state.facingOffsetDeg) === false ||
        Math.abs(state.facingOffsetDeg) > 360_000
      )
        fail(
          `formationMotion:${cue.id}.${name}`,
          "must keep translation inside +/-1000000000m and facing inside +/-360000 degrees",
        );
      if (
        [state.spacingScale.lateral, state.spacingScale.depth].some(
          (number: number): boolean =>
            Number.isFinite(number) === false || number < 0.25 || number > 4,
        )
      )
        fail(
          `formationMotion:${cue.id}.${name}.spacingScale`,
          "must stay inside the bounded 0.25..4 envelope",
        );
    }
    const prior: IAutoMovieFormationMotion | undefined = priorByFormation.get(
      cue.formation,
    );
    if (prior !== undefined && cue.start < prior.end)
      fail(
        `formationMotion:${cue.id}.start`,
        `must not overlap prior cue "${prior.id}" ending at ${prior.end}s`,
      );
    priorByFormation.set(cue.formation, cue);
  }
  return diagnostics;
};
