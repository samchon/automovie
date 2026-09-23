/** Typed inputs and outputs for the capture page's pure inspection decisions. */
export declare const portraitWebModes: readonly ["colour", "clay", "wireframe"];
export declare function portraitWebHairMaskPart(id: string): boolean;
export declare function portraitWebHairMaskPixels(
  rgba: Uint8ClampedArray,
): Uint8ClampedArray;
export declare function portraitWebCapturePose(
  poses: Record<
    string,
    {
      yaw: number;
      pitch: number;
      distance?: number;
      target?: [number, number, number];
    } | null
  > | null,
  id: string,
  hairMask: boolean,
): {
  yaw: number;
  pitch: number;
  hairMask: boolean;
  distance?: number;
  target?: number[];
};
export declare function resetPortraitWebSubject(subject: {
  matrixAutoUpdate: boolean;
  matrix: { identity(): unknown };
  updateMatrixWorld(force: boolean): unknown;
}): void;
export declare function verifyPortraitWebBasis(
  expected: Record<string, string>,
  actual: Record<string, string>,
): void;
export declare function portraitWebCamera(
  target: readonly number[],
  distance: number,
  yaw: number,
  pitch: number,
): number[];
export declare function portraitWebFocusIds(
  ids: readonly string[],
  focus: string,
): string[];
export declare function portraitWebHardwareRenderer(renderer: string): boolean;
export declare function portraitWebCaptureLabel(label: string): string;
export declare function portraitWebClip(
  min: readonly number[],
  max: readonly number[],
  eye: readonly number[],
  forward: readonly number[],
): { near: number; far: number };
export declare function createPortraitWebBuildGate(): {
  request: () => void;
  start: () => boolean;
  finish: () => boolean;
};
export declare function portraitWebReferenceFrame(profile: {
  measurement: {
    rotation: readonly number[];
    origin: readonly number[];
    millimetersPerPixel: number;
  };
  reference: { crop: { x: number; y: number; size: number } };
}): { target: number[]; position: number[]; span: number; matrix: number[] };
