import { IAutoMovieCompiledFilmEffect } from "@automovie/interface";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieFilmTimelineArtifact } from "./IAutoMovieFilmTimelineArtifact";
import { parseAutoMovieFilmTimeline } from "./parseAutoMovieFilmTimeline";
import { parseAutoMovieFilmEffects } from "./parseAutoMovieFilmEffects";

/**
 * Admit generated timeline and effects using one observed manifest and expected compile identity.
 *
 * @evidence contracts/common.md#principled-implementation Captures one manifest, admits its timeline first, then admits effect bytes and verifies exact population against that timeline. Generated reads remain sequential physical observations.
 * @evidence contracts/common.md#clear-and-simple-design Composes canonical timeline/effect parsers through one project capability; this exported effects reader currently has no live application invocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shared manifest reference does not prove atomic multi-file acquisition; either parser/refusal propagates and no empty substitute effect population is inserted.
 * @evidence contracts/common.md#meaningful-documentation States timeline-before-effects order, common fingerprint and one-manifest attempt meaning rather than snapshot atomicity.
 * @evidence contracts/performance.md#efficient-algorithms Includes manifest acquisition, both complete guarded byte reads/digests/JSON schemas and engine population validation, sorting cues and computing canonical edit/runtime identities.
 * @evidence contracts/performance.md#reuse-equivalent-work One manifest and reader closure supply both admissions; the admitted timeline supplies population comparison without a second timeline parse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Complete timeline/effect data can coexist during validation, with no byte cap; returned effects transfer and delegated native readers own descriptor release.
 */
export function readAutoMovieFilmEffects(project: AutoMovieProductionProject, fingerprint: string): IAutoMovieCompiledFilmEffect[] {
    const artifact: IAutoMovieFilmTimelineArtifact = {
        manifest: project.generatedManifest(),
        fingerprint,
        read: (file: string): Uint8Array => project.readGeneratedFile(file),
    };
    return parseAutoMovieFilmEffects(artifact, parseAutoMovieFilmTimeline(artifact));
}
