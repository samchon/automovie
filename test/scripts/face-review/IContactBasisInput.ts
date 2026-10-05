import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanFaceControlMap,
} from "@automovie/human";

/**
 * Everything the coupled oral contact revision is measured from: the surfaces
 * and regions it reads, the constants of its rules and the study it revises.
 * `prepare-contact-basis.ts` supplies the values; `prepareContactBasis`
 * documents what each is used for.
 */
export interface IContactBasisInput {
  basis: IAutoMovieHumanFaceBasis;
  lips: { surface: string; region: string };
  incisors: { surface: string };
  /** Transverse half-width about the jaw axis within which seam candidates lie, metres. */
  midlineBandMetres: number;
  /** Spacing of the lip margin stations along the jaw axis, metres; a stated sampling convention fixing only the chain anchors (`findLipMargin`). */
  marginStationMetres: number;
  closure: { channel: string; reference: string };
  passage: { surface: string; channel: string; slabMetres: number };
  colliders: { surface: string; maximumRingVertices: number }[];
  soft: {
    surface: string;
    budget: { metres: number } | { extent: true };
  }[];
  toleranceMetres: number;
  decimals: number;
  revision: string;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
}
