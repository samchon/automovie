import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { reachesXpbdJointBound } from "./reachesXpbdJointBound";
import { readXpbdJointCoordinate } from "./readXpbdJointCoordinate";
import { readXpbdJointRelation } from "./readXpbdJointRelation";
import { solveXpbdArticulationContacts } from "./solveXpbdArticulationContacts";
import type { solveXpbdContacts } from "./solveXpbdContacts";
import type { solveXpbdSupportCascade } from "./solveXpbdSupportCascade";

/**
 * The joint motors' velocity pass over whole articulations, by the
 * articulated-body algorithm (Featherstone 2008, "Rigid Body Dynamics
 * Algorithms", chapter 7) in its impulse form (`AutoMovieXpbdArticulation`).
 *
 * The world's joints form a forest: a joint is a tree edge when its child is
 * dynamic, has no parent edge yet and lies in another tree than its parent; a
 * kinematic parent is a fixed base. Each edge's motion subspace `S` is the
 * rotation about its anchor along its profile's free axes. A motor on axis `k`
 * is the backward-Euler damper `mu_k = h c_k (s_k - qd_k')` on the axis's
 * relative angular velocity after the pass, which enters the algorithm as the
 * joint-space term `D = S^T I^A S + diag(h c)` with the joint impulse `h c (s -
 * qd)`, so each motor meets the inertia of everything it really moves and every
 * attachment's velocity is kept. A tree pressed onto something that is not
 * dynamic is held at those supports in the same solve
 * (`solveXpbdArticulationContacts`). A motor whose impulse exceeds its cap `tau
 * h` is held at the cap and the tree solved again, at most once more per motor.
 * An axis whose rate after the solve carries its joint out of the joint's
 * admitted set over the substep is locked, its rate prescribed to zero
 * (Featherstone 2008, section 7.3), and the tree solved again the same way, so
 * a limit is held in the velocity pass rather than only restored by the
 * position pass after the prediction has stepped past it.
 */
export namespace solveXpbdArticulation {
  /**
   * Solve every motor-driven tree's motors at once and return the joints
   * outside the forest (closing a loop or with a kinematic child), which the
   * caller solves pair by pair.
   *
   * @param joints The world's joints, in creation order.
   * @param h The substep, seconds.
   * @param contacts The step's contacts, for the trees' supports.
   * @param tasks The root tasks the trees' supports should meet, by root body.
   * @param warm Each tree's warm start for its supports' cascade, by root body;
   *   a tree's entry is created on its first task.
   * @returns The joints outside the forest, in creation order.
   */
  export function motors(
    joints: readonly AutoMovieXpbdJoint[],
    h: number,
    contacts: readonly solveXpbdContacts.IContact[],
    tasks: ReadonlyMap<AutoMovieXpbdBody, AutoMovieXpbdWorld.IRootTask>,
    warm: Map<AutoMovieXpbdBody, solveXpbdSupportCascade.IWarm>,
  ): readonly AutoMovieXpbdJoint[] {
    const kept: IForest = forest(joints);
    for (const node of kept.nodes.values())
      if (node.parent === undefined) {
        const task: AutoMovieXpbdWorld.IRootTask | undefined = tasks.get(
          node.body,
        );
        let start: solveXpbdSupportCascade.IWarm | undefined = warm.get(
          node.body,
        );
        if (task !== undefined && start === undefined) {
          start = { first: [], second: [] };
          warm.set(node.body, start);
        }
        solveTree(node, h, contacts, task, start);
      }
    return kept.loops;
  }

  /**
   * Apply a linear impulse at a point of a body through its whole articulation:
   * the impulse form of the articulated-body algorithm (Featherstone 2008,
   * section 7.5; Mirtich 1996, "Impulse-based dynamic simulation of rigid body
   * systems", chapter 4) gives every body of the body's tree the velocity
   * change that keeps each attachment's anchors together and moves each joint
   * only along its free axes, so a blow on the chest moves the body it is
   * attached to at once, as the joints' impulses carry it, where an impulse on
   * the chest alone sets it moving away from its limbs and leaves the joints'
   * position pass to drag them after it. A body no joint attaches is its own
   * tree, and the change is the rigid body's own.
   *
   * @param joints The world's joints, in creation order.
   * @param body The struck body.
   * @param point The world point the impulse acts at, metres.
   * @param impulse The world linear impulse, newton seconds.
   * @throws {Error} When the struck body's tree has a singular inertia.
   */
  export function impulse(
    joints: readonly AutoMovieXpbdJoint[],
    body: AutoMovieXpbdBody,
    point: IAutoMovieVector3,
    impulse: IAutoMovieVector3,
  ): void {
    if (!body.dynamic) return;
    const kept: IForest = forest(joints);
    const tree: AutoMovieXpbdArticulation.ITree = build(
      root(kept.nodes.get(body) ?? { body, children: [] }),
    );
    // An instant's impulse: no motor's damping acts over it.
    const factored: AutoMovieXpbdArticulation.IFactor | null =
      AutoMovieXpbdArticulation.factor(tree, 0);
    if (factored === null)
      throw new Error("A struck articulation has a singular inertia");
    apply(
      tree,
      AutoMovieXpbdArticulation.propagate(tree, factored, false, {
        state: tree.states.findIndex(
          (state: AutoMovieXpbdArticulation.IState): boolean =>
            state.body === body,
        ),
        impulse: AutoMovieXpbdArticulation.spatialImpulse(
          Vector3.subtract(point, tree.origin),
          impulse,
        ),
      }),
    );
  }

  /**
   * The world's forest: its bodies' nodes and the joints outside it, the
   * model's connectivity (its parent array, Featherstone 2008, section 4.1.2).
   */
  export interface IForest {
    /** Every jointed body's node. */
    nodes: ReadonlyMap<AutoMovieXpbdBody, INode>;

    /** The joints outside the forest, in creation order. */
    loops: readonly AutoMovieXpbdJoint[];
  }

  /**
   * The world's forest: each joint whose child is dynamic, has no parent edge
   * yet and lies in another tree than its parent becomes a tree edge.
   *
   * @param joints The world's joints, in creation order.
   * @returns The forest's nodes and the joints outside it.
   */
  export function forest(joints: readonly AutoMovieXpbdJoint[]): IForest {
    const nodes: Map<AutoMovieXpbdBody, INode> = new Map();
    const loops: AutoMovieXpbdJoint[] = [];
    for (const joint of joints) {
      const child: INode = nodeOf(nodes, joint.child);
      const parent: INode = nodeOf(nodes, joint.parent);
      if (
        !joint.child.dynamic ||
        child.edge !== undefined ||
        root(child) === root(parent)
      ) {
        loops.push(joint);
        continue;
      }
      child.edge = joint;
      child.parent = parent;
      parent.children.push(child);
    }
    return { nodes, loops };
  }

  /** Add a propagation's velocity changes to every dynamic body of its tree. */
  function apply(
    tree: AutoMovieXpbdArticulation.ITree,
    response: AutoMovieXpbdArticulation.IResponse,
  ): void {
    tree.states.forEach(
      (state: AutoMovieXpbdArticulation.IState, i: number): void => {
        const body: AutoMovieXpbdBody = state.body;
        if (!body.dynamic) return;
        const change: number[] = response.change[i]!;
        body.angularVelocity = Vector3.add(body.angularVelocity, {
          x: change[0]!,
          y: change[1]!,
          z: change[2]!,
        });
        body.velocity = Vector3.add(
          body.velocity,
          AutoMovieXpbdArticulation.pointChange(
            change,
            Vector3.subtract(body.center, tree.origin),
          ),
        );
      },
    );
  }

  /** One body of the forest. */
  export interface INode {
    /** The world's body. */
    body: AutoMovieXpbdBody;

    /** The joint to its parent; absent at a root. */
    edge?: AutoMovieXpbdJoint;

    /** Its parent node; absent at a root. */
    parent?: INode;

    /** Its child nodes, in joint creation order. */
    children: INode[];
  }

  /** A node waiting in the depth-first walk with its state's index. */
  interface IVisit {
    node: INode;
    state: number;
  }

  /** The node of a body, created on first use. */
  function nodeOf(
    nodes: Map<AutoMovieXpbdBody, INode>,
    body: AutoMovieXpbdBody,
  ): INode {
    let found: INode | undefined = nodes.get(body);
    if (found === undefined) {
      found = { body, children: [] };
      nodes.set(body, found);
    }
    return found;
  }

  /** The node's root. */
  export function root(node: INode): INode {
    let top: INode = node;
    while (top.parent !== undefined) top = top.parent;
    return top;
  }

  /** Solve one tree's motors, from its root. */
  function solveTree(
    top: INode,
    h: number,
    contacts: readonly solveXpbdContacts.IContact[],
    task: AutoMovieXpbdWorld.IRootTask | undefined,
    warm: solveXpbdSupportCascade.IWarm | undefined,
  ): void {
    const joints: AutoMovieXpbdJoint[] = [];
    const tree: AutoMovieXpbdArticulation.ITree = build(top, joints);
    if (
      !tree.edges.some((edge: AutoMovieXpbdArticulation.IEdge): boolean =>
        edge.axes.some(
          (axis: AutoMovieXpbdArticulation.IAxis): boolean =>
            axis.motor !== undefined,
        ),
      )
    )
      return;
    let held: solveXpbdArticulationContacts.IHeld;
    let factored: AutoMovieXpbdArticulation.IFactor | null;
    do {
      factored = AutoMovieXpbdArticulation.factor(tree, h);
      if (factored === null) return;
      held = solveXpbdArticulationContacts.solve(
        tree,
        factored,
        AutoMovieXpbdArticulation.propagate(tree, factored, true),
        contacts,
        h,
        task,
        warm,
      );
    } while (
      clamp(tree, factored, held.response, h) ||
      lock(tree, joints, held.response, h)
    );
    solveXpbdArticulationContacts.commit(held);
    apply(tree, held.response);
  }

  /**
   * A tree's states and edges, depth-first from its root so every edge follows
   * its parent's.
   */
  export function build(
    top: INode,
    joints?: AutoMovieXpbdJoint[],
  ): AutoMovieXpbdArticulation.ITree {
    const origin: IAutoMovieVector3 = top.body.center;
    const tree: AutoMovieXpbdArticulation.ITree = {
      origin,
      free: top.body.dynamic,
      states: [state(top.body, origin)],
      edges: [],
    };
    const stack: IVisit[] = [{ node: top, state: 0 }];
    while (stack.length !== 0) {
      const visit: IVisit = stack.pop()!;
      for (const next of visit.node.children) {
        const child: number = tree.states.length;
        tree.states.push(state(next.body, origin));
        tree.edges.push({
          parent: visit.state,
          child,
          axes: axes(next.edge!, origin),
        });
        joints?.push(next.edge!);
        stack.push({ node: next, state: child });
      }
    }
    return tree;
  }

  /** A body's state with its own spatial inertia about the origin. */
  function state(
    body: AutoMovieXpbdBody,
    origin: IAutoMovieVector3,
  ): AutoMovieXpbdArticulation.IState {
    return {
      body,
      own: AutoMovieXpbdArticulation.spatialInertia(body, origin),
    };
  }

  /** An edge's free axes: columns, motors and present relative velocities. */
  function axes(
    joint: AutoMovieXpbdJoint,
    origin: IAutoMovieVector3,
  ): AutoMovieXpbdArticulation.IAxis[] {
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      joint.parent.orientation,
      joint.parentFrame().rotation,
    );
    const anchor: IAutoMovieVector3 = Vector3.subtract(
      Vector3.add(
        joint.child.center,
        Quaternion.rotateVector(
          joint.child.orientation,
          Vector3.subtract(
            joint.childFrame().position,
            joint.child.centerOfMass,
          ),
        ),
      ),
      origin,
    );
    const relative: IAutoMovieVector3 = Vector3.subtract(
      joint.child.angularVelocity,
      joint.parent.angularVelocity,
    );
    // A sequential chart moves each axis with the rotations composed before
    // it, so the motion subspace is the chart's axes at the joint's present
    // configuration (`AutoMoviePhysicalJointChart.directions`).
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
      joint.joint.order;
    const chart: IAutoMovieVector3[] | undefined =
      order === undefined
        ? undefined
        : AutoMoviePhysicalJointChart.directions(
            order,
            AutoMoviePhysicalJointChart.nearest(
              joint.joint,
              Quaternion.multiply(
                Quaternion.inverse(frame),
                Quaternion.multiply(
                  joint.child.orientation,
                  joint.childFrame().rotation,
                ),
              ),
            ),
          );
    return joint.joint.axes.map(
      (
        declared: IAutoMoviePhysicalJointAxis,
      ): AutoMovieXpbdArticulation.IAxis => {
        const e: IAutoMovieVector3 = Quaternion.rotateVector(
          frame,
          chart === undefined
            ? UNIT[declared.axis]!
            : chart[order!.indexOf(declared.axis)]!,
        );
        const moment: IAutoMovieVector3 = Vector3.cross(anchor, e);
        const motor: AutoMovieXpbdJoint.IMotor | undefined = joint.motors.get(
          declared.axis,
        );
        const axis: AutoMovieXpbdArticulation.IAxis = {
          column: [e.x, e.y, e.z, moment.x, moment.y, moment.z],
          present: Vector3.dot(relative, e),
        };
        if (motor !== undefined && motor.damping > 0 && motor.maximumTorque > 0)
          axis.motor = motor;
        return axis;
      },
    );
  }

  /**
   * Hold every free motor whose impulse `b - h c qd'` exceeds its cap on that
   * impulse's direction at the cap; true when any was newly held.
   */
  function clamp(
    tree: AutoMovieXpbdArticulation.ITree,
    factored: AutoMovieXpbdArticulation.IFactor,
    response: AutoMovieXpbdArticulation.IResponse,
    h: number,
  ): boolean {
    let clamped: boolean = false;
    tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
        const f: AutoMovieXpbdArticulation.IEdgeFactor = factored.edges[e]!;
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (
              axis.motor === undefined ||
              axis.fixed !== undefined ||
              axis.locked === true
            )
              return;
            const mu: number =
              f.impulse[k]! - f.damping[k]! * response.rates[e]![k]!;
            const cap: number = AutoMovieXpbdJoint.cap(axis.motor, mu, h);
            if (Math.abs(mu) > cap) {
              axis.fixed = Math.sign(mu) * cap;
              clamped = true;
            }
          },
        );
      },
    );
    return clamped;
  }

  /**
   * Lock every free axis whose rate after the solve carries its coordinate onto
   * or past one of its bounds over the substep (`reachesXpbdJointBound`), so an
   * axis moving outward at its limit is held at zero rate (prescribed motion,
   * Featherstone 2008, section 7.3; a joint limit enforced once the joint
   * reaches it moving outward, Kokkevis 2004, "Practical physics for
   * articulated characters", Game Developers Conference) and the tree solved
   * again, at most once more per newly locked axis (the caps' loop). True when
   * any axis was newly locked.
   */
  function lock(
    tree: AutoMovieXpbdArticulation.ITree,
    joints: readonly AutoMovieXpbdJoint[],
    response: AutoMovieXpbdArticulation.IResponse,
    h: number,
  ): boolean {
    let locked: boolean = false;
    tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
        const joint: AutoMovieXpbdJoint = joints[e]!;
        const relative: IAutoMovieQuaternion = readXpbdJointRelation(joint);
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (axis.locked === true || axis.fixed !== undefined) return;
            const declared: IAutoMoviePhysicalJointAxis = joint.joint.axes[k]!;
            const q: number | null = readXpbdJointCoordinate(
              joint.joint,
              relative,
              declared,
            );
            const rate: number = axis.present + response.rates[e]![k]!;
            if (q !== null && reachesXpbdJointBound(declared, q + rate * h)) {
              axis.locked = true;
              locked = true;
            }
          },
        );
      },
    );
    return locked;
  }

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
