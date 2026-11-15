import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Frames, AutoMovieHumanF1Joints, AutoMovieHumanF1Landmarks, AutoMovieHumanSegmentFrame as F } from "@automovie/human";

/**
 * The re-base of f1 (step 2 of the Human skill's three steps): every quantity that places a part, written in the frame of the segment it
 * belongs to, and the proof that the figure's source did not move.
 *
 * Usage, from `test/` after `pnpm conic:build`, each writing under `test/.shots/family-conic-rebase/`:
 * - `node .shots/esbuild/FamilyConicRebase.cjs --tables` writes `packages/human/src/generation/f1/AutoMovieHumanF1Placing.ts`: the chain
 *   (`AutoMovieHumanSegmentFrame.chain` of `AutoMovieHumanF1Frames.segments()`), every datum of `AutoMovieHumanF1Joints` and
 *   `AutoMovieHumanF1Landmarks` and every course centre as `{ frame, local point }`, every family's `up` and every relief's `axis` and
 *   `turn` as `{ frame, local direction }`, and each family's course as datum names; and the receipt `assignment.txt`.
 * - `--modules` rewrites the placing fields of the datum tables and of every family module to read that table, and nothing else of
 *   their text: a section table (`knots`, `values`, `tips`, `layout`, a relief's window, net and heights) is never touched.
 * - `--snapshot=<name>` writes `<name>.json` (every datum, family, cutter, port loop and fan seam as the bundle holds them) and
 *   `<name>.construction.json` (the declared construction: its tree, fills and every source's stations and outlines).
 * - `--compare=<before>,<after>` writes `comparison.<before>.<after>.txt`: both snapshots walked number by number.
 *
 * A stored local value is `A^T (p - o)` (a direction: `A^T d`) at full double precision, and its return `o + A q` is the world value
 * within rounding; the receipt lists each return's difference. A bit-for-bit return does not exist in general: a world coordinate small
 * beside its segment's origin (an epicondyle's x of -0.08 mm from an origin at -16.33) is the difference of two larger numbers, which
 * stands on their coarser grid. A rerun keeps every stored entry that still returns its present world value within `KEEP_MM`, so the
 * table does not drift, and enters only what changed (`--world=<file>`, a JSON `{ points, directions }` of world values by name, such as
 * the fit tool's `joints.world.json` and `<module>.placing.json`).
 */
namespace FamilyConicRebase {
  type V3 = F.V3;
  type IFamily = AutoMovieHumanConicLoft.IFamily;

  /** One stored quantity: its segment, its value there, and what the tool notes about the choice. */
  interface IPlaced {
    frame: string;
    local: V3;
    note?: string;
  }

  /** The stored tables as the package module holds them. */
  interface ITables {
    chain: F.IJoint[];
    points: Record<string, IPlaced>;
    directions: Record<string, IPlaced>;
    courses: Record<string, string[]>;
  }

  /**
   * Largest difference between a newly entered value's return through the chain and its world value: mm for a point, whose rounding is a
   * few units in the last place of a coordinate near 1,700 mm (2.3e-13 each), and a unit vector's share for a direction (1.1e-16 each).
   */
  const RETURN: { point: number; direction: number } = { point: 1e-12, direction: 1e-14 };

  /**
   * The magnitude under which a stored component is written as 0: mm for a point or a chain offset, a unit vector's share for a direction
   * or a rotation entry. A number that is zero by its definition (a joint centre in the segment whose origin it is, an axis a rule sets
   * square) comes out of `A^T (p - o)` as rounding noise, and the laws of step 3 are read from this table, so it must read 0. The
   * thresholds stand far below any stored datum's resolution (0.01 mm; 1e-5 for a relief's axis) and far above the double rounding of a
   * 2,000 mm figure (about 4e-13 mm; 2e-16 for a unit vector). Nothing else is rounded, and a zeroed entry is accepted only while it
   * still returns within `RETURN`.
   */
  const ZERO: { point: number; direction: number } = { point: 1e-9, direction: 1e-12 };

  /** Largest difference at which a stored entry still counts as the present world value on a rerun, mm (and unit for a direction): far above rounding (1e-13), far below the tables' 0.01 mm. */
  const KEEP_MM: number = 1e-9;

  /** The digits by their joint-table stem and their bones in the frame tree. */
  const FINGERS: readonly string[] = ["index", "middle", "ring", "pinky"];
  const TOES: readonly string[] = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"];

  /**
   * The segment each datum belongs to. A joint centre belongs to the segment whose origin it is, so it reads `[0, 0, 0]` there; a built
   * point belongs to the segment it stands in; a landmark to the segment whose frame it sets.
   *
   * The choices that are not forced:
   * - `armRoot`, `armTurn`, `armpit`, the axilla's and the vault's courses and the breast's fan point: the thorax, the trunk's side they
   *   were read on, although the arm's course starts through the first two.
   * - `axisFloor` in the pelvis and `axisCrown` in the head: the trunk is one family on one straight course whose ends stand in the
   *   tree's first and last trunk frames.
   * - `handEnd` and `footEnd`, where a limb's course runs on past its knuckles toward its digits: the hand and the foot, since the palm's
   *   and the forefoot's sections are read about that course, not a digit's.
   * - a digit's pad and its course's end past the pad: its distal phalanx.
   * - the concha's course: the ear, as the auricle's bowl, although its cutter ends inside the head.
   * - nasion and pronasale: the nose, whose frame they set with subnasale; tragion: the ear, whose origin it is.
   */
  function frameOf(name: string): string {
    const stem: string = name.split(".")[0]!;
    const direct: Record<string, string> = {
      upperarm: "humerus", lowerarm: "forearm", hand: "hand", thigh: "femur", calf: "tibia", foot: "foot",
      axisFloor: "pelvis", axisCrown: "head", footBall: "foot", footEnd: "foot", handEnd: "hand",
      armpit: "thorax", armRoot: "thorax", armTurn: "thorax", axilla: "thorax", vault: "thorax", breastFan: "thorax",
      helix: "ear", plate: "ear", antihelix: "ear", conchaRoot: "ear", conchaTip: "ear", tragion: "ear",
      noseRoot: "nose", noseTip: "nose", nostrilRoot: "nose", nostrilTip: "nose", pronasale: "nose", nasion: "nose", subnasale: "nose",
      breastRoot: "breast", breastTip: "breast",
      epicondyleLateral: "humerus", epicondyleMedial: "humerus", styloidRadial: "forearm", styloidUlnar: "forearm",
      femoralEpicondyleLateral: "femur", femoralEpicondyleMedial: "femur", pternion: "foot", suprasternale: "thorax", metacarpalBase: "hand",
    };
    if (direct[stem] !== undefined) return direct[stem];
    for (const finger of FINGERS) {
      if (stem === finger + "1") return finger + ".proximal";
      if (stem === finger + "2") return finger + ".middle";
      if (stem === finger + "3" || stem === finger + "Pad" || stem === finger + "End") return finger + ".distal";
    }
    if (stem === "thumb1") return "thumb.metacarpal";
    if (stem === "thumb2") return "thumb.proximal";
    if (stem === "thumb3" || stem === "thumbPad" || stem === "thumbEnd") return "thumb.distal";
    for (const toe of TOES) {
      if (stem === toe + "1") return toe + ".proximal";
      if (stem === toe + "2" || stem === toe + "Pad" || stem === toe + "End") return toe + ".distal";
    }
    throw new Error("no segment is declared for the datum " + name);
  }

  /** A polyline datum's centres by name: `helix.0`, `helix.1`, and so on. */
  const line = (name: string, count: number): string[] => Array.from({ length: count }, (_: unknown, k: number): string => name + "." + k);

  /**
   * Every family's course as datum names. A course's end past its last joint is a datum of its own (`handEnd`, `footEnd`, a digit's
   * `<digit>End`): the point `AutoMovieHumanF1Joints.toward` or `beyond` built, stored in the segment it stands in.
   */
  const COURSES: Record<string, string[]> = {
    trunk: ["axisFloor", "axisCrown"],
    arm: ["armRoot", "armTurn", "lowerarm", "hand", "middle1", "handEnd"],
    hand: ["armRoot", "armTurn", "lowerarm", "hand", "middle1", "handEnd"],
    leg: ["thigh", "calf", "foot", "footBall", "footEnd"],
    plate: line("plate", 5),
    helix: line("helix", 11),
    antihelix: line("antihelix", 7),
    nose: ["noseRoot", "noseTip"],
    breast: ["breastRoot", "breastTip"],
    concha: ["conchaRoot", "conchaTip"],
    nostril: ["nostrilRoot", "nostrilTip"],
    axilla: line("axilla", 4),
    vault: line("vault", 2),
    ...Object.fromEntries([...FINGERS, "thumb"].map((finger: string): [string, string[]] => ["finger." + finger, [finger + "1", finger + "2", finger + "3", finger + "End"]])),
    ...Object.fromEntries(TOES.map((toe: string): [string, string[]] => ["toe." + toe.replace("toe", ""), [toe + "1", toe + "2", toe + "End"]])),
  };

  /**
   * The segment each leg of a jointed course lies on, by family: a relief's directions are stored in the segment its window's middle
   * lies on. The arm's and the hand's first leg, from `armRoot` to `armTurn`, runs through the shoulder inside the thorax.
   */
  const LEGS: Record<string, string[]> = {
    arm: ["thorax", "humerus", "forearm", "hand", "hand"],
    hand: ["thorax", "humerus", "forearm", "hand", "hand"],
    leg: ["femur", "tibia", "foot", "foot"],
    nose: ["nose"],
  };

  /**
   * The trunk's reliefs by anatomy, since its one straight course crosses the pelvis, the thorax and the head: the crotch, the navel and
   * the low wall (the perineum to the chest's foot, most of it below the waist) in the pelvis; the chest, the fold under the breast and
   * the shoulder in the thorax; the head, the crown, the face, the eyes, the mouth, the chin and the collar in the head. The collar's
   * window, stations 680 to 734 mm, is the chin's (690 to 734) carried round the neck under the jaw, so it goes with the head.
   */
  const TRUNK: readonly [string, string][] = [
    ["trunk.low", "pelvis"], ["trunk.crotch", "pelvis"], ["trunk.navel", "pelvis"],
    ["trunk.chest", "thorax"], ["trunk.fold", "thorax"], ["trunk.shoulder", "thorax"],
    ["trunk.head", "head"], ["trunk.crown", "head"], ["trunk.collar", "head"], ["trunk.face", "head"], ["trunk.mouth", "head"], ["trunk.eyes", "head"], ["trunk.chin", "head"],
  ];

  /**
   * Quantities no exported object holds, entered once from the source named beside each and carried by the table afterwards: the vault's
   * course and `up` (`AutoMovieHumanF1Vault`, a constructed cutter outside the body, as its module wrote them), the breast's fan point
   * (`AutoMovieHumanF1.BREAST_FAN_MM`) and the sole's normal the leg's fan seams hold (`fanSeams`, the floor's normal reversed).
   */
  const SEEDS: { points: Record<string, V3>; directions: Record<string, { frame: string; world: V3 }> } = {
    points: { "vault.0": [16, 1290, 149.5], "vault.1": [-1, 1276, 148.5], breastFan: [99, 1245, 110] },
    directions: { "vault.up": { frame: "thorax", world: [0, 1, 0] }, "leg.fan.up": { frame: "foot", world: [0, -1, 0] } },
  };

  /**
   * The course ends by the rules that built them (`AutoMovieHumanF1Joints.toward` and `beyond`, with the lengths the fit tool laid them
   * by: `KNUCKLE.reach` and `TOE_TURN.reach`, 40 mm, and `PAD.past`, 4 mm): a limb's course runs on past its knuckles along the mean
   * direction of its digits' first segments, and a digit's past its pad's far point on the line from its last joint.
   */
  function built(joints: typeof AutoMovieHumanF1Joints): Record<string, V3> {
    const at = (name: string): V3 => (joints as unknown as Record<string, V3>)[name]!;
    return {
      handEnd: joints.toward(joints.middle1, FINGERS.map((finger: string): [V3, V3] => [at(finger + "1"), at(finger + "2")]), 40),
      footEnd: joints.toward(joints.footBall, TOES.map((toe: string): [V3, V3] => [at(toe + "1"), at(toe + "2")]), 40),
      ...Object.fromEntries([...FINGERS, "thumb"].map((finger: string): [string, V3] => [finger + "End", joints.beyond(at(finger + "3"), at(finger + "Pad"), 4)])),
      ...Object.fromEntries(TOES.map((toe: string): [string, V3] => [toe + "End", joints.beyond(at(toe + "2"), at(toe + "Pad"), 4)])),
    };
  }

  const F1: string = "packages/human/src/generation/f1";
  const same = (a: readonly number[], b: readonly number[]): boolean => a.length === b.length && a.every((x: number, i: number): boolean => Object.is(x, b[i]));
  const far = (a: readonly number[], b: readonly number[]): number => Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));

  /** The stored tables parsed from the package module's text; null when it is not written yet. */
  async function stored(root: string): Promise<ITables | null> {
    const text: string | null = await fs.readFile(path.join(root, F1, "AutoMovieHumanF1Placing.ts"), "utf8").catch((): null => null);
    if (text === null) return null;
    const read = <X>(name: string, open: string, close: string): X => {
      const from: number = text.indexOf("= " + open, text.indexOf("export const " + name + ":")) + 2;
      return JSON.parse(text.slice(from, text.indexOf("\n  " + close + ";", from) + 4)) as X;
    };
    return { chain: read("CHAIN", "[", "]"), points: read("POINTS", "{", "}"), directions: read("DIRECTIONS", "{", "}"), courses: read("COURSES", "{", "}") };
  }

  /** World values by name from `--world=<file>` arguments, the later file winning. */
  async function overrides(): Promise<{ points: Record<string, V3>; directions: Record<string, V3> }> {
    const out: { points: Record<string, V3>; directions: Record<string, V3> } = { points: {}, directions: {} };
    for (const argument of process.argv.filter((a: string): boolean => a.startsWith("--world="))) {
      const file: { points?: Record<string, V3>; directions?: Record<string, V3> } = JSON.parse(await fs.readFile(argument.slice(8), "utf8")) as { points?: Record<string, V3>; directions?: Record<string, V3> };
      Object.assign(out.points, file.points ?? {});
      Object.assign(out.directions, file.directions ?? {});
    }
    return out;
  }

  /** Every family the figure stores, by name: the sewn and merged families, the digits as fitted and the cutters as stored. */
  function families(): Map<string, IFamily> {
    const out: Map<string, IFamily> = new Map();
    for (const member of AutoMovieHumanF1.FAMILIES) out.set(member.family.name, member.family);
    for (const cutter of AutoMovieHumanF1.CUTTERS) out.set(cutter.family.name, cutter.family);
    return out;
  }

  /** Every V3 and V3[] a datum namespace exports, flattened by name. */
  function datums(table: object): Record<string, V3> {
    const out: Record<string, V3> = {};
    const point = (x: unknown): x is V3 => Array.isArray(x) && x.length === 3 && x.every((c: unknown): boolean => typeof c === "number");
    for (const [name, value] of Object.entries(table)) {
      if (point(value)) out[name] = value;
      else if (Array.isArray(value) && value.length > 0 && value.every(point)) value.forEach((p: V3, k: number): void => void (out[name + "." + k] = p));
    }
    return out;
  }

  /** The leg of a polyline nearest a point. */
  function nearestLeg(centres: readonly V3[], p: readonly number[]): number {
    let best: [number, number] = [0, Infinity];
    for (let i: number = 0; i + 1 < centres.length; ++i) {
      const [a, b]: [V3, V3] = [centres[i]!, centres[i + 1]!];
      const d: V3 = F.sub(b, a);
      const t: number = Math.max(0, Math.min(1, F.dot(F.sub(p as V3, a), d) / F.dot(d, d)));
      const off: number = Math.hypot(...F.sub(p as V3, F.add(a, F.scale(d, t))));
      if (off < best[1]) best = [i, off];
    }
    return best[0];
  }

  /** The segment a relief's directions are stored in, with the note of how its window lies on the course. */
  function reliefFrame(family: IFamily, relief: { name: string; stations: [number, number] }): { frame: string; note?: string } {
    if (family.name === "trunk") {
      const hit: [string, string] | undefined = TRUNK.find(([prefix]: [string, string]): boolean => relief.name === prefix || relief.name.startsWith(prefix + "."));
      if (hit === undefined) throw new Error("no segment is declared for the trunk relief " + relief.name);
      return { frame: hit[1] };
    }
    const legs: string[] | undefined = LEGS[family.name];
    if (legs === undefined) throw new Error("no legs are declared for the reliefs of " + family.name);
    const course = AutoMovieHumanConicLoft.axis(family);
    const at = (s: number): string => legs[nearestLeg(family.centres, course.at(s).origin)]!;
    const middle: number = (relief.stations[0] + relief.stations[1]) / 2;
    const [from, on, to]: string[] = [at(relief.stations[0]), at(middle), at(relief.stations[1])];
    return { frame: on!, ...(from === to ? {} : { note: "window " + relief.stations[0] + " to " + relief.stations[1] + " mm runs from the " + from + " to the " + to + "; its middle at " + middle + " mm lies on the " + on }) };
  }

  /** `--tables`: the stored tables from the present world values. */
  async function tables(root: string, out: string): Promise<void> {
    const before: ITables | null = await stored(root);
    const given: { points: Record<string, V3>; directions: Record<string, V3> } = await overrides();
    const all: Map<string, IFamily> = families();

    // The present world points: the datum tables, then each course's centres under their datum names, the seeds, and the overrides.
    const world: Record<string, V3> = { ...datums(AutoMovieHumanF1Joints), ...datums(AutoMovieHumanF1Landmarks) };
    for (const [name, family] of all) {
      const names: string[] | undefined = COURSES[name];
      if (names === undefined || names.length !== family.centres.length) throw new Error("the course of " + name + " is not declared centre for centre");
      names.forEach((datum: string, k: number): void => {
        if (world[datum] === undefined) world[datum] = family.centres[k]!;
        else if (!same(world[datum], family.centres[k]!)) throw new Error(name + "'s centre " + k + " is not the datum " + datum);
      });
    }
    for (const [name, p] of Object.entries(SEEDS.points)) if (world[name] === undefined && before?.points[name] === undefined) world[name] = p;
    Object.assign(world, given.points);

    // The datum tables with the given points laid over them, for the rules that read them.
    const laid = <X extends object>(table: X): X => {
      const out: Record<string, unknown> = Object.fromEntries(Object.entries(table));
      for (const [name, p] of Object.entries(given.points)) {
        const [stem, index]: string[] = name.split(".");
        if (!(stem! in out)) continue;
        if (index === undefined) out[stem!] = p;
        else out[stem!] = (out[stem!] as V3[]).map((old: V3, k: number): V3 => (k === Number(index) ? p : old));
      }
      return out as X;
    };

    // The course ends by their rules: rebuilt from the given points when any is given, and held to the rules within rounding otherwise.
    for (const [name, p] of Object.entries(built(laid(AutoMovieHumanF1Joints)))) {
      if (Object.keys(given.points).length > 0) world[name] = p;
      else if (far(world[name]!, p) > KEEP_MM) throw new Error("the course end " + name + " is not its rule's point");
    }

    // The chain: the rules applied to the present landmarks; the stored one is kept while the rules still return it within rounding.
    const ruled: F.IJoint[] = F.chain(AutoMovieHumanF1Frames.segments(laid(AutoMovieHumanF1Joints), laid(AutoMovieHumanF1Landmarks)));
    const kept: boolean = before !== null && before.chain.length === ruled.length && ruled.every((joint: F.IJoint, i: number): boolean => before.chain[i]!.name === joint.name && before.chain[i]!.parent === joint.parent && far(before.chain[i]!.offset, joint.offset) <= KEEP_MM && far(before.chain[i]!.rotation.flat(), joint.rotation.flat()) <= KEEP_MM);
    let zeroed: number = 0;
    const zero = (v: readonly number[], limit: number): number[] =>
      v.map((x: number): number => {
        if (x !== 0 && Math.abs(x) < limit) ++zeroed;
        return Math.abs(x) < limit ? 0 : x;
      });
    const chain: F.IJoint[] = (kept ? before!.chain : ruled).map((joint: F.IJoint): F.IJoint => ({ name: joint.name, parent: joint.parent, offset: zero(joint.offset, ZERO.point) as V3, rotation: joint.rotation.map((row: V3): V3 => zero(row, ZERO.direction) as V3) as F.M3 }));
    for (const [i, joint] of chain.entries()) if (far(joint.offset, ruled[i]!.offset) > KEEP_MM || far(joint.rotation.flat(), ruled[i]!.rotation.flat()) > KEEP_MM) throw new Error("the chain's " + joint.name + " leaves its rule beyond rounding");
    const frames: Map<string, F.IFrame> = F.world(chain, (): undefined => undefined);
    const frame = (name: string): F.IFrame => {
      const found: F.IFrame | undefined = frames.get(name);
      if (found === undefined) throw new Error("the tree has no segment " + name);
      return found;
    };

    const receipt: string[] = ["f1 re-based placing: every quantity in its segment's frame; mm; chain " + (kept ? "kept as stored" : "from the rules"), ""];
    const worst: { point: number; direction: number } = { point: 0, direction: 0 };
    const place = (kind: "point" | "direction", name: string, segment: string, value: V3, previous: IPlaced | undefined, note?: string): IPlaced => {
      const f: F.IFrame = frame(segment);
      const back = (q: V3): V3 => (kind === "point" ? F.toWorld(f, q) : F.toWorldDirection(f, q));
      const carried: boolean = previous !== undefined && previous.frame === segment && far(back(previous.local), value) <= KEEP_MM;
      const local: V3 = zero(carried ? previous!.local : kind === "point" ? F.toLocal(f, value) : F.toLocalDirection(f, value), ZERO[kind]) as V3;
      const off: number = far(back(local), value);
      worst[kind] = Math.max(worst[kind], off);
      if (off > RETURN[kind]) throw new Error(name + " returns " + off + " from its world value, beyond rounding");
      receipt.push([kind, name, segment, JSON.stringify(local), "world " + JSON.stringify(value), "returns within " + (off === 0 ? "0" : off.toExponential(2)), carried ? "carried" : "entered", note ?? ""].join("\t"));
      return { frame: segment, local, ...(note === undefined ? {} : { note }) };
    };

    const points: Record<string, IPlaced> = {};
    for (const name of new Set([...Object.keys(world), ...Object.keys(before?.points ?? {})])) {
      if (world[name] === undefined) points[name] = { ...before!.points[name]!, local: zero(before!.points[name]!.local, ZERO.point) as V3 };
      else points[name] = place("point", name, frameOf(name), world[name], before?.points[name]);
    }

    // The directions: each family's `up` in its course's first segment, each relief's `axis` and `turn` in its window's segment.
    const directions: Record<string, IPlaced> = {};
    const direct = (name: string, segment: string, value: V3 | undefined, note?: string): void => {
      const present: V3 | undefined = given.directions[name] ?? value;
      if (present === undefined) directions[name] = { ...before!.directions[name]!, local: zero(before!.directions[name]!.local, ZERO.direction) as V3 };
      else directions[name] = place("direction", name, segment, present, before?.directions[name], note);
    };
    for (const [name, family] of all) {
      direct(name + ".up", frameOf(COURSES[name]![0]!), family.up);
      for (const relief of family.reliefs ?? []) {
        const where: { frame: string; note?: string } = reliefFrame(family, relief);
        direct(relief.name + ".axis", where.frame, relief.axis, where.note);
        if (relief.turn !== undefined) direct(relief.name + ".turn", where.frame, relief.turn, where.note);
      }
    }
    for (const [name, seed] of Object.entries(SEEDS.directions)) direct(name, seed.frame, before?.directions[name] === undefined ? seed.world : undefined);

    const row = (value: unknown): string => JSON.stringify(value).replaceAll(",", ", ").replaceAll("\":", "\": ");
    const block = (rows: [string, unknown][]): string[] => rows.map(([key, value]: [string, unknown], i: number): string => "    " + JSON.stringify(key) + ": " + row(value) + (i + 1 < rows.length ? "," : ""));
    const text: string[] = [
      "import type { AutoMovieHumanSegmentFrame } from \"../frame/AutoMovieHumanSegmentFrame\";",
      "",
      "/**",
      " * f1's placing, re-based: the chain of its segment frames and every quantity that places a part, each in the frame of the segment it",
      " * belongs to. This table is the one source of where f1's parts stand; `AutoMovieHumanF1Placement` maps it through the chain to the",
      " * figure's frame at a pose, and `AutoMovieHumanF1Joints`, `AutoMovieHumanF1Landmarks` and every family's placing fields read it at the",
      " * reference pose.",
      " *",
      " * Generated data, never edited by hand: `test/src/reference-conics/FamilyConicRebase.ts` (from `test/`: `pnpm conic:build`, then",
      " * `node .shots/esbuild/FamilyConicRebase.cjs --tables`) wrote it from the world tables of step 1 (`2ad771f825`): the chain is",
      " * `AutoMovieHumanSegmentFrame.chain` of the frames `AutoMovieHumanF1Frames.segments` builds by its written rules, a point is",
      " * `A^T (p - o)` and a direction `A^T d` in its segment's reference frame. Which segment each belongs to is declared, with its basis,",
      " * in that tool (`frameOf`, `LEGS`, `TRUNK`); a `note` says how a relief's window lies on its course when it crosses a joint.",
      " *",
      " * Every number is written at full double precision, JavaScript's shortest form that reads back the same double, because the round",
      " * trip to the reference pose must be exact within rounding and a shortened number would add its own error: the tool enters a value",
      " * only when it returns through the chain within " + RETURN.point + " mm of its world value for a point and " + RETURN.direction + " for a direction, and its",
      " * receipt lists each return. The reference pose is the chain's rotations and nothing else; identity rotations give the neutral body.",
      " *",
      " * A component under " + ZERO.point + " mm (a point, a chain offset) or " + ZERO.direction + " (a direction, a rotation entry) is written as 0 and nothing else is",
      " * rounded: a number that is zero by its definition, such as a joint centre in the segment whose origin it is, leaves the formula as",
      " * rounding noise, and step 3 reads its laws here. The thresholds stand far below any datum's resolution (0.01 mm; 1e-5 for a",
      " * relief's axis) and far above the double rounding of a 2,000 mm figure (about 4e-13 mm), and a zeroed entry is accepted only",
      " * while it still returns within the bounds above.",
      " *",
      " * Millimetres; directions are as their sources wrote them (a relief's `axis` is rounded to 1e-5, so it is unit only to that).",
      " */",
      "export namespace AutoMovieHumanF1Placing {",
      "  /** One placed quantity. */",
      "  export interface IPlaced {",
      "    /** The segment whose frame holds it. */",
      "    frame: string;",
      "",
      "    /** The point, mm, or the direction in that frame. */",
      "    local: [number, number, number];",
      "",
      "    /** How a relief's window lies on its course, when it crosses a joint. */",
      "    note?: string;",
      "  }",
      "",
      "  /** The chain, parent first: each segment's origin in its parent's frame, mm, and its reference rotation `A_parent^T A_child` by rows. */",
      "  export const CHAIN: AutoMovieHumanSegmentFrame.IJoint[] = [",
      ...chain.map((joint: F.IJoint, i: number): string => "    " + row(joint) + (i + 1 < chain.length ? "," : "")),
      "  ];",
      "",
      "  /** Every datum and course centre: a joint centre reads `[0, 0, 0]` in the segment whose origin it is; a polyline's centres are `<name>.<index>`. */",
      "  export const POINTS: Record<string, IPlaced> = {",
      ...block(Object.entries(points)),
      "  };",
      "",
      "  /** Every placing direction: a family's `<family>.up` in its course's first segment, a relief's `<relief>.axis` and `<relief>.turn` in its window's segment. */",
      "  export const DIRECTIONS: Record<string, IPlaced> = {",
      ...block(Object.entries(directions)),
      "  };",
      "",
      "  /** Every family's course as the names of its centres in `POINTS`. */",
      "  export const COURSES: Record<string, string[]> = {",
      ...block(Object.entries(COURSES)),
      "  };",
      "}",
      "",
    ];
    await fs.writeFile(path.join(root, F1, "AutoMovieHumanF1Placing.ts"), text.join("\n"));
    receipt.splice(1, 0, Object.keys(points).length + " points, largest return difference " + worst.point.toExponential(2) + " mm; " + Object.keys(directions).length + " directions, largest " + worst.direction.toExponential(2) + "; " + zeroed + " components under " + ZERO.point + " mm or " + ZERO.direction + " written as 0 in this run (chain, points and directions)");
    await fs.writeFile(path.join(out, "assignment.txt"), receipt.join("\n") + "\n");
    process.stdout.write(receipt.slice(0, 2).join("\n") + "\nout " + path.join(out, "assignment.txt") + "\n");
  }

  /** The module file of a family. */
  const moduleOf = (name: string): string => "AutoMovieHumanF1" + name.split(".").map((part: string): string => part[0]!.toUpperCase() + part.slice(1)).join("") + ".ts";

  /** `--modules`: the placing fields' text rewritten to read the table. */
  async function modules(root: string, out: string): Promise<void> {
    const table: ITables | null = await stored(root);
    if (table === null) throw new Error("run --tables first");
    const report: string[] = [];
    const use: string = "import { AutoMovieHumanF1Placement } from \"./AutoMovieHumanF1Placement\";";
    const imported = (lines: string[], line: string): void => {
      if (lines.includes(line)) return;
      const last: number = lines.reduce((at: number, text: string, i: number): number => (text.startsWith("import ") ? i : at), -1);
      lines.splice(last + 1, 0, ...(last < 0 ? [line, ""] : [line]));
    };

    // The datum tables: every stored point reads the table by its own name.
    for (const file of ["AutoMovieHumanF1Joints.ts", "AutoMovieHumanF1Landmarks.ts"]) {
      const lines: string[] = (await fs.readFile(path.join(root, F1, file), "utf8")).split("\n");
      let count: number = 0;
      lines.forEach((text: string, i: number): void => {
        const one: RegExpMatchArray | null = text.match(/^(\s*export const (\w+): V3 = )\[[^\]]*\];(\r?)$/);
        const many: RegExpMatchArray | null = text.match(/^(\s*export const (\w+): V3\[\] = )\[\[.*\]\];(\r?)$/);
        const hit: RegExpMatchArray | null = one ?? many;
        if (hit === null) return;
        const name: string = hit[2]!;
        if (one !== null ? table.points[name] === undefined : table.points[name + ".0"] === undefined) throw new Error(file + ": the table has no " + name);
        lines[i] = hit[1]! + "AutoMovieHumanF1Placement." + (one !== null ? "point" : "points") + "(" + JSON.stringify(name) + ");" + hit[3]!;
        ++count;
      });
      if (count > 0) imported(lines, use);
      await fs.writeFile(path.join(root, F1, file), lines.join("\n"));
      report.push(file + ": " + count + " datums rewritten");
    }

    // The families: `centres` names the course's datums, `up` and each relief's `axis` and `turn` read their directions.
    for (const [name, names] of Object.entries(table.courses)) {
      const file: string = moduleOf(name);
      const lines: string[] = (await fs.readFile(path.join(root, F1, file), "utf8")).split("\n");
      const changed: string[] = [];
      const whole: RegExpMatchArray | null = names[0]!.match(/^(\w+)\.0$/);
      const centres: string = whole !== null && names.every((datum: string, k: number): boolean => datum === whole[1] + "." + k) ? "AutoMovieHumanF1Joints." + whole[1] : "[" + names.map((datum: string): string => "AutoMovieHumanF1Joints." + datum).join(", ") + "]";
      lines.forEach((text: string, i: number): void => {
        const eol: string = text.endsWith("\r") ? "\r" : "";
        if (/^ {2}centres: .*,\r?$/.test(text)) {
          const next: string = "  centres: " + centres + "," + eol;
          if (next !== text) changed.push("centres");
          lines[i] = next;
        } else if (/^ {2}up: \[[^\]]*\],\r?$/.test(text)) {
          lines[i] = "  up: AutoMovieHumanF1Placement.direction(" + JSON.stringify(name + ".up") + ")," + eol;
          changed.push("up");
        } else {
          const relief: RegExpMatchArray | null = text.match(/^\s*\{"name":"([^"]+)", "stations":/);
          if (relief === null) return;
          const until: number = text.indexOf("\"rows\":");
          let head: string = text.slice(0, until);
          for (const field of ["axis", "turn"]) {
            const literal: RegExp = new RegExp("\"" + field + "\":\\[[^\\]]*\\]");
            if (!literal.test(head)) continue;
            if (table.directions[relief[1] + "." + field] === undefined) throw new Error(file + ": the table has no " + relief[1] + "." + field);
            head = head.replace(literal, "\"" + field + "\":AutoMovieHumanF1Placement.direction(" + JSON.stringify(relief[1] + "." + field) + ")");
            changed.push(relief[1] + "." + field);
          }
          lines[i] = head + text.slice(until);
        }
      });
      if (changed.some((field: string): boolean => field !== "centres")) imported(lines, use);
      if (lines.some((text: string): boolean => text.includes("AutoMovieHumanF1Joints."))) imported(lines, "import { AutoMovieHumanF1Joints } from \"./AutoMovieHumanF1Joints\";");
      await fs.writeFile(path.join(root, F1, file), lines.join("\n"));
      report.push(file + ": " + (changed.length === 0 ? "unchanged" : changed.join(", ")));
    }
    await fs.writeFile(path.join(out, "modules.txt"), report.join("\n") + "\n");
    process.stdout.write(report.join("\n") + "\n");
  }

  /** `--snapshot=<name>`: everything the figure is built from, as the bundle holds it. */
  async function snapshot(out: string, name: string): Promise<void> {
    const all: Map<string, IFamily> = families();
    const data: object = {
      joints: datums(AutoMovieHumanF1Joints),
      landmarks: datums(AutoMovieHumanF1Landmarks),
      families: Object.fromEntries(all),
      cut: Object.fromEntries(AutoMovieHumanF1.CUTTERS.map((cutter): [string, IFamily] => [cutter.family.name, cutter.cut(cutter.family)])),
      assembled: Object.fromEntries(AutoMovieHumanF1.assemble().families.map((family: IFamily): [string, IFamily] => [family.name, family])),
      loops: {
        "armscye.+z": AutoMovieHumanF1.armscye(1),
        "armscye.-z": AutoMovieHumanF1.armscye(-1),
        nostril: AutoMovieHumanF1.nostril(),
        "mammary.+z": AutoMovieHumanF1.mammary(1),
        "mammary.-z": AutoMovieHumanF1.mammary(-1),
        "fanSeams.arm": AutoMovieHumanF1.fanSeams("arm"),
        "fanSeams.leg": AutoMovieHumanF1.fanSeams("leg"),
      },
    };
    await fs.writeFile(path.join(out, name + ".json"), JSON.stringify(data));
    process.stdout.write("snapshot " + path.join(out, name + ".json") + "\n");
    const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
    await fs.writeFile(path.join(out, name + ".construction.json"), JSON.stringify({ root: declared.root, fills: declared.fills, sources: Object.fromEntries(declared.sources) }));
    process.stdout.write("snapshot " + path.join(out, name + ".construction.json") + "\n");
  }

  /** One group's tally of a comparison. */
  interface ITally {
    numbers: number;
    differing: number;
    worst: number;
    where: string;
    faults: string[];
  }

  /** `--compare=<before>,<after>`: both snapshots walked number by number. */
  async function compare(out: string, before: string, after: string): Promise<void> {
    const groups: Map<string, ITally> = new Map();
    const tally = (group: string): ITally => {
      let found: ITally | undefined = groups.get(group);
      if (found === undefined) groups.set(group, (found = { numbers: 0, differing: 0, worst: 0, where: "", faults: [] }));
      return found;
    };
    const walk = (group: (at: string) => string, at: string, a: unknown, b: unknown): void => {
      const t: ITally = tally(group(at));
      if (typeof a === "number" && typeof b === "number") {
        ++t.numbers;
        if (a === b) return;
        ++t.differing;
        if (Math.abs(a - b) > t.worst) [t.worst, t.where] = [Math.abs(a - b), at];
      } else if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) t.faults.push(at + ": lengths " + a.length + " and " + b.length);
        for (let i: number = 0; i < Math.min(a.length, b.length); ++i) walk(group, at + "[" + i + "]", a[i], b[i]);
      } else if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
        const [x, y]: Record<string, unknown>[] = [a as Record<string, unknown>, b as Record<string, unknown>];
        for (const key of new Set([...Object.keys(x!), ...Object.keys(y!)])) {
          if (!(key in x!) || !(key in y!)) t.faults.push(at + "." + key + ": only in the " + (key in x! ? "first" : "second"));
          else walk(group, at + "." + key, x![key], y![key]);
        }
      } else if (a !== b) t.faults.push(at + ": " + String(JSON.stringify(a)).slice(0, 60) + " against " + String(JSON.stringify(b)).slice(0, 60));
    };
    // A name only one snapshot holds is listed apart: a datum the re-base adds has nothing to be compared with.
    const alone: string[] = [];
    const both = (kind: string, x: Record<string, unknown> | undefined, y: Record<string, unknown> | undefined): string[] => {
      const names: string[] = [...new Set([...Object.keys(x ?? {}), ...Object.keys(y ?? {})])];
      for (const name of names) if (x?.[name] === undefined || y?.[name] === undefined) alone.push(kind + " " + name + ": only in the " + (x?.[name] === undefined ? "second" : "first"));
      return names.filter((name: string): boolean => x?.[name] !== undefined && y?.[name] !== undefined);
    };
    const load = async (name: string): Promise<Record<string, Record<string, unknown>>> => JSON.parse(await fs.readFile(path.join(out, name), "utf8")) as Record<string, Record<string, unknown>>;

    // A family's placing fields apart from its section table; a twin's entries of the other groups by their own names.
    const placing = (at: string): boolean => /^\.(centres|up)\b/.test(at) || /^\.reliefs\[\d+\]\.(axis|turn)\b/.test(at);
    const [a, b]: Record<string, Record<string, unknown>>[] = [await load(before + ".json"), await load(after + ".json")];
    for (const kind of ["families", "cut"]) for (const name of both(kind, a![kind], b![kind])) walk((at: string): string => kind + " " + name + (placing(at) ? ": placing" : ": section table"), "", a![kind]![name], b![kind]![name]);
    // The families `assemble` places at the reference pose against the first snapshot's stored ones (a snapshot taken before `assemble` existed holds none).
    for (const name of both("assembled", a!.assembled ?? a!.families, b!.assembled)) walk((at: string): string => "assembled " + name + (placing(at) ? ": placing" : ": section table"), "", (a!.assembled ?? a!.families)![name], b!.assembled![name]);
    for (const kind of ["joints", "landmarks", "loops"]) for (const name of both(kind, a![kind], b![kind])) walk((): string => kind + (kind === "loops" ? " " + name : ""), "." + name, a![kind]![name], b![kind]![name]);
    const [c, d]: Record<string, Record<string, unknown>>[] = [await load(before + ".construction.json"), await load(after + ".construction.json")];
    walk((): string => "construction root", "", c!.root, d!.root);
    walk((): string => "construction fills", "", c!.fills, d!.fills);
    for (const name of both("construction source", c!.sources, d!.sources)) walk((): string => "construction source " + name, "", c!.sources![name], d!.sources![name]);

    const lines: string[] = ["before " + before + ", after " + after + "; every number of both snapshots; differences in the quantity's own unit (mm, unit vector, radians)", "a field or a length only one side holds is a FAULT", "", ...alone, "", ["group", "numbers", "differing", "largest difference", "at"].join("\t")];
    let faults: number = 0;
    for (const [group, t] of groups) {
      lines.push([group, t.numbers, t.differing, t.worst === 0 ? "0" : t.worst.toExponential(3), t.where].join("\t"));
      for (const fault of t.faults.slice(0, 20)) lines.push("\tFAULT " + fault);
      if (t.faults.length > 20) lines.push("\tFAULT and " + (t.faults.length - 20) + " more");
      faults += t.faults.length;
    }
    const sections: ITally[] = [...groups].filter(([group]: [string, ITally]): boolean => group.endsWith(": section table")).map(([, t]: [string, ITally]): ITally => t);
    const moved: number = sections.reduce((sum: number, t: ITally): number => sum + t.differing, 0);
    const worst: number = Math.max(0, ...[...groups.values()].map((t: ITally): number => t.worst));
    lines.push("", "section tables: " + moved + " numbers differ; every group: largest difference " + worst.toExponential(3) + "; faults " + faults);
    const file: string = path.join(out, "comparison." + before + "." + after + ".txt");
    await fs.writeFile(file, lines.join("\n") + "\n");
    process.stdout.write(lines.slice(-1)[0] + "\nout " + file + "\n");
  }

  /** Run the mode the arguments name. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-rebase");
    await fs.mkdir(out, { recursive: true });
    const value = (flag: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(flag + "="))?.slice(flag.length + 1);
    if (process.argv.includes("--tables")) await tables(root, out);
    if (process.argv.includes("--modules")) await modules(root, out);
    const name: string | undefined = value("--snapshot");
    if (name !== undefined) await snapshot(out, name);
    const pair: string[] | undefined = value("--compare")?.split(",");
    if (pair !== undefined) await compare(out, pair[0]!, pair[1]!);
  }
}
void FamilyConicRebase.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
