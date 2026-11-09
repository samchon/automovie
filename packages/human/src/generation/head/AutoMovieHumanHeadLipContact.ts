import {
  type AutoMovieLoftFrame,
  AutoMovieLoftSectionNative,
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieLoftViewWorldJet,
  type AutoMovieViewAxis,
  type IAutoMovieViewPart,
} from "@automovie/engine";

/** World-mm vector, with derivatives in physical lateral millimetres. */
type V3 = [number, number, number];

/** The actual axis owner's nullable analytic frame2 result. */
type FrameJet = ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>>;

/**
 * Original mass contact and both lip borders in one declared level chart.
 * Each border is the signed native-parent chord of its supplied Euclidean
 * height from the resting curve. This reads original scalar functions; it
 * neither projects an emitted mesh nor changes a supplied height.
 *
 * @evidence contracts/common.md#principled-implementation Inverts the actual forward native branch, then differentiates the chord equation and its secant frame from original world total2.
 * @evidence contracts/common.md#clear-and-simple-design One immutable parent admission serves the resting reader and both regional border consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile residual, copied conic coefficient, fitted mesh or fabricated pole derivative supplies a border.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes native incidence and public chord from bulk relief and whole-footprint containment.
 * @evidence contracts/performance.md#efficient-algorithms Parent scalar admission is linear in its knots. Each field query prepares one section and uses at most 56 native phase steps; a border uses at most 48 safeguarded chord steps plus its original world2 reads, retaining the source and axis owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The two lips borrow the same parent preparation and resting law; each lip may retain only its latest resulting section.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned contact retains its original parent and admitted scalar source; query temporaries and vectors have call scope, with no global cache.
 */
export namespace AutoMovieHumanHeadLipContact {
  /** One original forward point and its optional physical lateral derivatives. */
  export interface IReading {
    /** Actual point in world mm. */
    point: V3;
    /** First and second forward derivatives per lateral mm; absent at a singular inverse. */
    forwardJet: [number, number] | null;
  }

  /** The same native field with optional implicit-coordinate total2. */
  interface IField extends IReading {
    /** Fy, Fz, Fyy, Fyz, Fzz for world X=F(world Y,world Z). */
    derivatives: [number, number, number, number, number] | null;
  }

  /** A section value is valid independently of availability of its frame2. */
  export interface ISection {
    /** Actual midpoint and oriented secant axes, with parallel lateral planes. */
    frame: AutoMovieLoftFrame.IFrame;
    /** Analytic derivatives in physical lateral mm, null at a singular border/corner. */
    jet: FrameJet;
    /** Same original parent resting point. */
    resting: V3;
    /** Same original parent border point, at its own height. */
    border: V3;
  }

  /** One full native parent source, with explicit units and chart ownership. */
  export interface IContact {
    /** Identical original material parent. */
    parent: IAutoMovieViewPart;
    /** Complete original signed supports, effective fullness and cap laws. */
    source: AutoMovieLoftViewSource.ISource;
    /** Actual source plane at stomion. */
    frame: AutoMovieLoftFrame.IFrame;
    /** Forward resting point at world lateral mm. */
    at(lateral: number): IReading;
    /** Actual signed border at Euclidean height mm; heightJet uses physical lateral mm. */
    section(
      lateral: number,
      height: number,
      sign: number,
      heightJet: readonly [number, number] | null,
    ): ISection;
  }

  /**
   * Admit one original level field, retaining the actual source and axis.
   * Queries reject unsupported charts and domains instead of moving a point.
   */
  export function create(parent: IAutoMovieViewPart, height: number): IContact {
    const admitted: AutoMovieLoftViewSource.IResult | null =
      AutoMovieLoftViewSource.create(parent);
    if (admitted?.source === null || admitted === null)
      throw new Error(
        "Lip material parent has no admitted original direct field",
      );
    const source: AutoMovieLoftViewSource.ISource = admitted.source;
    const frame: AutoMovieLoftFrame.IFrame = parent.axis.at(height);

    /** Read X=F(Y,Z) from the original forward branch, preserving its available total2. */
    const field: (y: number, z: number) => IField = (
      y: number,
      z: number,
    ): IField => {
      const inputs: AutoMovieLoftViewRead.IValues | string =
        AutoMovieLoftViewRead.values(source, y);
      if (typeof inputs === "string")
        throw new Error(`Lip parent field: ${inputs}`);
      const plane: AutoMovieLoftFrame.IFrame = parent.axis.at(y);
      if (
        Math.hypot(
          plane.u[0] - 1,
          plane.u[1],
          plane.u[2],
          plane.v[0],
          plane.v[1],
          plane.v[2] - 1,
          plane.origin[1] - y,
        ) > 1e-9
      )
        throw new Error(
          "Lip material parent requires its declared world-level X/Z chart",
        );
      const point: ReturnType<typeof AutoMovieLoftSectionNative.point> =
        AutoMovieLoftSectionNative.point(inputs);
      const target: number = z - plane.origin[2];
      const lower: number = point(-Math.PI / 2)[1];
      const upper: number = point(Math.PI / 2)[1];
      if (!(Number.isFinite(target) && target >= lower && target <= upper))
        throw new Error(
          `Lip lateral ${z} is outside the original parent at ${y}`,
        );
      let low: number = -Math.PI / 2;
      let high: number = Math.PI / 2;
      for (let i: number = 0; i < 56; i++) {
        const middle: number = (low + high) / 2;
        if (point(middle)[1] < target) low = middle;
        else high = middle;
      }
      const phase: number =
        target === lower
          ? -Math.PI / 2
          : target === upper
            ? Math.PI / 2
            : (low + high) / 2;
      const local: ReturnType<
        ReturnType<typeof AutoMovieLoftSectionNative.phase>
      > = AutoMovieLoftSectionNative.phase(inputs)(phase);
      const first: number = local.t[0] / local.t[1];
      const second: number =
        (local.tt[0] * local.t[1] - local.t[0] * local.tt[1]) / local.t[1] ** 3;
      const world: ReturnType<typeof AutoMovieLoftViewWorldJet> =
        AutoMovieLoftViewWorldJet(source, parent.axis, y, phase);
      let derivatives: IField["derivatives"] = null;
      if (typeof world !== "string" && world.v[2] !== 0) {
        const q: number = -world.u[2] / world.v[2];
        const qy: number =
          -(world.uu[2] + 2 * world.uv[2] * q + world.vv[2] * q * q) /
          world.v[2];
        const qz: number = -(world.uv[2] + world.vv[2] * q) / world.v[2] ** 2;
        const values: [number, number, number, number, number] = [
          world.u[0] + world.v[0] * q,
          world.v[0] / world.v[2],
          world.uu[0] +
            2 * world.uv[0] * q +
            world.vv[0] * q * q +
            world.v[0] * qy,
          (world.uv[0] + world.vv[0] * q) / world.v[2] + world.v[0] * qz,
          (world.vv[0] * world.v[2] - world.v[0] * world.vv[2]) /
            world.v[2] ** 3,
        ];
        if (values.every(Number.isFinite)) derivatives = values;
      }
      return {
        point: [plane.origin[0] + local.p[0], y, z],
        forwardJet:
          Number.isFinite(first) && Number.isFinite(second)
            ? [first, second]
            : null,
        derivatives,
      };
    };

    return {
      parent,
      source,
      frame,
      at: (lateral: number): IReading => field(height, lateral),
      section: (
        z: number,
        h: number,
        sign: number,
        hjet: readonly [number, number] | null,
      ): ISection => {
        if (!(Number.isFinite(h) && h >= 0 && (sign === 1 || sign === -1)))
          throw new Error(
            "Lip chord needs a finite nonnegative height and signed direction",
          );
        const rest: IField = field(height, z);
        if (h === 0) {
          if (rest.derivatives === null)
            throw new Error("Lip corner has no original forward tangent");
          const slope: number = rest.derivatives[0];
          const norm: number = Math.hypot(slope, 1);
          return {
            frame: {
              origin: [...rest.point],
              u: [slope / norm, 1 / norm, 0],
              v: [1 / norm, -slope / norm, 0],
            },
            jet: null,
            resting: rest.point,
            border: [...rest.point],
          };
        }

        // Vertical separation alone brackets a chord of length h. The actual
        // parent must own this interval; a failed field read is never clamped.
        let lo: number = 0;
        let hi: number = h;
        let distance: number = h;
        let border: IField = field(height + sign * h, z);
        for (let i: number = 0; i < 48; i++) {
          const dx: number = border.point[0] - rest.point[0];
          const dy: number = border.point[1] - height;
          const residual: number = Math.hypot(dx, dy) - h;
          if (Math.abs(residual) <= 2e-12) break;
          if (residual > 0) hi = distance;
          else lo = distance;
          const derivative: number | null =
            border.derivatives === null
              ? null
              : (sign * (dx * border.derivatives[0] + dy)) / Math.hypot(dx, dy);
          const trial: number =
            derivative === null || derivative === 0
              ? NaN
              : distance - residual / derivative;
          distance =
            Number.isFinite(trial) && trial > lo && trial < hi
              ? trial
              : (lo + hi) / 2;
          border = field(height + sign * distance, z);
          if (i === 47)
            throw new Error("Lip native chord inverse did not converge");
        }
        const delta: V3 = [
          border.point[0] - rest.point[0],
          border.point[1] - height,
          0,
        ];
        const u: V3 = [(sign * delta[0]) / h, (sign * delta[1]) / h, 0];
        const value: AutoMovieLoftFrame.IFrame = {
          origin: [
            (rest.point[0] + border.point[0]) / 2,
            (height + border.point[1]) / 2,
            z,
          ],
          u,
          v: [u[1], -u[0], 0],
        };
        return {
          frame: value,
          resting: rest.point,
          border: border.point,
          jet: differentiate(rest, border, delta, value, h, sign, hjet),
        };
      },
    };
  }

  /** Differentiate the same native chord equation and secant, never its sampled values. */
  function differentiate(
    rest: IField,
    border: IField,
    delta: V3,
    value: AutoMovieLoftFrame.IFrame,
    h: number,
    sign: number,
    hjet: readonly [number, number] | null,
  ): FrameJet {
    if (
      rest.derivatives === null ||
      border.derivatives === null ||
      hjet === null
    )
      return null;
    const [fy, fz, fyy, fyz, fzz]: [number, number, number, number, number] =
      border.derivatives;
    const az: number = fz - rest.derivatives[1];
    const azz: number = fzz - rest.derivatives[4];
    const gy: number = 2 * (delta[0] * fy + delta[1]);
    if (gy === 0) return null;
    const dy: number = (-2 * (delta[0] * az - h * hjet[0])) / gy;
    const gzz: number =
      2 * (az * az + delta[0] * azz - hjet[0] ** 2 - h * hjet[1]);
    const gyz: number = 2 * (fy * az + delta[0] * fyz);
    const gyy: number = 2 * (fy * fy + delta[0] * fyy + 1);
    const ddy: number = -(gzz + 2 * gyz * dy + gyy * dy * dy) / gy;
    const dx: number = fy * dy + fz;
    const ddx: number = fyy * dy * dy + 2 * fyz * dy + fzz + fy * ddy;
    const firstDelta: V3 = [dx - rest.derivatives[1], dy, 0];
    const secondDelta: V3 = [ddx - rest.derivatives[4], ddy, 0];
    const firstU: V3 = [0, 0, 0];
    const secondU: V3 = [0, 0, 0];
    for (let i: number = 0; i < 2; i++) {
      firstU[i] = sign * (firstDelta[i]! / h - (delta[i]! * hjet[0]) / h ** 2);
      secondU[i] =
        sign *
        (secondDelta[i]! / h -
          (2 * firstDelta[i]! * hjet[0]) / h ** 2 -
          (delta[i]! * hjet[1]) / h ** 2 +
          (2 * delta[i]! * hjet[0] ** 2) / h ** 3);
    }
    const first: AutoMovieLoftFrame.IFrame = {
      origin: [(dx + rest.derivatives[1]) / 2, dy / 2, 1],
      u: firstU,
      v: [firstU[1], -firstU[0], 0],
    };
    const second: AutoMovieLoftFrame.IFrame = {
      origin: [(ddx + rest.derivatives[4]) / 2, ddy / 2, 0],
      u: secondU,
      v: [secondU[1], -secondU[0], 0],
    };
    return [
      ...first.origin,
      ...first.u,
      ...first.v,
      ...second.origin,
      ...second.u,
      ...second.v,
    ].every(Number.isFinite)
      ? { value, first, second }
      : null;
  }
}
