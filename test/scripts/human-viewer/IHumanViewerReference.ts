import type { IFaceLikenessCamera } from "../face-review/faceLikenessFraming";

/** The photograph a document is compared with, and how to place the camera like it. */
export interface IHumanViewerReference {
  /** Folder and file name of the photograph, always a plain name inside the reference folder. */
  folder: "" | "body";
  file: string;

  /** The camera the photograph was taken from, or null when none was recorded. */
  camera: IFaceLikenessCamera | null;

  /** Observed landmarks in unit image coordinates, empty when none were recorded. */
  landmarks: { x: number; y: number; group: string }[];
}
