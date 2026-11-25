import { createHorse, createPony } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The alternative mounted supports keep the horse's body and add only their
 * own contacts: a bareback bridle, an asymmetric side saddle and a vaulting
 * surcingle.
 *
 * Scenarios, each on the same seeded horse:
 * 1. Every tack keeps the untacked horse's bone parts unchanged, by id, transform and geometry.
 * 2. Mass: the bareback bridle and the surcingle add nothing (no maker's weight read); the side saddle adds its press weight of 10 kg (Horse & Hound: "around 22lb (10kg)").
 * 3. Bareback: a seat sat astride and mounted from the near side, the two reins and the lead, and no stirrup, pommel, cantle or saddle part; the seat lies on the trunk's top, within 10 mm of the trunk capsule's surface over its axis.
 * 4. Side saddle: one stirrup on the near side (`+X`) with an open boot passage and an exterior leather run anchored to the saddle; both heads on the near side of or at the spine, the leaping head lower than the fixed head and further out; the seat faces the near side and is not sat astride.
 * 5. Surcingle: exactly two handles, one each side of the spine, at most 240 mm apart (the harmonised FEI rule); a pad no thicker than 3 cm and reaching no more than 80 cm behind the surcingle (USEF); a seat astride on the pad.
 * 6. A pony takes the new tacks through the shared equid producer, under its own name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the six scenarios and their sources.
 * @evidence contracts/development/testing.md#behavioral-verification Builds actual horses under every new tack and reads their parts, masses and contacts; a tack that moves the body, invents a weight, mirrors the side saddle or breaks a published limit fails.
 * @evidence contracts/development/testing.md#independent-expectations The limits are the vaulting rules' and the side saddle's weight the press figure; the body comparison is against the untacked horse of the same seed, not against stored output.
 * @evidence contracts/development/testing.md#distinguishing-cases Near against off side, one stirrup against two, a seat astride against one sat sideways, and the horse against a pony.
 * @evidence contracts/development/testing.md#execution-ownership In-memory archetype construction only; the motion specs own the riders on these tacks.
 */
export function test_archetype_equine_tack(): void {
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
  else stirrupMaterial(aside.shapes(), stirrups[0]!, dims.stirrupDrop - 0.1, findings);
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

/** Check the material tread, opening and leather of the existing side. */
function stirrupMaterial(
  shapes: readonly IAutoMoviePhysicalShape[],
  tread: IAutoMovieAffordance,
  drop: number,
  findings: string[],
): void {
  const material = (id: string): IAutoMoviePhysicalShape | undefined =>
    shapes.find((shape: IAutoMoviePhysicalShape): boolean => shape.id === id);
  const tree: IAutoMoviePhysicalShape | undefined = material("saddle");
  const plate: IAutoMoviePhysicalShape | undefined = material("stirrup-left");
  const bar: IAutoMoviePhysicalShape | undefined = material("stirrup-left-bar");
  const rail: IAutoMoviePhysicalShape | undefined = material(
    "stirrup-left-bearing",
  );
  const crown: IAutoMoviePhysicalShape | undefined = material(
    "stirrup-left-crown",
  );
  const trunk: IAutoMoviePhysicalShape | undefined = material("trunk");
  if (
    tree?.kind !== "box" ||
    plate?.kind !== "box" ||
    bar?.kind !== "capsule" ||
    rail?.kind !== "capsule" ||
    crown?.kind !== "capsule" ||
    trunk?.kind !== "capsule" ||
    tread.width === undefined ||
    tread.depth === undefined
  ) {
    findings.push("side saddle: missing the physical plate, eye, or saddle bar");
    return;
  }
  const zero: IAutoMovieRigidTransform = {
    position: Vector3.create(0, 0, 0),
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const top: IAutoMovieVector3 = tread.frame.translation;
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    tread.frame.rotation,
    { x: 0, y: 1, z: 0 },
  );
  const bottom: number = plate.transform.position.y - plate.halfExtents.y;

  // Allow roundoff through midpoint, transform and the capsule distance.
  const roundoff: number = 128 * Number.EPSILON * tree.transform.position.y;
  const fillisHeight: number = 4.5 * 0.0254;
  if (
    !nclose(top.x, trunk.radius + 0.03, roundoff) ||
    !nclose(top.x, plate.transform.position.x, roundoff) ||
    !nclose(top.z, plate.transform.position.z, roundoff) ||
    !nclose(top.y, plate.transform.position.y + plate.halfExtents.y, roundoff) ||
    !nclose(
      top.y + drop,
      tree.transform.position.y + tree.halfExtents.y,
      roundoff,
    ) ||
    !nclose(Vector3.distance(normal, { x: 0, y: 1, z: 0 }), 0, roundoff) ||
    !nclose(plate.halfExtents.x * 2, tread.width, roundoff) ||
    !nclose(plate.halfExtents.z * 2, tread.depth, roundoff) ||
    !nclose(
      crown.transform.position.y + crown.radius - bottom,
      fillisHeight,
      roundoff,
    ) ||
    physicalShapeSegmentDistance(
      zero,
      tree,
      bar.transform.position,
      bar.transform.position,
    ) > roundoff
  )
    findings.push(
      "side saddle: the plate, Fillis height or bar placement does not match its material",
    );

  // Pass a line through the foot opening at midheight, across the whole tread depth.
  const y: number = (top.y + rail.transform.position.y - rail.radius) / 2;
  const front: IAutoMovieVector3 = { ...top, y, z: top.z + tread.depth / 2 };
  const back: IAutoMovieVector3 = { ...top, y, z: top.z - tread.depth / 2 };
  for (const shape of shapes) {
    const leather: boolean = shape.id.startsWith("leather-left");
    if (
      (leather || shape.id.startsWith("stirrup-left")) &&
      physicalShapeSegmentDistance(zero, shape, front, back) <= 0
    )
      findings.push(`side saddle: ${shape.id} closes the centre of the opening`);
    if (!leather) continue;
    if (shape.kind !== "capsule") {
      findings.push(`side saddle: ${shape.id} is missing its leather solid`);
      continue;
    }
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      shape.transform.rotation,
      { x: 0, y: shape.halfLength, z: 0 },
    );
    if (
      physicalShapeSegmentDistance(
        zero,
        trunk,
        Vector3.subtract(shape.transform.position, half),
        Vector3.add(shape.transform.position, half),
        [shape.radius, shape.radius],
      ) < -roundoff
    )
      findings.push(`side saddle: ${shape.id} goes inside the rendered barrel`);
  }
}
