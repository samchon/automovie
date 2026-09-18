import { IAutoMovieCompiledShotSource, IAutoMovieDiagnostic, IAutoMovieShotContract } from "@automovie/interface";
import { autoMovieModelGaits } from "../index";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { engineDiagnostic } from "./engineDiagnostic";

/**
 * Validate bounded source-authored formation cues against one compiled shot.
 *
 * @author Samchon
 */
export const validateAutoMovieFormationMotions = (
  contract: IAutoMovieShotContract,
  value: IAutoMovieCompiledShotSource,
): IAutoMovieDiagnostic[] => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const fail = (field: string, expectation: string): void => {
    diagnostics.push(engineDiagnostic(contract.id, field, expectation));
  };
  if (value.formationMotions.length > 256)
    fail(
      "formationMotions",
      "must contain at most 256 compact cues rather than per-member curves",
    );
  const ids = new Set<string>();
  const participating = new Set(
    contract.participants.flatMap((participant) =>
      participant.kind === "formation" ? [participant.id] : [],
    ),
  );
  const priorByFormation = new Map<
    string,
    IAutoMovieCompiledShotSource["formationMotions"][number]
  >();
  // What each unit's own tier figures can perform, read through the engine's
  // answer rather than a second one, so a cue this compile accepts is one the
  // viewer's bake accepts too. A unit whose figures declare nothing is a crowd
  // of props and has no repertoire to disagree with, exactly as the bake reads
  // it.
  const runtimeById = new Map(value.models.map((model) => [model.id, model]));
  const repertoire = new Map(
    value.formations.map((formation) => [
      formation.id,
      new Set(
        formation.lod.flatMap((tier) => {
          const model = runtimeById.get(tier.model);
          return model === undefined
            ? []
            : autoMovieModelGaits(model).map((gait) => gait.name);
        }),
      ),
    ]),
  );
  for (const cue of [...value.formationMotions].sort(
    (left, right) =>
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
      value.formations.some((formation) => formation.id === cue.formation) ===
        false
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
    const target = cue.layout;
    const unit = value.formations.find(
      (formation) => formation.id === cue.formation,
    );
    if (target !== undefined && unit !== undefined) {
      const lattice =
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
    const declared = repertoire.get(cue.formation);
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
          (number) =>
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
          (number) =>
            Number.isFinite(number) === false || number < 0.25 || number > 4,
        )
      )
        fail(
          `formationMotion:${cue.id}.${name}.spacingScale`,
          "must stay inside the bounded 0.25..4 envelope",
        );
    }
    const prior = priorByFormation.get(cue.formation);
    if (prior !== undefined && cue.start < prior.end)
      fail(
        `formationMotion:${cue.id}.start`,
        `must not overlap prior cue "${prior.id}" ending at ${prior.end}s`,
      );
    priorByFormation.set(cue.formation, cue);
  }
  return diagnostics;
};
