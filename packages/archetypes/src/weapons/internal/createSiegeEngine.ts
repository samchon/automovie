import { AutoMovieArchetypeSiegeEngine } from "../AutoMovieArchetypeSiegeEngine";


import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession } from "../../core";
import "../constants/SIEGE_BANDS";
import { SiegeArm } from "./SiegeArm";

/*
 * A siege engine that throws a stone: a counterweight trebuchet, its arm swung
 * up by a box hanging from its short end, or a mangonel, a traction trebuchet
 * whose short end the crew hauls down, its pull taken as the weight that would
 * pull as hard.
 *
 * The engine stands on its base at the origin, its arm across its posts'
 * crossshaft, the long end toward `+Z` and level at rest. `arm` is the throwing
 * arm's hinge, a positive travel raising the long end; it is cocked by its
 * reverse, the long end down. The unsourced arm/cradle section is designed
 * together to clear model floor zero over every declared angle; fixed
 * base/control stock stays separate. A trebuchet's `counterweight` hangs from
 * the short end on a hinge that turns against the arm, so it stays plumb.
 * `pouch` is the inner floor of the real-section arm-tip cradle, joined to the
 * arm by two folded sling spans, with no independent sling swing. `pin` is the
 * real release rod, its cocked-tip drawbar and fixed guide/trestle. `winch` is
 * the cross-post windlass with its radial crank and axial grip, turning by its
 * ratio as the arm is wound. `frame` is the base the crew stands on. `throwAt`
 * uses the same source launch law and the current pouch origin. Solid composite
 * mass distribution under the drawn total is separate from that law's
 * provisional armMass/counterweight controls.
 * Parameter params: The kind and any dimension the author fixes.
 * Parameter seed: The seed that draws every dimension left free inside its band;
 * absent, the middle of each band.
 * Returns: The engine.
 * For a fixed dimension outside its band or
 * one the kind lacks.
 * If no positive representable moving section or fitting
 * clears its complete declared angular floor domain.
 */
export function createSiegeEngine(
  params: AutoMovieArchetypeSiegeEngine.IParams,
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeSiegeEngine.Affordance,
  AutoMovieArchetypeSiegeEngine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSiegeEngine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeSiegeEngine.Dimension>(
      "siegeEngine",
      AutoMovieArchetypeSiegeEngine.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeSiegeEngine.Kind = ArchetypeDraw.choice(
    "siegeEngine",
    "kind",
    params.kind,
    AutoMovieArchetypeSiegeEngine.KINDS,
  );
  draw.dimensions(AutoMovieArchetypeSiegeEngine.BANDS[kind], AutoMovieArchetypeSiegeEngine.BANDS);
  // The arm's rise past level: released from its cocked travel it swings through its rest, the long end straight up, and as far again, energy being kept.
  draw.derive("reach", 2 * SiegeArm.REST + draw.values.cocked!);
  const d: Partial<Record<AutoMovieArchetypeSiegeEngine.Dimension, number>> = {
    ...draw.values,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSiegeEngine.Affordance,
    AutoMovieArchetypeSiegeEngine.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind,
    draw,
  });
  SiegeArm.lay(builder, d, kind === "trebuchet");
  return builder.build(d.mass!);
}
