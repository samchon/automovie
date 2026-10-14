import type { IAutoMovieBuildProjectInput, IAutoMovieDiagnostic } from "@automovie/interface";
import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { type IAutoMovieFingerprintField, digestAutoMovieBytes, normalizeAutoMovieSource } from "./contentIdentity";
import { filmSourcePathDiagnostic, sourcePathDiagnostic } from "./productionBuildDiagnostics";
import { FILM_SOURCE_PATH } from "./productionFilmAssembly";

/**
 * Observe and normalize every declared shot module and the film entry once.
 *
 * Design scope records uninspected fields without reading source. Other scopes
 * retain absent-source diagnostics and fingerprint sentinels; normalization
 * preserves semantic whitespace and removes only declared BOM/EOL differences.
 *
 * @evidence contracts/common.md#principled-implementation Exact project reads feed the shared source normalizer and ordered fingerprint fields; missing bytes remain an absent field instead of becoming empty source, while design scope explicitly leaves source uninspected.
 * @evidence contracts/common.md#clear-and-simple-design One source-observation phase supplies both evaluation bytes and identity fields to the builder, avoiding an independent reread that could describe another revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot or expected source output is special-cased; read refusals retain their owner diagnostics and never trigger generated repair.
 * @evidence contracts/common.md#meaningful-documentation States scope behavior, normalization equivalence, absent-source handling and single-observation ownership.
 * @evidence contracts/performance.md#efficient-algorithms For S shots and total source bytes B, this phase performs O(S+B) reading, decoding and normalization work and holds O(S+B) normalized data and fingerprint fields. The film digest hashes its normalized bytes once.
 * @evidence contracts/performance.md#reuse-equivalent-work The same normalized buffers serve source fingerprinting and module evaluation during this attempt; fresh attempts read current source again and share no stale byte cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Project readers own and close file handles; returned buffers transfer to the compilation and have no fixed byte cap beyond declared sources. The phase retains nothing after return.
 */
export function readAutoMovieProductionBuildSources(props: {
  project: AutoMovieProductionProject;
  input: IAutoMovieBuildProjectInput;
  graph: ReturnType<AutoMovieProductionProject["graph"]>;
  sourceFields: IAutoMovieFingerprintField[];
  diagnostics: IAutoMovieDiagnostic[];
}): { shotSources: Map<string, Uint8Array>; filmSource: Uint8Array | null; filmSourceDigest: string | null } {
  const { project, input, graph, sourceFields, diagnostics }: typeof props = props;

  let filmSource: Uint8Array | null = null;
  let filmSourceDigest: string | null = null;
    const shotSources: Map<string, Uint8Array> = new Map<string, Uint8Array>();
    for (const [id, contract] of graph.shots) {
      if (input.scope === "design") {
        sourceFields.push({
          role: `source:${id}`,
          kind: "not-inspected",
          payload: new Uint8Array(),
        });
        continue;
      }
      let source: Uint8Array;
      try {
        source = project.readSource(contract.source.module);
      } catch (error) {
        diagnostics.push(
          sourcePathDiagnostic(id, contract.source.module, error),
        );
        sourceFields.push({
          role: `source:${id}`,
          kind: "absent",
          payload: new Uint8Array(),
        });
        continue;
      }
      const normalized: Uint8Array = normalizeAutoMovieSource(source);
      shotSources.set(id, normalized);
      sourceFields.push({
        role: `source:${id}`,
        kind: "typescript",
        payload: normalized,
      });
    }
    if (input.scope === "design")
      sourceFields.push({
        role: "source:film",
        kind: "not-inspected",
        payload: new Uint8Array(),
      });
    else
      try {
        filmSource = normalizeAutoMovieSource(
          project.readSource(FILM_SOURCE_PATH),
        );
        filmSourceDigest = digestAutoMovieBytes(filmSource);
        sourceFields.push({
          role: "source:film",
          kind: "typescript",
          payload: filmSource,
        });
      } catch (error) {
        diagnostics.push(filmSourcePathDiagnostic(error));
        sourceFields.push({
          role: "source:film",
          kind: "absent",
          payload: new Uint8Array(),
        });
      }

  return { shotSources, filmSource, filmSourceDigest };
}
