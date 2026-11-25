/**
 * Tooth-crown dimensions and the closed vocabulary of crown forms. Runtime
 * construction and admission remain with AutoMovieHumanMouthPrior in Human.
 */
export namespace IAutoMovieHumanMouthPrior {
  /** One tooth's crown, millimetres. */
  export interface ITooth {
    /** Name within its quadrant. */
    name: string;

    /** Mesiodistal crown width, along the arch. */
    width: number;

    /** Labiolingual or buccolingual crown depth, across the arch. */
    depth: number;

    /** Cervicoincisal or cervico-occlusal crown height. */
    height: number;

    /** Mesiodistal width at the cervical line, where the crown meets the gum. */
    neck: number;

    /** Kind of crown: a blade, a cusp or a table. */
    kind: "incisor" | "canine" | "premolar" | "molar";
  }
}
