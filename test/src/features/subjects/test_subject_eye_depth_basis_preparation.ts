import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareEyeDepthBasis } from "../../../scripts/face-review/prepareEyeDepthBasis";
import { nclose, throwsError } from "../internal/predicates";

/** Grid vertex at x, y in -3..3. */
const cell = (x: number, y: number) => (y + 3) * 7 + (x + 3);

/**
 * A globe (an octahedron of unit radius about the origin, its pivot there
 * and its aim along +z), a skin grid of 7 by 7 unit cells at z = 1.2 in
 * front of it, a blink moving the grid within 1.5 of the axis by one and
 * the rest by a fifth, and one lash just ahead of the grid's centre.
 */
const fixture = (): IAutoMovieHumanFaceBasis => {
  const positions: number[] = [];
  for (let y = -3; y <= 3; ++y)
    for (let x = -3; x <= 3; ++x) positions.push(x, y, 1.2);
  const indices: number[] = [];
  for (let y = -3; y < 3; ++y)
    for (let x = -3; x < 3; ++x)
      indices.push(
        cell(x, y),
        cell(x + 1, y),
        cell(x + 1, y + 1),
        cell(x, y),
        cell(x + 1, y + 1),
        cell(x, y + 1),
      );
  const blink: number[] = [];
  for (let y = -3; y <= 3; ++y)
    for (let x = -3; x <= 3; ++x)
      blink.push(cell(x, y), 0, Math.hypot(x, y) <= 1.5 ? -1 : -0.2, 0);
  const globe = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1];
  return {
    id: "orbit/1",
    channels: [
      {
        id: "blink",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "blinkT",
        negative: null,
      },
      {
        id: "still",
        kind: "expression",
        minimum: 0,
        maximum: 1,
        positive: "stillT",
        negative: null,
      },
    ],
    landmarks: {
      ids: ["centre", "aim", "far", "farAim"],
      positions: [0, 0, 0, 0, 0, 1, 100, 0, 0, 100, 0, 1],
      targets: {},
    },
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: { blinkT: blink },
        regions: [{ id: "skin/skin", material: "skin", indices, uvs: null }],
      },
      {
        id: "eye",
        positions: globe,
        indices: [0, 2, 4, 1, 3, 5],
        targets: {},
        regions: [
          {
            id: "eye/eye",
            material: "skin",
            indices: [0, 2, 4, 1, 3, 5],
            uvs: null,
          },
        ],
      },
      {
        id: "lashes",
        positions: [0, 0, 1.3, 0.1, 0, 1.3, 0, 0.1, 1.3],
        indices: [0, 1, 2],
        targets: {},
        regions: [
          {
            id: "lashes/lashes",
            material: "skin",
            indices: [0, 1, 2],
            uvs: null,
          },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
};

/**
 * An eye depth control moving the globe along its orbit axis.
 * Scenarios:
 * 1. Forward, the globe's vertices and the pivot and aim landmarks move a
 *    unit along the axis; the lids within the globe's silhouette (the grid's
 *    centre and its four neighbours on the axes) move with it whole; the
 *    grid outside the aperture (x = 3) stays; a vertex between (x = 2)
 *    moves part of the way; the four diagonal lids past the silhouette,
 *    which the membrane alone would leave inside the globe, are pushed out
 *    to its surface's normal displacement; the lash moves as the grid's
 *    centre. Back is forward's negative.
 * 2. The channel spans the given envelope; the revision names itself and
 *    restamps documents and controls.
 * 3. A repeated revision, a unit of zero, an envelope missing a direction,
 *    a missing surface, landmark or
 *    blink, a channel the basis has, a blink moving no skin and an eye with
 *    no globe near a side's pivot refuse.
 */
export const test_subject_eye_depth_basis_preparation = (): void => {
  const basis = fixture();
  const side = {
    channel: "depth",
    blink: "blink",
    centre: "centre",
    target: "aim",
  };
  const input = {
    basis,
    documents: [
      { id: "doc", name: "doc", basis: basis.id, shape: {}, expression: {} },
    ],
    controls: { basis: basis.id } as never,
    revision: "orbit/2",
    skin: "skin",
    eye: "eye",
    attached: ["lashes"],
    sides: [side],
    unit: 0.5,
    envelope: [-1, 0.75] as [number, number],
    aperture: { halfWidth: 2.5, halfHeight: 2.5 },
  };
  const prepared = prepareEyeDepthBasis(input);
  const target = (surface: string, name: string) => {
    const rows =
      prepared.basis.surfaces.find((one) => one.id === surface)!.targets[
        name
      ] ?? [];
    const out = new Map<number, number[]>();
    for (let i = 0; i < rows.length; i += 4)
      out.set(rows[i]!, [rows[i + 1]!, rows[i + 2]!, rows[i + 3]!]);
    return out;
  };
  const forward = target("skin", "depth.forward");
  const back = target("skin", "depth.back");
  const whole = (d: number[] | undefined) =>
    d !== undefined &&
    nclose(d[0]!, 0) &&
    nclose(d[1]!, 0) &&
    nclose(d[2]!, 0.5);
  TestValidator.predicate(
    "globe, landmarks and lids within the silhouette",
    [...target("eye", "depth.forward").values()].every(whole) &&
      target("eye", "depth.forward").size === 6 &&
      prepared.basis.landmarks!.targets["depth.forward"]!.join() ===
        "0,0,0,0.5,1,0,0,0.5" &&
      [cell(0, 0), cell(1, 0), cell(-1, 0), cell(0, 1), cell(0, -1)].every(
        (vertex) => whole(forward.get(vertex)),
      ),
  );
  const pushedOut = [cell(1, 1), cell(-1, 1), cell(1, -1), cell(-1, -1)].every(
    (vertex) => {
      const p = [(vertex % 7) - 3, Math.floor(vertex / 7) - 3, 1.2];
      const n = p.map((v) => v / Math.hypot(...p));
      const d = forward.get(vertex)!;
      return nclose(
        n.reduce((sum, v, k) => sum + v * d[k]!, 0),
        0.5 * n[2]!,
        1e-9,
      );
    },
  );
  const between = forward.get(cell(2, 0))!;
  TestValidator.predicate(
    "outside stays, between follows part way, lids pushed out, lash follows",
    !forward.has(cell(3, 0)) &&
      between[2]! > 0 &&
      between[2]! < 0.5 &&
      pushedOut &&
      prepared.receipt.sides[0]!.pushed === 4 &&
      whole(target("lashes", "depth.forward").get(0)) &&
      [...forward].every(([vertex, d]) =>
        back.get(vertex)!.every((v, k) => nclose(v, -d[k]!, 1e-12)),
      ),
  );
  TestValidator.predicate(
    "channel, stamps",
    prepared.basis.channels.some(
      (one) =>
        one.id === "depth" &&
        one.minimum === -1 &&
        one.maximum === 0.75 &&
        one.positive === "depth.forward" &&
        one.negative === "depth.back",
    ) &&
      prepared.basis.id === "orbit/2" &&
      prepared.documents[0]!.basis === "orbit/2" &&
      (prepared.controls as { basis: string }).basis === "orbit/2",
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareEyeDepthBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareEyeDepthBasis({ ...input, unit: 0 }),
        "unit must be positive",
      ) &&
      throwsError(
        () => prepareEyeDepthBasis({ ...input, envelope: [0, 1] }),
        "both directions",
      ) &&
      throwsError(
        () => prepareEyeDepthBasis({ ...input, envelope: [-1, 0] }),
        "both directions",
      ) &&
      throwsError(
        () => prepareEyeDepthBasis({ ...input, attached: ["none"] }),
        "No surface none",
      ) &&
      throwsError(
        () =>
          prepareEyeDepthBasis({
            ...input,
            sides: [{ ...side, target: "none" }],
          }),
        "No landmark none",
      ) &&
      throwsError(
        () =>
          prepareEyeDepthBasis({
            ...input,
            sides: [{ ...side, blink: "none" }],
          }),
        "No blink none",
      ) &&
      throwsError(
        () =>
          prepareEyeDepthBasis({
            ...input,
            sides: [{ ...side, channel: "blink" }],
          }),
        "already has a channel blink",
      ) &&
      throwsError(
        () =>
          prepareEyeDepthBasis({
            ...input,
            sides: [{ ...side, blink: "still" }],
          }),
        "moves no lid",
      ) &&
      throwsError(
        () =>
          prepareEyeDepthBasis({
            ...input,
            sides: [
              side,
              {
                channel: "other",
                blink: "blink",
                centre: "far",
                target: "farAim",
              },
            ],
          }),
        "No globe near far",
      ),
  );
};
