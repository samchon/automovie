import { AutoMovieArchetypeLongGun } from "../AutoMovieArchetypeLongGun";
import { Vector3 } from "@automovie/engine";

import { ArchetypeDraw, AutoMovieArchetype, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame } from "../../core";
import "../constants/LONG_GUN_BANDS";
import "../constants/LONG_GUN_MODELS";
import { LongGunLock } from "./LongGunLock";

/*
 * A long gun as a film prop: a carbine with a sliding stock, a pump shotgun, a
 * flintlock musket, a bolt-action rifle or a lever action. It models no effect;
 * the period and repeating kinds' mechanisms are `LongGunLock`'s.
 *
 * The gun lies along `+Z` from its butt plate at the origin to its muzzle, the
 * barrel's line at `y = 0`. The firing hand takes the `grip` behind the trigger
 * and the other hand the `foreEnd` from below; the `butt` goes to the shoulder.
 * The trigger's face is the length of pull ahead of the butt, as gunmakers
 * measure it. The stock ends behind the grip and a round neck joins it to the
 * receiver: a carbine's fixed buffer tube, a shotgun's wrist. A carbine's
 * `stock` slides back along its tube to lengthen the pull, carrying the butt; a
 * shotgun's `pump` slides back, carrying the fore-end.
 * Parameter params: The kind, a carbine's model and any dimension the author fixes.
 * Parameter seed: The seed that picks the model left free and draws every dimension
 * left free inside its band; absent, the first model and the middle of each
 * band.
 * Returns: The long gun.
 * For a model not of the kind, a fixed
 * dimension outside its band, or one the model gives.
 */
export function createLongGun(
  params: AutoMovieArchetypeLongGun.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLongGun.Affordance, AutoMovieArchetypeLongGun.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLongGun.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLongGun.Dimension>(
      "longGun",
      AutoMovieArchetypeLongGun.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeLongGun.Kind = ArchetypeDraw.choice(
    "longGun",
    "kind",
    params.kind,
    AutoMovieArchetypeLongGun.KINDS,
  );
  // A carbine is one of Colt's three, each weighed whole; a shotgun has one read model, its bands.
  const model: {
    figures: Readonly<Partial<Record<AutoMovieArchetypeLongGun.Dimension, number>>>;
  } = draw.model<AutoMovieArchetypeLongGun.Model>(
    "model",
    params.model,
    AutoMovieArchetypeLongGun.MODELS[kind],
  );
  const d: Partial<Record<AutoMovieArchetypeLongGun.Dimension, number>> = {
    ...draw.dimensions(AutoMovieArchetypeLongGun.BANDS[kind], AutoMovieArchetypeLongGun.BANDS),
    ...model.figures,
  };
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLongGun.Affordance,
    AutoMovieArchetypeLongGun.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: AutoMovieArchetypeLongGun.NAMES[kind],
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const steel: string = "#2c2f33";
  const pull: number = d.lengthOfPull!;
  const breech: number = d.length! - d.barrel!;
  const hand: number = AutoMovieArchetypeLongGun.FORE_END / 2;
  // The supporting hand: a musket's at the swell, as the 1764 drill holds it (`LongGunLock.swell`); a modern gun's under the middle of its barrel.
  const fore: number =
    kind === "musket" ? LongGunLock.swell(d) : breech + d.barrel! * 0.45;

  // Where the stock ends, behind the grip by the room a hand and its mark take: picture only.
  const neck: number = pull - 0.175;

  // Butt to muzzle: the stock, the neck that joins it to the receiver, the receiver over the trigger, the barrel and the fore-end round it.
  builder.box("stock", v(0.04, 0.11, neck), v(0, -0.035, neck / 2), {
    color: steel,
    density: 0.5,
  });

  // A carbine's neck is its fixed buffer tube, reaching back far enough to stay inside the stock at full travel; a shotgun's is the wrist of its fixed stock.
  builder.rod(
    kind === "carbine" ? "buffer-tube" : "wrist",
    0.015,
    v(0, 0, kind === "carbine" ? neck - d.travel! - 0.012 : neck - 0.02),
    v(0, 0, pull - 0.08),
    { color: steel },
  );
  builder.box(
    "receiver",
    v(0.045, 0.07, breech - pull + 0.1),
    v(0, 0, (pull - 0.1 + breech) / 2),
    { color: steel },
  );
  builder.rod("barrel", 0.011, v(0, 0, breech), v(0, 0, d.length!), {
    color: steel,
  });
  builder.rod("fore-end", hand, v(0, 0, fore - 0.1), v(0, 0, fore + 0.1), {
    color: "#55595f",
    density: 0.3,
  });
  builder.rod(
    "grip",
    0.02,
    v(0, -0.035, pull - 0.055),
    v(0, -0.13, pull - 0.055),
    { color: steel },
  );
  builder.box("trigger", v(0.008, 0.02, 0.006), v(0, -0.05, pull - 0.003), {
    color: "#55595f",
  });

  builder.affordance({
    id: "grip",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -0.0825, pull - 0.055),
      v(0, 0, -1),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: 0.04,
    length: 0.095,
  });
  builder.affordance({
    id: "trigger",
    kind: "trigger",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -0.05, pull),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    travel: AutoMovieArchetypeLongGun.TRIGGER,
    parts: ["trigger"],
  });
  builder.affordance({
    id: "foreEnd",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, fore),
      v(0, -1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: 2 * hand,
    length: 0.2,
    ...(kind === "shotgun" ? { rides: "pump" } : {}),
  });
  builder.affordance({
    id: "butt",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, -0.035, 0),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    width: 0.04,
    depth: 0.11,
    ...(kind === "carbine" ? { rides: "stock" } : {}),
  });
  // A muzzle-loader's muzzle is a socket the cartridge and the rod go into; the others' a surface along the bore.
  builder.affordance({
    id: "muzzle",
    kind: kind === "musket" ? "socket" : "surface",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, d.length!),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
  });
  builder.affordance({
    id: "sight",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.sightHeight!, breech)),
    extent: null,
  });
  if (kind === "musket") LongGunLock.musket(builder, d);
  else if (kind === "rifle") LongGunLock.bolt(builder, d);
  else if (kind === "leverAction") LongGunLock.lever(builder, d);
  else if (kind === "carbine")
    builder.affordance({
      id: "stock",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, -0.035, 0),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: d.travel!,
      parts: ["stock"],
    });
  else
    builder.affordance({
      id: "pump",
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, 0, fore),
        v(0, -1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      travel: d.travel!,
      parts: ["fore-end"],
    });
  return builder.build(d.mass!);
}
