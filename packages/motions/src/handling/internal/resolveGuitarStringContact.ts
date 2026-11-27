import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/** The contact geometry in the guitar's frame, in metres. */
interface ISites {
  /** The intersection of the chosen fret and string bars. */
  stop: IAutoMovieVector3;

  /** The soundboard centre projected onto the chosen string. */
  pluck: IAutoMovieVector3;

  /** The direction away from the soundboard. */
  normal: IAutoMovieVector3;

  /** The cross-string half-stroke, bounded by half the closest string spacing. */
  sweep: IAutoMovieVector3;
}

/** Tolerance for intersecting the rigid coplanar affordance axes, metres. */
const COINCIDENCE: number = 1e-6;
/** The record of `IResolveGuitarStringContactParamsItem`'s site. */
type IResolveGuitarStringContactParamsItem = { fret: string; string: string };

/**
 * Resolve the crossing of one pitched string with a fret and the place to sound
 * it over the body. The sounding segment runs from the fret toward the string
 * endpoint beyond the projected soundboard centre. Also measure the transverse
 * half-spacing used to clear the other strings in a single-note stroke.
 *
 * @param params The rigid bar ids of the fret and string.
 * @param affordances The staged guitar's model-space affordances.
 * @returns Contact geometry in the guitar frame, in metres.
 * @throws {HumanRefusal} When these bars or the sounding segment are
 *   incompatible.
 */
export function resolveGuitarStringContact(
  params: Readonly<IResolveGuitarStringContactParamsItem>,
  affordances: readonly IAutoMovieAffordance[],
): ISites {
  const fret: IAutoMovieAffordance = site(affordances, params.fret, "bar");
  const string: IAutoMovieAffordance = site(affordances, params.string, "bar");
  const body: IAutoMovieAffordance = site(affordances, "body", "surface");
  const axis: IAutoMovieVector3 = barAxis(string);
  const across: IAutoMovieVector3 = barAxis(fret);
  const origin: IAutoMovieVector3 = string.frame.translation;
  const halfLength: number = (string.length ?? 0) / 2;
  const delta: IAutoMovieVector3 = Vector3.subtract(
    fret.frame.translation,
    origin,
  );
  const dot: number = Vector3.dot(axis, across);
  const determinant: number = 1 - dot * dot;
  const a: number = Vector3.dot(delta, axis);
  const b: number = Vector3.dot(delta, across);
  const alongFret: number = (a - b * dot) / determinant;
  const acrossFret: number = (a * dot - b) / determinant;
  const stop: IAutoMovieVector3 = Vector3.add(
    origin,
    Vector3.scale(axis, alongFret),
  );
  const gap: IAutoMovieVector3 = Vector3.subtract(
    stop,
    Vector3.add(fret.frame.translation, Vector3.scale(across, acrossFret)),
  );
  const alongBody: number = Vector3.dot(
    Vector3.subtract(body.frame.translation, origin),
    axis,
  );

  if (
    !(
      determinant > COINCIDENCE &&
      Math.abs(alongFret) <= halfLength &&
      Math.abs(acrossFret) <= (fret.length ?? 0) / 2 + COINCIDENCE &&
      Vector3.length(gap) <= COINCIDENCE &&
      Math.abs(alongBody) < halfLength &&
      alongBody !== alongFret
    )
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "fret",
      value: [params.fret, params.string],
      reason:
        "the fret must cross the string away from the soundboard projection, which must lie inside the string",
      fix: "name the rigid fret and string bars of a staged guitar",
    });
  const pluck: IAutoMovieVector3 = Vector3.add(
    origin,
    Vector3.scale(axis, alongBody),
  );

  // The bars carry no endpoint labels. Use the direction from the pluck to
  // the stop so reversing the authored bar leaves the sweep unchanged.
  const along: IAutoMovieVector3 = Vector3.scale(
    axis,
    Math.sign(alongFret - alongBody),
  );
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    body.frame.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const sweep: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(along, normal),
  );
  let spacing: number = Infinity;
  for (const other of affordances) {
    if (
      other.id === string.id ||
      other.kind !== "bar" ||
      !/^string[1-6]$/.test(other.id)
    )
      continue;
    const direction: IAutoMovieVector3 = barAxis(other);
    const offset: IAutoMovieVector3 = Vector3.subtract(
      other.frame.translation,
      pluck,
    );
    const lateral: number =
      Vector3.dot(offset, sweep) -
      (Vector3.dot(offset, along) * Vector3.dot(direction, sweep)) /
        Vector3.dot(direction, along);
    spacing = Math.min(spacing, Math.abs(lateral));
  }
  if (!(spacing > COINCIDENCE && spacing < Infinity))
    throw new HumanRefusal({
      kind: "affordance",
      axis: "string",
      value: params.string,
      reason:
        "the stroke needs a distinct neighbouring string for its clearance",
      fix: "use guitar string bars with separate lines",
    });
  return { stop, pluck, normal, sweep: Vector3.scale(sweep, spacing / 2) };
}
/** The alternatives of `SiteKind`'s site. */
type SiteKind = "bar" | "surface";

/** A named rigid guitar affordance of the kind the law uses. */
function site(
  affordances: readonly IAutoMovieAffordance[],
  id: string,
  kind: SiteKind,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === id && a.kind === kind,
  );
  if (
    found === undefined ||
    found.rides !== undefined ||
    (kind === "bar" && !(found.length! > 0))
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: id,
      reason: `the staged guitar needs a rigid ${kind} named ${id}`,
      fix: "supply a guitar with rigid fret, string and body affordances",
    });
  return found;
}

/** A rigid bar's unit length axis in the guitar frame. */
function barAxis(bar: IAutoMovieAffordance): IAutoMovieVector3 {
  return Quaternion.rotateVector(bar.frame.rotation, { x: 1, y: 0, z: 0 });
}
