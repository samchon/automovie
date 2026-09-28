import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  type IAutoMovieHumanFaceControlMap,
  createHumanFaceBasisBuilder,
} from "@automovie/human";

import { faceShapeFitSurfacePositions } from "./faceShapeFitSurface";

/**
 * Seat the neutral's brow card at the measured resting brow height, sliding
 * it up the skin it lies on.
 *
 * Resting brow height is the distance from the central inferior corneal
 * limbus to the first row of mature brow hairs, on the corneal centre's
 * vertical, in primary gaze (Cole, Winn and Putterman, Ophthalmic Plast
 * Reconstr Surg 2010;26:443-447: 19.4 mm in men, 19.7 in women, 213
 * subjects, no significant sex difference). `measureFaceBrowRest` reads it on
 * a model: the corneal centre is the globe's most anterior point, the
 * inferior limbus lies half a horizontal visible iris diameter below it
 * (`limbus`), and the first hair row is the lowest brow-card vertex within
 * `band` of that vertical.
 *
 * On the source the brow card sat 7 to 9 mm above the pupil, on the upper
 * lid's sulcus, while the skin's own brow prominence (the soft tissue over
 * the supraorbital rim, the front-most skin on the pupil's vertical) crests
 * 16 to 18 mm above it; the brow overlies the orbital rim. The skin is
 * therefore right and the card's seat is not, so only the card moves: every
 * card vertex is lifted by one height and keeps its clearance from the skin
 * along the view axis, read at its old and new heights from the skin's
 * front-most surface at its own x (`skinFront`). The lift is the one that
 * brings the brow height, the mean of both sides, to the target. Endpoint
 * rows are displacements, so every channel, corrective and population row
 * applies to the reseated card unchanged; the documents are restamped and
 * must build.
 *
 * Pure: returns new values.
 */
export function prepareBrowRestBasis(input: {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  revision: string;
  targetMetres: number;
  skin: string;
  eyes: string;
  brows: string;
  limbus: number;
  band: number;
}): {
  basis: IAutoMovieHumanFaceBasis;
  documents: IAutoMovieHumanFaceBasisDocument[];
  controls: IAutoMovieHumanFaceControlMap;
  receipt: {
    source: string;
    revision: string;
    liftMetres: number;
    beforeMetres: number;
    afterMetres: number;
    movedVertices: number;
  };
} {
  const { basis, documents, controls, revision } = structuredClone(input);
  if (revision.trim() === "" || revision === basis.id)
    throw new Error("A brow revision needs a distinct revision.");
  if (!(input.targetMetres > 0))
    throw new Error("A brow height target is a positive length.");
  const skin = basis.surfaces.find((one) => one.id === input.skin);
  const card = basis.surfaces.find((one) => one.id === input.brows);
  if (skin === undefined || card === undefined)
    throw new Error("The brow revision needs its skin and brow surfaces.");
  const measure = (candidate: IAutoMovieHumanFaceBasis) =>
    measureFaceBrowRest({
      basis: candidate,
      eyes: input.eyes,
      brows: input.brows,
      limbus: input.limbus,
      band: input.band,
    });
  const before = measure(basis);
  const front = (x: number, y: number) =>
    skinFront(skin.positions, skin.indices, x, y);
  const original = [...card.positions];
  const lift = (height: number): number[] => {
    const out = [...original];
    for (let v = 0; v < out.length / 3; ++v) {
      const x = original[3 * v]!;
      const y = original[3 * v + 1]!;
      const was = front(x, y);
      const now = front(x, y + height);
      if (was === null || now === null)
        throw new Error("A brow vertex has no skin in front of the head.");
      out[3 * v + 1] = y + height;
      out[3 * v + 2] = original[3 * v + 2]! + (now - was);
    }
    return out;
  };
  const withLift = (height: number): IAutoMovieHumanFaceBasis => ({
    ...basis,
    surfaces: basis.surfaces.map((one) =>
      one === card ? { ...one, positions: lift(height) } : one,
    ),
  });
  // The height is linear in the lift until the lowest card vertex changes,
  // so a secant iteration settles it.
  let a = 0;
  let fa = before - input.targetMetres;
  let b = input.targetMetres - before;
  let fb = measure(withLift(b)) - input.targetMetres;
  for (let k = 0; k < 20 && Math.abs(fb) > 1e-7 && fb !== fa; ++k) {
    const next = b - (fb * (b - a)) / (fb - fa);
    [a, fa] = [b, fb];
    b = next;
    fb = measure(withLift(b)) - input.targetMetres;
  }
  const raised = withLift(b);
  raised.id = revision;
  const build = createHumanFaceBasisBuilder(raised);
  const restamped = documents.map((document) => {
    const next = { ...document, basis: revision };
    build(next);
    return next;
  });
  return {
    basis: raised,
    documents: restamped,
    controls: { ...controls, basis: revision },
    receipt: {
      source: basis.id,
      revision,
      liftMetres: b,
      beforeMetres: before,
      afterMetres: measure(raised),
      movedVertices: original.length / 3,
    },
  };
}

/**
 * The front-most z of a surface's triangles over (x, y), the skin a card
 * lies on as the camera sees it; null when no triangle covers the point.
 */
export function skinFront(
  positions: readonly number[],
  indices: readonly number[],
  x: number,
  y: number,
): number | null {
  let best: number | null = null;
  for (let t = 0; t < indices.length; t += 3) {
    const [i, j, k] = [indices[t]!, indices[t + 1]!, indices[t + 2]!];
    const ax = positions[3 * i]!;
    const ay = positions[3 * i + 1]!;
    const bx = positions[3 * j]!;
    const by = positions[3 * j + 1]!;
    const cx = positions[3 * k]!;
    const cy = positions[3 * k + 1]!;
    const det = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (det === 0) continue;
    const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / det;
    const v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / det;
    const w = 1 - u - v;
    if (u < 0 || v < 0 || w < 0) continue;
    const z =
      u * positions[3 * i + 2]! +
      v * positions[3 * j + 2]! +
      w * positions[3 * k + 2]!;
    if (best === null || z > best) best = z;
  }
  return best;
}

/**
 * Mean of both sides' resting brow height on a basis neutral: the lowest
 * brow-card vertex within `band` metres of the corneal centre's vertical,
 * above the inferior limbus `limbus` metres below the corneal apex.
 */
export function measureFaceBrowRest(props: {
  basis: IAutoMovieHumanFaceBasis;
  eyes: string;
  brows: string;
  limbus: number;
  band: number;
}): number {
  const model = createHumanFaceBasisBuilder(props.basis)({
    id: "brow",
    name: "brow",
    basis: props.basis.id,
    shape: {},
    expression: {},
  });
  const eyes = faceShapeFitSurfacePositions(props.basis, model, props.eyes);
  const brows = faceShapeFitSurfacePositions(props.basis, model, props.brows);
  const heights = [-1, 1].map((side) => {
    let apex = -1;
    for (let v = 0; v < eyes.length / 3; ++v)
      if (
        Math.sign(eyes[3 * v]!) === side &&
        (apex < 0 || eyes[3 * v + 2]! > eyes[3 * apex + 2]!)
      )
        apex = v;
    if (apex < 0) throw new Error("Each side needs a globe.");
    let low = Infinity;
    for (let v = 0; v < brows.length / 3; ++v)
      if (Math.abs(brows[3 * v]! - eyes[3 * apex]!) < props.band)
        low = Math.min(low, brows[3 * v + 1]!);
    if (low === Infinity)
      throw new Error("No brow vertex lies over the cornea.");
    return low - (eyes[3 * apex + 1]! - props.limbus);
  });
  return (heights[0]! + heights[1]!) / 2;
}
