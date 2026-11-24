import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import type { IAutoMovieXpbdPointImpulse } from "./IAutoMovieXpbdPointImpulse";
import type { IAutoMovieXpbdPointResponse } from "./IAutoMovieXpbdPointResponse";
import type { IAutoMovieXpbdResponder } from "./IAutoMovieXpbdResponder";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { reachesXpbdJointBound } from "./reachesXpbdJointBound";
import { readXpbdJointCoordinate } from "./readXpbdJointCoordinate";
import { readXpbdJointDirections } from "./readXpbdJointDirections";
import { readXpbdJointRelation } from "./readXpbdJointRelation";
import { solveXpbdArticulation } from "./solveXpbdArticulation";
import type { solveXpbdContacts } from "./solveXpbdContacts";

/**
 * The articulated response of the trees a pass's contacts touch to positional
 * impulses (Kokkevis 2004, "Practical physics for articulated characters", Game
 * Developers Conference; Featherstone 2008, section 7.5): a contact's
 * correction on a jointed body moves its whole tree along the joints' free
 * axes, as the joints' impulses carry it, instead of moving the one body off
 * its joints. Each touched tree is built and factored once per position pass at
 * `h = 0` (an instant's impulse: no motor damps it). A correction that would
 * carry a free axis's coordinate onto or past one of its bounds
 * (`reachesXpbdJointBound`) holds that axis as prescribed motion
 * (`IAxis.locked`, Featherstone 2008, section 7.3) and its tree is factored
 * again before the correction is solved again
 * (`IAutoMovieXpbdPointResponse.limit`), so a contact never carries a joint
 * past its limit; an axis once held stays held for the pass. The move is taken
 * in joint space: the root by its change and every other body placed from its
 * parent by the joint transform at the moved coordinates (`place`).
 *
 * @param joints The world's joints, in creation order.
 * @param contacts The pass's contacts; only the trees they touch are prepared.
 * @returns The responder for one position pass.
 */
export function respondXpbdArticulation(
  joints: readonly AutoMovieXpbdJoint[],
  contacts: readonly solveXpbdContacts.IContact[],
): IAutoMovieXpbdResponder {
  const kept: solveXpbdArticulation.IForest =
    solveXpbdArticulation.forest(joints);

  // Each tree a contact touches, prepared once for the pass by its root, and
  // each of its bodies' root.
  const prepared: Map<solveXpbdArticulation.INode, IPrepared | null> =
    new Map();
  const owners: Map<AutoMovieXpbdBody, solveXpbdArticulation.INode> = new Map();
  for (const contact of contacts)
    for (const body of [contact.a.body, contact.b.body]) {
      const node: solveXpbdArticulation.INode | undefined =
        kept.nodes.get(body);
      if (node === undefined || !body.dynamic) continue;
      const top: solveXpbdArticulation.INode = solveXpbdArticulation.root(node);
      if (prepared.has(top)) continue;
      const tree: IPrepared | null = prepare(top);
      prepared.set(top, tree);
      if (tree !== null)
        for (const state of tree.tree.states) owners.set(state.body, top);
    }
  return {
    has: (body: AutoMovieXpbdBody): boolean => {
      const top: solveXpbdArticulation.INode | undefined = owners.get(body);
      return body.dynamic && top !== undefined && prepared.get(top) !== null;
    },
    respond: (
      impulses: readonly IAutoMovieXpbdPointImpulse[],
    ): IAutoMovieXpbdPointResponse | null =>
      respond(prepared, owners, impulses),
  };
}

/** A tree built and factored for one position pass. */
interface IPrepared {
  /** The tree. */
  tree: AutoMovieXpbdArticulation.ITree;

  /** Its edges' joints, in the tree's edge order. */
  joints: AutoMovieXpbdJoint[];

  /** Each of its bodies' state index. */
  index: Map<AutoMovieXpbdBody, number>;

  /** Its factor at `h = 0`, with the axes held so far. */
  factored: AutoMovieXpbdArticulation.IFactor;

  /**
   * Each edge's free coordinates as the pass has moved them
   * (`readXpbdJointCoordinate`); none for an axis with no coordinate of its
   * own.
   */
  coordinates: (number | null)[][];
}

/** A response's velocity changes and joint rates, per unit multiplier. */
interface IMove {
  /** Each state's spatial velocity change. */
  change: number[][];

  /** Each edge's free-axis rate changes. */
  rates: number[][];
}

/** A joint's relation before a move: its relative rotation and anchor gap. */
interface IRelation {
  /** The child's anchor frame relative to the parent's, normalised. */
  relative: IAutoMovieQuaternion;

  /** The child's anchor less the parent's, world, metres. */
  gap: IAutoMovieVector3;
}

/** Build and factor one tree for a position pass; none when singular. */
function prepare(top: solveXpbdArticulation.INode): IPrepared | null {
  const joints: AutoMovieXpbdJoint[] = [];
  const tree: AutoMovieXpbdArticulation.ITree = solveXpbdArticulation.build(
    top,
    joints,
  );
  const factored: AutoMovieXpbdArticulation.IFactor | null =
    AutoMovieXpbdArticulation.factor(tree, 0);
  if (factored === null) return null;
  return {
    tree,
    joints,
    index: new Map(
      tree.states.map(
        (
          state: AutoMovieXpbdArticulation.IState,
          i: number,
        ): [AutoMovieXpbdBody, number] => [state.body, i],
      ),
    ),
    factored,
    coordinates: joints.map((joint: AutoMovieXpbdJoint): (number | null)[] => {
      const relative: IAutoMovieQuaternion = readXpbdJointRelation(joint);
      return joint.joint.axes.map(
        (declared: IAutoMoviePhysicalJointAxis): number | null =>
          readXpbdJointCoordinate(joint.joint, relative, declared),
      );
    }),
  };
}

/**
 * The response of the impulses' trees to the impulses acting together: one
 * propagation per impulse through its tree's factor, summed per tree, and the
 * row's generalised inverse mass read from the sum.
 */
function respond(
  prepared: Map<solveXpbdArticulation.INode, IPrepared | null>,
  owners: ReadonlyMap<AutoMovieXpbdBody, solveXpbdArticulation.INode>,
  impulses: readonly IAutoMovieXpbdPointImpulse[],
): IAutoMovieXpbdPointResponse | null {
  // Each impulse's tree; a body no prepared tree holds has none.
  const tops: solveXpbdArticulation.INode[] = [];
  const ready: IPrepared[] = [];
  for (const impulse of impulses) {
    const top: solveXpbdArticulation.INode | undefined = owners.get(
      impulse.body,
    );
    if (top === undefined) return null;
    const tree: IPrepared | null | undefined = prepared.get(top);
    if (tree === undefined || tree === null) return null;
    tops.push(top);
    ready.push(tree);
  }
  const states: number[] = impulses.map(
    (impulse: IAutoMovieXpbdPointImpulse, i: number): number =>
      ready[i]!.index.get(impulse.body)!,
  );
  const moves: Map<solveXpbdArticulation.INode, IMove> = new Map();
  impulses.forEach((impulse: IAutoMovieXpbdPointImpulse, i: number): void => {
    const response: AutoMovieXpbdArticulation.IResponse =
      AutoMovieXpbdArticulation.propagate(
        ready[i]!.tree,
        ready[i]!.factored,
        false,
        {
          state: states[i]!,
          impulse: AutoMovieXpbdArticulation.spatialImpulse(
            Vector3.subtract(impulse.point, ready[i]!.tree.origin),
            impulse.direction,
          ),
        },
      );
    const sum: IMove | undefined = moves.get(tops[i]!);
    moves.set(
      tops[i]!,
      sum === undefined
        ? { change: response.change, rates: response.rates }
        : {
            change: add(sum.change, response.change),
            rates: add(sum.rates, response.rates),
          },
    );
  });

  // The row's generalised inverse mass: each impulse's direction against the
  // displacement of its point under all of them.
  let weight: number = 0;
  impulses.forEach((impulse: IAutoMovieXpbdPointImpulse, i: number): void => {
    weight += Vector3.dot(
      impulse.direction,
      AutoMovieXpbdArticulation.pointChange(
        moves.get(tops[i]!)!.change[states[i]!]!,
        Vector3.subtract(impulse.point, ready[i]!.tree.origin),
      ),
    );
  });
  return {
    weight,
    limit: (scale: number): boolean => limit(prepared, moves, scale),
    apply: (scale: number): void => {
      for (const [top, move] of moves) advance(prepared.get(top)!, move, scale);
    },
  };
}

/**
 * Hold every free axis a move by a multiplier would carry onto or past one of
 * its bounds and factor its tree again; a tree that turns singular answers none
 * for the rest of the pass. True when any axis was newly held.
 */
function limit(
  prepared: Map<solveXpbdArticulation.INode, IPrepared | null>,
  moves: ReadonlyMap<solveXpbdArticulation.INode, IMove>,
  scale: number,
): boolean {
  let held: boolean = false;
  for (const [top, move] of moves) {
    const tree: IPrepared = prepared.get(top)!;
    let newly: boolean = false;
    tree.tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void =>
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            const q: number | null = tree.coordinates[e]![k]!;
            if (
              axis.locked !== true &&
              q !== null &&
              reachesXpbdJointBound(
                tree.joints[e]!.joint.axes[k]!,
                q + move.rates[e]![k]! * scale,
              )
            ) {
              axis.locked = true;
              newly = true;
            }
          },
        ),
    );
    if (!newly) continue;
    const factored: AutoMovieXpbdArticulation.IFactor | null =
      AutoMovieXpbdArticulation.factor(tree.tree, 0);
    if (factored === null) prepared.set(top, null);
    else tree.factored = factored;
    held = true;
  }
  return held;
}

/**
 * Take one tree's move by a multiplier in joint space: the root by its own
 * change, every other body placed by its joint's model at its new position
 * variables, parents first (Featherstone 2008, chapter 4: a body's pose is its
 * parent's composed with the joint transform `X_J(q)`), and each free
 * coordinate advanced by its rate.
 */
function advance(tree: IPrepared, move: IMove, scale: number): void {
  // The joints' present relations, read before any body moves.
  const before: IRelation[] = tree.joints.map(relate);
  const c: number[] = move.change[0]!;
  const top: AutoMovieXpbdBody = tree.tree.states[0]!.body;
  AutoMovieXpbdMath.displace(
    top,
    Vector3.scale(
      AutoMovieXpbdArticulation.pointChange(
        c,
        Vector3.subtract(top.center, tree.tree.origin),
      ),
      scale,
    ),
    { x: c[0]! * scale, y: c[1]! * scale, z: c[2]! * scale },
  );
  tree.joints.forEach((joint: AutoMovieXpbdJoint, e: number): void =>
    place(
      joint,
      before[e]!,
      move.rates[e]!.map((rate: number): number => rate * scale),
    ),
  );

  // Each free coordinate moves by its rate per unit multiplier.
  tree.coordinates.forEach((row: (number | null)[], e: number): void =>
    row.forEach((q: number | null, k: number): void => {
      if (q !== null) row[k] = q + move.rates[e]![k]! * scale;
    }),
  );
}

/** A joint's relation at the present poses. */
function relate(joint: AutoMovieXpbdJoint): IRelation {
  return {
    relative: readXpbdJointRelation(joint),
    gap: Vector3.subtract(
      anchor(joint.child, joint.childFrame().position),
      anchor(joint.parent, joint.parentFrame().position),
    ),
  };
}

/** A body's world point of a frame position given in its body frame. */
function anchor(
  body: AutoMovieXpbdBody,
  position: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    body.center,
    Quaternion.rotateVector(
      body.orientation,
      Vector3.subtract(position, body.centerOfMass),
    ),
  );
}

/**
 * Place a joint's child from its parent's present pose by the joint's model at
 * its new position variables (Featherstone 2008, chapter 4, the joint transform
 * `X_J(q)`): a chart's free angles moved by their changes and the rest of the
 * relative rotation kept, `compose(q + dq) compose(q)^-1 r`, or, for a joint
 * without a chart, the relative rotation turned by the changes about its
 * frame's axes; the anchor gap is kept as it was.
 */
function place(
  joint: AutoMovieXpbdJoint,
  before: IRelation,
  changes: readonly number[],
): void {
  const child: AutoMovieXpbdBody = joint.child;
  if (!child.dynamic) return;
  const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
    joint.joint.order;
  let relative: IAutoMovieQuaternion;
  if (order !== undefined) {
    const angles: number[] = AutoMoviePhysicalJointChart.nearest(
      joint.joint,
      before.relative,
    );
    const moved: number[] = [...angles];
    joint.joint.axes.forEach(
      (declared: IAutoMoviePhysicalJointAxis, k: number): void => {
        moved[order.indexOf(declared.axis)]! += changes[k]!;
      },
    );
    relative = Quaternion.multiply(
      Quaternion.multiply(
        AutoMoviePhysicalJointChart.compose(order, moved),
        Quaternion.inverse(AutoMoviePhysicalJointChart.compose(order, angles)),
      ),
      before.relative,
    );
  } else {
    const directions: IAutoMovieVector3[] = readXpbdJointDirections(
      joint.joint,
      before.relative,
    );
    let turn: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    changes.forEach((change: number, k: number): void => {
      turn = Vector3.addScaled(turn, directions[k]!, change);
    });
    relative = Quaternion.multiply(
      PhysicalRotationVector.exp(turn),
      before.relative,
    );
  }

  // The child's pose from its parent's through the joint's two frames.
  const pf: IAutoMovieRigidTransform = joint.parentFrame();
  const cf: IAutoMovieRigidTransform = joint.childFrame();
  child.orientation = Quaternion.normalize(
    Quaternion.multiply(
      Quaternion.multiply(
        Quaternion.multiply(joint.parent.orientation, pf.rotation),
        relative,
      ),
      Quaternion.inverse(cf.rotation),
    ),
  );
  child.center = Vector3.subtract(
    Vector3.add(anchor(joint.parent, pf.position), before.gap),
    Quaternion.rotateVector(
      child.orientation,
      Vector3.subtract(cf.position, child.centerOfMass),
    ),
  );
}

/** Two equal-shaped arrays of rows added entry by entry. */
function add(left: number[][], right: number[][]): number[][] {
  return left.map((row: number[], i: number): number[] =>
    row.map((value: number, j: number): number => value + right[i]![j]!),
  );
}
