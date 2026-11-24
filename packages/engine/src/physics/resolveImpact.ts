import {
  type AutoMovieImpactKind,
  type IAutoMovieImpact,
  type IAutoMovieImpactBodyState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

const EMBED_SPEED: number = 6 as const; // m/s above which a penetrable body is pierced, not bounced

const THROUGH_SPEED: number = 14 as const; // m/s above which a very soft body is passed clean through

const THROUGH_TRANSFER: number = 0.3 as const; // fraction of momentum a pass-through still imparts

type ImpactCoefficient = "restitution" | "hardness" | "penetrability";

const assertImpactMass: (label: "a" | "b", mass: number) => void = (
  label: "a" | "b",
  mass: number,
): void => {
  if (mass <= 0)
    throw new RangeError(
      `impact body ${label} mass must be > 0, but was ${mass}`,
    );
};

const assertImpactCoefficient: (
  label: "a" | "b",
  name: ImpactCoefficient,
  value: number,
) => void = (
  label: "a" | "b",
  name: ImpactCoefficient,
  value: number,
): void => {
  if (value < 0 || value > 1)
    throw new RangeError(
      `impact body ${label} ${name} must be within [0, 1], but was ${value}`,
    );
};

const assertImpactBody: (
  label: "a" | "b",
  body: IAutoMovieImpactBodyState,
) => void = (label: "a" | "b", body: IAutoMovieImpactBodyState): void => {
  assertImpactMass(label, body.mass);
  assertImpactCoefficient(label, "restitution", body.restitution);
  assertImpactCoefficient(label, "hardness", body.hardness);
  assertImpactCoefficient(label, "penetrability", body.penetrability);
};

/**
 * Resolve a collision between bodies `a` and `b` across unit contact `normal`
 * (pointing from `a` to `b`) into an abstracted {@link IAutoMovieImpact}.
 *
 * Impulse is the textbook normal response, `jn = (1+e)·closing / (1/mₐ +
 * 1/m_b)`, but the **effective restitution and a qualitative kind** come from a
 * cheap, deterministic material heuristic rather than a contact solver: a fast
 * strike into a soft, penetrable body **embeds** (no rebound) or, if very fast
 * and very soft, passes **through** (only a fraction of the momentum
 * transfers); a hard, bouncy pair **bounces**; otherwise it **deflects**.
 * Bodies already separating yield a pure `deflect` with no impulse.
 */
export const resolveImpact: (
  a: IAutoMovieImpactBodyState,
  b: IAutoMovieImpactBodyState,
  normal: IAutoMovieVector3,
) => IAutoMovieImpact = (
  a: IAutoMovieImpactBodyState,
  b: IAutoMovieImpactBodyState,
  normal: IAutoMovieVector3,
): IAutoMovieImpact => {
  assertImpactBody("a", a);
  assertImpactBody("b", b);

  const normalLengthSq: number = Vector3.dot(normal, normal);
  if (normalLengthSq === 0)
    throw new RangeError("impact normal must be non-zero");

  const n: IAutoMovieVector3 = Vector3.normalize(normal);
  const vRel: IAutoMovieVector3 = Vector3.subtract(b.velocity, a.velocity); // b relative to a
  const vRelN: number = Vector3.dot(vRel, n);
  const closing: number = -vRelN; // > 0 when approaching

  if (closing <= 0)
    return {
      normal: n,
      speed: 0,
      impulse: Vector3.create(0, 0, 0),
      velocityA: a.velocity,
      velocityB: b.velocity,
      kind: "deflect",
    };

  const e: number = a.restitution * b.restitution;
  let kind: AutoMovieImpactKind;
  if (b.penetrability >= 0.6 && closing >= EMBED_SPEED)
    kind =
      b.penetrability >= 0.85 && closing >= THROUGH_SPEED ? "through" : "embed";
  else if (e >= 0.5 && b.hardness >= 0.5) kind = "bounce";
  else kind = "deflect";

  // effective restitution + how much of the impulse actually lands
  const eEff: number = kind === "bounce" ? e : 0;
  const transfer: number = kind === "through" ? THROUGH_TRANSFER : 1;

  const invSum: number = 1 / a.mass + 1 / b.mass;
  const jn: number = (transfer * (1 + eEff) * closing) / invSum;
  const impulse: IAutoMovieVector3 = Vector3.scale(n, jn);

  return {
    normal: n,
    speed: closing,
    impulse,
    velocityA: Vector3.subtract(a.velocity, Vector3.scale(n, jn / a.mass)),
    velocityB: Vector3.add(b.velocity, Vector3.scale(n, jn / b.mass)),
    kind,
  };
};
