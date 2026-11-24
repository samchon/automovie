import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { AutoMoviePhysicalJointChart } from "./AutoMoviePhysicalJointChart";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieXpbdJoint } from "./AutoMovieXpbdJoint";
import { AutoMovieXpbdMath } from "./AutoMovieXpbdMath";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
import { projectPhysicalJointRotation } from "./projectPhysicalJointRotation";
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
  function root(node: INode): INode {
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
  function build(
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
   * Hold every free motor whose impulse `b - h c qd'` exceeds its cap at the
   * cap; true when any was newly held.
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
            const cap: number = axis.motor.maximumTorque * h;
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
   * Lock every free axis whose rate after the solve carries its joint out of
   * its admitted set over the substep: the joint's relative rotation turned
   * about the axis by the rate times `h` is projected back by the joint's own
   * admission (`projectPhysicalJointRotation`: box, chart or swing-twist gate),
   * so an axis on its limit and moving outward is held at zero rate (a joint
   * limit enforced as a constraint once the joint reaches it moving outward,
   * Kokkevis 2004, "Practical physics for articulated characters", Game
   * Developers Conference; prescribed motion, Featherstone 2008, section 7.3)
   * and the tree solved again, at most once more per newly locked axis (the
   * caps' loop). The turn the projection removes counts when it exceeds the
   * joints' tolerance (`ROM_TOLERANCE`), the resolution to which a solver need
   * resolve a joint's angle. True when any axis was newly locked.
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
        const frame: IAutoMovieQuaternion = Quaternion.multiply(
          joint.parent.orientation,
          joint.parentFrame().rotation,
        );
        const relative: IAutoMovieQuaternion = Quaternion.multiply(
          Quaternion.inverse(frame),
          Quaternion.multiply(
            joint.child.orientation,
            joint.childFrame().rotation,
          ),
        );
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (axis.locked === true || axis.fixed !== undefined) return;
            const rate: number = axis.present + response.rates[e]![k]!;
            if (removed(joint, frame, relative, axis, rate * h) > TOLERANCE) {
              axis.locked = true;
              locked = true;
            }
          },
        );
      },
    );
    return locked;
  }

  /**
   * How much of a turn about an axis the joint's admission removes: the joint's
   * relative rotation turned about the axis by `angle` and projected back
   * (`projectPhysicalJointRotation`: box, chart or swing-twist gate).
   */
  function removed(
    joint: AutoMovieXpbdJoint,
    frame: IAutoMovieQuaternion,
    relative: IAutoMovieQuaternion,
    axis: AutoMovieXpbdArticulation.IAxis,
    angle: number,
  ): number {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(frame),
      { x: axis.column[0]!, y: axis.column[1]!, z: axis.column[2]! },
    );
    const stepped: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        PhysicalRotationVector.exp(Vector3.scale(local, angle)),
        relative,
      ),
    );
    return Vector3.length(
      PhysicalRotationVector.log(
        Quaternion.multiply(
          projectPhysicalJointRotation(joint.joint, stepped),
          Quaternion.inverse(stepped),
        ),
      ),
    );
  }

  /**
   * The articulated response of the trees a pass's contacts touch to positional
   * impulses (Kokkevis 2004, "Practical physics for articulated characters",
   * Game Developers Conference; Featherstone 2008, section 7.5): a contact's
   * correction on a jointed body moves its whole tree along the joints' free
   * axes, as the joints' impulses carry it, instead of moving the one body off
   * its joints. Each touched tree is built and factored once per position pass
   * at `h = 0` (an instant's impulse: no motor damps it), with every axis that
   * stands on or past one of its bounds held as prescribed motion
   * (`IAxis.locked`, Featherstone 2008, section 7.3), so the response never
   * carries a joint further past its limit. The axes held are those whose limit
   * rows Bullet makes active (`onBound`).
   *
   * @param joints The world's joints, in creation order.
   * @param contacts The pass's contacts; only the trees they touch are
   *   prepared.
   * @returns The responder for one position pass.
   */
  export function responder(
    joints: readonly AutoMovieXpbdJoint[],
    contacts: readonly solveXpbdContacts.IContact[],
  ): IResponder {
    const kept: IForest = forest(joints);
    const prepared: Map<INode, IPrepared | null> = new Map();
    for (const contact of contacts)
      for (const body of [contact.a.body, contact.b.body]) {
        const node: INode | undefined = kept.nodes.get(body);
        if (node === undefined || !body.dynamic) continue;
        const top: INode = root(node);
        if (!prepared.has(top)) prepared.set(top, prepare(top));
      }
    const respond = (
      impulses: readonly IPointImpulse[],
    ): IPointResponse | null => {
      // Each impulse's tree; a body no prepared tree holds has none.
      const tops: INode[] = [];
      const ready: IPrepared[] = [];
      for (const impulse of impulses) {
        const node: INode | undefined = kept.nodes.get(impulse.body);
        if (node === undefined) return null;
        const top: INode = root(node);
        const tree: IPrepared | null | undefined = prepared.get(top);
        if (tree === undefined || tree === null) return null;
        tops.push(top);
        ready.push(tree);
      }
      const states: number[] = impulses.map(
        (impulse: IPointImpulse, i: number): number =>
          ready[i]!.tree.states.findIndex(
            (s: AutoMovieXpbdArticulation.IState): boolean =>
              s.body === impulse.body,
          ),
      );
      const changes: Map<INode, number[][]> = new Map();
      impulses.forEach((impulse: IPointImpulse, i: number): void => {
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
        const sum: number[][] | undefined = changes.get(tops[i]!);
        changes.set(
          tops[i]!,
          sum === undefined
            ? response.change
            : sum.map((row: number[], s: number): number[] =>
                row.map(
                  (value: number, r: number): number =>
                    value + response.change[s]![r]!,
                ),
              ),
        );
      });
      // The row's generalised inverse mass: each impulse's direction against
      // the displacement of its point under all of them.
      let weight: number = 0;
      impulses.forEach((impulse: IPointImpulse, i: number): void => {
        weight += Vector3.dot(
          impulse.direction,
          AutoMovieXpbdArticulation.pointChange(
            changes.get(tops[i]!)![states[i]!]!,
            Vector3.subtract(impulse.point, ready[i]!.tree.origin),
          ),
        );
      });
      return {
        weight,
        apply: (scale: number): void => {
          for (const [top, change] of changes) {
            const tree: IPrepared = prepared.get(top)!;
            tree.tree.states.forEach(
              (s: AutoMovieXpbdArticulation.IState, i: number): void => {
                const c: number[] = change[i]!;
                AutoMovieXpbdMath.displace(
                  s.body,
                  Vector3.scale(
                    AutoMovieXpbdArticulation.pointChange(
                      c,
                      Vector3.subtract(s.body.center, tree.tree.origin),
                    ),
                    scale,
                  ),
                  { x: c[0]! * scale, y: c[1]! * scale, z: c[2]! * scale },
                );
              },
            );
          }
        },
      };
    };
    return {
      has: (body: AutoMovieXpbdBody): boolean => {
        const node: INode | undefined = kept.nodes.get(body);
        if (!body.dynamic || node === undefined) return false;
        const tree: IPrepared | null | undefined = prepared.get(root(node));
        return tree !== undefined && tree !== null;
      },
      respond,
    };
  }

  /** A unit positional impulse at a point of a body. */
  export interface IPointImpulse {
    /** The body. */
    body: AutoMovieXpbdBody;

    /** The world point it acts at, metres. */
    point: IAutoMovieVector3;

    /** Its unit world direction. */
    direction: IAutoMovieVector3;
  }

  /** The articulated response to a set of unit impulses acting together. */
  export interface IPointResponse {
    /**
     * The generalised inverse mass of the row: each impulse's direction against
     * its point's displacement under all of them.
     */
    weight: number;

    /**
     * Move every body of the trees by the response scaled by a multiplier.
     *
     * @param scale The multiplier, newton seconds squared.
     */
    apply(scale: number): void;
  }

  /** A position pass's articulated response. */
  export interface IResponder {
    /**
     * Whether a body moves through a prepared tree: dynamic, attached by a
     * joint, and in a tree a contact of the pass touches.
     *
     * @param body The body.
     */
    has(body: AutoMovieXpbdBody): boolean;

    /**
     * The response of the impulses' trees to the impulses acting together; none
     * when an impulse's body is in no prepared tree or a tree is singular.
     *
     * @param impulses Unit impulses on bodies the responder has.
     */
    respond(impulses: readonly IPointImpulse[]): IPointResponse | null;
  }

  /** A tree built and factored for one position pass. */
  interface IPrepared {
    /** The tree. */
    tree: AutoMovieXpbdArticulation.ITree;

    /** Its factor at `h = 0`. */
    factored: AutoMovieXpbdArticulation.IFactor;
  }

  /**
   * Build and factor one tree for a position pass, every axis on or past a
   * bound locked (`onBound`); none when its inertia is singular.
   */
  function prepare(top: INode): IPrepared | null {
    const joints: AutoMovieXpbdJoint[] = [];
    const tree: AutoMovieXpbdArticulation.ITree = build(top, joints);
    tree.edges.forEach(
      (edge: AutoMovieXpbdArticulation.IEdge, e: number): void => {
        const joint: AutoMovieXpbdJoint = joints[e]!;
        const frame: IAutoMovieQuaternion = Quaternion.multiply(
          joint.parent.orientation,
          joint.parentFrame().rotation,
        );
        const relative: IAutoMovieQuaternion = Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.inverse(frame),
            Quaternion.multiply(
              joint.child.orientation,
              joint.childFrame().rotation,
            ),
          ),
        );
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (onBound(joint, relative, joint.joint.axes[k]!))
              axis.locked = true;
          },
        );
      },
    );
    const factored: AutoMovieXpbdArticulation.IFactor | null =
      AutoMovieXpbdArticulation.factor(tree, 0);
    return factored === null ? null : { tree, factored };
  }

  /**
   * Whether a free axis stands on or past one of its bounds, by Bullet's
   * joint-limit rows (bulletphysics/bullet3,
   * `src/BulletDynamics/Featherstone/btMultiBodyJointLimitConstraint.cpp`,
   * lines 104-116 at commit c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib
   * licence, Copyright (c) 2013 Erwin Coumans): the lower row's penetration is
   * the coordinate less its lower bound, the upper row's the upper bound less
   * the coordinate, and a row is active when its penetration is at most zero.
   * The coordinate is the one the joint's admission clamps
   * (`projectPhysicalJointRotation`): the chart's angle where the joint
   * declares a chart, else the twist coordinate `2 atan(q.axis / w)`. A
   * swing-twist gate has no coordinate per axis, so a gated joint's axes stay
   * free here and the joints' pass restores its gate.
   */
  function onBound(
    joint: AutoMovieXpbdJoint,
    relative: IAutoMovieQuaternion,
    declared: IAutoMoviePhysicalJointAxis,
  ): boolean {
    if (joint.joint.range !== undefined) return false;
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
      joint.joint.order;
    const sign: number = relative.w < 0 ? -1 : 1;
    const q: number =
      order === undefined
        ? 2 * Math.atan2(relative[declared.axis] * sign, Math.abs(relative.w))
        : AutoMoviePhysicalJointChart.nearest(joint.joint, relative)[
            order.indexOf(declared.axis)
          ]!;
    return q - declared.minimum <= 0 || declared.maximum - q <= 0;
  }
  /**
   * The joints' tolerance (`ROM_TOLERANCE`), radians: the resolution to which a
   * solver need resolve a joint's angle.
   */
  const TOLERANCE: number = (ROM_TOLERANCE * Math.PI) / 180;

  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
