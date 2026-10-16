import { interpolateAutoMovieMonotone } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

import { AUTOMOVIE_HUMAN_JAWLINE } from "../../junction/AUTOMOVIE_HUMAN_JAWLINE";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { locateAutoMovieHumanSubnasale } from "./locateAutoMovieHumanSubnasale";

/**
 * The head's guide curves, the silhouettes its sections are lofted through, in the head frame.
 *
 * Four guides run from the vertex down to the chin, each a monotone piecewise cubic through landmark knots, so between knots a guide never bulges past its neighbours (Fritsch and Carlson 1980):
 *
 * - Front: the midline profile without the nose and lips, which the features add: the forehead's arc from the vertex to glabella, nasion, the cheek plane under the nose, subnasale at the intersection of its measured three-dimensional nasal chord and its tragion-distance sphere, the base under the lips, the labiomental fold, pogonion and gnathion. Subnasale and gnathion stand where the measured tragion depths put them: the straight distances from tragion to nasion, subnasale and gnathion keep their measured ratios, so the skeleton's tragion-nasion distance sets the other two, and each depth follows after half the bitragion width and the landmark's height above tragion.
 * - Back: the midline from the vertex over the vault to opisthocranion and down the occiput to the neck-top ring's posterior point at the nape.
 * - Breadth: the half-breadth of the head's frontal outline, from the vertex over eurion and tragion to gonion, with the depth at which it lies.
 * - Exponents: the turn of the section's front and back quadrants, solved where a landmark lies on it (frontotemporale on the forehead, the ring behind the jaw) and named coefficients elsewhere.
 *
 * @param props The head frame with its landmarks, the head measurements, the neck-top ring's limit points in the head frame (anterior, posterolateral on the left and posterior), and the form coefficients
 * @returns The guides as functions of height in the head frame, millimetres
 */
export function profileAutoMovieHumanHead(props: {
  frame: frameAutoMovieHumanHead.IFrame;
  head: IAutoMovieHumanIdentity.IHead;
  ring: profileAutoMovieHumanHead.IRing;
  form: IAutoMovieHumanHeadForm;
}): profileAutoMovieHumanHead.IProfile {
  const { frame, head, ring, form }: typeof props = props;
  const fh: number = head.faceHeight;
  const top: number = frame.vertex.y;
  // depth in front of tragion of a midline point at a height, from its straight distance to tragion
  const tn: number = AutoMovieHumanVector.distance(frame.nasion, frame.tragion);
  const depth: (ratio: number, y: number) => number = (ratio: number, y: number): number =>
    Math.sqrt(
      Math.max(
        0,
        (ratio * tn) ** 2 - frame.tragion.x ** 2 - (y - frame.tragion.y) ** 2,
      ),
    ) + frame.tragion.z;
  const subnasale: IPoint = locateAutoMovieHumanSubnasale({
    nasion: frame.nasion,
    tragion: frame.tragion,
    noseHeight: head.features.noseHeight,
    tragionDistance: SUBNASALE_DEPTH * tn,
  });
  const gnathionY: number =
    frame.menton.y + AUTOMOVIE_HUMAN_JAWLINE.gnathionAboveMenton * fh;
  const gnathion: IPoint = {
    y: gnathionY,
    z: depth(AUTOMOVIE_HUMAN_JAWLINE.gnathionDepth, gnathionY),
  };
  const pogonion: IPoint = {
    y: frame.menton.y + form.pogonionAboveMenton * fh,
    z: subnasale.z - form.pogonionBehindSubnasale * fh,
  };
  const arc: (from: IPoint, to: IPoint, exponent: number, count: number) => IPoint[] = (
    from: IPoint,
    to: IPoint,
    exponent: number,
    count: number,
  ): IPoint[] =>
    Array.from({ length: count }, (_: unknown, k: number): IPoint => {
      // closer together toward the arc's end, where it turns fastest
      const f: number = 1 - Math.pow(1 - (k + 1) / count, ARC_SPACING);
      return {
        y: from.y + (to.y - from.y) * f,
        z:
          to.z +
          (from.z - to.z) * Math.pow(1 - Math.pow(f, exponent), 1 / exponent),
      };
    });
  const vertex: IPoint = { y: top, z: frame.vertex.z };
  const glabella: IPoint = { y: frame.glabella.y, z: frame.glabella.z };
  const opisthocranion: IPoint = {
    y: frame.opisthocranion.y,
    z: frame.opisthocranion.z,
  };
  const front: IPoint[] = [
    gnathion,
    pogonion,
    {
      y: frame.stomion.y - LOWER_LIP_HEIGHT * fh,
      z: subnasale.z - form.labiomentalBehindSubnasale * fh,
    },
    { y: frame.stomion.y, z: subnasale.z - form.stomionBehindSubnasale * fh },
    subnasale,
    { y: frame.zygion.y, z: subnasale.z - form.midfaceBehindSubnasale * fh },
    { y: frame.nasion.y, z: frame.nasion.z },
    glabella,
    ...arc(glabella, vertex, form.forehead, ARC_KNOTS),
  ];
  const nape: IPoint = { y: ring.posterior.y, z: ring.posterior.z };
  const back: IPoint[] = [
    nape,
    ...arc(opisthocranion, nape, form.occiput, ARC_KNOTS),
    opisthocranion,
    ...arc(opisthocranion, vertex, form.vaultBack, ARC_KNOTS),
  ];
  const eurion: IPoint = {
    y: frame.tragion.y + form.eurionHeight * (top - frame.tragion.y),
    z: frame.eurion.x,
  };
  const breadth: IPoint[] = [
    { y: frame.gonion.y, z: frame.gonion.x },
    { y: frame.tragion.y, z: frame.tragion.x },
    eurion,
    ...arc(eurion, { y: top, z: 0 }, form.vaultSide, ARC_KNOTS),
  ];
  const lateral: IPoint[] = [
    { y: frame.gonion.y, z: frame.gonion.z },
    { y: frame.tragion.y, z: frame.tragion.z },
    { y: top, z: frame.vertex.z },
  ];
  const curve: (points: IPoint[]) => (y: number) => number = (points: IPoint[]): ((y: number) => number) => {
    const sorted: IPoint[] = [...points].sort(
      (a: IPoint, b: IPoint): number => a.y - b.y,
    );
    const kept: IPoint[] = sorted.filter(
      (p: IPoint, k: number): boolean =>
        k === 0 || p.y - sorted[k - 1]!.y > 0.25,
    );
    return interpolateAutoMovieMonotone({
      knots: kept.map((p: IPoint): number => p.y),
      values: kept.map((p: IPoint): number => p.z),
    });
  };
  const guides: { front: (y: number) => number; back: (y: number) => number; breadth: (y: number) => number; lateral: (y: number) => number } = {
    front: curve(front),
    back: curve(back),
    breadth: curve(breadth),
    lateral: curve(lateral),
  };
  // the exponent that carries a quadrant through a point at its own height
  const solve: (x: number, z: number, fallback: number) => number = (x: number, z: number, fallback: number): number => {
    if (!(x > 0 && x < 1 && z > 0 && z < 1)) return fallback;
    let lo: number = 1.05;
    let hi: number = 20;
    for (let k: number = 0; k < 60; ++k) {
      const n: number = (lo + hi) / 2;
      if (Math.pow(x, n) + Math.pow(z, n) > 1) lo = n;
      else hi = n;
    }
    return (lo + hi) / 2;
  };
  const throughFront: (p: IAutoMovieVector3, fallback: number) => number = (p: IAutoMovieVector3, fallback: number): number =>
    solve(
      Math.abs(p.x) / guides.breadth(p.y),
      (p.z - guides.lateral(p.y)) / (guides.front(p.y) - guides.lateral(p.y)),
      fallback,
    );
  const throughBack: (p: IAutoMovieVector3, fallback: number) => number = (p: IAutoMovieVector3, fallback: number): number =>
    solve(
      Math.abs(p.x) / guides.breadth(p.y),
      (guides.lateral(p.y) - p.z) / (guides.lateral(p.y) - guides.back(p.y)),
      fallback,
    );
  const frontExponent: IPoint[] = [
    { y: gnathion.y, z: form.frontChin },
    { y: pogonion.y, z: form.frontChin },
    { y: frame.stomion.y, z: form.frontStomion },
    { y: subnasale.y, z: form.frontSubnasale },
    { y: frame.zygion.y, z: form.frontCheek },
    {
      y: frame.frontotemporale.y,
      z: throughFront(frame.frontotemporale, form.frontVault),
    },
    { y: top, z: form.frontVault },
  ];
  const backExponent: IPoint[] = [
    {
      y: ring.posterolateral.y,
      z: throughBack(ring.posterolateral, form.backNape),
    },
    { y: opisthocranion.y, z: form.backVault },
    { y: top, z: form.backVault },
  ];
  return {
    top,
    chin: gnathion.y,
    ...guides,
    frontExponent: curve(frontExponent),
    backExponent: curve(backExponent),
    subnasale,
  };
}
/** Input and output types of {@link profileAutoMovieHumanHead}. */
export namespace profileAutoMovieHumanHead {
  /**
   * The neck-top ring's limit points the guides read, head frame, millimetres.
   *
   * @author Samchon
   */
  export interface IRing {
    /** On the posterior midline, at the nape. */
    posterior: IAutoMovieVector3;

    /** On the left behind the jaw, the neck's column under the occiput. */
    posterolateral: IAutoMovieVector3;
  }

  /**
   * The guides, each a function of height in the head frame, millimetres.
   *
   * @author Samchon
   */
  export interface IProfile {
    /** Height of the vertex. */
    top: number;

    /** Height of gnathion, the lowest the front guide reaches. */
    chin: number;

    /** Depth of the midline front without nose and lips. */
    front: (y: number) => number;

    /** Depth of the midline back, negative. */
    back: (y: number) => number;

    /** Half-breadth of the frontal outline. */
    breadth: (y: number) => number;

    /** Depth at which the frontal outline lies. */
    lateral: (y: number) => number;

    /** Superellipse exponent of the front quadrants. */
    frontExponent: (y: number) => number;

    /** Superellipse exponent of the back quadrants. */
    backExponent: (y: number) => number;

    /** Subnasale on the midline, the profile's reference. */
    subnasale: { y: number; z: number };
  }
}

interface IPoint {
  y: number;
  z: number;
}

/** Lower lip height, stomion to sublabiale, the labiomental fold, over face height: 19.2 and 17.6 mm over 127.2 and 118.6 mm (3D Facial Norms; Weinberg et al. 2016, Cleft Palate Craniofac J 53(6):e185-e197). Grade: derived. */
const LOWER_LIP_HEIGHT: number = 0.15;

/** Tragion-subnasale over tragion-nasion, straight 3D distances: 132.8 over 126.7 mm in men and 123.5 over 118.9 in women, adults 20 to 40 (same source), sexes averaged. Grade: derived. */
const SUBNASALE_DEPTH: number = 1.043;

/** Knots each superellipse arc of the guides is sampled at, and the exponent drawing them together toward its end, where its radius of curvature shrinks fastest. */
const ARC_KNOTS: number = 16;
const ARC_SPACING: number = 2.5;
