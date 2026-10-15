import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "../../junction/AUTOMOVIE_HUMAN_NECK_COLUMN";
import { IAutoMovieHumanIdentity } from "../../structures/IAutoMovieHumanIdentity";
import { AUTOMOVIE_HUMAN_HEAD_FORM } from "./AUTOMOVIE_HUMAN_HEAD_FORM";
import { AutoMovieHumanHeadMath } from "./AutoMovieHumanHeadMath";
import { IAutoMovieHumanHeadForm } from "./IAutoMovieHumanHeadForm";
import { frameAutoMovieHumanHead } from "./frameAutoMovieHumanHead";
import { shapeAutoMovieHumanHeadFace } from "./shapeAutoMovieHumanHeadFace";
import { shapeAutoMovieHumanHeadRelief } from "./shapeAutoMovieHumanHeadRelief";
import { shapeAutoMovieHumanHeadVault } from "./shapeAutoMovieHumanHeadVault";

/**
 * The skin surface of the head as a signed distance field in the head frame, from which the head cage takes its positions.
 *
 * Three masses are joined by smooth unions: the vault ({@link shapeAutoMovieHumanHeadVault}), the face mass ({@link shapeAutoMovieHumanHeadFace}) and the stem of the neck under the skull, an elliptic cylinder of the measured neck circumference along the neck bone, narrowed in front under the jaw. The relief of cheek bones, brows, temples, jaw angles and chin and the neutral nose are added on top ({@link shapeAutoMovieHumanHeadRelief}), and each eyeball, under its lids, fills its orbit, so the lid surface is part of the one skin.
 *
 * Distances are millimetres, negative inside. Each mass gives its radial distance from its own section centre, exact along that radius, so the union is smooth where masses meet and exact elsewhere. The shape's coefficients are {@link AUTOMOVIE_HUMAN_HEAD_FORM}; another set can be passed to compare forms.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadField {
  private readonly vault_: (p: IAutoMovieVector3) => number;
  private readonly face_: (p: IAutoMovieVector3) => number;
  private readonly relief_: shapeAutoMovieHumanHeadRelief.IOutput;
  private readonly stem_: (p: IAutoMovieVector3) => number;
  private readonly blend_: number;
  private readonly platforms_: Array<(p: IAutoMovieVector3) => number>;
  private readonly eyes_: Array<(p: IAutoMovieVector3) => number>;

  /**
   * @param measurements Resolved measurements of the person
   * @param form Form coefficients, by default the head's own
   */
  public constructor(
    /** The head frame and its landmarks. */
    public readonly frame: frameAutoMovieHumanHead.IFrame,

    measurements: IAutoMovieHumanMeasurements,
    form: IAutoMovieHumanHeadForm = AUTOMOVIE_HUMAN_HEAD_FORM,
    platforms: AutoMovieHumanHeadField.IPlatform[] = [],
  ) {
    const head: IAutoMovieHumanIdentity.IHead = measurements.identity.head;
    this.vault_ = shapeAutoMovieHumanHeadVault(frame, head, measurements.headBreadth, form);
    this.face_ = shapeAutoMovieHumanHeadFace(frame, head, form);
    this.relief_ = shapeAutoMovieHumanHeadRelief(frame, head, measurements.headBreadth, form);
    this.stem_ = shapeStem(frame, measurements.identity.body.neckCircumference);
    this.blend_ = form.blend * head.faceHeight;
    this.platforms_ = platforms.map(shapePlatform);
    const globe: number = (1 + LID) * AutoMovieHumanVector.distance(frame.eye, frame.cornea);
    this.eyes_ = [1, -1].map((s: number): ((p: IAutoMovieVector3) => number) => {
      const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(s * frame.eye.x, frame.eye.y, frame.eye.z);
      return (p: IAutoMovieVector3): number => AutoMovieHumanVector.distance(p, centre) - globe;
    });
  }

  /**
   * Signed distance of a local point from the skin, negative inside.
   *
   * @param p Point in the head frame, millimetres
   * @returns Approximate signed distance, millimetres
   */
  public distance(p: IAutoMovieVector3): number {
    const k: number = this.blend_;
    let d: number = AutoMovieHumanHeadMath.smoothMin(this.vault_(p), this.face_(p), k);
    d = AutoMovieHumanHeadMath.smoothMin(d, this.stem_(p), 2.5 * k);
    d = AutoMovieHumanHeadMath.smoothMin(d, this.relief_.nose(p), 0.5 * k);
    for (const eye of this.eyes_) d = AutoMovieHumanHeadMath.smoothMin(d, eye(p), 0.4 * this.blend_);
    for (const platform of this.platforms_)
      d = AutoMovieHumanHeadMath.smoothMin(d, platform(p), this.blend_);
    return d - this.relief_.relief(p);
  }

  /**
   * The outermost skin point on a ray.
   *
   * Without a guess the search starts 400 mm out, beyond any head, and walks inward in 2 mm steps to the first point inside, then bisects; that is the first crossing seen from outside. With a guess, the distance along the ray where the skin was nearby, the walk starts just outside the guess instead, which is what relaxation needs on every sweep.
   *
   * @param from Start of the ray, inside the head
   * @param direction Direction of the ray, not necessarily unit
   * @param guess Distance along the ray near the skin, if known
   * @returns Where the ray leaves the head
   */
  public project(
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    guess?: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.normalize(direction);
    const at = (t: number): IAutoMovieVector3 => AutoMovieHumanVector.offset(from, [d, t]);
    const step: number = 2;
    let outer: number = guess === undefined ? 400 : guess + 3 * step;
    while (guess !== undefined && this.distance(at(outer)) < 0) outer += 3 * step;
    let inner: number = outer;
    while (inner > 0) {
      inner -= step;
      if (this.distance(at(inner)) < 0) break;
      outer = inner;
    }
    if (inner <= 0) return from;
    for (let i: number = 0; i < 18; ++i) {
      const mid: number = (inner + outer) / 2;
      if (this.distance(at(mid)) < 0) inner = mid;
      else outer = mid;
    }
    return at((inner + outer) / 2);
  }
}

export namespace AutoMovieHumanHeadField {
  /**
   * A flat attachment the skin must reach, such as the ear's: the skin is raised to a plane over an ellipse a little larger than the attachment, so a part joined there meets the head's surface instead of standing off it.
   *
   * @author Samchon
   */
  export interface IPlatform {
    /** Centre of the attachment on its plane, head frame. */
    origin: IAutoMovieVector3;

    /** Unit normal of the plane, pointing out of the head. */
    normal: IAutoMovieVector3;

    /** Unit direction of the attachment's long axis, in the plane. */
    axis: IAutoMovieVector3;

    /** Semi-axis along `axis`, millimetres. */
    long: number;

    /** Semi-axis across it, millimetres. */
    short: number;
  }
}

/** Thickness of the closed lids over the eyeball, over the eyeball's radius to the cornea: about 1.5 to 2 mm over a 12 mm radius. Conventional; the eye module shapes the lids themselves. */
const LID: number = 0.15;

/** Margin of a platform beyond its attachment, as a factor of the semi-axes, so the skin is level under the whole ring. Conventional. */
const PLATFORM_MARGIN: number = 1.35;

/** The solid of a platform: a flat-faced superellipsoid whose outer face is the attachment's plane. */
const shapePlatform = (
  platform: AutoMovieHumanHeadField.IPlatform,
): ((p: IAutoMovieVector3) => number) => {
  const across: IAutoMovieVector3 = AutoMovieHumanVector.cross(platform.normal, platform.axis);
  const long: number = PLATFORM_MARGIN * platform.long;
  const short: number = PLATFORM_MARGIN * platform.short;
  const thickness: number = short;
  return (p: IAutoMovieVector3): number => {
    const q: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [platform.origin, -1]);
    const u: number = AutoMovieHumanVector.dot(q, platform.axis);
    const w: number = AutoMovieHumanVector.dot(q, across);
    const n: number = AutoMovieHumanVector.dot(q, platform.normal) + thickness;
    const s: number = ((u / long) ** 2 + (w / short) ** 2) ** 2 + (n / thickness) ** 4;
    return AutoMovieHumanHeadMath.radial(Math.sqrt(u * u + w * w + n * n), s, 4);
  };
};

/** The upper neck under the occiput, along the neck bone up to the ears' level: the column of the shared neck top ring (`AUTOMOVIE_HUMAN_NECK_COLUMN`), so the nape above the ring continues the ring itself. */
const shapeStem = (
  frame: frameAutoMovieHumanHead.IFrame,
  circumference: number,
): ((p: IAutoMovieVector3) => number) => {
  const r: number = circumference / (2 * Math.PI);
  const lower: IAutoMovieVector3 = frame.neckJoint;
  const upper: IAutoMovieVector3 = frame.headJoint;
  const across: number = AUTOMOVIE_HUMAN_NECK_COLUMN.across * r;
  const back: number = AUTOMOVIE_HUMAN_NECK_COLUMN.back * r;
  const front: number = AUTOMOVIE_HUMAN_NECK_COLUMN.front * r;
  const top: number = frame.tragion.y;
  const cap: number = 0.1 * r;
  return (p: IAutoMovieVector3): number => {
    const t: number = (p.y - lower.y) / (upper.y - lower.y);
    const dz: number = p.z - (lower.z + (upper.z - lower.z) * t);
    const dx: number = Math.abs(p.x);
    const s: number = (dx / across) ** 2 + (dz / (dz > 0 ? front : back)) ** 2;
    return AutoMovieHumanHeadMath.smoothMax(
      AutoMovieHumanHeadMath.radial(Math.sqrt(dx * dx + dz * dz), s, 2),
      p.y - top,
      cap,
    );
  };
};
