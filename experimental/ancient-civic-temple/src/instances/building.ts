/** Places the reviewed fixed building prototypes on the current space datums. */
import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieModel,
} from "@automovie/interface";
import { identityTransform } from "../geometry/model-parts";
import { templeOpenDoorPlacement } from "../geometry/door-placement";
import { TempleCladding } from "../models/cladding";
import { TempleColumns } from "../models/columns";
import { TempleEntablature } from "../models/entablature";
import { TempleFixtures } from "../models/fixtures";
import { TempleOpenings } from "../models/openings";
import { templePlan as p } from "../spaces/building";
import { createTempleBuildingEnvelope } from "./envelope";
import { templeClerestories, templeDoorPassages } from "../spaces/openings";
import { templeLevels as y } from "../spaces/storey";

const placed = (
  id: string, model: IAutoMovieModel, space: string | null,
  x: number, height: number, z: number, angle = 0, pitch = 0,
): IAutoMovieBuiltElement => ({
  id: `element.building.${id}`,
  kind: "fixture",
  parent: "temple.root",
  model: model.id,
  space,
  transform: {
    ...identityTransform(),
    translation: { x, y: height, z },
    rotation: {
      x: Math.cos(angle / 2) * Math.sin(pitch / 2),
      y: Math.sin(angle / 2) * Math.cos(pitch / 2),
      z: -Math.sin(angle / 2) * Math.sin(pitch / 2),
      w: Math.cos(angle / 2) * Math.cos(pitch / 2),
    },
  },
});

/**
 * @evidence instances/building.md The building scene joins one reviewed space envelope with its independent fixed architectural members.
 * @evidence instances/building.md#columns-beams The court datum yields 14 colonnade columns, two porch columns, four ring beams, and one porch entablature with stable role and coordinate IDs.
 * @evidence instances/building.md#openings Eight passage records place matching frames and opened leaves; clerestory records supply window frame width, sill, and host thickness.
 * @evidence instances/building.md#roof-members The authored roof patches locate repeated tile modules, while sanctuary and low-ceiling rooms locate trusses and joists.
 * @evidence instances/building.md#fountain-review One fountain sits on the courtyard floor at its plan centre, and model IDs and placement values are checked before return.
 * @evidence principles/core/source-units.md#source-scope-preservation The builder combines only authored building prototypes with existing roof, passage and room datums; it does not generate mesh shapes or alter the space envelope.
 * @evidence principles/core/source-units.md#source-substantive-completion The returned environment includes the complete independent building member set and refuses duplicate IDs, missing prototypes and non-finite locations.
 * @evidenceExclude upstream/design/instance-sources.md#design-revision-from-instance-source-work The four building placement H2s already specify the repeat origins, spacing, variant selection, roof contact and review sites consumed here.
 * @evidence obligations/design/instance-sources.md#instance-source-design-ownership Each generated member is a column, beam, opening, roof, timber, or fountain choice of the four authored building H2s.
 * @evidence obligations/design/instance-sources.md#instance-source-stable-membership Equal immutable plan, opening, roof and model inputs traverse fixed loops to produce stable member IDs and transforms.
 * @evidence obligations/design/instance-sources.md#instance-source-invalid-placement Duplicate IDs, unknown prototypes and non-finite translations throw with a member ID before the scene is returned.
 */
export const createTempleBuildingScene = (): IAutoMovieBuiltEnvironment => {
  const built = createTempleBuildingEnvelope();
  const columns = new TempleColumns();
  const beams = new TempleEntablature();
  const openings = new TempleOpenings();
  const cladding = new TempleCladding();
  const fixtures = new TempleFixtures();
  const models: IAutoMovieModel[] = [];
  const elements: IAutoMovieBuiltElement[] = [];
  const add = (model: IAutoMovieModel): IAutoMovieModel => {
    if (!models.some((entry) => entry.id === model.id)) models.push(model);
    return model;
  };
  const put = (id: string, model: IAutoMovieModel, space: string | null,
    x: number, height: number, z: number, angle = 0, pitch = 0): void => {
    elements.push(placed(id, add(model), space, x, height, z, angle, pitch));
  };

  const column12 = columns.colonnade(12);
  const column19 = columns.colonnade(19);
  const xAxis = p.eastCourt + 0.175;
  const north = p.courtBack - 0.175;
  const south = p.courtFront + 0.175;
  for (const x of [-xAxis, -1.225, 1.225, xAxis]) {
    put(`colonnade.north.${x}`, column12, "colonnade", x, y.floor, north);
    put(`colonnade.south.${x}`, column12, "colonnade", x, y.floor, south);
  }
  for (let i = 1; i < 4; i++) {
    const z = north + (south - north) * i / 4;
    put(`colonnade.west.${i}`, column12, "colonnade", -xAxis, y.floor, z);
    put(`colonnade.east.${i}`, column19, "colonnade", xAxis, y.floor, z);
  }
  const porchColumn = columns.porch();
  for (const x of [-1.35, 1.35]) put(`porch.column.${x}`, porchColumn, "entrance", x, y.floor, 10);
  put(
    "colonnade.beam.north",
    beams.colonnadeBeam("north"),
    "colonnade",
    0,
    y.floor + 2.622862867,
    north,
  );
  put(
    "colonnade.beam.south",
    beams.colonnadeBeam("south"),
    "colonnade",
    0,
    y.floor + 2.622862867,
    south,
  );
  put(
    "colonnade.beam.west",
    beams.colonnadeBeam("west"),
    "colonnade",
    -xAxis,
    y.floor + 2.622862867,
    (north + south) / 2,
    -Math.PI / 2,
  );
  put(
    "colonnade.beam.east",
    beams.colonnadeBeam("east"),
    "colonnade",
    xAxis,
    y.floor + 2.618208538,
    (north + south) / 2,
    -Math.PI / 2,
  );
  put("porch.entablature", beams.porch(), "entrance", 0, 3.2, 10);

  for (const door of templeDoorPassages) {
    const across = (door.wallLow + door.wallHigh) / 2;
    const alongX = door.axis === "x";
    const x = alongX ? door.center : across;
    const z = alongX ? across : door.center;
    const angle = alongX ? 0 : -Math.PI / 2;
    put(
      `frame.${door.id}`,
      openings.doorFrame(door.id),
      door.room,
      x,
      y.floor,
      z,
      angle,
    );
    if (door.id === "door-entry" || door.id === "door-sanctuary") {
      const leaf = openings.doubleLeaf(door.id, "closed");
      for (const side of [-1, 1] as const) {
        const at = templeOpenDoorPlacement(door, side);
        put(
          `leaf.${door.id}.${side < 0 ? "west" : "east"}`,
          leaf,
          door.room,
          at.x,
          y.floor,
          at.z,
          at.angle,
        );
      }
    } else {
      const singles = [
        "door-offering",
        "door-administration",
        "door-records",
        "door-storage",
        "door-yard",
        "door-service-exterior",
      ] as const;
      const single = singles.find((id) => id === door.id);
      if (single === undefined) throw new Error(
        `${door.id}: unknown single door`,
      );
      const leaf = openings.singleLeaf(single, "closed");
      const side = door.swing === "room-north" ? -1 : 1;
      const at = templeOpenDoorPlacement(door, side);
      put(`leaf.${door.id}`, leaf, door.room, at.x, y.floor, at.z, at.angle);
    }
  }
  for (const window of templeClerestories()) {
    const depth = window.wallHigh - window.wallLow;
    const frame = openings.windowFrame(Math.abs(depth - 0.6) < p.tolerance ? 0.60 : 0.30);
    const xs = window.profile.outline.map((point) => point.x);
    const along = (Math.min(...xs) + Math.max(...xs)) / 2;
    const across = (window.wallLow + window.wallHigh) / 2;
    const side = window.id.split("-")[2];
    const x = side === "north" || side === "south" ? along : across;
    const z = side === "north" || side === "south" ? across : along;
    const angle = side === "north"
      ? Math.PI
      : side === "south"
        ? 0
        : side === "west"
          ? -Math.PI / 2
          : Math.PI / 2;
    put(
      `frame.${window.id}`,
      frame,
      "sanctuary",
      x,
      window.sill - window.frame,
      z,
      angle,
    );
  }

  const truss = beams.sanctuaryTruss();
  for (const z of [-8.3, -5.5]) put(`truss.${z}`, truss, "sanctuary", 0, 4.86, z);
  const joist = beams.ceilingJoist();
  for (const [room, back, front, x] of [
    ["offering", p.northInner, p.southInner, (p.westInner + p.westRoom) / 2],
    ["storage", p.storageBack, p.storageFront, (p.eastRoom + p.eastInner) / 2],
    ["records", p.recordsBack, p.recordsFront, (p.eastRoom + p.eastInner) / 2],
    [
      "administration",
      p.officeBack,
      p.southInner,
      (p.eastRoom + p.eastInner) / 2,
    ],
  ] as const) {
    for (let z = back + 0.3; z < front - 0.2; z += 0.6)
      put(
        `joist.${room}.${z.toFixed(2)}`,
        joist,
        room,
        x,
        y.lowCeiling - y.exposedBeamDepth,
        z,
      );
  }
  put(
    "fountain",
    fixtures.fountain(),
    "courtyard",
    0,
    y.courtyard,
    (p.courtBack + p.courtFront) / 2,
  );

  // Coplanar roof pieces are a partition of one bearing plane. Test coverage
  // against their union, so a legitimate seam does not delete whole tile rows.
  const tile = cladding.roofTile();
  const roofGroups = new Map<string, typeof built.roof>();
  for (const patch of built.roof) {
    const h = patch.height;
    const key = `${patch.tier}:${h.x.toFixed(8)}:${h.z.toFixed(8)}:${h.constant.toFixed(8)}`;
    const group = roofGroups.get(key) ?? [];
    group.push(patch);
    roofGroups.set(key, group);
  }
  for (const [groupId, group] of roofGroups) {
    const patch = group[0]!;
    const gradient = { x: patch.height.x, z: patch.height.z };
    const slope = Math.hypot(gradient.x, gradient.z);
    if (slope < 1e-9) continue;
    const uphill = { x: gradient.x / slope, z: gradient.z / slope };
    const lateral = { x: uphill.z, z: -uphill.x };
    const polygons = group.map((piece) =>
      piece.polygon.map((point) => ({
        u: point.x * lateral.x + point.z * lateral.z,
        v: point.x * uphill.x + point.z * uphill.z,
      })),
    );
    const coordinates = polygons.flat();
    const u0 = Math.min(...coordinates.map((q) => q.u));
    const u1 = Math.max(...coordinates.map((q) => q.u));
    const v0 = Math.min(...coordinates.map((q) => q.v));
    const v1 = Math.max(...coordinates.map((q) => q.v));
    type Point = { u: number; v: number };
    const area = (poly: Point[]): number => Math.abs(poly.reduce((sum, a, i) => {
      const b = poly[(i + 1) % poly.length]!;
      return sum + a.u * b.v - a.v * b.u;
    }, 0)) / 2;
    const clippedArea = (rect: Point[], host: Point[]): number => {
      let subject = rect;
      for (let i = 0; i < host.length && subject.length > 0; i++) {
        const a = host[i]!;
        const b = host[(i + 1) % host.length]!;
        const side = (point: Point): number =>
          (b.u - a.u) * (point.v - a.v) - (b.v - a.v) * (point.u - a.u);
        const result: Point[] = [];
        for (let j = 0; j < subject.length; j++) {
          const from = subject[j]!;
          const to = subject[(j + 1) % subject.length]!;
          const d0 = side(from);
          const d1 = side(to);
          if ((d0 >= 0) !== (d1 >= 0)) {
            const fraction = d0 / (d0 - d1);
            result.push({
              u: from.u + fraction * (to.u - from.u),
              v: from.v + fraction * (to.v - from.v),
            });
          }
          if (d1 >= 0) result.push(to);
        }
        subject = result;
      }
      return subject.length < 3 ? 0 : area(subject);
    };
    const angle = Math.atan2(uphill.x, uphill.z);
    const cosine = 1 / Math.sqrt(1 + slope * slope);
    const sine = slope * cosine;
    for (let u = u0 + 0.2; u - 0.2 < u1 - 1e-7; u += 0.4) {
      for (let v = v0; v < v1 - 1e-7; v += 0.44 * cosine) {
        const vEnd = v + 0.52 * cosine + 0.125 * sine;
        const rect = [
          { u: u - 0.2, v },
          { u: u + 0.285, v },
          { u: u + 0.285, v: vEnd },
          { u: u - 0.2, v: vEnd },
        ];
        const covered = polygons.reduce(
          (sum, poly) => sum + clippedArea(rect, poly),
          0,
        );
        if (covered < 1e-8) continue;
        const x = u * lateral.x + v * uphill.x;
        const z = u * lateral.z + v * uphill.z;
        const name = `${groupId}.${u.toFixed(2)}.${v.toFixed(2)}`;
        const height = patch.height.x * x + patch.height.z * z + patch.height.constant;
        const hasRidge = patch.tier === "sanctuary" || patch.tier === "porch" ||
          (patch.tier === "wing" && Math.abs(slope - Math.tan(19 * Math.PI / 180)) < 1e-7);
        const ridgeEnd = hasRidge ? (v1 - v) / cosine - 0.16 : null;
        const ridgeCut = ridgeEnd !== null && ridgeEnd < 0.52;
        const belowCoping = patch.tier === "wing" && gradient.x < -1e-7;
        const copingCut = belowCoping && height + 0.125 * cosine + 0.52 * sine > 4.68;
        if (covered >= area(rect) - 1e-6 && !ridgeCut && !copingCut) {
          put(`tile.${name}`, tile, null, x, height, z, angle, -Math.atan(slope));
        } else {
          // A boundary module is cut at each actual polygon. Shared coplanar
          // partitions retain full modules above; only boundary fragments split.
          for (let i = 0; i < polygons.length; i++) {
            const polygon = polygons[i]!;
            if (clippedArea(rect, polygon) < 1e-8) continue;
            const planes = polygon.map((a, j) => {
              const b = polygon[(j + 1) % polygon.length]!;
              const nu = -(b.v - a.v), nv = b.u - a.u;
              return { x: nu, y: nv * sine, z: nv * cosine,
                constant: nu * (u - a.u) + nv * (v - a.v) };
            });
            if (copingCut) planes.push({ x: 0, y: -cosine, z: -sine, constant: 4.68 - height });
            const crop = cladding.roofTileCut(`${name}.${i}`, planes, ridgeCut ? ridgeEnd : null);
            if (crop !== null) put(`tile.${name}.${i}`, crop, null, x, height, z, angle, -Math.atan(slope));
          }
        }
      }
    }
  }

  const ridge = (name: string, slope: 19 | 22, x: number,
    height: number, start: number, end: number): void => {
    let index = 0;
    for (let z = start; z < end - 1e-7; z += 0.4) {
      const model = cladding.ridgeTile(slope, Math.min(0.45, end - z));
      put(`ridge.${name}.${index++}`, model, null, x, height, z);
    }
  };
  ridge("sanctuary", 22, 0, 7.673150798552151, -10.6, -3.5);
  ridge(
    "east",
    19,
    7.3582369035932675,
    1.9948533534861719 + 0.3443276132896652 * 7.3582369035932675,
    -2.8,
    p.southInner - 0.06,
  );
  ridge("porch", 22, 0, 4.666643272628009, 8.05, 10.6);

  // Exposed roof members stop at the room wall, leaving the roof over the
  // low-ceiling rooms without duplicated hidden timber.
  const rafterRun = (name: string, slope: 12 | 19 | 22,
    length: number, startX: number, startZ: number,
    upper: number, yaw: number, stations: number[], alongX: boolean): void => {
    const model = beams.rafter(slope, length, name);
    const angle = slope * Math.PI / 180;
    const underside = upper - 0.30 / Math.cos(angle);
    for (const station of stations) {
      put(
        `rafter.${name}.${station.toFixed(2)}`,
        model,
        name.startsWith("sanctuary") ? "sanctuary" : "colonnade",
        alongX ? station : startX,
        underside,
        alongX ? startZ : station,
        yaw,
        -angle,
      );
    }
  };
  const stations = (low: number, high: number): number[] => {
    const values: number[] = [];
    for (let at = low + 0.25; at <= high - 0.25 + 1e-7; at += 0.5) values.push(
      at,
    );
    return values;
  };
  const wingZ = stations(-1.4, 5.75);
  const wingX = stations(-3.15, 3.15);
  rafterRun(
    "west-court",
    12,
    2.45,
    -3.15,
    0,
    2.456052034154923 - 0.2125565616700221 * -3.15,
    -Math.PI / 2,
    wingZ,
    false,
  );
  rafterRun(
    "east-court",
    19,
    2.45,
    3.15,
    0,
    1.9948533534861719 + 0.3443276132896652 * 3.15,
    Math.PI / 2,
    wingZ,
    false,
  );
  rafterRun(
    "north-court",
    12,
    2.45,
    0,
    -1.4,
    2.8280260170774616 - 0.2125565616700221 * -1.4,
    Math.PI,
    wingX,
    true,
  );
  rafterRun(
    "south-court",
    12,
    2.30,
    0,
    5.75,
    1.9034049738128656 + 0.2125565616700221 * 5.75,
    0,
    wingX,
    true,
  );
  const [sanctuaryTail, sanctuaryInterior] = beams.sanctuaryRafters();
  const sanctuaryStations = stations(-10.6, -3.5);
  for (const side of [-1, 1]) {
    for (const z of sanctuaryStations) {
      const yaw = -side * Math.PI / 2;
      const tailX = side * 6.1;
      const innerX = side * 5.6;
      const topAt = (absoluteX: number): number =>
        5.35 + (5.75 - absoluteX) * Math.tan(22 * Math.PI / 180)
        - 0.18 / Math.cos(22 * Math.PI / 180);
      put(
        `rafter.sanctuary.tail.${side}.${z.toFixed(2)}`,
        sanctuaryTail,
        "sanctuary",
        tailX,
        topAt(6.1) - 0.12 / Math.cos(22 * Math.PI / 180),
        z,
        yaw,
        -22 * Math.PI / 180,
      );
      put(
        `rafter.sanctuary.interior.${side}.${z.toFixed(2)}`,
        sanctuaryInterior,
        "sanctuary",
        innerX,
        topAt(5.6) - 0.12 / Math.cos(22 * Math.PI / 180),
        z,
        yaw,
        -22 * Math.PI / 180,
      );
    }
  }

  const environment: IAutoMovieBuiltEnvironment = {
    ...built.environment,
    models: [...built.environment.models, ...models],
    elements: [...built.environment.elements, ...elements],
  };
  const known = new Set(environment.models.map((model) => model.id));
  const seen = new Set<string>();
  for (const member of elements) {
    if (seen.has(member.id)) throw new Error(`${member.id}: duplicate building member`);
    seen.add(member.id);
    if (member.model === null || !known.has(member.model))
      throw new Error(
        `${member.id}: missing building prototype ${member.model}`,
      );
    const at = member.transform.translation;
    if (![at.x, at.y, at.z].every(Number.isFinite))
      throw new Error(`${member.id}: non-finite building placement`);
  }
  return environment;
};
