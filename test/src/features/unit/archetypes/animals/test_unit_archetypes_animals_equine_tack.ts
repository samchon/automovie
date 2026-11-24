import { createHorse, createPony } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The alternative mounted supports keep the horse's body and add only their
 * own contacts: a bareback bridle, an asymmetric side saddle and a vaulting
 * surcingle.
 *
 * Scenarios, each on the same seeded horse:
 * 1. Every tack keeps the untacked horse's bone parts unchanged, by id, transform and geometry.
 * 2. Mass: the bareback bridle and the surcingle add nothing (no maker's weight read); the side saddle adds its press weight of 10 kg (Horse & Hound: "around 22lb (10kg)").
 * 3. Bareback: a seat sat astride and mounted from the near side, the two reins and the lead, and no stirrup, pommel, cantle or saddle part; the seat lies on the trunk's top, within 10 mm of the trunk capsule's surface over its axis.
 * 4. Side saddle: one stirrup only, on the near side (`+X`); both heads on the near side of or at the spine, the leaping head lower than the fixed head and further out; the seat faces the near side and is not sat astride.
 * 5. Surcingle: exactly two handles, one each side of the spine, at most 240 mm apart (the harmonised FEI rule); a pad no thicker than 3 cm and reaching no more than 80 cm behind the surcingle (USEF); a seat astride on the pad.
 * 6. A pony takes the new tacks through the shared equid producer, under its own name.
 */
export function test_unit_archetypes_animals_equine_tack(): void {
  const findings: string[] = [];
  const dims = { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 } as const;
  const bare = createHorse({ ...dims, tack: "bare" }, 7);
  const bones: Map<string, IAutoMovieModelPart> = new Map(
    bare.parts.map((p: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
      p.id,
      p,
    ]),
  );
  const contact = (
    horse: ReturnType<typeof createHorse>,
    id: string,
  ): IAutoMovieAffordance | undefined =>
    horse.affordances.find((a: IAutoMovieAffordance): boolean => a.id === id);
  const at = (a: IAutoMovieAffordance): IAutoMovieVector3 =>
    a.frame.translation;

  for (const tack of ["bareback", "sidesaddle", "surcingle"] as const) {
    const horse = createHorse({ ...dims, tack }, 7);

    // 1. The body is untouched.
    for (const [id, part] of bones) {
      const same: IAutoMovieModelPart | undefined = horse.parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === id,
      );
      if (
        same === undefined ||
        JSON.stringify(same.transform) !== JSON.stringify(part.transform) ||
        JSON.stringify(same.geometry) !== JSON.stringify(part.geometry)
      )
        findings.push(`${tack}: the body part ${id} changed`);
    }

    // 2. Mass.
    const added: number = horse.properties.mass - bare.properties.mass;
    const wanted: number = tack === "sidesaddle" ? 10 : 0;
    if (Math.abs(added - wanted) > 1e-9)
      findings.push(`${tack}: adds ${added} kg, wanted ${wanted}`);
  }

  // 3. Bareback.
  const bareback = createHorse({ ...dims, tack: "bareback" }, 7);
  const seat: IAutoMovieAffordance | undefined = contact(bareback, "seat");
  if (seat?.astride !== true || seat.mount !== "left")
    findings.push("bareback: the seat must be sat astride from the near side");
  for (const id of ["leftRein", "rightRein", "lead"])
    if (contact(bareback, id) === undefined)
      findings.push(`bareback: lacks ${id}`);
  for (const id of ["leftStirrup", "rightStirrup", "pommel", "cantle"])
    if (contact(bareback, id) !== undefined)
      findings.push(`bareback: has ${id}`);
  if (
    bareback.parts.some((p: IAutoMovieModelPart): boolean => p.id === "saddle")
  )
    findings.push("bareback: lays a saddle");
  const trunk: IAutoMovieModelPart = bones.get("trunk")!;
  if (seat !== undefined && trunk.geometry.type === "primitive") {
    const shape = trunk.geometry.shape;
    const radius: number =
      shape.type === "capsule" || shape.type === "cylinder"
        ? shape.radius
        : NaN;
    const axis: IAutoMovieVector3 = trunk.transform!.translation;
    const above: number = at(seat).y - axis.y;
    if (!(Math.abs(above - radius) <= 0.01))
      findings.push(
        `bareback: the seat stands ${above.toFixed(3)} m over the trunk's axis, its radius ${radius.toFixed(3)} m`,
      );
  }

  // 4. Side saddle.
  const aside = createHorse({ ...dims, tack: "sidesaddle" }, 7);
  const stirrups: IAutoMovieAffordance[] = aside.affordances.filter(
    (a: IAutoMovieAffordance): boolean => a.kind === "stirrup",
  );
  if (stirrups.length !== 1 || !(at(stirrups[0]!).x > 0))
    findings.push("side saddle: wants exactly one stirrup, on the near side");
  const fixed: IAutoMovieAffordance | undefined = contact(aside, "fixedHead");
  const leaping: IAutoMovieAffordance | undefined = contact(
    aside,
    "leapingHead",
  );
  if (
    fixed === undefined ||
    leaping === undefined ||
    !(
      at(fixed).x >= 0 &&
      at(leaping).x > at(fixed).x &&
      at(leaping).y < at(fixed).y
    )
  )
    findings.push(
      "side saddle: the heads must lie on the near side, the leaping head below and outside the fixed head",
    );
  const sideways: IAutoMovieAffordance | undefined = contact(aside, "seat");
  if (sideways !== undefined) {
    const facing: IAutoMovieVector3 = Vector3.normalize(
      Quaternion.rotateVector(sideways.frame.rotation, { x: 0, y: 0, z: 1 }),
    );
    if (!(facing.x > 0.99) || sideways.astride === true)
      findings.push(
        "side saddle: the seat must face the near side and not be sat astride",
      );
  } else findings.push("side saddle: lacks its seat");

  // 5. Surcingle.
  const vaulting = createHorse({ ...dims, tack: "surcingle" }, 7);
  const handles: IAutoMovieAffordance[] = vaulting.affordances.filter(
    (a: IAutoMovieAffordance): boolean => a.kind === "handle",
  );
  if (
    handles.length !== 2 ||
    !(at(handles[0]!).x * at(handles[1]!).x < 0) ||
    Math.abs(at(handles[0]!).x - at(handles[1]!).x) > 0.24
  )
    findings.push(
      "surcingle: wants two handles at most 240 mm apart, one each side",
    );
  const pad: IAutoMovieModelPart | undefined = vaulting.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "pad",
  );
  const band: IAutoMovieModelPart | undefined = vaulting.parts.find(
    (p: IAutoMovieModelPart): boolean => p.id === "surcingle",
  );
  if (
    pad?.geometry.type === "primitive" &&
    pad.geometry.shape.type === "box" &&
    band?.geometry.type === "primitive" &&
    band.geometry.shape.type === "box"
  ) {
    const size: typeof pad.geometry.shape = pad.geometry.shape;

    // From the surcingle's back edge, as the USEF rule measures it.
    const behind: number =
      band.transform!.translation.z -
      band.geometry.shape.depth / 2 -
      (pad.transform!.translation.z - size.depth / 2);
    if (size.height > 0.03 + 1e-9 || behind > 0.8)
      findings.push(
        `surcingle: the pad is ${size.height} m thick and reaches ${behind.toFixed(3)} m behind`,
      );
  } else findings.push("surcingle: lacks its pad or band");
  if (
    contact(vaulting, "seat")?.astride !== true ||
    contact(vaulting, "pad")?.kind !== "surface"
  )
    findings.push("surcingle: wants a seat astride and a pad surface");

  // 6. A pony takes the new tacks.
  const pony = createPony({ tack: "sidesaddle" }, 7);
  if (contact(pony, "fixedHead") === undefined || pony.name !== "pony")
    findings.push(`pony: side saddle missing or misnamed (${pony.name})`);

  TestValidator.equals("alternative mounted tack", findings, []);
}
