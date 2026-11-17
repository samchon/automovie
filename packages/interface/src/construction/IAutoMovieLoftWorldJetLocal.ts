import type { IAutoMovieLoftSectionJet } from "./IAutoMovieLoftSectionJet";


/** Exactly the Cartesian local total2, independent of its generating basis. */
export type IAutoMovieLoftWorldJetLocal = ReturnType<((phi: number) => IAutoMovieLoftSectionJet)>;
