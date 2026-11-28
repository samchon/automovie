import { AutoMovieArchetypeDrinkware } from "@automovie/archetypes";
import { AutoMovieEngineVector3 } from "@automovie/engine";
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import type {
  IAutoMovieComposition,
  IAutoMovieHumanParameters,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieSceneCollision,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBody,
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanHandover,
  AutoMovieMotionHumanMutual,
  AutoMovieMotionHumanObject,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieRenderHumanPolygon,
  AutoMovieRenderInspectionPath,
  AutoMovieRenderSceneLayout,
  AutoMovieRenderSceneResource,
} from "@automovie/render";
import * as THREE from "three";

import type { IFilm } from "../../IFilm";
import type { IFilmProduction } from "../../IFilmProduction";
import bodyFixture from "./installedPassageBody.json" with { type: "json" };

type Outcome = "transfer" | "withdraw" | "missing-receiver" | "unready-layout";

const SUBJECT = "mug";
const DURATION = 5;
const FPS = 12;
const WIDTH = 720;
const HEIGHT = 432;
const GRIP_PAD_OVERLAP = 0.004;

/**
 * Mount the ordinary mug exchange with the same stock source for its passage,
 * hold and complete cut. The receiver raises an open hand before taking the
 * handle. Select a withdrawn offer or an omitted receiver to exercise the
 * declared alternative and a genuine refusal. The independent layout variant
 * asks for an unbound nonparticipating actor. Render observes exterior contacts
 * for each segmented body. The Motion verdict still owns each body's internal
 * motion and clearance.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Drives both polygon bodies and the archetype from the resolved pickup and handover, with one stock receiver hold after transfer. Each body owns its emitted parts and supplies the independent Motion verdict. The giver's named pads may touch the mug body within the pickup, carry and release windows. The receiver's palm may touch the separate handle near closure and while holding it. These exact pairs admit up to 4 mm of local pad contact. Other pairs retain the ordinary collision gate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Construction builds one performance and one scene per mount, indexing the emitted collision ownership and the two performers' contact windows once. Each seek places two prepared bodies, one prop and their retained camera. The host owns the drawing handles and resources until disposal.
 */
export function installedPassageFilm(
  outcome: Outcome = "transfer",
  occluded: boolean = false,
): IFilm {
  return {
    durationSeconds: DURATION,
    fps: FPS,
    width: WIDTH,
    height: HEIGHT,
    create: async (): Promise<IFilmProduction> => {
      const { canonical, mug, performance } = stage(outcome);
      if (performance.duration > DURATION)
        throw new Error("The authored continuation exceeds the film clock");
      const giver = performance.segments("giver");
      const pickup = giver.find((part) => part.id === "pickUp");
      const offer = giver.find((part) => part.id === "offer.giver");
      const grip = pickup?.plan.holds?.find(
        (hold) => hold.prop === SUBJECT && hold.side === "right",
      );
      if (pickup === undefined || offer === undefined || grip === undefined)
        throw new Error("The giver's pickup and offer do not own the mug");
      const scene: THREE.Scene = new THREE.Scene();
      scene.background = new THREE.Color(0x363f4c);
      const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
        28,
        WIDTH / HEIGHT,
        0.1,
        12,
      );
      camera.position.set(3.28, 1.82, 1.12);
      camera.lookAt(0, 1, 0.58);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x554020, 2.8));

      const mirror: THREE.Matrix4 = new THREE.Matrix4().fromArray(
        AutoMovieHumanCanonicalBody.REFLECTION,
      );
      const figures = performance.performers.map((performer) => {
        const drawing: AutoMovieRenderHumanPolygon.IDrawing =
          AutoMovieRenderHumanPolygon.build(
            AutoMovieHumanCanonicalBody.display(
              canonical,
              performance.pose(performer.subject, 0),
            ),
          );
        const figure: THREE.Group = new THREE.Group();
        figure.name = performer.subject;
        figure.matrixAutoUpdate = false;
        figure.matrix.copy(mirror);
        figure.add(drawing.object);
        scene.add(figure);
        return { subject: performer.subject, drawing };
      });
      const mugDrawing = AutoMovieRenderSceneLayout.buildModel(mug);
      const prop: THREE.Object3D = mugDrawing.object;
      const floor = new THREE.Mesh(
        new THREE.BoxGeometry(4, 0.1, 4),
        new THREE.MeshStandardMaterial({ color: 0x9d8e77 }),
      );
      const initial: IAutoMovieRigidTransform = performance.prop(SUBJECT, 0);
      const standHeight: number = initial.position.y - 0.00015;
      const stand = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, standHeight, 0.024),
        new THREE.MeshStandardMaterial({ color: 0x4b5962 }),
      );
      floor.position.set(0, -0.05, 0);
      stand.name = "mug stand";
      stand.position.set(
        initial.position.x,
        standHeight / 2,
        initial.position.z,
      );
      scene.add(floor, stand, prop);
      const ownership: Map<
        THREE.Object3D,
        Omit<IAutoMovieSceneCollision.IPart, "geometry">
      > = new Map();
      const contact: IAutoMovieSceneCollision.IAllowance[] = [];
      const mugBody: string = AutoMovieRenderInspectionPath.entityPathOf({
        root: scene,
        object: mugDrawing.parts.get("body")!,
      });
      const mugHandle: string = AutoMovieRenderInspectionPath.entityPathOf({
        root: scene,
        object: mugDrawing.parts.get("handle")!,
      });
      const giverClose = pickup.start + grip.from * pickup.plan.duration;
      const release = offer.plan.events?.find(
        (event) => event.name === "release",
      );
      if (release === undefined)
        throw new Error("The giver has no played release event");
      const giverRelease = offer.start + release.share * offer.plan.duration;
      const receiverClose =
        outcome === "transfer"
          ? receivingInterval(performance).grip
          : undefined;
      for (const { subject, drawing } of figures) {
        const group: IAutoMovieSceneCollision.IGroup = {
          id: subject,
          kind: "deformable-body",
        };
        for (const [bone, mesh] of drawing.parts) {
          const id: string = AutoMovieRenderInspectionPath.entityPathOf({
            root: scene,
            object: mesh,
          });
          ownership.set(mesh, { id, group });
          if (subject === "giver") {
            if (bone === "rightThumbDistal" || bone === "rightRingIntermediate")
              contact.push({
                first: id,
                second: mugBody,
                startSeconds: giverClose - 0.08,
                endSeconds: giverClose,
                maxPenetration: GRIP_PAD_OVERLAP,
              });
            if (
              bone === "rightHand" ||
              bone === "rightLittleDistal" ||
              bone === "rightMiddleDistal" ||
              bone === "rightRingIntermediate" ||
              bone === "rightThumbProximal" ||
              bone === "rightRingDistal" ||
              bone === "rightMiddleIntermediate" ||
              bone === "rightIndexDistal"
            )
              contact.push({
                first: id,
                second: mugBody,
                startSeconds: giverClose,
                endSeconds: giverRelease + 0.2,
                maxPenetration: GRIP_PAD_OVERLAP,
              });
          }
          if (subject === "receiver" && receiverClose !== undefined) {
            if (bone === "rightHand")
              contact.push({
                first: id,
                second: mugHandle,
                startSeconds: receiverClose - 1 / FPS,
                endSeconds: DURATION,
                maxPenetration: GRIP_PAD_OVERLAP,
              });
          }
        }
      }
      if (occluded) {
        const { grip } = receivingInterval(performance);
        const site: IAutoMovieRigidTransform | undefined = performance.site(
          SUBJECT,
          "handle",
          grip,
        );
        if (site === undefined)
          throw new Error("Cannot place the screen across an unavailable grip");
        const screen = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.55, 0.22),
          new THREE.MeshStandardMaterial({ color: 0x4b5962 }),
        );
        const goal: THREE.Vector3 = new THREE.Vector3(
          site.position.x,
          site.position.y,
          site.position.z,
        );
        screen.position.lerpVectors(goal, camera.position, 0.3);
        scene.add(screen);
      }
      const paths = Object.fromEntries(
        figures.map(({ subject, drawing }) => [
          subject,
          AutoMovieRenderInspectionPath.entityPathOf({
            root: scene,
            object: drawing.object.parent!,
          }),
        ]),
      );
      return {
        scene,
        camera,
        humanPerformance: () => ({ performance, paths }),
        inspectionLayers: ({ time }) => [
          {
            id: "mug-exchange",
            root: scene,
            localSeconds: time.filmSeconds,
            ownership,
            allowances: contact,
          },
        ],
        seek: (seconds: number): void => {
          for (const { subject, drawing } of figures)
            drawing.setPose(
              AutoMovieHumanCanonicalBody.display(
                canonical,
                performance.pose(subject, seconds),
              ),
            );
          const { position, rotation } = performance.prop(SUBJECT, seconds);
          prop.position.set(position.x, position.y, position.z);
          prop.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
          scene.updateMatrixWorld(true);
        },
        dispose: (): void => {
          for (const { drawing } of figures) {
            drawing.object.removeFromParent();
            drawing.dispose();
          }
          for (const resource of AutoMovieRenderSceneResource.collectOwnedResources(
            scene,
          ))
            resource.dispose();
          scene.clear();
        },
      };
    },
  };
}

/**
 * Measure the wrist-to-grip gaps across a played right-hand exchange in metres.
 * Require the receiver's played grip and the continued hold. An absent
 * recipient, withdrawn offer or truncated grip produces no value.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Admits the resolved right-hand grip within its played segment. Reads the giver's right wrist and the mug body before the grip, then the receiving wrist and neck on both sides of the following hold. A missing actor, grip or sample throws before a favorable value is possible.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolves one performance and searches one recipient's segment list. Each native sample reads the selected wrist and prop site. The check retains no runtime or handle.
 */
export function measureInstalledPassage(outcome: Outcome = "transfer"): number {
  const { performance } = stage(outcome);
  const { grip, before, after } = receivingInterval(performance);
  const lastGiverFrame: number = (Math.ceil(grip * FPS) - 1) / FPS;
  return Math.max(
    wristGap(performance, "giver", "body", lastGiverFrame),
    wristGap(performance, "receiver", "handle", before),
    wristGap(performance, "receiver", "handle", after),
  );
}

/**
 * Measure the giver's right wrist to mug body gap after a withdrawn offer.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Resolves the stock alternate outcome. Checks that the recipient's performed action leaves the hand empty before reading the original giver and grip at the finished performance time.
 * @evidence contracts/development/implementation.md#efficient-algorithms Resolves one performance, finds the receiving action, and reads one wrist and one prop site at the end. The check retains no runtime or handle.
 */
export function measureInstalledWithdrawal(): number {
  const { performance } = stage("withdraw");
  const recipient: IAutoMovieMotionHumanSegment | undefined = performance
    .segments("receiver")
    .find((segment) => segment.id === "offer.receiver");
  if (
    recipient === undefined ||
    recipient.plan.holds?.some((hold) => hold.prop === SUBJECT)
  )
    throw new Error("The withdrawn offer must leave the receiver's hand empty");
  return wristGap(performance, "giver", "body", performance.duration);
}

/* Select the played right-hand grip and native samples at the following join. */
function receivingInterval(performance: AutoMovieMotionHumanPerformance): {
  grip: number;
  before: number;
  after: number;
} {
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("receiver");
  const index: number = segments.findIndex(
    (segment) => segment.id === "offer.receiver",
  );
  const recipient: IAutoMovieMotionHumanSegment | undefined = segments[index];
  const contact = recipient?.plan.contacts?.find(
    (window) =>
      window.part === "rightHand" &&
      window.kind === "grip" &&
      window.support.kind === "prop" &&
      window.support.subject === SUBJECT,
  );
  const hold = recipient?.plan.holds?.find(
    (candidate) => candidate.side === "right" && candidate.prop === SUBJECT,
  );
  if (recipient === undefined || contact === undefined || hold === undefined)
    throw new Error("No played receiving right-hand grip on the mug");
  const grip: number = recipient.start + contact.from * recipient.plan.duration;
  if (grip <= 0 || grip < recipient.entryTime || grip >= recipient.end)
    throw new Error(
      "The receiving right-hand grip lies outside the played action",
    );
  const continuation: IAutoMovieMotionHumanSegment | undefined =
    segments[index + 1];
  if (continuation?.id !== "result")
    throw new Error("No adjacent receiver hold after the transfer");
  const afterFrame: number = Math.floor(continuation.entryTime * FPS) + 1;
  const before: number = (afterFrame - 1) / FPS;
  const after: number = afterFrame / FPS;
  if (grip > before || after >= continuation.end)
    throw new Error(
      "The receiving grip and its continuation lack native witness frames",
    );
  return { grip, before, after };
}

/* Compare the exact right wrist and the held model's named affordance. */
function wristGap(
  performance: AutoMovieMotionHumanPerformance,
  actor: string,
  handle: string,
  seconds: number,
): number {
  const wrist: IAutoMovieVector3 | undefined = performance
    .bones(actor, seconds)
    .get("rightHand")?.worldPosition;
  const gripPoint: IAutoMovieVector3 | undefined = performance.site(
    SUBJECT,
    handle,
    seconds,
  )?.position;
  if (wrist === undefined || gripPoint === undefined)
    throw new Error("The receiving hand or the mug grip cannot be observed");
  return AutoMovieEngineVector3.distance(wrist, gripPoint);
}

/* Stage one continuous exchange and hold on the authored source clock. */
function stage(outcome: Outcome) {
  const canonical = AutoMovieHumanCanonicalBody.prepare(
    bodyFixture.params as IAutoMovieHumanParameters,
    { id: "passage-body", mass: bodyFixture.mass },
  );
  const body = AutoMovieMotionHumanBody.create(
    canonical.skeleton,
    canonical.profile,
  );
  const mug = AutoMovieArchetypeDrinkware.create({
    id: SUBJECT,
    kind: "mug",
  });
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const spacing: number =
    AutoMovieMotionHumanHandover.handshake.gap(body, body) +
    2 * AutoMovieMotionHumanHandover.handshake.stance(body).sternum;
  const people: IAutoMovieMotionHumanPerformer[] = [
    {
      subject: "giver",
      at: { x: 0, y: 0, z: 0 },
      yaw: 0,
      body,
      proficiency: { level: "trained" },
    },
    {
      subject: "receiver",
      at: { x: 0.16, y: 0, z: spacing },
      yaw: 165,
      body,
      proficiency: { level: "trained" },
    },
  ];
  const prop = AutoMovieMotionHumanObject.prop(SUBJECT, mug, {
    at: { x: shoulder.x, y: body.measure.hipHeight + 0.12, z: 0.36 },
    yaw: 0,
  });
  const exchange = AutoMovieMotionHumanChain.mutual(
    AutoMovieMotionHumanMutual.handOver,
    {
      giver: AutoMovieMotionHumanChain.subject("giver")
        .stand({ hold: 0.3, sway: 0 })
        .act("pickUp", { prop: SUBJECT, handle: "body", hand: "right" }),
      receiver: AutoMovieMotionHumanChain.subject("receiver")
        .gesture({ kind: "stopPalm", hand: "right", hold: 0.12 }, "ready")
        .until({ type: "event", event: "retract" }),
    },
    {
      prop: SUBJECT,
      handle: "handle",
      hand: "right",
      receiverHand: "right",
      outcome: outcome === "withdraw" ? "withdraw" : "transfer",
    },
    "offer",
  );
  const passage: IAutoMovieComposition = {
    type: "sequence",
    parts: [
      exchange.node,
      AutoMovieMotionHumanChain.subject("receiver").stand(
        { hold: 0.6, sway: 0 },
        "result",
      ).node,
    ],
  };
  const performance = new AutoMovieMotionHumanPerformance({
    seed: "ordinary-bottle-passage",
    performers: outcome === "missing-receiver" ? people.slice(0, 1) : people,
    props: [prop],
    composition:
      outcome === "unready-layout"
        ? {
            type: "parallel",
            parts: [
              AutoMovieMotionHumanChain.subject("layout-extra").stand({
                hold: 0.4,
              }).node,
              passage,
            ],
          }
        : passage,
  });
  return { canonical, mug, performance };
}
