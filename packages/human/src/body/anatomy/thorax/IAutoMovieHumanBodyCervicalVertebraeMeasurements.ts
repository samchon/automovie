import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyVertebraMeasurements } from "./IAutoMovieHumanBodyVertebraMeasurements";

/**
 * Seven cervical vertebrae, including atlas C1 and axis C2, named separately. The neck/face skin seam does not duplicate these midline bones.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty numbered C1-C7 record preserves seven independent midline vertebral measurements, including distinct atlas and axis identities.
 * @evidence contracts/common.md#clear-and-simple-design One cervical collection composes the shared vertebra schema without duplicating bones across neck/face skin ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named vertebral inputs do not reconstruct cervical discs, loaded alignment or a neck exterior from bone volumes.
 * @evidence contracts/common.md#meaningful-documentation The prose names the cervical population and members preserve individual vertebral numbering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cervical collection typing performs no intervertebral alignment or neck mesh generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Seven numbered cervical records own no shared vertebral reconstruction cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Cervical measurements retain no disc mesh, atlas/axis transform solver or scan handle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCervicalVertebraeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Numbered C1 vertebra. */
    c1?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C2 vertebra. */
    c2?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C3 vertebra. */
    c3?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C4 vertebra. */
    c4?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C5 vertebra. */
    c5?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C6 vertebra. */
    c6?: IAutoMovieHumanBodyVertebraMeasurements;

    /** Numbered C7 vertebra. */
    c7?: IAutoMovieHumanBodyVertebraMeasurements;
  }>;
