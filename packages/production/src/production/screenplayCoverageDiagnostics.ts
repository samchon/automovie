import { IAutoMovieAcceptanceScenario, IAutoMovieBuildProjectInput, IAutoMovieCompiledContractRealization, IAutoMovieDiagnostic, IAutoMovieScreenplayIndex, IAutoMovieShotContract, type IAutoMovieScreenplayScene } from "@automovie/interface";

/**
 * Join scene citations to realization-map presence and required acceptance declarations, then report contradictory or missing coverage. Required declarations describe observation coverage; this function reads no pixels or review files.
 *
 * @evidence contracts/common.md#principled-implementation Exact scene-id sets join current contracts and required acceptance declarations to the index. Realization membership alone counts here, including a record whose caller collected post-validation errors; this is not an independent passing-realization gate.
 * @evidence contracts/common.md#clear-and-simple-design One coverage owner reports tombstone/disposition contradictions before active-scene observation and realization gaps; production-phase dispositions exempt active scenes from those latter checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source scope warns about unrealized scenes and every other scope reports them as errors; only review/final require declared observation coverage. The actual coordinator skips this coverage gate in design scope. Contradictions remain errors in every invocation, and no omitted scene or declaration is silently reactivated.
 * @evidence contracts/common.md#meaningful-documentation Documents null-index silence, exact citation joins, declaration-versus-pixel distinction, map-membership limitation, disposition handling and scope-dependent severity.
 * @evidence contracts/performance.md#efficient-algorithms Contract and acceptance citations are indexed once, then scene populations are scanned for contradictions and gaps. Time and temporary storage scale with citation and scene counts plus emitted message bytes; diagnostic array copying is proportional to findings.
 * @evidence contracts/performance.md#reuse-equivalent-work The two sets serve all scene checks in this call. Mutable contracts, declarations, realization maps and scope are reread on each build; no prior coverage result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input maps and screenplay are borrowed without mutation; temporary sets and filtered arrays last for the call and returned diagnostics belong to the caller. No handle or task is acquired and no scene-count cap is imposed.
 */
export const screenplayCoverageDiagnostics: (props: {
    /** Acceptance declarations; only required scenarios contribute scene ids. */
    acceptance: ReadonlyMap<string, IAutoMovieAcceptanceScenario>;

    /** Current shot contracts whose evidence citations identify covered scenes. */
    contracts: ReadonlyMap<string, IAutoMovieShotContract>;

    /** Current realization records; this gate tests membership rather than result status. */
    realizations: ReadonlyMap<string, IAutoMovieCompiledContractRealization>;

    /** Build scope deciding missing realization severity and declared observation coverage. */
    scope: IAutoMovieBuildProjectInput["scope"];

    /** Resident index to join, or null to leave index residency to its own gate. */
    screenplay: IAutoMovieScreenplayIndex | null;
}) => IAutoMovieDiagnostic[] = (props: {
  /** Acceptance declarations; only required scenarios contribute scene ids. */
  acceptance: ReadonlyMap<string, IAutoMovieAcceptanceScenario>;

  /** Current shot contracts whose evidence citations identify covered scenes. */
  contracts: ReadonlyMap<string, IAutoMovieShotContract>;

  /** Current realization records; this gate tests membership rather than result status. */
  realizations: ReadonlyMap<string, IAutoMovieCompiledContractRealization>;

  /** Build scope deciding missing realization severity and declared observation coverage. */
  scope: IAutoMovieBuildProjectInput["scope"];

  /** Resident index to join, or null to leave index residency to its own gate. */
  screenplay: IAutoMovieScreenplayIndex | null;
}): IAutoMovieDiagnostic[] => {
  if (props.screenplay === null) return [];
  const realized: Set<string> = new Set<string>();
  for (const [id, contract] of props.contracts) {
    if (props.realizations.get(id) === undefined) continue;
    for (const evidence of contract.evidence ?? [])
      realized.add(evidence.scene);
  }
  // A `production`-phase disposition is the index's own way of exempting a
  // scene from shot realization with an auditable reason, so honouring it is
  // the difference between a coverage gate and a demand that every scene be
  // shot. Tombstones need no exemption; they are not active.
  // A required acceptance scenario citing a scene is what claims that scene was
  // observed. The claim is a declaration in the ledger and this set is coverage
  // over declarations, not over pixels: whether the frames behind it exist is
  // asked by `review-evidence-missing`, and whether anyone looked at them is
  // stated in the evidence citation on the source that realizes the shot.
  const observed: Set<string> = new Set<string>();
  for (const scenario of props.acceptance.values()) {
    if (scenario.required !== true) continue;
    for (const evidence of scenario.evidence ?? [])
      observed.add(evidence.scene);
  }
  const diagnostics: IAutoMovieDiagnostic[] = [];
  // A ledger asserting both absence and realization contradicts itself, and
  // the contradiction is not a scope-dependent "not yet": it is wrong the
  // moment both records exist.
  for (const scene of props.screenplay.screenplay.scenes) {
    const claimed: boolean = realized.has(scene.id) || observed.has(scene.id);
    if (claimed === false) continue;
    if (scene.status === "OMITTED")
      diagnostics.push({
        code: "screenplay-tombstone-realized",
        category: "error",
        phase: "compile",
        target: "screenplay",
        path: null,
        message: `Scene "${scene.id}" is an OMITTED tombstone, yet a compiled realization or a required acceptance scenario cites it. The ledger asserts both absence and realized work. Remove the downstream claim or reactivate the scene, then compile again.`,
      });
    else if (scene.disposition !== null)
      diagnostics.push({
        code: "screenplay-disposition-realized",
        category: "error",
        phase: "compile",
        target: "screenplay",
        path: null,
        message: `Scene "${scene.id}" is exempted at the ${scene.disposition.phase} phase, yet a compiled realization or a required acceptance scenario cites it. Intentional omission and realized work contradict each other. Remove the disposition or the downstream claim, then compile again.`,
      });
  }
  const active: IAutoMovieScreenplayScene[] = props.screenplay.screenplay.scenes.filter(
    (scene: IAutoMovieScreenplayScene) : boolean =>
      scene.status === "active" && scene.disposition?.phase !== "production",
  );
  // Observation is the review scopes' bar, not authoring's. A film being built
  // has scenes nobody has looked at yet by construction; a film presented for
  // review is claiming somebody did.
  const unobserved: IAutoMovieScreenplayScene[] =
    props.scope === "review" || props.scope === "final"
      ? active.filter((scene: IAutoMovieScreenplayScene) : boolean => observed.has(scene.id) === false)
      : [];
  if (unobserved.length !== 0)
    diagnostics.push({
      code: "screenplay-scene-unobserved",
      category: "error",
      phase: "compile",
      target: "screenplay",
      path: null,
      message: `Active ${unobserved.length === 1 ? "scene" : "scenes"} ${unobserved
        .map((scene: IAutoMovieScreenplayScene) : string => `"${scene.id}"`)
        .join(
          ", ",
        )} ${unobserved.length === 1 ? "has" : "have"} no required acceptance scenario citing them. A compiled realization is not an observation, so nothing here was ever looked at. Author a required acceptance scenario citing the scene, or record a phase-local disposition, then compile again.`,
    });
  const uncovered: IAutoMovieScreenplayScene[] = active.filter((scene: IAutoMovieScreenplayScene) : boolean => realized.has(scene.id) === false);
  if (uncovered.length === 0) return diagnostics;
  return [
    ...diagnostics,
    {
      code: "screenplay-scene-unrealized",
      category: props.scope === "source" ? "warning" : "error",
      phase: "compile",
      target: "screenplay",
      path: null,
      message: `Active ${uncovered.length === 1 ? "scene" : "scenes"} ${uncovered
        .map((scene: IAutoMovieScreenplayScene) : string => `"${scene.id}"`)
        .join(
          ", ",
        )} ${uncovered.length === 1 ? "has" : "have"} no shot with a passing compiled realization.${
        props.scope === "source"
          ? " The film does not cover its screenplay yet; it must before review."
          : " Build and compile a citing shot, or record the scene as OMITTED."
      }`,
    },
  ];
};
