import type { IAutoMovieModel } from "@automovie/interface";

/** Read-only display contracts for the isolated Node software experiment; metres throughout. */
export namespace NodeCanvasTypes {
  /** Cartesian coordinates, not a new anatomical or construction representation. */
  export type Point = [number, number, number];

  /** Borrowed display triangles; their only consumer is the diagnostic rasterizer. */
  export interface Mesh {
    /** Producer identity retained in every frame manifest. */
    id: string;

    /** Original metre positions without fitting or deformation. */
    positions: readonly number[];

    /** Original triangle order. */
    indices: readonly number[];

    /** Linear RGB clay colour, independent of anatomy. */
    colour: Point;
  }

  /** A sampled source or production construction line, never used to generate geometry. */
  export interface Curve {
    /** Exact producer id. */
    id: string;

    /** Borrowed metre samples. */
    points: readonly Point[];

    /** The source's own closure. */
    closed: boolean;

    /** True only for an actual always-through line, such as the source axis, within a depth-tested frame. */
    xray?: boolean;

    /** Six hexadecimal colour digits from the existing source display. */
    colour?: string;
  }

  /** Orthographic camera with an explicit orthonormal basis and projected scale. */
  export interface Camera {
    /** Named viewing direction. */
    name: string;

    /** World target in metres. */
    target: Point;

    /** Unit vector toward the camera. */
    back: Point;

    /** Unit screen-right direction. */
    right: Point;

    /** Unit screen-up direction. */
    up: Point;

    /** Pixels per metre, using the selected source ROI. */
    scale: number;

    /** Output width including captions. */
    width: number;

    /** Output height including captions. */
    height: number;

    /** False for an actual saved-camera pair using the complete image viewport without captions. */
    annotations?: boolean;

    /** Saved-camera clipping only; omitted for the original experimental fitted cameras. */
    clipping?: { near: number; far: number; distance: number };
  }

  /** Actual cache work, independent of original geometry and final PNG writing. */
  export interface ReferenceBackground {
    /** None means this frame had no cacheable original reference prefix. */
    status: "none" | "memory-hit" | "disk-hit" | "miss";

    /** Exact resolved scene identity, absent for a non-reference frame. */
    key: string | null;

    /** Invalid or incomplete stored bytes cause a fresh reference raster, never a successful hit. */
    refusal: string | null;

    /** Persistence refusal does not replace the freshly rendered reference with stale data. */
    writeFailure: string | null;

    /** Original scene insertion count represented by the retained background, not this frame's work. */
    retainedSceneSurfaceWrites: number;

    /** Actual reference triangle writes this frame; zero on a real hit. */
    referenceSurfaceWrites: number;

    /** Actual generated-mesh writes performed after the reference prefix this frame. */
    overlaySurfaceWrites: number;

    /** Disjoint cache and final composition intervals, milliseconds; output-file write remains entry-owned. */
    milliseconds: {
      key: number;
      read: number;
      verify: number;
      decode: number;
      referenceRaster: number;
      referenceEncode: number;
      store: number;
      compose: number;
      total: number;
    };
  }

  /** One durable PNG observation with its exact render and encoding intervals. */
  export interface Frame {
    /** File basename. */
    file: string;

    /** Byte identity of the saved PNG. */
    sha256: string;

    /** Exact camera used. */
    camera: Camera;

    /** Display stage; raw operands are not a final Boolean skin. */
    stage: string;

    /** Requested part group. */
    scope: string;

    /** Actual line ids. */
    curves: string[];

    /** Actual mesh ids. */
    meshes: string[];

    /** Whether lines deliberately ignore surface depth. */
    lineMode: "xray" | "depth";

    /** Explicit always-through curve IDs within this frame; other curves follow lineMode. */
    xrayOverrides: string[];

    /** Measured independent phases, milliseconds. */
    milliseconds: {
      canvas: number;
      raster: number;
      encode: number;
      write: number;
    };

    /** Optional actual reference-cache state and work; cached scene insertions are not repeated triangle work. */
    referenceBackground?: ReferenceBackground;

    /** Scene-equivalent insertion/line statistics, never anatomical validity; referenceBackground separates cached counts from actual work. */
    pixels: { surface: number; line: number; hiddenLine: number };
  }

  /** Existing entry-owned resources borrowed by a complete actual-source inventory round. */
  export interface Session {
    /** Adopted native reference, validated by its existing display adapter. */
    referenceModel: IAutoMovieModel;

    /** Exact adopted reference artifact bytes, compared with each actual saved scene demand. */
    referenceSha256: string;

    /** Full unchanged native reference display buffers. */
    referenceMeshes: Mesh[];

    /** Shared durable manifest facts. */
    details: Record<string, unknown>;

    /** Persist current producer status. */
    save(): Promise<void>;

    /** Existing serial PNG writer, preserving exact cameras and ids. */
    capture(
      scope: string,
      stage: string,
      camera: Camera,
      meshes: readonly Mesh[],
      curves: readonly Curve[],
      lineMode: "xray" | "depth",
    ): Promise<void>;
  }
}
