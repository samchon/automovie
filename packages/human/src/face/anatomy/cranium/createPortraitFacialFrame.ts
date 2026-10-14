import type { IPortraitComponentHost } from "../../surface/structures/IPortraitComponentHost";
import type { IPortraitEyeSocket } from "../eye/structures/IPortraitEyeSocket";
import { resolvePortraitFacialFrameShape } from "./resolvePortraitFacialFrameShape";
import { IPortraitFacialFrameShape } from "./structures/IPortraitFacialFrameShape";

/**
 * Fit compact anatomical supports at the paired gonial and temporal landmarks,
 * gnathion, pogonion and frontal midline. The C1 compact kernel is one at its
 * anatomical centre and exactly zero outside its derived support radius.
 * Global width/length act last about the nasion. Every attached component reads
 * this same derived host; source observations and triangle identities survive.
 * A nonzero brow projection additionally needs both caller-owned eye sockets.
 * Its shared superior-orbit envelope preserves their aperture and changes the
 * outer skin before fitting eyelid attachments, not as a later skin overlay.
 *
 * @evidence contracts/common.md#principled-implementation Compact C1 fields on named landmark supports and nasion-centred global scales transform the shared 478-point host before attached components fit it.
 * @evidence contracts/common.md#clear-and-simple-design Dimension resolution admits a fresh shape, the returned transform shares copied anchors, and optional brow support is derived only from both actual eye sockets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid host geometry, degenerate support dimensions, missing paired brow sockets and numerical overflow refuse; support radii are derived construction controls rather than measured tissue envelopes.
 * @evidence contracts/common.md#meaningful-documentation The prose states common-host identity retention, fixed anatomical anchors and the aperture-preserving superior-orbit support boundary.
 * @evidence contracts/performance.md#efficient-algorithms Host admission/copy/transform is O(V) for the supported 478 residents; optional paired brow guides scan their actual aperture/brow IDs once and subsequent transforms evaluate a fixed number of kernels.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned point transform reuses admitted copied anchors, dimensions and paired brow sections; caller host/input mutations cannot replace that owned numerical basis.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the transformed host and closure; copied basis/settings and optional two support sections live only as long as that result, without a global cache or resource.
 */
export function createPortraitFacialFrame(
  host: IPortraitComponentHost,
  input: IPortraitFacialFrameShape = {},
  eyes?: readonly IPortraitEyeSocket[],
): {
  host: { positions: number[][]; indices: number[]; viewRay: number[] };
  transform: (sample: readonly number[]) => number[];
} {
  const shape: Required<IPortraitFacialFrameShape> =
    resolvePortraitFacialFrameShape(input);
  if (
    host.positions.length !== 478 ||
    host.positions.some(
      (point: number[]): boolean =>
        point.length !== 3 || !point.every(Number.isFinite),
    )
  )
    throw new Error("Facial-frame anatomy requires 478 finite XYZ landmarks.");
  const basis: IPortraitComponentHost = structuredClone(host);
  const brow: ((sample: readonly number[]) => number) | undefined =
    shape.browProjection === 0
      ? undefined
      : createBrowProjection(basis, eyes, shape.browProjection);
  const point: (id: number) => number[] = (id: number): number[] =>
    basis.positions[id];
  const width: number = Math.abs(point(454)[0] - point(234)[0]);
  const length: number = Math.abs(point(10)[1] - point(152)[1]);
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(length) ||
    width <= 1 ||
    length <= 1
  )
    throw new Error(
      "Facial-frame supports need nondegenerate zygomatic breadth and frontal-to-chin length.",
    );
  const weight: (
    sample: readonly number[],
    id: number,
    rx: number,
    ry: number,
  ) => number = (
    sample: readonly number[],
    id: number,
    rx: number,
    ry: number,
  ): number => {
    const anchor: number[] = point(id);
    const radius: number = Math.hypot(
      (sample[0] - anchor[0]) / rx,
      (sample[1] - anchor[1]) / ry,
      (sample[2] - anchor[2]) / (width * 0.4),
    );
    const t: number = Math.max(0, 1 - radius * radius);
    return t * t;
  };
  const transform: (sample: readonly number[]) => number[] = (
    sample: readonly number[],
  ): number[] => {
    if (sample.length !== 3 || !sample.every(Number.isFinite))
      throw new Error("A facial-frame attachment must be finite XYZ.");
    const jaw: number =
      weight(sample, 397, width * 0.32, length * 0.32) -
      weight(sample, 172, width * 0.32, length * 0.32);
    const temple: number =
      weight(sample, 356, width * 0.22, length * 0.22) -
      weight(sample, 127, width * 0.22, length * 0.22);
    const nasion: number[] = point(168);
    const result: number[] = [
      sample[0] +
        (sample[0] - nasion[0]) * (shape.widthScale - 1) +
        (shape.jawWidth * jaw + shape.templeWidth * temple) * shape.widthScale,
      sample[1] +
        (sample[1] - nasion[1]) * (shape.lengthScale - 1) -
        shape.chinHeight *
          weight(sample, 152, width * 0.3, length * 0.3) *
          shape.lengthScale,
      sample[2] +
        shape.chinProjection * weight(sample, 199, width * 0.3, length * 0.3) +
        shape.foreheadProjection *
          weight(sample, 10, width * 0.45, length * 0.4) +
        (brow?.(sample) ?? 0),
    ];
    if (!result.every(Number.isFinite))
      throw new Error(
        "Facial-frame transformation overflowed its numerical range.",
      );
    return result;
  };
  return {
    host: { ...basis, positions: basis.positions.map(transform) },
    transform,
  };
}

/** Build paired superior-orbit support sections from the copied host's resident guides. */
function createBrowProjection(
  host: IPortraitComponentHost,
  eyes: readonly IPortraitEyeSocket[] | undefined,
  amount: number,
): (sample: readonly number[]) => number {
  if (
    eyes === undefined ||
    eyes.length !== 2 ||
    !eyes.some((eye: IPortraitEyeSocket): boolean => eye.name === "left") ||
    !eyes.some((eye: IPortraitEyeSocket): boolean => eye.name === "right")
  )
    throw new Error(
      "Brow foundation needs both independently named eye sockets.",
    );
  const guides: { aperture: number[][]; brow: number[][] }[] = eyes.map(
    (eye: IPortraitEyeSocket): { aperture: number[][]; brow: number[][] } => {
      const aperture: number[] = [...eye.top, ...eye.bottom];
      if (
        aperture.length === 0 ||
        eye.browBottom.length < 2 ||
        [...aperture, ...eye.browBottom].some(
          (id: number): boolean =>
            !Number.isInteger(id) || id < 0 || id >= host.positions.length,
        )
      )
        throw new Error(
          "Brow foundation needs resident aperture and brow guides.",
        );
      return {
        aperture: aperture.map((id: number): number[] => host.positions[id]),
        brow: eye.browBottom.map((id: number): number[] => host.positions[id]),
      };
    },
  );
  // Both fields share the highest aperture floor. Overlapping medial shoulders
  // cannot move the other eye's higher aperture in an asymmetric foundation.
  const floor: number =
    Math.max(
      ...guides.flatMap(
        (guide: { aperture: number[][]; brow: number[][] }): number[] =>
          guide.aperture.map((p: number[]): number => p[1]),
      ),
    ) + 0.5;
  const sections: {
    floor: number;
    crest: number;
    top: number;
    left: number;
    right: number;
    shoulder: number;
  }[] = guides.map(
    ({
      aperture: points,
      brow,
    }: {
      aperture: number[][];
      brow: number[][];
    }): {
      floor: number;
      crest: number;
      top: number;
      left: number;
      right: number;
      shoulder: number;
    } => {
      const crest: number = brow.reduce(
        (sum: number, p: number[]): number => sum + p[1] / brow.length,
        0,
      );
      const width: number =
        Math.max(...points.map((p: number[]): number => p[0])) -
        Math.min(...points.map((p: number[]): number => p[0]));
      const top: number = crest + 2 * (crest - floor);
      const left: number = Math.min(...brow.map((p: number[]): number => p[0]));
      const right: number = Math.max(
        ...brow.map((p: number[]): number => p[0]),
      );
      if (
        ![floor, crest, width, top, left, right].every(Number.isFinite) ||
        crest <= floor + 1 ||
        width <= 1 ||
        right <= left
      )
        throw new Error(
          "Brow foundation needs a finite superior band above a nondegenerate aperture.",
        );
      return { floor, crest, top, left, right, shoulder: width / 4 };
    },
  );
  const smooth: (x: number) => number = (x: number): number => {
    const t: number = Math.max(0, Math.min(1, x));
    return t * t * (3 - 2 * t);
  };
  return (sample: readonly number[]): number =>
    amount *
    Math.max(
      ...sections.map(
        (section: {
          floor: number;
          crest: number;
          top: number;
          left: number;
          right: number;
          shoulder: number;
        }): number =>
          smooth(
            (sample[0] - section.left + section.shoulder) / section.shoulder,
          ) *
          smooth(
            (section.right + section.shoulder - sample[0]) / section.shoulder,
          ) *
          (sample[1] < section.crest
            ? smooth(
                (sample[1] - section.floor) / (section.crest - section.floor),
              )
            : smooth(
                (section.top - sample[1]) / (section.top - section.crest),
              )),
      ),
    );
}
