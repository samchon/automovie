import { IAutoMovieBeatEndState, IAutoMovieShot } from "@automovie/interface";
import { IAutoMovieLegacyActorSpec, IAutoMovieLegacyProjectSummary, IAutoMovieLegacyPropSpec, IAutoMovieLegacyWritableSlate } from "./legacyRecords";
import type { IAutoMovieProjectState } from "./IAutoMovieProjectState";

/**
 * Return slice-presence flags, ids/counts, registered assets and advisory render strays through the existing sequence of resident reads. Scene presence includes keyed scenes, flags use admitted non-null content and notes count all returned rows. This operation performs no deletion or media certification and does not create an atomic cross-file snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Fenced slate, prop/actor reads, stray discovery and asset acquisition assemble observations in the original order.
 * @evidence contracts/common.md#clear-and-simple-design Reports resident presence/keys without deleting strays or selecting production kind.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential nested reads are not one atomic filesystem snapshot.
 * @evidence contracts/common.md#meaningful-documentation States presence/count meaning and advisory stray paths.
 * @evidence contracts/performance.md#efficient-algorithms Includes repeated nested refreshes, all slice/prop validation and render-name scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The writable slate supplies presence and stem data; other original reads renew their own authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every acquired level has a retirement attempt, which can retain fences on native failure; summary arrays transfer and the instance retains its latest mirror.
 */
export function autoMovieProjectSummary(_project: IAutoMovieProjectState): IAutoMovieLegacyProjectSummary {
    return _project.withRootNamespace((): {
        root: string;
        script: boolean;
        scene: boolean;
        shots: string[];
        beatEnds: string[];
        notes: number;
        film: boolean;
        props: string[];
        actors: string[];
        staleRenders: string[];
        assets: string[];
    } => {
        const slate: IAutoMovieLegacyWritableSlate = _project.writableSlate();
        return {
            root: _project.root,
            script: slate.script !== null,
            scene: slate.scenes.length !== 0,
            shots: slate.shots.map((shot: IAutoMovieShot): string => shot.id),
            beatEnds: slate.beatEnds.map((end: IAutoMovieBeatEndState): string => end.beat),
            notes: slate.notes.length,
            film: slate.film !== null,
            props: _project.storedProps().map((spec: IAutoMovieLegacyPropSpec): string => spec.node),
            actors: _project.storedActors().map((spec: IAutoMovieLegacyActorSpec): string => spec.node),
            staleRenders: _project.staleRenders(slate),
            assets: _project.assets,
        };
    });
}
