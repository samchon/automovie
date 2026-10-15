import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";

/**
 * The vault: an egg superellipsoid, the braincase whose length, breadth and height the cephalic and height indices measure.
 *
 * Its centre lies at glabella's height under the vertex, so the vertex tops it, glabella and opisthocranion bound its length and its breadth is the measured head breadth. The front and back halves of its horizontal section are superellipses of their own: the front exponent is solved so the forehead passes through frontotemporale, the narrowest forehead, and the back exponent so the section at glabella's height, where the tape runs just above the brows, has the measured head circumference. That is what makes length, breadth and circumference agree with the identity together, the shape the circumference check of the identity admits (circumference about 1.04 to 1.06 times the perimeter of the length-breadth ellipse; Zhuang et al. 2010, Ann Occup Hyg 54(4):391-402; Du et al. 2008, Ann Occup Hyg 52(8):773-782).
 *
 * Below glabella the front recedes into the orbital roofs, leaving the face to the face mass, while the temples run down to the zygomatic arch and the back and sides to the mastoid level.
 *
 * @param frame The head frame and its landmarks
 * @param head The head measurements
 * @param breadth Maximum head breadth, millimetres
 * @param form Form coefficients
 * @returns Signed distance from the vault, millimetres
 */
export function shapeAutoMovieHumanHeadVault(
  frame: frameAutoMovieHumanHead.IFrame,
  head: IAutoMovieHumanIdentity.IHead,
  breadth: number,
  form: IAutoMovieHumanHeadForm,
): (p: IAutoMovieVector3) => number {
  const cy: number = frame.glabella.y;
  const cz: number = frame.vertex.z;
  const half: number = breadth / 2;
  const front: number = frame.glabella.z - cz;
  const back: number = cz - frame.opisthocranion.z;
  const up: number = frame.vertex.y - cy;
  const ft: IAutoMovieVector3 = frame.frontotemporale;
  const rise: number = Math.max(0, ft.y - cy) / up;
  const level: number = Math.pow(
    Math.max(1e-6, 1 - Math.pow(rise, form.vaultForehead)),
    1 / form.vaultForehead,
  );
  const frontExponent: number = AutoMovieHumanHeadMath.solve(
    (n: number): number =>
      Math.pow(ft.x / half, n) +
      Math.pow(Math.max(0, ft.z - cz) / front, n) -
      Math.pow(level, n),
    1.5,
    5,
  );
  const frontHalf: number = AutoMovieHumanHeadMath.halfPerimeter(
    half,
    front,
    frontExponent,
  );
  const backExponent: number = AutoMovieHumanHeadMath.solve(
    (n: number): number =>
      frontHalf +
      AutoMovieHumanHeadMath.halfPerimeter(half, back, n) -
      head.headCircumference,
    1.5,
    8,
  );
  const above: number = cy - frame.tragion.y;
  const downBack: number = above + form.mastoid * head.headHeight;
  const downTemple: number = above + form.temple * head.headHeight;
  const downFront: number = form.orbitRoof * head.headHeight;
  return (p: IAutoMovieVector3): number => {
    const dx: number = Math.abs(p.x);
    const dy: number = p.y - cy;
    const dz: number = p.z - cz;
    const forward: number = dz / (dz > 0 ? front : back);
    const temple: number =
      downBack +
      (downTemple - downBack) *
        AutoMovieHumanHeadMath.smoothStep(-0.15, 0.1, forward);
    const down: number =
      temple +
      (downFront - temple) *
        AutoMovieHumanHeadMath.smoothStep(
          form.recedeStart,
          form.recedeEnd,
          forward,
        );
    const n: number = dz > 0 ? frontExponent : backExponent;
    const horizontal: number = Math.pow(
      Math.pow(dx / half, n) +
        Math.pow(Math.abs(dz) / (dz > 0 ? front : back), n),
      1 / n,
    );
    const q: number =
      dy > 0
        ? form.vaultTop +
          (form.vaultForehead - form.vaultTop) *
            AutoMovieHumanHeadMath.smoothStep(0, 0.8, forward)
        : form.vaultBottom;
    const s: number =
      Math.pow(horizontal, q) +
      Math.pow(Math.abs(dy) / (dy > 0 ? up : down), q);
    return AutoMovieHumanHeadMath.radial(
      Math.sqrt(dx * dx + dy * dy + dz * dz),
      s,
      q,
    );
  };
}
