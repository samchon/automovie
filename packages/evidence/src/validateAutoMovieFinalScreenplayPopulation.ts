import type { IAutoMovieEvidenceSyntaxAnnotation } from "./IAutoMovieEvidenceSyntaxAnnotation";
import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";
import type { IAutoMovieScreenplayDocumentIdentity } from "./IAutoMovieScreenplayDocumentIdentity";


/**
 * Protect the construction population while final audience language changes.
 *
 * Physical enumeration and Markdown parsing belong to the graph factory. These comparisons decide population identity, counterpart selection, and draft admission; literal content and mechanical-clause fidelity still require author review.
 *
 * @evidence contracts/common.md#principled-implementation Ordered final files and H1/headings must match construction identity; existing construction citations must select their exact counterpart, and draft hosts carry no evidence tags.
 * @evidence contracts/common.md#clear-and-simple-design Physical enumeration and parsing belong to the graph factory while this validator owns final/construction identity and draft admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A mere bijection cannot permit swapped parents; literal mechanical and audience-language fidelity remain author-review obligations rather than lexical scoring.
 * @evidence contracts/common.md#meaningful-documentation The comment states identity versus content-review boundaries and injected final/group readers own source acquisition.
 * @evidence contracts/performance.md#efficient-algorithms For F files, U units and A annotations, ordered comparisons and counterpart maps are linear plus carrier parsing; each delivery group title pair is read once via a set.
 * @evidence contracts/performance.md#reuse-equivalent-work Construction metadata is supplied once and each file's counterpart map serves all citations; no final source is cached across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns source readers and construction maps; validator-local arrays/maps are released on success or refusal and no handle is acquired.
 */
export const validateAutoMovieFinalScreenplayPopulation: (props: {
    stage: AutoMovieEvidenceStage;
    residents: readonly string[];
    files: readonly string[];
    construction: ReadonlyMap<string, Omit<IAutoMovieScreenplayDocumentIdentity, "source">>;
    readFinal: (relative: string) => IAutoMovieScreenplayDocumentIdentity;
    readGroupTitles: (group: string) => {
        construction: string;
        final: string;
    };
}) => void = (props: {
  stage: AutoMovieEvidenceStage;
  residents: readonly string[];
  files: readonly string[];
  construction: ReadonlyMap<
    string,
    Omit<IAutoMovieScreenplayDocumentIdentity, "source">
  >;
  readFinal: (relative: string) => IAutoMovieScreenplayDocumentIdentity;
  readGroupTitles: (group: string) => {
    construction: string;
    final: string;
  };
}): void => {
  if (props.stage === "disabled") {
    if (props.residents.length !== 0)
      throw new Error(
        `screenplayNaturalness is disabled but governed hosts remain: ${props.residents.join(", ")}.`,
      );
    return;
  }
  if (props.files.length === 0)
    throw new Error(
      `screenplayNaturalness cannot enter ${props.stage} without a final screenplay host.`,
    );
  const expectedFiles: string[] = [...props.construction.keys()];
  if (
    props.files.length !== expectedFiles.length ||
    props.files.some((file: string, index: number) : boolean => file !== expectedFiles[index])
  )
    throw new Error(
      `final screenplay filenames must exactly preserve construction screenplays; received [${props.files.join(", ")}], expected [${expectedFiles.join(", ")}].`,
    );
  for (const relative of props.files) {
    const final: IAutoMovieScreenplayDocumentIdentity = props.readFinal(relative);
    const construction: Omit<IAutoMovieScreenplayDocumentIdentity, "source"> = props.construction.get(relative)!;
    const file: string = `docs/final/screenplays/${relative}`;
    const annotations: readonly IAutoMovieEvidenceSyntaxAnnotation[] = parseAutoMovieEvidenceSyntax({
      path: file,
      source: final.source,
    });
    if (props.stage === "draft" && annotations.length !== 0)
      throw new Error(
        `docs/final/screenplays/${relative} is draft and must be completed before evidence tags are authored.`,
      );
    // Native graph validation owns presence, cardinality, and review syntax.
    // A bijection alone permits swapped parents, so this product invariant
    // checks which construction counterpart an existing citation selects.
    const counterparts: Map<string, string> = new Map<string, string>([
      [`${file}::file`, `screenplays/${relative}`],
      ...final.units.map(
        (unit: { anchor: string; depth: 2 | 3 | 4; lineage: string; title: string; }) : readonly [`${string}#${string}`, `screenplays/${string}#${string}`] =>
          [
            `${file}#${unit.anchor}`,
            `screenplays/${relative}#${unit.anchor}`,
          ] as const,
      ),
    ]);
    for (const annotation of annotations) {
      const target: string | undefined =
        /^@evidence(?:Review|Exclude|ExcludeReview)?\s+(screenplays\/\S+)/u.exec(
          annotation.text,
        )?.[1];
      if (target !== undefined && target !== counterparts.get(annotation.host))
        throw new Error(
          `${file}:${annotation.line} must cite its exact construction counterpart, not ${target}.`,
        );
    }
    if (final.title !== construction.title)
      throw new Error(
        `final/screenplays/${relative} must exactly preserve the construction screenplay H1 title.`,
      );
    if (
      final.units.length !== construction.units.length ||
      final.units.some((unit: { anchor: string; depth: 2 | 3 | 4; lineage: string; title: string; }, index: number) : boolean => {
        const expected: { anchor: string; depth: 2 | 3 | 4; lineage: string; title: string; } = construction.units[index]!;
        return (
          unit.depth !== expected.depth ||
          unit.anchor !== expected.anchor ||
          unit.lineage !== expected.lineage ||
          unit.title !== expected.title
        );
      })
    )
      throw new Error(
        `final/screenplays/${relative} must exactly preserve construction screenplay headings, identity, nesting, and order.`,
      );
  }
  for (const group of new Set(props.files.map((file: string) : string => file.split("/")[0]!))) {
    const titles: { construction: string; final: string; } = props.readGroupTitles(group);
    if (titles.final !== titles.construction)
      throw new Error(
        `final/screenplays/${group}/index.md must exactly preserve the construction screenplay delivery-group H1 title.`,
      );
  }
};
