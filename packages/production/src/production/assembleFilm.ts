import { resolveProductionFrameRate } from "@automovie/engine";
import { IAutoMovieDiagnostic, IAutoMovieFilmEdit, IAutoMovieFilmTimeline, IAutoMovieProductionFrameRate, IAutoMovieShotContract, type IAutoMovieFilmTimelineSegment, type IAutoMovieWorldEffectZone } from "@automovie/interface";
import { filmGrammarDiagnostics } from "./filmGrammarDiagnostics";
import type { ISourceBuildResult } from "./ISourceBuildResult";
import { FILM_SOURCE_PATH } from "./FILM_SOURCE_PATH";


import type { ICompiledFilmDraft } from "./ICompiledFilmDraft";
import type { IProductionFilmAssemblyProps } from "./IProductionFilmAssemblyProps";
import { filmDiagnostic } from "./filmDiagnostic";
import { productionFilmAssemblyFrameTime } from "./productionFilmAssemblyFrameTime";
import { productionFilmAssemblyNormalizeAudioCues } from "./productionFilmAssemblyNormalizeAudioCues";
import { productionFilmAssemblyNormalizeCaptionCues } from "./productionFilmAssemblyNormalizeCaptionCues";
import { productionFilmAssemblyNormalizeEffectCues } from "./productionFilmAssemblyNormalizeEffectCues";
import { productionFilmAssemblyNormalizeTransition } from "./productionFilmAssemblyNormalizeTransition";
import { productionFilmAssemblyValidateVideoTimeline } from "./productionFilmAssemblyValidateVideoTimeline";

/**
 * Resolve an admitted film edit into a draft timeline against current shot contracts, compiled sources, and realizations. Any error returns a null draft; source-scope target-runtime differences remain warnings, and a null source preserves its original diagnostic array identity.
 *
 * @evidence contracts/common.md#principled-implementation Exact rational frame-grid conversion resolves placement and track boundaries, then contract accounting, source ranges, transitions, state predicates, and ordered timed tracks are validated. The canonical frame rate and schema-admitted edit are premises; grammar checks run only after structural errors are absent.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator retains the existing ordered validation sequence and delegates timing, transitions, continuity, and each track to focused helpers. The returned draft omits builder identity, compile fingerprint, and source digest because materializeFilmArtifacts seals those separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Runtime targets are binding from review onward, with the existing explicit source-scope warning policy. Invalid rows may be collected for further diagnostics but an error prevents draft acceptance; no omitted shot, fallback media, or subjective film approval is fabricated.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies borrowed source inputs, current contract premises, null/error behavior, source-scope severity, and unsealed draft ownership. Timeline assembly performs no media render or effect instantiation.
 * @evidence contracts/performance.md#efficient-algorithms Placements, omissions, and timed cues are scanned, with asset and zone membership scans and canonical continuity encoding adding their populations. The existing spread-based maximum materializes segment ends and can meet JavaScript argument-count limits for very large edits; no population quota is imposed.
 * @evidence contracts/performance.md#reuse-equivalent-work Resolved rate, shot maps, and intermediate segments are reused within this assembly. No result is cached across builds because edit, contracts, compiled sources, realizations, scope, and context determine validity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns copied diagnostics and the accepted draft arrays; edit and omission references remain borrowed rather than deeply frozen. Intermediate sets and arrays live through the call, and no native handles, workers, or cross-build cache are acquired.
 */
export const assembleFilm: (props: IProductionFilmAssemblyProps) => ISourceBuildResult<ICompiledFilmDraft> = (
  props: IProductionFilmAssemblyProps,
): ISourceBuildResult<ICompiledFilmDraft> => {
  const source: ISourceBuildResult<IAutoMovieFilmEdit> = props.source;
  if (source.value === null)
    return { value: null, diagnostics: source.diagnostics };
  const diagnostics: IAutoMovieDiagnostic[] = [...source.diagnostics];
  const edit: IAutoMovieFilmEdit = source.value;
  const frameRate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(
    props.context.production.frameFormat,
  );
  const fps: number = frameRate.numerator / frameRate.denominator;
  const targetFrames: number | null = productionFilmAssemblyFrameTime(
    { seconds: props.context.production.targetRuntimeSeconds },
    frameRate,
    "production target runtime",
    diagnostics,
  );
  if (edit.id !== props.context.production.id)
    diagnostics.push(
      filmDiagnostic(
        "film-id-mismatch",
        `Film id "${edit.id}" differs from production id "${props.context.production.id}". Return the current production id from ${FILM_SOURCE_PATH}.`,
      ),
    );
  const omitted: Set<string> = new Set<string>();
  for (const omission of edit.omissions) {
    if (
      omission.shot.trim().length === 0 ||
      omission.reason.trim().length === 0 ||
      omitted.has(omission.shot)
    )
      diagnostics.push(
        filmDiagnostic(
          "film-shot-accounting-invalid",
          `Omission "${omission.shot}" must name one unique current shot with a non-blank reason.`,
        ),
      );
    else omitted.add(omission.shot);
    if (props.contracts.has(omission.shot) === false)
      diagnostics.push(
        filmDiagnostic(
          "film-shot-unknown",
          `Omission "${omission.shot}" is not a current shot contract. Remove it or restore that contract.`,
        ),
      );
  }
  const used: Set<string> = new Set<string>();
  const segments: IAutoMovieFilmTimeline["segments"] = [];
  for (const placement of edit.tracks.video) {
    const contract: IAutoMovieShotContract | undefined = props.contracts.get(placement.shot);
    if (
      placement.shot.trim().length === 0 ||
      used.has(placement.shot) ||
      omitted.has(placement.shot)
    )
      diagnostics.push(
        filmDiagnostic(
          "film-shot-accounting-invalid",
          `Video shot "${placement.shot}" must appear once and cannot also be omitted.`,
        ),
      );
    else used.add(placement.shot);
    if (contract === undefined) {
      diagnostics.push(
        filmDiagnostic(
          "film-shot-unknown",
          `Video shot "${placement.shot}" is not a current shot contract.`,
        ),
      );
      continue;
    }
    if (
      props.compiled.has(placement.shot) === false ||
      props.realizations.has(placement.shot) === false
    )
      diagnostics.push(
        filmDiagnostic(
          "film-shot-not-compiled",
          `Shot "${placement.shot}" has no current compiled source and realization. Correct that shot before compiling the film.`,
        ),
      );
    const sourceInFrame: number | null = productionFilmAssemblyFrameTime(
      placement.sourceIn,
      frameRate,
      `${placement.shot} sourceIn`,
      diagnostics,
    );
    const sourceOutFrame: number | null = productionFilmAssemblyFrameTime(
      placement.sourceOut,
      frameRate,
      `${placement.shot} sourceOut`,
      diagnostics,
    );
    const startFrame: number | null = productionFilmAssemblyFrameTime(
      placement.start,
      frameRate,
      `${placement.shot} global start`,
      diagnostics,
    );
    const headHandleFrames: number | null = productionFilmAssemblyFrameTime(
      placement.handles.head,
      frameRate,
      `${placement.shot} head handle`,
      diagnostics,
    );
    const tailHandleFrames: number | null = productionFilmAssemblyFrameTime(
      placement.handles.tail,
      frameRate,
      `${placement.shot} tail handle`,
      diagnostics,
    );
    const transitionIn: IAutoMovieFilmTimeline["segments"][number]["transitionIn"] | null = productionFilmAssemblyNormalizeTransition(
      placement.transitionIn,
      frameRate,
      `${placement.shot} transitionIn`,
      diagnostics,
    );
    const transitionOut: IAutoMovieFilmTimeline["segments"][number]["transitionIn"] | null = productionFilmAssemblyNormalizeTransition(
      placement.transitionOut,
      frameRate,
      `${placement.shot} transitionOut`,
      diagnostics,
    );
    const shotFrames: number | null = productionFilmAssemblyFrameTime(
      { seconds: contract.durationSeconds },
      frameRate,
      `${placement.shot} contract duration`,
      diagnostics,
    );
    if (
      sourceInFrame === null ||
      sourceOutFrame === null ||
      startFrame === null ||
      headHandleFrames === null ||
      tailHandleFrames === null ||
      transitionIn === null ||
      transitionOut === null ||
      shotFrames === null
    )
      continue;
    if (
      sourceOutFrame <= sourceInFrame ||
      sourceOutFrame > shotFrames ||
      headHandleFrames > sourceOutFrame - sourceInFrame ||
      tailHandleFrames > sourceOutFrame - sourceInFrame
    )
      diagnostics.push(
        filmDiagnostic(
          "film-source-range-invalid",
          `Shot "${placement.shot}" source range ${sourceInFrame}..${sourceOutFrame} and handles ${headHandleFrames}/${tailHandleFrames} must fit its ${shotFrames}-frame contract.`,
        ),
      );
    segments.push({
      shot: placement.shot,
      sourceInFrame,
      sourceOutFrame,
      startFrame,
      endFrame: startFrame + sourceOutFrame - sourceInFrame,
      headHandleFrames,
      tailHandleFrames,
      transitionIn,
      transitionOut,
    });
  }
  for (const shot of props.contracts.keys())
    if (used.has(shot) === false && omitted.has(shot) === false)
      diagnostics.push(
        filmDiagnostic(
          "film-shot-unaccounted",
          `Shot "${shot}" is neither placed nor explicitly omitted. Account for every current narrative shot.`,
        ),
      );
  productionFilmAssemblyValidateVideoTimeline(segments, props, frameRate, diagnostics);
  const totalFrames: number =
    segments.length === 0
      ? 0
      : Math.max(...segments.map((item: IAutoMovieFilmTimelineSegment) : number => item.endFrame));
  // `targetRuntimeSeconds` is the production's *intended finished* runtime, so
  // a film edit shorter than it is the normal state of an unfinished
  // production, not an authoring error. Failing `source` scope on the gap would
  // make a target impossible to declare before the film that fills it exists,
  // which turns a stated intent into a value derived from whatever is built so
  // far. Delivery is where the two must agree, and `review` is already the
  // scope that judges the whole assembled film, so the gap is binding from
  // there on.
  if (targetFrames !== null && totalFrames !== targetFrames)
    diagnostics.push({
      ...filmDiagnostic(
        "film-runtime-mismatch",
        `Film timeline ends at frame ${totalFrames}, but production target runtime is frame ${targetFrames}.${
          props.scope === "source"
            ? " The film does not yet fill its intended runtime; it must before review."
            : " Correct placement timing or production runtime."
        }`,
      ),
      category: props.scope === "source" ? "warning" : "error",
    });
  const audio: IAutoMovieFilmTimeline["tracks"]["audio"] = productionFilmAssemblyNormalizeAudioCues(
    edit,
    props.context.assets,
    frameRate,
    totalFrames,
    diagnostics,
  );
  const captions: IAutoMovieFilmTimeline["tracks"]["captions"] = productionFilmAssemblyNormalizeCaptionCues(
    edit,
    frameRate,
    totalFrames,
    diagnostics,
  );
  const effects: IAutoMovieFilmTimeline["tracks"]["effects"] = productionFilmAssemblyNormalizeEffectCues(
    edit,
    props.context.effectZones.map((zone: IAutoMovieWorldEffectZone) : string => zone.id),
    frameRate,
    totalFrames,
    diagnostics,
  );
  // The mechanical read of the assembled edit, once the edit is known to hold
  // together. The analyzer requires one unique shot per placement, a positive
  // edited duration, and a compiled shot behind each one. These are exactly
  // what the checks above establish, and an edit that fails them publishes no
  // artifact for anyone to read a grammar out of.
  if (diagnostics.every((diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category !== "error"))
    diagnostics.push(
      ...filmGrammarDiagnostics({
        segments,
        fps,
        aspect:
          props.context.production.frameFormat.width /
          props.context.production.frameFormat.height,
        contracts: props.contracts,
        compiled: props.compiled,
      }),
    );
  return {
    value: diagnostics.some((diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category === "error")
      ? null
      : {
          edit,
          timeline: {
            version: 1,
            id: edit.id,
            fps,
            frameRate,
            totalFrames,
            segments,
            omissions: edit.omissions,
            tracks: { audio, captions, effects },
          },
        },
    diagnostics,
  };
};
