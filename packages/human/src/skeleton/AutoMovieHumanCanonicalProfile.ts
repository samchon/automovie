import {
  AutoMovieEngineDefaultHumanoidRom,
  AutoMovieEngineDefaultJointAxes,
  AutoMovieEngineHumanoidJointAxes,
  AutoMovieEngineHumanoidRestFrame,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEnginePhysicalHull,
  AutoMovieEngineMath,
  AutoMovieEnginePhysics,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieHumanCanonicalSolids,
  IAutoMovieJointAxes,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalJointAxis,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { AutoMovieHumanCanonicalSolids as Solids } from "./AutoMovieHumanCanonicalSolids";
import { AutoMovieHumanJointStrength } from "./internal/AutoMovieHumanJointStrength";

/**
 * The contact and mass profile of a polygon man, built from the same joints and
 * girth radii its drawing is built from, at the canonical T-pose rest.
 *
 * The trunk, neck, head, limbs, palm, rear foot and toe phalanges use convex
 * hulls of the same ring vertices as the drawing. Where proportions change
 * between rings, the convex faces and the loft's triangles can take different
 * diagonals between those vertices. The foot carries the heel and midfoot
 * modules, and the toes pivot at the ball with their phalanx hulls. The hand
 * uses girth-radius capsules for its phalanges so the grasp solver can compute
 * their contact in closed form.
 *
 * A foot can also carry a simulation-only sole box in `contactShapes`.
 * The box gives a planted foot a contact face across the heel and forefoot
 * support points. It has no mass. The motion audits read the skin hulls.
 *
 * Masses are Dempster's shares of body mass as tabulated by Winter
 * (Biomechanics and Motor Control of Human Movement, 4th ed., table 4.1): hand
 * 0.006, forearm 0.016, upper arm 0.028, thigh 0.100, leg 0.0465, foot 0.0145,
 * thorax 0.216, abdomen 0.139, pelvis 0.142 and head with neck 0.081, the head
 * taking de Leva's (1996) 0.0694 and the neck the rest; the hand's share is
 * split over the palm and the phalanges by collider volume, a uniform density
 * within the hand, and the foot's over the rear foot and the toes the same way.
 * Each segment's centre of mass and inertia are those of its colliders as
 * uniform solids, combined by the parallel-axis theorem, the way physics
 * engines derive inertia from shapes. Joints sit at each child joint with
 * identity frames; every clinical axis of `AutoMovieEngineDefaultHumanoidRom` becomes a
 * physical axis along its `AutoMovieEngineHumanoidJointAxes` direction with limits read
 * through `AutoMovieEngineHumanoidRestFrame`, so the physical zero is the T-pose. A drive's
 * strength is the person's peak joint torque where Harbo, Brincks and Andersen
 * (2012) measured the motion, each direction its own
 * (`AutoMovieHumanJointStrength`): hip and knee flexion and extension, ankle
 * dorsi- and plantar flexion, shoulder abduction and adduction, elbow and wrist
 * flexion and extension; the hip's abduction, adduction and rotations take
 * McNabb et al.'s (2024) per-kilogram means instead. The axes neither measured
 * keep an unsourced placeholder, 50 N m per downstream kilogram, still open.
 * Every drive is critically damped on the moment of inertia of the subtree it
 * turns about its axis, kd = 2 sqrt(kp I). The profile excludes contact
 * between adjacent modules and among the palm and digits of one hand. It also
 * excludes each upper arm from the spine, the two thighs from each other,
 * and each thumb metacarpal from its own forearm. These pairs can overlap near
 * their joint roots in the stock pose or during ordinary articulation. The
 * exclusions apply to the named segment pairs throughout the simulation.
 */
export namespace AutoMovieHumanCanonicalProfile {
  /**
   * Build the physical profile for a complete stock joint map at the canonical
   * T-pose. The shape set contains visible-body ring hulls and hand capsules.
   * Admitted foot supports are separate simulation-only contact shapes; they
   * contribute no mass. The profile combines segment inertias and sets joint
   * limits and drives on the canonical rest frames.
   *
   * @param joints Parent-first canonical rest joints, with centres, radii and any
   * heel planes in metres.
   * @param mass Positive body mass in kilograms used to distribute segment masses.
   * @param id Identity carried by the returned profile.
   * @param person Sex, height in metres and mass in kilograms used by the
   * joint-strength model.
   * @returns Segment shapes, mass properties, mechanical joints and explicit
   * self-contact exclusions for the canonical body.
   * @throws If a canonical joint referenced by the profile or a required segment
   * collider is missing.
   */
  export function build(
    joints: ReadonlyMap<string, IAutoMovieHumanCanonicalSolids.IJoint>,
    mass: number,
    id: string,
    person: AutoMovieHumanJointStrength.IPerson,
  ): P {
    const j = (name: string): IAutoMovieHumanCanonicalSolids.IJoint => {
      const found: IAutoMovieHumanCanonicalSolids.IJoint | undefined =
        joints.get(name);
      if (found === undefined)
        throw new Error(`The polygon profile needs the joint ${name}`);
      return found;
    };
    const hulls: ReturnType<typeof AutoMovieEnginePhysicalHull.createShapeFactory> =
      AutoMovieEnginePhysicalHull.createShapeFactory();
    const identity: IAutoMovieQuaternion = hulls.rotation;
    const at = (name: string): IAutoMovieVector3 => j(name).position;
    // A rig bone's origin is its joint; the toes bone sits at the hallux's root.
    const origin = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      at(bone.replace(/Toes$/u, "HalluxProximal"));
    const parts: Map<AutoMovieHumanoidBone, IPart[]> = new Map();
    const put = (bone: AutoMovieHumanoidBone, part: IPart): void => {
      parts.set(bone, [...(parts.get(bone) ?? []), part]);
    };
    for (const solid of Solids.build(joints))
      put(solid.carrier, {
        shape: hulls.shape(
          solid.id,
          "skin",
          hulls.offset(
            (): IAutoMovieVector3 => solid.centre,
            (): IAutoMovieVector3 => origin(solid.carrier),
          ),
          solid.points,
        ),
        volume: solid.volume,
        inertia: solid.inertia,
        inertiaRotation: solid.inertiaRotation,
      });
    // A phalanx between two joints ends in the joints' balls; a distal one
    // ends with its cap on the fingertip.
    const capsule = (
      bone: AutoMovieHumanoidBone,
      from: IAutoMovieVector3,
      end: IAutoMovieVector3,
      radius: number,
      tip: boolean,
    ): void => {
      const span: number = AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(end, from));
      const inward: number = tip ? Math.min(radius, span) : 0;
      const to: IAutoMovieVector3 =
        span > 1e-9
          ? AutoMovieEngineVector3.subtract(
              end,
              AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(end, from), inward / span),
            )
          : end;
      const axis: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(to, from);
      const length: number = AutoMovieEngineVector3.length(axis);
      const rotation: IAutoMovieQuaternion =
        length > 1e-9 ? AutoMovieEngineMath.rotationBetween({ x: 0, y: 1, z: 0 }, axis) : identity;
      const full: number = length + 2 * radius;
      const transverse: number = (3 * radius * radius + full * full) / 12;
      put(bone, {
        shape: {
          id: "body",
          material: "skin",
          transform: {
            position: AutoMovieEngineVector3.subtract(
              AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(from, to), 0.5),
              origin(bone),
            ),
            rotation,
          },
          kind: "capsule",
          radius,
          halfLength: length / 2,
        },
        volume:
          Math.PI * radius * radius * length + (4 / 3) * Math.PI * radius ** 3,
        inertia: { x: transverse, y: (radius * radius) / 2, z: transverse },
        inertiaRotation: rotation,
      });
    };

    const parentOf: Partial<
      Record<AutoMovieHumanoidBone, AutoMovieHumanoidBone>
    > = {
      spine: "hips",
      chest: "spine",
      neck: "chest",
      head: "neck",
    };
    // Each group of rig bones shares one Dempster share by collider volume.
    const groups: { share: number; bones: AutoMovieHumanoidBone[] }[] = [
      { share: 0.142, bones: ["hips"] },
      { share: 0.139, bones: ["spine"] },
      { share: 0.216, bones: ["chest"] },
      { share: 0.081 - 0.0694, bones: ["neck"] },
      { share: 0.0694, bones: ["head"] },
    ];
    const hands: AutoMovieHumanoidBone[][] = [];
    const soles: Map<AutoMovieHumanoidBone, IAutoMoviePhysicalShape> =
      new Map();
    for (const side of ["left", "right"] as const) {
      const b = (name: string): AutoMovieHumanoidBone =>
        `${side}${name}` as AutoMovieHumanoidBone;
      const hand: AutoMovieHumanoidBone[] = [b("Hand")];
      for (const chain of DIGITS)
        chain.forEach((name: string, i: number): void => {
          const joint: IAutoMovieHumanCanonicalSolids.IJoint = j(b(name));
          const next: string | undefined = chain[i + 1];
          capsule(
            b(name),
            joint.position,
            next === undefined ? (joint.tip ?? joint.position) : at(b(next)),
            joint.radius,
            next === undefined && joint.tip !== null,
          );
          parentOf[b(name)] = i === 0 ? b("Hand") : b(chain[i - 1]!);
          hand.push(b(name));
        });
      hands.push(hand);
      parentOf[b("UpperArm")] = "chest";
      parentOf[b("LowerArm")] = b("UpperArm");
      parentOf[b("Hand")] = b("LowerArm");
      parentOf[b("UpperLeg")] = "hips";
      parentOf[b("LowerLeg")] = b("UpperLeg");
      parentOf[b("Foot")] = b("LowerLeg");
      parentOf[b("Toes")] = b("Foot");
      const flexion: IAutoMoviePhysicalJointAxis | undefined = axesOf(
        b("Foot"),
        0,
        person,
        (): number => 0,
      ).find(
        (axis: IAutoMoviePhysicalJointAxis): boolean =>
          axis.channel === `${b("Foot")}.flexion`,
      );
      const sole: IAutoMoviePhysicalShape | undefined =
        flexion === undefined
          ? undefined
          : soleOf(side, parts.get(b("Foot")) ?? [], flexion.axis);
      if (sole !== undefined) soles.set(b("Foot"), sole);
      groups.push(
        { share: 0.028, bones: [b("UpperArm")] },
        { share: 0.016, bones: [b("LowerArm")] },
        { share: 0.006, bones: hand },
        { share: 0.1, bones: [b("UpperLeg")] },
        { share: 0.0465, bones: [b("LowerLeg")] },
        { share: 0.0145, bones: [b("Foot"), b("Toes")] },
      );
    }

    const segments: IAutoMoviePhysicalSegment[] = [];
    for (const group of groups) {
      const members: IPart[][] = group.bones.map(
        (bone: AutoMovieHumanoidBone): IPart[] => {
          const found: IPart[] | undefined = parts.get(bone);
          if (found === undefined)
            throw new Error(`The polygon profile has no collider on ${bone}`);
          return found;
        },
      );
      const density: number =
        (group.share * mass) /
        members
          .flat()
          .reduce((sum: number, part: IPart): number => sum + part.volume, 0);
      group.bones.forEach(
        (bone: AutoMovieHumanoidBone, index: number): void => {
          const whole: IAutoMovieCombinePhysicalMassProperties.IPart =
            AutoMovieEnginePhysics.combineMassProperties(
              members[index]!.map(
                (
                  part: IPart,
                ): IAutoMovieCombinePhysicalMassProperties.IPart => ({
                  mass: density * part.volume,
                  centerOfMass: part.shape.transform.position,
                  inertia: AutoMovieEngineVector3.scale(part.inertia, density * part.volume),
                  inertiaRotation: part.inertiaRotation,
                }),
              ),
            );
          segments.push({
            bone,
            neutral: { position: origin(bone), rotation: identity },
            mass: whole.mass,
            centerOfMass: whole.centerOfMass,
            inertia: whole.inertia,
            inertiaRotation: whole.inertiaRotation,
            shapes: members[index]!.map(
              (part: IPart): IAutoMoviePhysicalShape => part.shape,
            ),
            ...(soles.has(bone) ? { contactShapes: [soles.get(bone)!] } : {}),
          });
        },
      );
    }

    const children = (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone[] =>
      (Object.keys(parentOf) as AutoMovieHumanoidBone[]).filter(
        (c: AutoMovieHumanoidBone): boolean => parentOf[c] === bone,
      );
    const downstream = (bone: AutoMovieHumanoidBone): number =>
      segments.find((s: IAutoMoviePhysicalSegment): boolean => s.bone === bone)!
        .mass +
      children(bone).reduce(
        (sum: number, c: AutoMovieHumanoidBone): number => sum + downstream(c),
        0,
      );
    // The moment of inertia of a joint's subtree about one of its axes through
    // its pivot, at the T-pose the axes are read on: each segment's principal
    // moments projected onto the axis, plus its mass at its centre's distance
    // from the axis (the parallel-axis theorem).
    const inertiaAbout = (
      child: AutoMovieHumanoidBone,
      letter: IAutoMoviePhysicalJointAxis["axis"],
    ): number => {
      const pivot: IAutoMovieVector3 = origin(child);
      const axis: IAutoMovieVector3 = {
        x: letter === "x" ? 1 : 0,
        y: letter === "y" ? 1 : 0,
        z: letter === "z" ? 1 : 0,
      };
      const of = (bone: AutoMovieHumanoidBone): number => {
        const s: IAutoMoviePhysicalSegment = segments.find(
          (candidate: IAutoMoviePhysicalSegment): boolean =>
            candidate.bone === bone,
        )!;
        const principal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
          AutoMovieEngineQuaternion.inverse(
            AutoMovieEngineQuaternion.multiply(s.neutral.rotation, s.inertiaRotation),
          ),
          axis,
        );
        const arm: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
          AutoMovieEngineVector3.add(
            s.neutral.position,
            AutoMovieEngineQuaternion.rotateVector(s.neutral.rotation, s.centerOfMass),
          ),
          pivot,
        );
        const along: number = AutoMovieEngineVector3.dot(arm, axis);
        return (
          s.inertia.x * principal.x * principal.x +
          s.inertia.y * principal.y * principal.y +
          s.inertia.z * principal.z * principal.z +
          s.mass * (AutoMovieEngineVector3.dot(arm, arm) - along * along) +
          children(bone).reduce(
            (sum: number, c: AutoMovieHumanoidBone): number => sum + of(c),
            0,
          )
        );
      };
      return of(child);
    };
    const links: IAutoMoviePhysicalJoint[] = (
      Object.keys(parentOf) as AutoMovieHumanoidBone[]
    ).map((child: AutoMovieHumanoidBone): IAutoMoviePhysicalJoint => {
      const parent: AutoMovieHumanoidBone = parentOf[child]!;
      return {
        id: child,
        parent,
        child,
        parentFrame: {
          position: AutoMovieEngineVector3.subtract(origin(child), origin(parent)),
          rotation: identity,
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
        axes: axesOf(child, 50 * downstream(child), person, (letter) =>
          inertiaAbout(child, letter),
        ),
        ...orderOf(child),
      };
    });
    const total: number = segments.reduce(
      (sum: number, s: IAutoMoviePhysicalSegment): number => sum + s.mass,
      0,
    );
    return {
      id,
      mass: total,
      centerOfMass: segments.reduce(
        (
          sum: IAutoMovieVector3,
          s: IAutoMoviePhysicalSegment,
        ): IAutoMovieVector3 =>
          AutoMovieEngineVector3.add(
            sum,
            AutoMovieEngineVector3.scale(
              AutoMovieEngineVector3.add(s.neutral.position, s.centerOfMass),
              s.mass / total,
            ),
          ),
        { x: 0, y: 0, z: 0 },
      ),
      segments,
      joints: links,
      collisionExclusions: [
        ...links.map(
          (
            jt: IAutoMoviePhysicalJoint,
          ): { a: string; b: string; reason: string } => ({
            a: jt.parent,
            b: jt.child,
            reason: "adjacent polygon modules overlap at their shared joint",
          }),
        ),
        // The shoulder lies inside the chest's girth, so a hanging upper
        // arm's root crosses the ring the chest shares with the abdomen
        // below it, whatever the abduction short of a raised arm.
        ...(["left", "right"] as const).map(
          (
            side: "left" | "right",
          ): { a: string; b: string; reason: string } => ({
            a: "spine",
            b: `${side}UpperArm`,
            reason:
              "the upper arm's root crosses the trunk ring the chest shares with the abdomen at the shoulder",
          }),
        ),
        // The hips sit closer together than a thigh's root is wide, so the
        // two roots cross the midline at any abduction; the shanks still
        // meet each other and the other thigh.
        {
          a: "leftUpperLeg",
          b: "rightUpperLeg",
          reason: "both thigh roots cross the midline between the hip joints",
        },
        // The thumb's carpometacarpal joint sits on the trapezium at the
        // wrist, so the metacarpal's base meets the forearm's distal end
        // across the wrist's flexion, as when a hand opens flat on a bent
        // wrist.
        ...(["left", "right"] as const).map(
          (
            side: "left" | "right",
          ): { a: string; b: string; reason: string } => ({
            a: `${side}LowerArm`,
            b: `${side}ThumbMetacarpal`,
            reason:
              "the thumb's carpometacarpal joint sits at the wrist, so the metacarpal's base meets the forearm's distal end across the wrist's range",
          }),
        ),
        ...hands.flatMap((hand: AutoMovieHumanoidBone[]) =>
          hand.flatMap((a: AutoMovieHumanoidBone, i: number) =>
            hand
              .slice(i + 1)
              .filter(
                (c: AutoMovieHumanoidBone): boolean =>
                  parentOf[c] !== a && parentOf[a] !== c,
              )
              .map(
                (
                  c: AutoMovieHumanoidBone,
                ): { a: string; b: string; reason: string } => ({
                  a,
                  b: c,
                  reason:
                    "the palm and digits of one hand touch at rest; finger contact is the grasp's",
                }),
              ),
          ),
        ),
      ],
      materials: [
        {
          id: "skin",
          friction: 0.7,
          restitution: 0,
          compliance: 0,
          damping: 0,
        },
      ],
      provenance:
        "Polygon-man contact profile: convex hulls of the drawn ring points with capsule phalanges, Dempster segment masses (Winter table 4.1), uniform-solid collider inertia.",
    };
  }
}

/*
 * One collider of a segment with the uniform solid's properties about its own
 * centre.
 */
interface IPart {
  /*
   * The collider, its transform in the segment's frame.
   */
  shape: IAutoMoviePhysicalShape;

  /*
   * Volume, cubic metres.
   */
  volume: number;

  /*
   * Principal moments per unit mass, square metres.
   */
  inertia: IAutoMovieVector3;

  /*
   * Rotation from the principal frame to the segment's frame.
   */
  inertiaRotation: IAutoMovieQuaternion;
}

/*
 * One foot hull vertex in the foot's frame, with the region its hull belongs
 * to.
 */
interface ISoleVertex {
  /*
   * The vertex, metres, in the foot's frame.
   */
  point: IAutoMovieVector3;

  /*
   * Whether it is the heel hull's; the forefoot hull's otherwise.
   */
  heel: boolean;
}

/*
 * The heel and forefoot vertices a sole's bottom face passes through.
 */
interface ISoleTangent {
  heel: IAutoMovieVector3;
  fore: IAutoMovieVector3;
}

/*
 * A foot's simulation-only sole: a thin box whose bottom face is the plane
 * along the ankle's flexion axis that touches the heel hull and the forefoot
 * hull from below, their lower common tangent. It is the plane the standing
 * handoff turns the foot onto the floor about that axis, so the sole lands
 * flat. The box spans heel to ball between the two tangent points and the foot
 * hulls' own medial-lateral extent, and rises to the nearer hull's centroid,
 * inside the drawn foot. Its bottom gives a planted foot a face on the floor
 * where the drawn hulls touch only at a vertex each, so it cannot roll about
 * the line between them.
 * Parameter side: The foot's side.
 * Parameter parts: The foot bone's colliders.
 * Parameter axis: The ankle's flexion axis letter, in the foot's rest frame.
 * Returns: The sole box, or undefined without both a heel and a forefoot hull.
 */
function soleOf(
  side: "left" | "right",
  parts: readonly IPart[],
  axis: "x" | "y" | "z",
): IAutoMoviePhysicalShape | undefined {
  const lateral: IAutoMovieVector3 = {
    x: axis === "x" ? 1 : 0,
    y: axis === "y" ? 1 : 0,
    z: axis === "z" ? 1 : 0,
  };
  const up: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract({ x: 0, y: 1, z: 0 }, AutoMovieEngineVector3.scale(lateral, lateral.y)),
  );
  const forward: IAutoMovieVector3 = AutoMovieEngineVector3.cross(up, lateral);
  const vertices: ISoleVertex[] = [];
  const centroids: IAutoMovieVector3[] = [];
  for (const part of parts) {
    const shape: IAutoMoviePhysicalShape = part.shape;
    const heel: boolean =
      shape.id === `${side}Subtalar` || shape.id.startsWith(`${side}Subtalar.`);
    const fore: boolean =
      shape.id === `${side}Midfoot` || shape.id.startsWith(`${side}Midfoot.`);
    if (shape.kind !== "hull" || (!heel && !fore)) continue;
    const points: IAutoMovieVector3[] = shape.points.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        AutoMovieEnginePhysics.physicalSupportPoint(shape.transform, point),
    );
    for (const point of points) vertices.push({ point, heel });
    centroids.push(
      AutoMovieEngineVector3.scale(
        points.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => AutoMovieEngineVector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / points.length,
      ),
    );
  }
  const heels: ISoleVertex[] = vertices.filter(
    (v: ISoleVertex): boolean => v.heel,
  );
  const fores: ISoleVertex[] = vertices.filter(
    (v: ISoleVertex): boolean => !v.heel,
  );
  if (heels.length === 0 || fores.length === 0) return undefined;
  // The lower common tangent in the sagittal plane: the heel and forefoot
  // vertices whose line every vertex lies on or above.
  function s(p: IAutoMovieVector3): number {
    return AutoMovieEngineVector3.dot(p, forward);
  }
  function h(p: IAutoMovieVector3): number {
    return AutoMovieEngineVector3.dot(p, up);
  }
  let best: ISoleTangent | undefined;
  let span: number = 0;
  for (const a of heels)
    for (const b of fores) {
      const ds: number = s(b.point) - s(a.point);
      const dh: number = h(b.point) - h(a.point);
      const length: number = Math.hypot(ds, dh);
      if (!(length > span)) continue;
      // Each vertex's height above the line, times the line's length; a
      // vertex below it by more than rounding rules the pair out.
      const below: boolean = vertices.some(
        (v: ISoleVertex): boolean =>
          (ds * (h(v.point) - h(a.point)) - dh * (s(v.point) - s(a.point))) *
            Math.sign(ds) <
          -64 * Number.EPSILON * length * length,
      );
      if (below) continue;
      best = { heel: a.point, fore: b.point };
      span = length;
    }
  if (best === undefined) return undefined;
  const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(forward, s(best.fore) - s(best.heel)),
      AutoMovieEngineVector3.scale(up, h(best.fore) - h(best.heel)),
    ),
  );
  let normal: IAutoMovieVector3 = AutoMovieEngineVector3.cross(along, lateral);
  if (AutoMovieEngineVector3.dot(normal, up) < 0) normal = AutoMovieEngineVector3.scale(normal, -1);
  const widths: number[] = vertices.map((v: ISoleVertex): number =>
    AutoMovieEngineVector3.dot(v.point, lateral),
  );
  const low: number = Math.min(...widths);
  const high: number = Math.max(...widths);
  const thickness: number = Math.min(
    ...centroids.map((c: IAutoMovieVector3): number =>
      AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(c, best!.heel), normal),
    ),
  );
  if (!(thickness > 0) || !(high > low)) return undefined;
  const base: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    best.heel,
    AutoMovieEngineVector3.scale(lateral, (low + high) / 2 - AutoMovieEngineVector3.dot(best.heel, lateral)),
  );
  const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    base,
    AutoMovieEngineVector3.add(
      AutoMovieEngineVector3.scale(along, span / 2),
      AutoMovieEngineVector3.scale(normal, thickness / 2),
    ),
  );
  // The box's local Y is the sole's normal and its local X the flexion axis
  // (either way along it: the box is symmetric), so the second turn is about
  // the normal and never a half turn.
  const tilt: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(
    { x: 0, y: 1, z: 0 },
    normal,
  );
  const turned: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(tilt, {
    x: 1,
    y: 0,
    z: 0,
  });
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
    AutoMovieEngineMath.rotationBetween(
      turned,
      AutoMovieEngineVector3.scale(lateral, AutoMovieEngineVector3.dot(turned, lateral) < 0 ? -1 : 1),
    ),
    tilt,
  );
  return {
    id: `${side}Sole`,
    material: "skin",
    kind: "box",
    halfExtents: { x: (high - low) / 2, y: thickness / 2, z: span / 2 },
    transform: { position: centre, rotation },
  };
}

/*
 * The four fingers, by rig name.
 */
const FINGERS: readonly string[] = ["Index", "Middle", "Ring", "Little"];

/*
 * Every digit's phalanx chain from the hand outward, by rig name.
 */
const DIGITS: readonly (readonly string[])[] = [
  ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"],
  ...FINGERS.map((d: string): string[] => [
    `${d}Proximal`,
    `${d}Intermediate`,
    `${d}Distal`,
  ]),
];

/*
 * The joint frame's axis a clinical axis turns about: its dominant rig letter,
 * as `axesOf` reads it.
 */
function letterOf(d: IAutoMovieVector3): IAutoMoviePhysicalJointAxis["axis"] {
  return Math.abs(d.x) >= Math.abs(d.y) && Math.abs(d.x) >= Math.abs(d.z)
    ? "x"
    : Math.abs(d.y) >= Math.abs(d.z)
      ? "y"
      : "z";
}

/*
 * The joint's sequential chart: its three clinical axes' letters in the order
 * the rig composes them (`jointToQuaternion`): flexion, abduction, twist for
 * the declared ISB order, abduction, flexion, twist for a distal twist, and
 * twist, abduction, flexion otherwise. Absent when two clinical axes share a
 * letter, which leaves the independent coordinates.
 */
function orderOf(
  bone: AutoMovieHumanoidBone,
): Pick<IAutoMoviePhysicalJoint, "order"> {
  const axes: IAutoMovieJointAxes =
    AutoMovieEngineHumanoidJointAxes[bone] ?? AutoMovieEngineDefaultJointAxes;
  const flexion: IAutoMoviePhysicalJointAxis["axis"] = letterOf(axes.flexion);
  const abduction: IAutoMoviePhysicalJointAxis["axis"] = letterOf(
    axes.abduction,
  );
  const twist: IAutoMoviePhysicalJointAxis["axis"] = letterOf(axes.twist);
  const order: IAutoMoviePhysicalJointAxis["axis"][] =
    axes.rotationOrder === "flexion-abduction-twist"
      ? [flexion, abduction, twist]
      : axes.twistPlacement === "distal"
        ? [abduction, flexion, twist]
        : [twist, abduction, flexion];
  return new Set(order).size === 3 ? { order } : {};
}

/*
 * The physical axes of one joint from its clinical ranges, read onto the T-pose
 * rig, each drive critically damped on the subtree it turns.
 */
function axesOf(
  bone: AutoMovieHumanoidBone,
  torque: number,
  person: AutoMovieHumanJointStrength.IPerson,
  inertia: (letter: IAutoMoviePhysicalJointAxis["axis"]) => number,
): IAutoMoviePhysicalJointAxis[] {
  const rom = AutoMovieEngineDefaultHumanoidRom[bone];
  const axes: IAutoMovieJointAxes =
    AutoMovieEngineHumanoidJointAxes[bone] ?? AutoMovieEngineDefaultJointAxes;
  const out: IAutoMoviePhysicalJointAxis[] = [];
  for (const clinical of ["flexion", "abduction", "twist"] as const) {
    const range = rom?.[clinical];
    if (range === null || range === undefined) continue;
    const d: IAutoMovieVector3 = axes[clinical];
    const letter: IAutoMoviePhysicalJointAxis["axis"] = letterOf(d);
    if (
      out.some((a: IAutoMoviePhysicalJointAxis): boolean => a.axis === letter)
    )
      continue;
    const sign: number = Math.sign(d[letter]);
    const frame = AutoMovieEngineHumanoidRestFrame[bone]?.[clinical];
    const physical = (c: number): number =>
      (sign * AutoMovieEngineKinematics.toRigAngle(c, frame)! * Math.PI) / 180;
    const ends: number[] = [physical(range.min), physical(range.max)].sort(
      (a: number, b: number): number => a - b,
    );
    const coordinateSign: 1 | -1 = (sign * (frame?.sign ?? 1)) as 1 | -1;
    // A measured motion's peak torque drives toward that end of the axis;
    // the drive's stiffness is their mean (SIMBICON: torque limited to kp;
    // Yin, Loken and van de Panne 2007, Section 7), and its damping the
    // critical one on the subtree's moment of inertia I about the axis,
    // kd = 2 sqrt(kp I), so the joint's second-order response has damping
    // ratio one and tracks without overshoot (Ogata, Modern Control
    // Engineering, Section 5-3).
    const measured = AutoMovieHumanJointStrength.of(person, bone, clinical);
    const up: number = measured
      ? coordinateSign > 0
        ? measured.toMaximum
        : measured.toMinimum
      : torque;
    const down: number = measured
      ? coordinateSign > 0
        ? measured.toMinimum
        : measured.toMaximum
      : torque;
    const stiffness: number = (up + down) / 2;
    out.push({
      axis: letter,
      minimum: Math.max(-Math.PI, ends[0]!),
      maximum: Math.min(Math.PI, ends[1]!),
      stiffness,
      damping: 2 * Math.sqrt(stiffness * inertia(letter)),
      maximumTorque: up,
      ...(down !== up ? { reverseTorque: down } : {}),
      channel: `${bone}.${clinical}`,
      coordinateSign,
    });
  }
  return out;
}
