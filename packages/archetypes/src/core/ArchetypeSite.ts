import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * The contact sites of an affordance: the places along or across its extent where a hand, a foot or a body may meet it, each as a frame in the affordance's own convention.
 *
 * A site is named by one or two coordinates from 0 to 1 over the extent the affordance's kind reads:
 *
 * | Kind | `u` | `v` |
 * | --- | --- | --- |
 * | `handle`, `bar`, `ledge`, `rein` | along `+X`, from `-length / 2` to `+length / 2` | unused |
 * | `seat` | across `+X`, from `-width / 2` to `+width / 2` | from the front edge back along `-Z` to `depth` |
 * | `surface`, `pedal` | across `+X`, over `width` | along `+Z`, over `depth`, both centred |
 * | `stirrup` | across `+X`, over `width` | unused |
 * | `aperture` | across `+X`, over `width` | up `+Y`, from the threshold to `height` |
 * | `wheel` | round the rim from the frame's `+X`, turning about `+Y` by the right-hand rule | unused |
 * | `crank` | unused: the one site at `radius` along `+X` | unused |
 *
 * A site keeps the affordance's rotation, except on a `wheel`, where it is a grip on the rim: `+X` along the rim in the turning sense and `+Y` out from the centre, so a hand takes it as it takes a `bar`. A kind without an extent, or an affordance that leaves the dimension out, has the one site of its own frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's coordinates, the site's frame and the single site of a point contact.
 * @evidence contracts/development/design.md#principled-representation Normalised coordinates over the extent the kind's own fields give, so a site is stated without knowing the archetype's size and stays on the affordance for every seed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; the choice among sites belongs to the motion grammar's site axis (#3357).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No site is named after an archetype's part; a coordinate outside 0 to 1 is refused instead of clamped onto the edge.
 */
export namespace ArchetypeSite {
  /**
   * A site of an affordance.
   *
   * @param archetype The name a refusal carries.
   * @param affordance The affordance, at its current frame.
   * @param u The first coordinate, 0 to 1; the middle when absent.
   * @param v The second coordinate, 0 to 1; the middle when absent.
   * @returns The site's frame in the space the affordance's frame is in.
   * @throws {ArchetypeRefusal} When a coordinate is not finite or lies outside 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinates' range and default and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A point of the kind's extent in the frame's own coordinates, carried to the frame's space; a rim site turns the frame about its `+Y` and takes the bar convention there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the coordinates, then one branch per kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent dimension leaves the coordinate at the frame, as the kind's doc says an affordance without that field has no extent there.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeFrame`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    archetype: string,
    affordance: IAutoMovieAffordance,
    u: number = 0.5,
    v: number = 0.5,
  ): IAutoMovieTransform {
    for (const [name, value] of [
      ["u", u],
      ["v", v],
    ] as const)
      if (!(Number.isFinite(value) && value >= 0 && value <= 1))
        throw new ArchetypeRefusal({
          kind: "site",
          archetype,
          axis: `${affordance.id}.${name}`,
          value,
          feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
          reason: `site coordinate ${name} of "${affordance.id}" is ${value}`,
          fix: "give a site coordinate from 0 to 1",
        });
    const frame: IAutoMovieTransform = affordance.frame;
    const offset = (local: IAutoMovieVector3): IAutoMovieTransform => ({
      translation: ArchetypeFrame.point(frame, local),
      rotation: { ...frame.rotation },
      scale: { ...frame.scale },
    });
    const length: number = affordance.length ?? 0;
    const width: number = affordance.width ?? 0;
    const depth: number = affordance.depth ?? 0;
    const kind: IAutoMovieAffordance["kind"] = affordance.kind;
    if (
      kind === "handle" ||
      kind === "bar" ||
      kind === "ledge" ||
      kind === "rein"
    )
      return offset({ x: (u - 0.5) * length, y: 0, z: 0 });
    if (kind === "seat")
      return offset({ x: (u - 0.5) * width, y: 0, z: -v * depth });
    if (kind === "surface" || kind === "pedal")
      return offset({ x: (u - 0.5) * width, y: 0, z: (v - 0.5) * depth });
    if (kind === "stirrup") return offset({ x: (u - 0.5) * width, y: 0, z: 0 });
    if (kind === "aperture")
      return offset({
        x: (u - 0.5) * width,
        y: v * (affordance.height ?? 0),
        z: 0,
      });
    if (kind === "crank")
      return offset({ x: affordance.radius ?? 0, y: 0, z: 0 });
    if (kind !== "wheel") return offset({ x: 0, y: 0, z: 0 });

    // A rim site: turn the frame to the rim point, then lay a bar frame there, +X the tangent in the turning sense (the turned -Z) and +Y the turned +X out from the centre.
    const turned: IAutoMovieTransform = {
      translation: frame.translation,
      rotation: Quaternion.multiply(
        frame.rotation,
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 360 * u),
      ),
      scale: frame.scale,
    };
    return ArchetypeFrame.facing(
      ArchetypeFrame.point(turned, { x: affordance.radius ?? 0, y: 0, z: 0 }),
      ArchetypeFrame.axis(turned, "x"),
      Vector3.scale(ArchetypeFrame.axis(turned, "z"), -1),
    );
  }
}
