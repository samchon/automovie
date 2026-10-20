import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

import { filterRecoveryImageGaussian } from "./filterRecoveryImageGaussian";

/**
 * Observe bounded multiscale Harris points and oriented gradient histograms.
 * Harris derivative sigma 1, integration 1.5 and average-gradient orientation
 * sigma 4.5 follow Brown, Szeliski and Winder (2005):
 * https://www.microsoft.com/en-us/research/wp-content/uploads/2005/06/cvpr05.pdf
 * A 4*4*8 trilinear histogram, unit normalization and .2 clipping follow Lowe's
 * descriptor construction, while this remains a Harris detector, not full SIFT:
 * https://www.cs.ubc.ca/~lowe/papers/ijcv04.pdf
 * The 35-pixel oriented window, 10-pixel bins and Gaussian sigma 20 define the
 * declared experimental descriptor chart. All positions return in original
 * integer-pixel-centre coordinates; no point is a verified material identity.
 *
 * @evidence contracts/common.md#principled-implementation Harmonic Harris response and negative-definite quadratic refinement locate corners; robust ANMS spreads retained positions in the original chart. Average blurred-gradient orientation and a bounded gradient histogram permit local appearance comparison without matching sliding silhouettes. Detector scale and orientation are approximate under perspective distortion, and repeated or hidden texture remains unresolved.
 * @evidence contracts/common.md#clear-and-simple-design One image owns its Gaussian pyramid, candidate admission and spatial selection; the separate convolution owner supplies all derivatives with one boundary convention. A selected point with an unobservable descriptor is omitted explicitly rather than repaired or given a fabricated match.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No mask, object-specific region, manual point, learned descriptor or expected camera controls detection. Only actual gradient-window support is required; an unused intensity-patch descriptor does not gate this gradient method.
 * @evidence contracts/common.md#meaningful-documentation States published scale/orientation premises, experimental descriptor dimensions, original pixel chart, candidate and output populations and the limits of local features.
 * @evidence contracts/performance.md#efficient-algorithms For P pyramid pixels, C admitted candidates and F selected features, fixed-radius separable filters cost O(P), robust ANMS O(C^2), sorting O(C log C) and bounded histogram samples O(F). Explicit pixel/candidate/feature limits bound the intended small-image workload; no dense all-pixel descriptor table is retained.
 * @evidence contracts/performance.md#reuse-equivalent-work Each level's first derivatives supply both its Harris moments and selected gradient descriptors. Orientation derivatives and integrated moments are computed once per level; completed image features can be reused by the pair owner without rescanning RGB.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous call owns O(P+C+128F) arrays under admitted capture budgets. Only selected points and descriptors transfer to the pair owner; pyramid/moment/candidate arrays become unreachable on return or throw and no image, handle or cache persists globally.
 */
export function extractRecoveryImageFeatures(
  view: IAutoMovieRecoveryCameraPairInput["views"][number],
  policy: IAutoMovieRecoveryCameraPairInput["policy"],
  budget: IAutoMovieRecoveryCameraPairInput["budget"],
): {
  points: {
    point: [number, number];
    scale: number;
    orientationRadians: number;
    response: number;
    descriptor: Float64Array;
  }[];
  rawCorners: number;
  validCandidates: number;
  selectedBeforeDescriptor: number;
  zeroDescriptors: number;
  invalidSupportDescriptors: number;
} {
  const pyramid: { width: number; height: number; dx: Float64Array; dy: Float64Array }[] = [];
  let gray: Float64Array = new Float64Array(view.width * view.height);
  for (let pixel: number = 0; pixel < gray.length; pixel++)
    // Integer BT.601 grayscale, including Pillow's L24 rounding convention:
    // https://github.com/python-pillow/Pillow/blob/main/src/libImaging/Convert.c
    gray[pixel] = Math.floor((19595 * view.rgb8[3 * pixel]! +
      38470 * view.rgb8[3 * pixel + 1]! + 7471 * view.rgb8[3 * pixel + 2]! + 32768) / 65536);
  let width: number = view.width, height: number = view.height;
  const candidates: { x: number; y: number; response: number; level: number; angle: number; radiusSquared: number }[] = [];
  let rawCorners: number = 0;
  const sample: (data: Float64Array, w: number, x: number, y: number) => number = (
    data: Float64Array, w: number, x: number, y: number,
  ): number => {
    const x0: number = Math.floor(x), y0: number = Math.floor(y);
    const x1: number = Math.min(w - 1, x0 + 1);
    const y1: number = Math.min(data.length / w - 1, y0 + 1);
    const tx: number = x - x0, ty: number = y - y0;
    return (1 - ty) * ((1 - tx) * data[y0 * w + x0]! + tx * data[y0 * w + x1]!) +
      ty * ((1 - tx) * data[y1 * w + x0]! + tx * data[y1 * w + x1]!);
  };
  for (let level: number = 0; level < budget.maxPyramidLevels && Math.min(width, height) >= 40; level++) {
    const dx: Float64Array = filterRecoveryImageGaussian(gray, width, height, 1, "x");
    const dy: Float64Array = filterRecoveryImageGaussian(gray, width, height, 1, "y");
    pyramid.push({ width, height, dx, dy });
    const xx: Float64Array = new Float64Array(gray.length);
    const yy: Float64Array = new Float64Array(gray.length);
    const xy: Float64Array = new Float64Array(gray.length);
    for (let at: number = 0; at < gray.length; at++) {
      xx[at] = dx[at]! * dx[at]!;
      yy[at] = dy[at]! * dy[at]!;
      xy[at] = dx[at]! * dy[at]!;
    }
    const a: Float64Array = filterRecoveryImageGaussian(xx, width, height, 1.5);
    const b: Float64Array = filterRecoveryImageGaussian(yy, width, height, 1.5);
    const c: Float64Array = filterRecoveryImageGaussian(xy, width, height, 1.5);
    const response: Float64Array = new Float64Array(gray.length);
    for (let at: number = 0; at < gray.length; at++) {
      const trace: number = a[at]! + b[at]!;
      response[at] = trace > 0 ? (a[at]! * b[at]! - c[at]! * c[at]!) / trace : 0;
    }
    const ox: Float64Array = filterRecoveryImageGaussian(gray, width, height, 4.5, "x");
    const oy: Float64Array = filterRecoveryImageGaussian(gray, width, height, 4.5, "y");
    for (let y: number = 2; y < height - 2; y++) {
      for (let x: number = 2; x < width - 2; x++) {
        const at: number = y * width + x;
        const value: number = response[at]!;
        if (!(value > policy.minimumCornerResponse)) continue;
        let maximum: boolean = true;
        for (let oyAt: number = -1; oyAt <= 1; oyAt++)
          for (let oxAt: number = -1; oxAt <= 1; oxAt++)
            if (response[at + oyAt * width + oxAt]! > value) maximum = false;
        if (!maximum) continue;
        rawCorners++;
        const gx: number = (response[at + 1]! - response[at - 1]!) / 2;
        const gy: number = (response[at + width]! - response[at - width]!) / 2;
        const hxx: number = response[at + 1]! - 2 * value + response[at - 1]!;
        const hyy: number = response[at + width]! - 2 * value + response[at - width]!;
        const hxy: number = (response[at + width + 1]! - response[at + width - 1]! -
          response[at - width + 1]! + response[at - width - 1]!) / 4;
        const determinant: number = hxx * hyy - hxy * hxy;
        if (!(hxx < 0 && determinant > 0)) continue;
        const rx: number = (hxy * gy - hyy * gx) / determinant;
        const ry: number = (hxy * gx - hxx * gy) / determinant;
        if (!Number.isFinite(rx) || !Number.isFinite(ry) || Math.max(Math.abs(rx), Math.abs(ry)) > 1) continue;
        const px: number = x + rx, py: number = y + ry;
        const orientationX: number = sample(ox, width, px, py);
        const orientationY: number = sample(oy, width, px, py);
        if (Math.hypot(orientationX, orientationY) < 1e-12) continue;
        const angle: number = Math.atan2(orientationY, orientationX);
        const cosine: number = Math.cos(angle), sine: number = Math.sin(angle);
        // The rotated square's extreme axis offsets are 17.5*(|cos|+|sin|).
        const extent: number = 17.5 * (Math.abs(cosine) + Math.abs(sine));
        if (px - extent < 0 || py - extent < 0 || px + extent > width - 1 || py + extent > height - 1) continue;
        if (candidates.length === budget.maxCandidates)
          throw new Error("camera-features: valid candidate budget exhausted");
        candidates.push({ x: px * 2 ** level, y: py * 2 ** level, response: value, level, angle, radiusSquared: Infinity });
      }
    }
    if (level + 1 < budget.maxPyramidLevels) {
      const blurred: Float64Array = filterRecoveryImageGaussian(gray, width, height, 1);
      const nextWidth: number = Math.ceil(width / 2), nextHeight: number = Math.ceil(height / 2);
      const next: Float64Array = new Float64Array(nextWidth * nextHeight);
      for (let y: number = 0; y < nextHeight; y++)
        for (let x: number = 0; x < nextWidth; x++) next[y * nextWidth + x] = blurred[2 * y * width + 2 * x]!;
      gray = next; width = nextWidth; height = nextHeight;
    }
  }
  for (const candidate of candidates) {
    for (const other of candidates) {
      if (other.response > candidate.response / policy.suppressionRobustness)
        candidate.radiusSquared = Math.min(candidate.radiusSquared,
          (candidate.x - other.x) ** 2 + (candidate.y - other.y) ** 2);
    }
  }
  candidates.sort((a: (typeof candidates)[number], b: (typeof candidates)[number]): number =>
    (a.radiusSquared === b.radiusSquared ? 0 : b.radiusSquared - a.radiusSquared) ||
    b.response - a.response || a.level - b.level || a.y - b.y || a.x - b.x);
  const selected: typeof candidates = candidates.slice(0, budget.maxFeatures);
  const points: ReturnType<typeof extractRecoveryImageFeatures>["points"] = [];
  let zeroDescriptors: number = 0;
  let invalidSupportDescriptors: number = 0;
  for (const candidate of selected) {
    const chart: (typeof pyramid)[number] = pyramid[candidate.level]!;
    const px: number = candidate.x / 2 ** candidate.level;
    const py: number = candidate.y / 2 ** candidate.level;
    const cosine: number = Math.cos(candidate.angle), sine: number = Math.sin(candidate.angle);
    const descriptor: Float64Array = new Float64Array(128);
    let validSupport: boolean = true;
    descriptorSamples: for (let y: number = 0; y < 16; y++) {
      for (let x: number = 0; x < 16; x++) {
        const u: number = (x - 7.5) * (35 / 15), v: number = (y - 7.5) * (35 / 15);
        const sx: number = px + cosine * u - sine * v;
        const sy: number = py + sine * u + cosine * v;
        if (!(sx >= 0 && sy >= 0 && sx <= chart.width - 1 && sy <= chart.height - 1)) {
          validSupport = false;
          break descriptorSamples;
        }
        const gx: number = sample(chart.dx, chart.width, sx, sy);
        const gy: number = sample(chart.dy, chart.width, sx, sy);
        const magnitude: number = Math.hypot(gx, gy) * Math.exp(-(u * u + v * v) / 800);
        const orientation: number = ((Math.atan2(gy, gx) - candidate.angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) * 8 / (2 * Math.PI);
        const bx: number = u / 10 + 1.5, by: number = v / 10 + 1.5;
        const ix: number = Math.floor(bx), iy: number = Math.floor(by), io: number = Math.floor(orientation);
        const fx: number = bx - ix, fy: number = by - iy, fo: number = orientation - io;
        for (let ax: number = 0; ax <= 1; ax++) {
          for (let ay: number = 0; ay <= 1; ay++) {
            for (let ao: number = 0; ao <= 1; ao++) {
              const hx: number = ix + ax, hy: number = iy + ay;
              if (hx < 0 || hx >= 4 || hy < 0 || hy >= 4) continue;
              descriptor[(hy * 4 + hx) * 8 + (io + ao) % 8] += magnitude *
                (ax ? fx : 1 - fx) * (ay ? fy : 1 - fy) * (ao ? fo : 1 - fo);
            }
          }
        }
      }
    }
    if (!validSupport) { invalidSupportDescriptors++; continue; }
    let norm: number = 0;
    for (const value of descriptor) norm = Math.hypot(norm, value);
    if (!(norm > 1e-12) || !Number.isFinite(norm)) { zeroDescriptors++; continue; }
    for (let at: number = 0; at < descriptor.length; at++) descriptor[at] = Math.min(descriptor[at]! / norm, 0.2);
    norm = 0;
    for (const value of descriptor) norm = Math.hypot(norm, value);
    for (let at: number = 0; at < descriptor.length; at++) descriptor[at] /= norm;
    points.push({ point: [candidate.x, candidate.y], scale: 2 ** candidate.level,
      orientationRadians: candidate.angle, response: candidate.response, descriptor });
  }
  return { points, rawCorners, validCandidates: candidates.length, selectedBeforeDescriptor: selected.length,
    zeroDescriptors, invalidSupportDescriptors };
}
