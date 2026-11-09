import { CaptureCameras } from "../../../../../packages/human/src/inspection/CaptureCameras";
import { NodeCanvasCamera } from "../../../../../packages/human/src/inspection/NodeCanvasCamera";
import type { NodeCanvasTypes } from "../../../../../packages/human/src/inspection/NodeCanvasTypes";

type V3 = NodeCanvasTypes.Point;
type Camera = NodeCanvasTypes.Camera;

/**
 * The capture's cameras look from the directions their names promise in the
 * Node display frame (+X forward, +Y up, +Z anatomical left), are
 * orthonormal and right-handed, frame every given point inside the drawable
 * area with the larger projected extent tight to the 88 % margin, keep a
 * finite scale for degenerate selections, centre a close-up on its port, and
 * give a curve close-ups only for ports within reach.
 *
 * Scenarios:
 * 1. Red proofs: a left-handed basis fails the handedness check, a camera zoomed 1.2 times leaves a framed point outside the drawable area, and a front camera turned to look from behind fails its direction check.
 * 2. For every standard camera and a made 300 x 600 x 100 mm box: right, up and back are unit, mutually orthogonal and right x up = back; every corner projects inside [20, w - 20] x [80, h - 30]; the largest |screen offset| of the corners equals 0.88 of the half drawable width or height (one axis tight).
 * 3. Directions: front sees the nearer +X face (larger x projects nearer), left looks from +Z (anatomical left), right from -Z, top from +Y with +X toward the image bottom, bottom from -Y with +X toward the image top, front and back keep +Y up on screen, both obliques stand on the front-left with the high one above and the low one below.
 * 4. A single point framed with a 60 mm minimum has the finite scale 0.88 min(w - 40, h - 110) / 0.06; an empty selection throws.
 * 5. A close-up's target is its port and its eight box corners project inside the image; `near` keeps a port at exactly its radius, drops one 1 mm beyond it.
 * 7. A framing point with a NaN coordinate makes the fitted camera's target and scale NaN, and `invalid` names those fields; the same points without it fit a camera `invalid` accepts, as it accepts every standard camera of the box.
 * 6. No fitted camera, standard or close-up (including a port written with -0 coordinates), holds a negative zero in its target or basis, since the reference-cache key distinguishes -0 from the 0 a JSON manifest stores; red: a camera holding -0 is flagged.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Fits cameras with `CaptureCameras.fit`, `closeup` and `near` and projects points with the shared `NodeCanvasCamera.project` the raster uses, asserting the resulting basis, screen positions and selections.
 * @evidence contracts/development/testing.md#independent-expectations Orthonormality and right-handedness are vector identities; the named directions come from the documented display frame; the margin bound restates the documented 88 % framing contract as a screen inequality checked through the independent projector; the single-point scale is that contract's closed form for a 60 mm square.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight standard cameras, a box, a single point, an empty selection, a close-up, a port at and beyond reach, a -0 port. Red: left-handed basis, 1.2 times zoom, reversed front, a -0 component.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit reached by `--include human_capture_cameras`; no canvas, file or browser.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Red proofs: a left-handed basis fails the handedness check, a camera zoomed 1.2 times leaves a framed point outside the drawable area, and...).
 */
export function test_human_capture_cameras(): void {
  const failures: string[] = [];
  const W: number = 720;
  const H: number = 720;
  const box: V3[] = [];
  for (const x of [-0.05, 0.05])
    for (const y of [0.2, 0.8]) for (const z of [0.1, 0.4]) box.push([x, y, z]);

  // 1. Red proofs.
  const front: Camera = CaptureCameras.fit(
    CaptureCameras.STANDARD[0]!,
    box,
    W,
    H,
    0.06,
  );
  if (
    basis({
      ...front,
      right: [-front.right[0], -front.right[1], -front.right[2]],
    }).length === 0
  )
    failures.push("proof: a left-handed basis read as right-handed");
  if (framed({ ...front, scale: front.scale * 1.2 }, box).length === 0)
    failures.push("proof: a 1.2 times zoom read as framed");
  if (direction("front", { ...front, back: [-1, 0, 0] }).length === 0)
    failures.push("proof: a front camera looking from behind read as front");

  // 2. Basis and framing for every standard camera.
  for (const d of CaptureCameras.STANDARD) {
    const c: Camera = CaptureCameras.fit(d, box, W, H, 0.06);
    failures.push(...basis(c).map((f: string): string => `${d.name}: ${f}`));
    failures.push(
      ...framed(c, box).map((f: string): string => `${d.name}: ${f}`),
    );
    const offsets: V3[] = box.map(
      (p: V3): V3 => NodeCanvasCamera.project(p, c),
    );
    const ex: number = Math.max(
      ...offsets.map((p: V3): number => Math.abs(p[0] - W / 2)),
    );
    const ey: number = Math.max(
      ...offsets.map((p: V3): number => Math.abs(p[1] - (H + 40) / 2)),
    );
    const tight: boolean =
      Math.abs(ex - (0.88 * (W - 40)) / 2) < 1e-6 ||
      Math.abs(ey - (0.88 * (H - 110)) / 2) < 1e-6;
    if (!tight)
      failures.push(
        `${d.name}: neither axis tight to the 88 % margin (${ex.toFixed(3)}, ${ey.toFixed(3)})`,
      );

    // 3. Directions.
    failures.push(...direction(d.name, c));
  }

  // 4. Degenerate selections.
  const single: Camera = CaptureCameras.fit(
    CaptureCameras.STANDARD[0]!,
    [[0, 0, 0]],
    W,
    H,
    0.06,
  );
  const expected: number = (0.88 * Math.min(W - 40, H - 110)) / 0.06;
  if (!(Math.abs(single.scale - expected) < 1e-9))
    failures.push(`single point scale ${single.scale} instead of ${expected}`);
  let threw: boolean = false;
  try {
    CaptureCameras.fit(CaptureCameras.STANDARD[0]!, [], W, H, 0.06);
  } catch {
    threw = true;
  }
  if (!threw) failures.push("an empty selection did not throw");

  // 6. Negative zero: no fitted vector keeps -0, which the reference-cache key distinguishes from the 0 a manifest stores.
  const fitted: Camera[] = [
    ...CaptureCameras.STANDARD.map(
      (d: CaptureCameras.IDirection): Camera =>
        CaptureCameras.fit(d, box, W, H, 0.06),
    ),
    CaptureCameras.closeup(
      { name: "zero", point: [-0, 0.5, -0], radius: 0.1 },
      W,
      H,
    ),
  ];
  for (const c of fitted)
    if (negativeZero(c).length !== 0)
      failures.push(`${c.name}: -0 in ${negativeZero(c).join(", ")}`);
  const signed: Camera = { ...front, right: [0, -0, -1] };
  if (negativeZero(signed).length === 0)
    failures.push("proof: a camera holding -0 read as clean");

  // 7. A non-finite framing point makes the fitted camera NaN (the empty-frame defect); the guard names its fields, and fitting the finite points alone gives a valid camera.
  const poisoned: V3[] = [...box, [Number.NaN, 0.5, 0.2]];
  const nanCamera: Camera = CaptureCameras.fit(
    CaptureCameras.STANDARD[0]!,
    poisoned,
    W,
    H,
    0.06,
  );
  const named: string[] = CaptureCameras.invalid(nanCamera);
  if (!(named.includes("target[0]") && named.includes("scale")))
    failures.push(
      `proof: a camera fitted through a NaN point read as finite (${named.join(", ")})`,
    );
  const healed: Camera = CaptureCameras.fit(
    CaptureCameras.STANDARD[0]!,
    poisoned.filter((p: V3): boolean => p.every(Number.isFinite)),
    W,
    H,
    0.06,
  );
  if (CaptureCameras.invalid(healed).length !== 0)
    failures.push(
      `a camera fitted on finite points read as invalid: ${CaptureCameras.invalid(healed).join(", ")}`,
    );
  for (const d of CaptureCameras.STANDARD)
    if (
      CaptureCameras.invalid(CaptureCameras.fit(d, box, W, H, 0.06)).length !==
      0
    )
      failures.push(`${d.name}: a finite camera read as invalid`);

  // 5. Close-ups and reach.
  const port: { name: string; point: V3; radius: number } = {
    name: "elbow",
    point: [0.01, 0.5, 0.2],
    radius: 0.11,
  };
  const close: Camera = CaptureCameras.closeup(port, W, H);
  if (
    close.name !== "closeup.elbow" ||
    close.target.some(
      (v: number, k: number): boolean => Math.abs(v - port.point[k]!) > 1e-12,
    )
  )
    failures.push(`close-up ${close.name} targets ${close.target.join(", ")}`);
  const corners: V3[] = [];
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1])
        corners.push([
          port.point[0] + sx * port.radius,
          port.point[1] + sy * port.radius,
          port.point[2] + sz * port.radius,
        ]);
  failures.push(
    ...framed(close, corners).map((f: string): string => `close-up: ${f}`),
  );
  failures.push(...basis(close).map((f: string): string => `close-up: ${f}`));
  const ports: { name: string; point: V3; radius: number }[] = [
    { name: "at", point: [0, 0, 100], radius: 100 },
    { name: "beyond", point: [0, 0, 101], radius: 100 },
  ];
  const near: string[] = CaptureCameras.near(ports, [[0, 0, 0]]).map(
    (p: { name: string }): string => p.name,
  );
  if (JSON.stringify(near) !== JSON.stringify(["at"]))
    failures.push(`near kept ${near.join(", ")}`);

  if (failures.length !== 0)
    throw new Error(
      `${failures.length} capture camera findings:\n${failures.join("\n")}`,
    );
}

/** Vector components of the camera that are negative zero. */
function negativeZero(c: Camera): string[] {
  const out: string[] = [];
  for (const [n, v] of [
    ["target", c.target],
    ["back", c.back],
    ["right", c.right],
    ["up", c.up],
  ] as const)
    for (let k: number = 0; k < 3; ++k)
      if (Object.is(v[k], -0)) out.push(`${n}[${k}]`);
  return out;
}

/** Unit, orthogonal, right-handed basis with right x up = back. */
function basis(c: Camera): string[] {
  const out: string[] = [];
  for (const [n, v] of [
    ["right", c.right],
    ["up", c.up],
    ["back", c.back],
  ] as const)
    if (Math.abs(Math.hypot(...v) - 1) > 1e-12) out.push(`${n} not unit`);
  if (
    Math.abs(dot(c.right, c.up)) > 1e-12 ||
    Math.abs(dot(c.right, c.back)) > 1e-12 ||
    Math.abs(dot(c.up, c.back)) > 1e-12
  )
    out.push("not orthogonal");
  const rxu: V3 = cross(c.right, c.up);
  if (
    Math.abs(rxu[0] - c.back[0]) +
      Math.abs(rxu[1] - c.back[1]) +
      Math.abs(rxu[2] - c.back[2]) >
    1e-9
  )
    out.push("right x up is not back (left-handed)");
  return out;
}

/** Every point inside the drawable area: 20 px side margins, 80 px caption band, 30 px footer. */
function framed(c: Camera, points: readonly V3[]): string[] {
  const out: string[] = [];
  for (const p of points) {
    const [x, y]: V3 = NodeCanvasCamera.project(p, c);
    if (
      x < 20 - 1e-9 ||
      x > c.width - 20 + 1e-9 ||
      y < 80 - 1e-9 ||
      y > c.height - 30 + 1e-9
    )
      out.push(
        `point ${p.join(",")} at (${x.toFixed(1)}, ${y.toFixed(1)}) outside the drawable area`,
      );
  }
  return out;
}

/** The named view's documented direction and screen orientation. */
function direction(name: string, c: Camera): string[] {
  const out: string[] = [];
  const near: (a: V3, b: V3) => boolean = (a: V3, b: V3): boolean =>
    NodeCanvasCamera.project(a, c)[2] > NodeCanvasCamera.project(b, c)[2];
  const below: (a: V3, b: V3) => boolean = (a: V3, b: V3): boolean =>
    NodeCanvasCamera.project(a, c)[1] > NodeCanvasCamera.project(b, c)[1];
  const o: V3 = [0, 0, 0];
  if (name === "front" && !(near([1, 0, 0], o) && below(o, [0, 1, 0])))
    out.push("front does not look from +X with +Y up");
  if (name === "back" && !(near([-1, 0, 0], o) && below(o, [0, 1, 0])))
    out.push("back does not look from -X with +Y up");
  if (name === "left" && !(near([0, 0, 1], o) && below(o, [0, 1, 0])))
    out.push("left does not look from +Z (anatomical left)");
  if (name === "right" && !near([0, 0, -1], o))
    out.push("right does not look from -Z");
  if (name === "top" && !(near([0, 1, 0], o) && below([1, 0, 0], o)))
    out.push("top does not look from +Y with +X toward the image bottom");
  if (name === "bottom" && !(near([0, -1, 0], o) && below(o, [1, 0, 0])))
    out.push("bottom does not look from -Y with +X toward the image top");
  if (
    name === "high-oblique" &&
    !(c.back[0] > 0 && c.back[2] > 0 && c.back[1] > 0)
  )
    out.push("high oblique is not front-left above");
  if (
    name === "low-oblique" &&
    !(c.back[0] > 0 && c.back[2] > 0 && c.back[1] < 0)
  )
    out.push("low oblique is not front-left below");
  return out;
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}
