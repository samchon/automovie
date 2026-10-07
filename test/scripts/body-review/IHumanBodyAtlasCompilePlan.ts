import type { IHumanBodyAtlasCompilePart } from "./IHumanBodyAtlasCompilePart";

/**
 * Rights and explicit axis convention for the offline atlas compiler.
 *
 * This compiler accepts a declared acquired atlas, never personal input
 * vertices. Its axis map is a right-handed signed permutation from original
 * source millimetres into body metres, applied once before authored placement.
 */
export interface IHumanBodyAtlasCompilePlan {
  /** Shared provenance location. */
  uri: string;

  /** Acquired release. */
  revision: string;

  /** Direct-source rights, retaining original asset notices where different. */
  license: string;

  /** License account read at acquisition. */
  licenseUri: string;

  /** Full attribution required by the source. */
  attribution: string;

  /** Original acquisition account and unknowns. */
  acquisition: string;

  /** x/y/z source axis index and sign, for each common-frame output axis. */
  axes: readonly [number, number, number];

  /** Explicit placement and unsupported physiological claims. */
  registrationProtocol: string;

  /** Source part population. */
  parts: IHumanBodyAtlasCompilePart[];
}
