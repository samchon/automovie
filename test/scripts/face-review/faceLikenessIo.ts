/**
 * File formats shared by the face likeness runners.
 *
 * `plan-face-likeness.ts` and `measure-face-likeness.ts` read the detector
 * output of `detect-face-likeness.py` and the capture records and PNGs of
 * `capture-articulation.mjs` through these helpers, so both runners agree on
 * one interpretation of every file. PNGs are decoded by `pngjs` into RGBA;
 * a mask is set where the red channel is at least 128, which matches both
 * the photograph segmenter's 0/255 grey PNG and the capture's white-on-black
 * hair ID pass. Reads only; nothing here writes.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { PNG } from "pngjs";

import type { IFaceLikenessImage } from "./faceLikenessColour";
import type { FaceLikenessPoint } from "./faceLikenessGeometry";
import type { IFaceLikenessMask } from "./faceLikenessMasks";

/** One detected face of `detections.json`. */
export interface IFaceLikenessFace {
  landmarks: FaceLikenessPoint[];
  transform: number[][];
  blendshapes: Record<string, number>;
}

/** One image record of `detections.json`. */
export interface IFaceLikenessDetection {
  id: string;
  path: string;
  sha256: string;
  width: number;
  height: number;
  faces: number;
  face: IFaceLikenessFace | null;
  hairMask: string | null;
  rgb: string | null;
}

/** The whole `detections.json`. */
export interface IFaceLikenessDetections {
  instrument: {
    faceLandmarkerSha256: string;
    hairSegmenterSha256: string;
    mediapipeVersion: string;
  };
  images: IFaceLikenessDetection[];
}

/** The `captures.json` a capture run writes. */
export interface IFaceLikenessCaptures {
  renderer: string;
  poseFileSha256: string | null;
  captures: {
    model: string;
    view: string;
    file: string;
    camera: {
      yaw: number;
      pitch: number;
      distance: number;
      target: [number, number, number];
      fov?: number;
    };
  }[];
}

/** Hex SHA-256 of a file. */
export function faceLikenessSha256(path: string): string {
  return createHash("sha256").update(fs.readFileSync(path)).digest("hex");
}

/** Parse a UTF-8 JSON file. */
export function readFaceLikenessJson<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, "utf8")) as T;
}

/** Decode a PNG into 8-bit RGB, dropping alpha. */
export function readFaceLikenessImage(path: string): IFaceLikenessImage {
  const png = PNG.sync.read(fs.readFileSync(path));
  const rgb = new Uint8Array(png.width * png.height * 3);
  for (let index = 0; index < png.width * png.height; ++index)
    for (let channel = 0; channel < 3; ++channel)
      rgb[3 * index + channel] = png.data[4 * index + channel]!;
  return { width: png.width, height: png.height, rgb };
}

/** Decode a PNG into a binary mask set where red is at least 128. */
export function readFaceLikenessMask(path: string): IFaceLikenessMask {
  const png = PNG.sync.read(fs.readFileSync(path));
  const data = new Uint8Array(png.width * png.height);
  for (let index = 0; index < data.length; ++index)
    data[index] = png.data[4 * index]! >= 128 ? 1 : 0;
  return { width: png.width, height: png.height, data };
}

/** Index a detections file by image id, refusing a duplicated id. */
export function indexFaceLikenessDetections(
  detections: IFaceLikenessDetections,
): Map<string, IFaceLikenessDetection> {
  const map = new Map<string, IFaceLikenessDetection>();
  for (const image of detections.images) {
    if (map.has(image.id)) throw new Error(`Duplicate image id ${image.id}.`);
    map.set(image.id, image);
  }
  return map;
}
