import { IAutoMovieTransform, IAutoMovieVector3 } from "@automovie/interface";
import { placeTransformedPoint } from "./placeTransformedPoint";
import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";
import { pointSubjectBox } from "./pointSubjectBox";

/**
 * The world box one staged node fills, given the model-space box of what it
 * draws.
 *
 * The eight corners of `extent` go through the node's own placement
 * ({@link placeTransformedPoint}, the arithmetic that placed the parts the
 * extent was measured from) and the result is their axis-aligned range, so a
 * yawed or scaled element is boxed where it stands rather than where its model
 * file happens to lie.
 *
 * **This is the one answer both sides of a shot read.** `performShot` frames a
 * node subject from it and `realizeShotContract` grades the same subject from
 * it, which is what makes the check honest: a camera solved to hold a mass is
 * tested against the mass it was solved for. Measuring the width on one side
 * only would be worse than measuring it on neither — grading a 60 m facade on
 * its true box while the solve still aimed at its element origin would refuse
 * shots no authored camera could then satisfy.
 *
 * An extent lying on the node's own vertical axis is a point with a height
 * rather than geometry — the shape {@link nodeSubjectExtent} returns when
 * nothing could be measured — and it goes to {@link pointSubjectBox} instead.
 * There is nothing to place, so the only part of the placement that could
 * matter is where it stands: a rotation cannot turn a segment about the axis it
 * lies on, and a scale must not stretch the height, because a rig span and the
 * stand-in are inventions about the subject rather than measurements of it, and
 * scaling an invention states something the model never did.
 *
 * **This re-frames existing shots, and that is the decision rather than a side
 * effect.** Determinism is the product, so the change is stated here instead of
 * arriving quietly. Two things move for a node subject that draws geometry: the
 * framed `base` becomes the bottom CENTRE of the drawn box rather than the node
 * root, and the fit gains a width. Neither reaches a subject whose width was
 * already obvious. The base moves only by the horizontal offset between a
 * model's drawn centre and its own origin, which is zero for every figure and
 * every prop authored around itself; the distance moves only where
 * `width > height * aspect`, which no single body reaches at any shot size. So
 * what re-frames is exactly the class of subject whose framing was already
 * wrong — a set piece authored outward from an element origin, aimed at a
 * corner and solved for a fraction of its width — and holding that framing
 * stable would be preserving a defect, not a contract. The one shot that newly
 * FAILS is the one that named an element whose geometry stands nowhere near the
 * frame it delivered, which the previous grade passed by testing a segment at
 * the origin instead of the mass.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion nodeSubjectBox exposes state-dependent asset extent: The world box one staged node fills, the eight corners of its drawn model-space box carried through its own placement, so a yawed or scaled element is bounded where it stands.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants nodeSubjectBox realizes dynamic-bounds invariants: The world box one staged node fills, given the model-space box of what it draws. The eight corners of extent go through the node's own placement, the arithmetic that placed the parts the extent was measured from, and the result is their axis-aligned range, so a yawed or scaled element is boxed where it stands rather than where its model file happens to lie. This is the one answer both sides of a shot read: performShot frames a node subject from it and realizeShotContract grades the same subject from it, which is what makes the check honest. An extent with no horizontal span states that nothing was measured and goes to pointSubjectBox instead, because a rig span and the stand-in are inventions about the subject rather than measurements of it, and scaling an invention states something the model never did.
 */
export const nodeSubjectBox = (
  placement: IAutoMovieTransform,
  extent: IAutoMovieSubjectBox,
): IAutoMovieSubjectBox => {
  if (
    extent.min.x === 0 &&
    extent.max.x === 0 &&
    extent.min.z === 0 &&
    extent.max.z === 0
  )
    return pointSubjectBox(placement.translation, {
      min: extent.min.y,
      max: extent.max.y,
    });
  const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: IAutoMovieVector3 = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const x of [extent.min.x, extent.max.x])
    for (const y of [extent.min.y, extent.max.y])
      for (const z of [extent.min.z, extent.max.z]) {
        const corner = placeTransformedPoint(placement, { x, y, z });
        if (corner.x < min.x) min.x = corner.x;
        if (corner.y < min.y) min.y = corner.y;
        if (corner.z < min.z) min.z = corner.z;
        if (corner.x > max.x) max.x = corner.x;
        if (corner.y > max.y) max.y = corner.y;
        if (corner.z > max.z) max.z = corner.z;
      }
  return { min, max };
};
