import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeFrame,
} from "../../core/index";
import { FIELD_GUN } from "../FIELD_GUN";
import type { AutoMovieArchetypeCannon } from "../AutoMovieArchetypeCannon";

/**
 * Builds `FIELD_GUN`, the 6-pdr field gun, on the producer's builder: the tube
 * on its trunnions, the cheeks and the stock to the trail's end, the axle and
 * the two wheels, with every part's share of the read weights; then its
 * contacts: the muzzle, the vent and the friction primer in it, the lanyard's
 * toggle 12 ft behind the primer, the trail and its handspike, the limber's
 * seat, the axle and each wheel's top.
 *
 * The tube's 884 lb is shared between its breech and its chase so that the
 * breech bears the read 47 lb preponderance at the rear of the base-ring; the
 * trunnions take their volume's part at the tube's mean density. The carriage's
 * wood and irons share its 540 lb less the axle-tree's read 116 lb by volume,
 * and each wheel carries its read 180 lb by the volumes of its disc, spokes and
 * nave.
 *
 * @param builder The producer's builder.
 * @param recoil The run back on firing, metres: the travel of the `recoil`
 *   slider every part rides.
 */
export function buildFieldGun(
  builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeCannon.Affordance,
    AutoMovieArchetypeCannon.Dimension
  >,
  recoil: number,
): void {
  const v: typeof Vector3.create = Vector3.create;
  const t: typeof FIELD_GUN.TUBE = FIELD_GUN.TUBE;
  const c: typeof FIELD_GUN.CARRIAGE = FIELD_GUN.CARRIAGE;
  const e: typeof FIELD_GUN.ESTIMATES = FIELD_GUN.ESTIMATES;
  const bronze: string = "#8c6a3a";
  const wood: string = "#6b5a3e";
  const iron: string = "#3f4246";

  // The places along Z: the trunnions' axis, the muzzle's face, the base-ring's rear and the cascabel's end.
  const radius: number = c.wheel / 2;
  const axis: number = c.trunnionHeight;
  const trunnions: number = -c.trunnionBehind;
  const muzzle: number = trunnions + t.trunnionToFace;
  const base: number = muzzle - t.baseRing;
  const end: number = muzzle - t.whole;

  // The tube's shares: the breech bears the preponderance at the base-ring's rear.
  const breech: number = t.breech / 2;
  const chase: number = t.swell / 2;
  const knob: number = breech * e.cascabel;
  const trunnion: number = t.trunnion / 2;
  const vBreech: number = Math.PI * breech * breech * (trunnions - base);
  const vKnob: number = Math.PI * knob * knob * (base - end);
  const vChase: number = Math.PI * chase * chase * (muzzle - trunnions);
  const vTrunnions: number =
    2 * Math.PI * trunnion * trunnion * t.trunnionLength;
  const density: number = t.mass / (vBreech + vKnob + vChase + vTrunnions);
  const tube: number = t.mass - density * vTrunnions;
  const rearArm: number =
    ((vBreech * (trunnions - base)) / 2 +
      vKnob * (trunnions - (base + end) / 2)) /
    (vBreech + vKnob);
  const frontArm: number = (muzzle - trunnions) / 2;
  const rear: number =
    (t.preponderance * (trunnions - base) + tube * frontArm) /
    (rearArm + frontArm);
  const front: number = tube - rear;

  // The carriage's and wheels' shares of the whole.
  const total: number = t.mass + c.mass + 2 * c.wheelMass;
  builder.rod("breech", breech, v(0, axis, base), v(0, axis, trunnions), {
    color: bronze,
    share: (rear * vBreech) / (vBreech + vKnob) / total,
  });
  builder.rod("cascabel", knob, v(0, axis, end), v(0, axis, base), {
    color: bronze,
    share: (rear * vKnob) / (vBreech + vKnob) / total,
  });
  builder.rod("chase", chase, v(0, axis, trunnions), v(0, axis, muzzle), {
    color: bronze,
    share: front / total,
  });
  builder.rod(
    "trunnions",
    trunnion,
    v(-(t.rimbases / 2 + t.trunnionLength), axis, trunnions),
    v(t.rimbases / 2 + t.trunnionLength, axis, trunnions),
    { color: bronze, share: (density * vTrunnions) / total },
  );

  // The carriage: the trail's underside from the top of the axle arm to its ground contact, then on the ground to its end.
  const width: number = c.plates;
  const depth: number = width * e.stockDepth;
  const arm: number = c.arm / 2;
  const contact: number = -c.trailContact;
  const trailEnd: number = radius - c.trailEnd;
  const slope: number = Math.atan2(radius + arm, -contact);
  const run: number = Math.hypot(radius + arm, contact);
  const under: IAutoMovieVector3 = v(0, (radius + arm) / 2, contact / 2);
  const stockCentre: IAutoMovieVector3 = Vector3.add(
    under,
    v(0, (depth / 2) * Math.cos(slope), (-depth / 2) * Math.sin(slope)),
  );
  const vStock: number = width * depth * run;
  const vTrail: number = width * depth * (contact - trailEnd);
  const cheek: number = t.trunnionLength;
  const cheekLength: number = trunnions + trunnion - (base - trunnion);
  const cheekHeight: number = axis - radius;
  const vCheeks: number = 2 * cheek * cheekLength * cheekHeight;
  // The screw, of the read bar, stands on the stock's top at the base-ring's rear and reaches the breech's underside.
  const screwRadius: number = FIELD_GUN.SCREW.bar / 2;
  const screwTop: number = axis - breech;
  const screwFoot: number =
    ((radius + arm) * (base - contact)) / -contact + depth / Math.cos(slope);
  const vScrew: number =
    Math.PI * screwRadius * screwRadius * (screwTop - screwFoot);
  const wooden: number = c.mass - c.axleMass;
  const vWood: number = vStock + vTrail + vCheeks + vScrew;
  builder.box("stock", v(width, depth, run), stockCentre, {
    color: wood,
    rotation: Quaternion.fromAxisAngle(v(1, 0, 0), (-slope * 180) / Math.PI),
    share: (wooden * vStock) / vWood / total,
  });
  builder.box(
    "trail",
    v(width, depth, contact - trailEnd),
    v(0, depth / 2, (contact + trailEnd) / 2),
    { color: wood, share: (wooden * vTrail) / vWood / total },
  );
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.box(
      `cheek-${side}`,
      v(cheek, cheekHeight, cheekLength),
      v(
        sign * (width / 2 + cheek / 2),
        (axis + radius) / 2,
        (trunnions + trunnion + base - trunnion) / 2,
      ),
      { color: wood, share: (wooden * vCheeks) / 2 / vWood / total },
    );
  builder.rod(
    "screw",
    screwRadius,
    v(0, screwFoot, base),
    v(0, screwTop, base),
    {
      color: iron,
      share: (wooden * vScrew) / vWood / total,
    },
  );
  builder.rod(
    "axle",
    arm,
    v(-c.axle / 2, radius, 0),
    v(c.axle / 2, radius, 0),
    {
      color: iron,
      share: c.axleMass / total,
    },
  );

  // The wheels: a disc of the tire's width, its spokes through the nave, turning on the axle.
  const spoke: number = c.tyre * e.spoke;
  const nave: number = arm * e.nave;
  const naveLength: number = c.tyre * e.naveLength;
  const vDisc: number = Math.PI * radius * radius * c.tyre;
  const vSpokes: number = (c.spokes / 2) * Math.PI * spoke * spoke * 2 * radius;
  const vNave: number = Math.PI * nave * nave * naveLength;
  const vWheel: number = vDisc + vSpokes + vNave;
  for (const [k, side, sign] of [
    [0, "left", 1],
    [1, "right", -1],
  ] as const) {
    const x: number = (sign * c.track) / 2;
    const parts: string[] = [
      `wheel-${side}`,
      `nave-${side}-in`,
      `nave-${side}-out`,
    ];
    builder.rod(
      `wheel-${side}`,
      radius,
      v(x - c.tyre / 2, radius, 0),
      v(x + c.tyre / 2, radius, 0),
      {
        color: wood,
        share: (c.wheelMass * vDisc) / vWheel / total,
      },
    );
    // The nave stands out from the wheel on both faces, an inner and an outer half.
    for (const [half, outward] of [
      ["in", -1],
      ["out", 1],
    ] as const)
      builder.rod(
        `nave-${side}-${half}`,
        nave,
        v(x, radius, 0),
        v(x + (outward * sign * naveLength) / 2, radius, 0),
        {
          color: wood,
          share: (c.wheelMass * vNave) / 2 / vWheel / total,
        },
      );
    for (let n: number = 0; n < c.spokes / 2; n++) {
      const angle: number = (2 * Math.PI * n) / c.spokes;
      const along: IAutoMovieVector3 = v(
        0,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
      );
      const hub: IAutoMovieVector3 = v(
        x + sign * (c.tyre / 2 + spoke),
        radius,
        0,
      );
      builder.rod(
        `spoke-${side}-${n}`,
        spoke,
        Vector3.subtract(hub, along),
        Vector3.add(hub, along),
        {
          color: wood,
          share: (c.wheelMass * vSpokes) / (c.spokes / 2) / vWheel / total,
        },
      );
      parts.push(`spoke-${side}-${n}`);
    }
    builder.affordance({
      id: k === 0 ? "leftSpin" : "rightSpin",
      kind: "knob",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, radius, 0),
        v(1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      travel: 360,
      parts,
      rides: "recoil",
    });
  }

  // A turn of the screw sinks its head by pitch times turns. The base ring's
  // underside fixes the elevation: its fall about the trunnions is
  // behind*sin(angle) - radius*(1-cos(angle)). This is monotone over the field
  // of fire; the inverse table makes the screw the independent input.
  const behind: number = trunnions - base;
  const sinking = (degrees: number): number => {
    const turn: number = (degrees * Math.PI) / 180;
    return behind * Math.sin(turn) - breech * (1 - Math.cos(turn));
  };
  const degrees: number[] = [];
  for (let k: number = -c.depression; k <= c.elevation; k++) degrees.push(k);
  const advance: number = FIELD_GUN.SCREW.pitch / 360;
  const turns = (k: number): number => sinking(k) / advance;

  // The dependent elevation can also be named as a desired input through the
  // reversible coupling, without a second law for existing launch consumers.
  builder.affordance({
    id: "elevation",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, axis, trunnions),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    travel: c.elevation,
    reverse: c.depression,
    parts: ["breech", "cascabel", "chase", "trunnions"],
    rides: "recoil",
    follows: {
      id: "screw",
      table: degrees.map((k: number): [number, number] => [turns(k), k]),
      reversible: true,
    },
  });
  // The recoil: the whole gun runs back along the ground, the carriage's parts on this slider and everything else riding it.
  builder.affordance({
    id: "recoil",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, radius, 0),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    travel: recoil,
    parts: ["stock", "trail", "cheek-left", "cheek-right", "axle"],
  });
  builder.affordance({
    id: "muzzle",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, axis, muzzle),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    // The bore runs its read length in from the muzzle's face.
    depth: t.boreLength,
    rides: "elevation",
  });

  // The vent: from its entry a quarter of the bore's diameter ahead of the bore's bottom, up through the metal at 80 degrees to the axis, leaning to the rear, to the breech's top.
  const entry: number = muzzle - t.boreLength + t.bore / 4;
  const rise: number = breech - t.bore / 2;
  const lean: number = (FIELD_GUN.VENT * Math.PI) / 180;
  const orifice: IAutoMovieVector3 = v(
    0,
    axis + breech,
    entry - rise / Math.tan(lean),
  );
  const out: IAutoMovieVector3 = v(0, Math.sin(lean), -Math.cos(lean));
  builder.affordance({
    id: "vent",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(orifice, out, v(1, 0, 0)),
    extent: null,
    rides: "elevation",
  });

  // The friction primer in the vent, its long tube standing out along it; its wire's eye at the tube's top is where the lanyard's hook takes it.
  const s: typeof FIELD_GUN.SERVICE = FIELD_GUN.SERVICE;
  const eye: IAutoMovieVector3 = Vector3.add(
    orifice,
    Vector3.scale(out, s.tube),
  );
  builder.affordance({
    id: "primer",
    kind: "socket",
    direction: "along",
    frame: AutoMovieArchetypeFrame.facing(eye, out, v(1, 0, 0)),
    extent: null,
    rides: "elevation",
  });
  // The lanyard's toggle, its 12 ft run straight back from the primer's eye at the eye's height, a slider the firing hand draws back by the friction wire's length, which pulls it out and fires the primer.
  builder.affordance({
    id: "lanyard",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, eye.y, eye.z - s.lanyard),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    grip: "power",
    aperture: s.toggle.diameter,
    length: s.toggle.length,
    travel: s.wire,
  });

  // Travel resolves before spatial parentage: the slider reads the screw's
  // turn, then the screw's handle rides that translated head.
  builder.affordance({
    id: "screwRise",
    kind: "slider",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, screwTop, base),
      v(0, 0, 1),
      v(0, -1, 0),
    ),
    extent: null,
    travel: turns(c.elevation) * advance,
    reverse: -turns(-c.depression) * advance,
    parts: ["screw"],
    rides: "recoil",
    follows: {
      id: "screw",
      ratio: advance,
    },
  });
  builder.affordance({
    id: "screw",
    kind: "knob",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, screwTop, base),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    travel: turns(c.elevation),
    reverse: -turns(-c.depression),
    rides: "screwRise",
  });
  // The trail's end, where the handspike bears.
  builder.affordance({
    id: "trail",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, depth, trailEnd)),
    extent: null,
    width,
    rides: "recoil",
  });
  // The trail handspike shipped in the trail's end, its read length running back along the trail, `FIELD_GUN.ESTIMATES.handspike` of it behind the end; the limber's pintle takes the trail's end from below, and the axle's middle is where the carriage is drawn from.
  builder.affordance({
    id: "handspike",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, depth, trailEnd - (s.handspike * e.handspike) / 2),
      v(0, 1, 0),
      v(0, 0, -1),
    ),
    extent: null,
    grip: "power",
    aperture: depth,
    length: s.handspike * e.handspike,
    rides: "recoil",
  });
  builder.affordance({
    id: "limber",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0, trailEnd),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    rides: "recoil",
  });
  builder.affordance({
    id: "axle",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, radius, 0),
      v(0, 1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    rides: "recoil",
  });
  // Each wheel's top, where a cannoneer takes the rim from the wheel's outer face to run the gun up, the hand closing across the tyre; it turns with the wheel.
  for (const [id, spin, sign] of [
    ["leftWheel", "leftSpin", 1],
    ["rightWheel", "rightSpin", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: AutoMovieArchetypeFrame.facing(
        v((sign * c.track) / 2, 2 * radius, 0),
        v(sign, 0, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: c.tyre,
      length: c.tyre,
      rides: spin,
    });
}
