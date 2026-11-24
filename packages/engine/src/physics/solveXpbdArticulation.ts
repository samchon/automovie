import type {
  IAutoMoviePhysicalJoint,
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
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import { PhysicalRotationVector } from "./PhysicalRotationVector";
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
   * Lock every free axis whose rate after the solve carries its coordinate onto
   * or past one of its bounds over the substep (`reaches`), so an axis moving
   * outward at its limit is held at zero rate (prescribed motion, Featherstone
   * 2008, section 7.3; a joint limit enforced once the joint reaches it moving
   * outward, Kokkevis 2004, "Practical physics for articulated characters",
   * Game Developers Conference) and the tree solved again, at most once more
   * per newly locked axis (the caps' loop). True when any axis was newly
   * locked.
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
        const relative: IAutoMovieQuaternion = relation(joint);
        edge.axes.forEach(
          (axis: AutoMovieXpbdArticulation.IAxis, k: number): void => {
            if (axis.locked === true || axis.fixed !== undefined) return;
            const declared: IAutoMoviePhysicalJointAxis = joint.joint.axes[k]!;
            const q: number | null = coordinate(joint, relative, declared);
            const rate: number = axis.present + response.rates[e]![k]!;
            if (q !== null && reaches(declared, q + rate * h)) {
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
   * The articulated response of the trees a pass's contacts touch to positional
   * impulses (Kokkevis 2004, "Practical physics for articulated characters",
   * Game Developers Conference; Featherstone 2008, section 7.5): a contact's
   * correction on a jointed body moves its whole tree along the joints' free
   * axes, as the joints' impulses carry it, instead of moving the one body off
   * its joints. Each touched tree is built and factored once per position pass
   * at `h = 0` (an instant's impulse: no motor damps it). A correction that
   * would carry a free axis's coordinate onto or past one of its bounds
   * (`reaches`) holds that axis as prescribed motion (`IAxis.locked`,
   * Featherstone 2008, section 7.3) and its tree is factored again before the
   * correction is solved again (`IPointResponse.limit`), so a contact never
   * carries a joint past its limit; an axis once held stays held for the pass.
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
      const moves: Map<INode, IMove> = new Map();
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
      // The row's generalised inverse mass: each impulse's direction against
      // the displacement of its point under all of them.
      let weight: number = 0;
      impulses.forEach((impulse: IPointImpulse, i: number): void => {
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
        limit: (scale: number): boolean => {
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
                      reaches(
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
        },
        apply: (scale: number): void => {
          for (const [top, move] of moves) {
            const tree: IPrepared = prepared.get(top)!;
            // The joints' present relations, read before any body moves.
            const before: IRelation[] = tree.joints.map(relate);
            // The root moves by its own change; every other body is placed
            // by its joint's model at its new position variables, parents
            // first (Featherstone 2008, chapter 4: a body's pose is its
            // parent's composed with the joint transform X_J(q)).
            const c: number[] = move.change[0]!;
            const top0: AutoMovieXpbdBody = tree.tree.states[0]!.body;
            AutoMovieXpbdMath.displace(
              top0,
              Vector3.scale(
                AutoMovieXpbdArticulation.pointChange(
                  c,
                  Vector3.subtract(top0.center, tree.tree.origin),
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
            tree.coordinates.forEach(
              (row: (number | null)[], e: number): void =>
                row.forEach((q: number | null, k: number): void => {
                  if (q !== null) row[k] = q + move.rates[e]![k]! * scale;
                }),
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
     * Hold every free axis the response scaled by a multiplier would carry onto
     * or past one of its bounds, and factor its tree again; the response is
     * then stale and is read again.
     *
     * @param scale The multiplier, newton seconds squared.
     * @returns Whether any axis was newly held.
     */
    limit(scale: number): boolean;

    /**
     * Move the trees by the response scaled by a multiplier: the root by its
     * change, every other body by its joint's model at the moved coordinates
     * (`place`).
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

    /** Its edges' joints, in the tree's edge order. */
    joints: AutoMovieXpbdJoint[];

    /** Its factor at `h = 0`, with the axes held so far. */
    factored: AutoMovieXpbdArticulation.IFactor;

    /**
     * Each edge's free coordinates as the pass has moved them (`coordinate`);
     * none for an axis with no coordinate of its own.
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

  /** Build and factor one tree for a position pass; none when singular. */
  function prepare(top: INode): IPrepared | null {
    const joints: AutoMovieXpbdJoint[] = [];
    const tree: AutoMovieXpbdArticulation.ITree = build(top, joints);
    const factored: AutoMovieXpbdArticulation.IFactor | null =
      AutoMovieXpbdArticulation.factor(tree, 0);
    if (factored === null) return null;
    return {
      tree,
      joints,
      factored,
      coordinates: joints.map(
        (joint: AutoMovieXpbdJoint): (number | null)[] => {
          const relative: IAutoMovieQuaternion = relation(joint);
          return joint.joint.axes.map(
            (declared: IAutoMoviePhysicalJointAxis): number | null =>
              coordinate(joint, relative, declared),
          );
        },
      ),
    };
  }

  /** A joint's relation before a move: its relative rotation and anchor gap. */
  interface IRelation {
    /** The child's anchor frame relative to the parent's, normalised. */
    relative: IAutoMovieQuaternion;

    /** The child's anchor less the parent's, world, metres. */
    gap: IAutoMovieVector3;
  }

  /** A joint's relation at the present poses. */
  function relate(joint: AutoMovieXpbdJoint): IRelation {
    return {
      relative: relation(joint),
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
   * Place a joint's child from its parent's present pose by the joint's model
   * at its new position variables (Featherstone 2008, chapter 4, the joint
   * transform `X_J(q)`): a chart's free angles moved by their changes and the
   * rest of the relative rotation kept, `compose(q + dq) compose(q)^-1 r`, or,
   * for a joint without a chart, the relative rotation turned by the changes
   * about its frame's axes; the anchor gap is kept as it was.
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
          Quaternion.inverse(
            AutoMoviePhysicalJointChart.compose(order, angles),
          ),
        ),
        before.relative,
      );
    } else {
      let turn: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      joint.joint.axes.forEach(
        (declared: IAutoMoviePhysicalJointAxis, k: number): void => {
          turn = Vector3.addScaled(turn, UNIT[declared.axis]!, changes[k]!);
        },
      );
      relative = Quaternion.multiply(
        PhysicalRotationVector.exp(turn),
        before.relative,
      );
    }
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
  /** The child's anchor frame relative to the parent's, normalised. */
  function relation(joint: AutoMovieXpbdJoint): IAutoMovieQuaternion {
    const frame: IAutoMovieQuaternion = Quaternion.multiply(
      joint.parent.orientation,
      joint.parentFrame().rotation,
    );
    return Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(frame),
        Quaternion.multiply(
          joint.child.orientation,
          joint.childFrame().rotation,
        ),
      ),
    );
  }

  /**
   * The directions of a joint's motion subspace at a relative rotation, in its
   * parent's anchor frame: each free axis's, in the joint's axis order, as the
   * articulated solve moves it (the chart's axes at the configuration,
   * `AutoMoviePhysicalJointChart.directions`, or the frame's axes for a joint
   * without a chart), then the locked ones completing them to a basis: the
   * normal of two free directions, or, for one, the first locked direction made
   * perpendicular to it and their normal.
   *
   * @param joint The joint's profile.
   * @param relative The child's anchor frame relative to the parent's, unit.
   * @returns Three directions: the free ones first, then the locked.
   */
  export function directions(
    joint: IAutoMoviePhysicalJoint,
    relative: IAutoMovieQuaternion,
  ): IAutoMovieVector3[] {
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
      joint.order;
    const chart: IAutoMovieVector3[] | undefined =
      order === undefined
        ? undefined
        : AutoMoviePhysicalJointChart.directions(
            order,
            AutoMoviePhysicalJointChart.nearest(joint, relative),
          );
    const along: (
      axis: IAutoMoviePhysicalJointAxis["axis"],
    ) => IAutoMovieVector3 = (
      axis: IAutoMoviePhysicalJointAxis["axis"],
    ): IAutoMovieVector3 =>
      chart === undefined ? UNIT[axis]! : chart[order!.indexOf(axis)]!;
    const free: IAutoMovieVector3[] = joint.axes.map(
      (declared: IAutoMoviePhysicalJointAxis): IAutoMovieVector3 =>
        along(declared.axis),
    );
    const locked: IAutoMovieVector3[] = (["x", "y", "z"] as const)
      .filter(
        (axis: IAutoMoviePhysicalJointAxis["axis"]): boolean =>
          !joint.axes.some(
            (declared: IAutoMoviePhysicalJointAxis): boolean =>
              declared.axis === axis,
          ),
      )
      .map(along);
    if (free.length === 2)
      return [...free, Vector3.normalize(Vector3.cross(free[0]!, free[1]!))];
    if (free.length === 1) {
      const f: IAutoMovieVector3 = Vector3.normalize(free[0]!);
      const l: IAutoMovieVector3 = Vector3.normalize(
        Vector3.addScaled(locked[0]!, f, -Vector3.dot(locked[0]!, f)),
      );
      return [free[0]!, l, Vector3.cross(f, l)];
    }
    return [...free, ...locked];
  }
  /**
   * A free axis's coordinate, the one the joint's admission clamps
   * (`projectPhysicalJointRotation`): the chart's angle where the joint
   * declares a chart, else the twist coordinate `2 atan(q.axis / w)`; none for
   * a swing-twist gate, which has no coordinate per axis, so a gated joint's
   * axes stay free and the joints' pass restores its gate.
   *
   * @param joint The joint.
   * @param relative The child's anchor frame relative to the parent's, unit.
   * @param declared The free axis.
   * @returns Its coordinate, radians; none for a gated joint.
   */
  export function coordinate(
    joint: AutoMovieXpbdJoint,
    relative: IAutoMovieQuaternion,
    declared: IAutoMoviePhysicalJointAxis,
  ): number | null {
    if (joint.joint.range !== undefined) return null;
    const order: readonly IAutoMoviePhysicalJointAxis["axis"][] | undefined =
      joint.joint.order;
    const sign: number = relative.w < 0 ? -1 : 1;
    return order === undefined
      ? 2 * Math.atan2(relative[declared.axis] * sign, Math.abs(relative.w))
      : AutoMoviePhysicalJointChart.nearest(joint.joint, relative)[
          order.indexOf(declared.axis)
        ]!;
  }

  /**
   * Whether a coordinate stands on or past one of its axis's bounds, by
   * Bullet's joint-limit rows (bulletphysics/bullet3,
   * `src/BulletDynamics/Featherstone/btMultiBodyJointLimitConstraint.cpp`,
   * lines 104-116 at commit c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib
   * licence, Copyright (c) 2013 Erwin Coumans): the lower row's penetration is
   * the coordinate less its lower bound, the upper row's the upper bound less
   * the coordinate, and a row is active when its penetration is at most zero.
   * It is read at the coordinate the solve would carry the axis to.
   */
  function reaches(declared: IAutoMoviePhysicalJointAxis, q: number): boolean {
    return q - declared.minimum <= 0 || declared.maximum - q <= 0;
  }

  /** Two equal-shaped arrays of rows added entry by entry. */
  function add(left: number[][], right: number[][]): number[][] {
    return left.map((row: number[], i: number): number[] =>
      row.map((value: number, j: number): number => value + right[i]![j]!),
    );
  }
  /** Each joint-frame axis by name. */
  const UNIT: Readonly<Record<string, IAutoMovieVector3>> = {
    x: { x: 1, y: 0, z: 0 },
    y: { x: 0, y: 1, z: 0 },
    z: { x: 0, y: 0, z: 1 },
  };
}
