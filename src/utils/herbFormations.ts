import { HerbItem, Weevil } from '../types/game';

export interface Point2D {
  x: number;
  y: number;
}

export interface YFormationResult {
  kind: 'y';
  herbIds: number[];
  herbs: HerbItem[];
  junction: Point2D;
  tips: [Point2D, Point2D, Point2D];
  center: Point2D;
  blastRadius: number;
  score: number;
}

export interface CircleFormationResult {
  kind: 'circle';
  herbIds: number[];
  herbs: HerbItem[];
  orderedPoints: Point2D[];
  center: Point2D;
  radius: number;
  score: number;
}

export type HerbFormationResult = YFormationResult | CircleFormationResult;

function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const lenSq = vx * vx + vy * vy;
  if (lenSq < 1e-6) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / lenSq));
  const projX = a.x + t * vx;
  const projY = a.y + t * vy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function normalizeAngle(rad: number): number {
  let a = rad;
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getWeevilsInsideCircle(
  circle: CircleFormationResult,
  weevils: Weevil[]
): Weevil[] {
  const effectiveRadius = circle.radius * 1.05;
  return weevils.filter((w) => {
    if (w.isDying) return false;
    if (isPointInPolygon(w, circle.orderedPoints)) return true;
    return Math.hypot(w.x - circle.center.x, w.y - circle.center.y) <= effectiveRadius;
  });
}

export function getWeevilsInYBlast(
  yForm: YFormationResult,
  weevils: Weevil[]
): Weevil[] {
  return weevils.filter((w) => {
    if (w.isDying) return false;
    return Math.hypot(w.x - yForm.center.x, w.y - yForm.center.y) <= yForm.blastRadius;
  });
}

// Build connected clusters of eligible herbs within linkDist
function getProximityClusters(herbs: HerbItem[], linkDist = 245): HerbItem[][] {
  const visited = new Set<number>();
  const clusters: HerbItem[][] = [];

  for (let i = 0; i < herbs.length; i++) {
    const start = herbs[i];
    if (visited.has(start.id)) continue;
    const cluster: HerbItem[] = [];
    const queue: HerbItem[] = [start];
    visited.add(start.id);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      cluster.push(cur);
      for (let j = 0; j < herbs.length; j++) {
        const other = herbs[j];
        if (!visited.has(other.id) && dist(cur, other) <= linkDist) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }
    if (cluster.length >= 4) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

function getCandidateSubsets(
  cluster: HerbItem[],
  focusHerbId?: number,
  maxPool = 9
): HerbItem[][] {
  let pool = cluster;
  if (focusHerbId !== undefined) {
    const focus = cluster.find((h) => h.id === focusHerbId);
    if (!focus) return [];
    const others = cluster
      .filter((h) => h.id !== focusHerbId)
      .sort((a, b) => dist(a, focus) - dist(b, focus))
      .slice(0, maxPool - 1);
    pool = [focus, ...others];

    const restCount = others.length;
    const subsets: HerbItem[][] = [];
    const totalMasks = 1 << restCount;
    for (let mask = 1; mask < totalMasks; mask++) {
      const sub: HerbItem[] = [focus];
      for (let bit = 0; bit < restCount; bit++) {
        if ((mask & (1 << bit)) !== 0) {
          sub.push(others[bit]);
        }
      }
      if (sub.length >= 4) {
        subsets.push(sub);
      }
    }
    return subsets;
  }

  if (cluster.length > maxPool) {
    pool = cluster.slice(0, maxPool);
  }
  const n = pool.length;
  const subsets: HerbItem[][] = [];
  const totalMasks = 1 << n;
  for (let mask = 15; mask < totalMasks; mask++) {
    const sub: HerbItem[] = [];
    for (let bit = 0; bit < n; bit++) {
      if ((mask & (1 << bit)) !== 0) {
        sub.push(pool[bit]);
      }
    }
    if (sub.length >= 4) {
      subsets.push(sub);
    }
  }
  return subsets;
}

function matchCircleSubset(
  subset: HerbItem[],
  allHerbs: HerbItem[],
  movedHerbIds: Set<number>
): CircleFormationResult | null {
  if (subset.length < 4) return null;

  const movedCount = subset.reduce((acc, h) => acc + (movedHerbIds.has(h.id) ? 1 : 0), 0);
  if (subset.length === 4 ? movedCount < 2 : movedCount < 1) {
    return null;
  }

  let cx = 0;
  let cy = 0;
  for (const h of subset) {
    cx += h.x;
    cy += h.y;
  }
  cx /= subset.length;
  cy /= subset.length;
  const center: Point2D = { x: cx, y: cy };

  const radii = subset.map((h) => Math.hypot(h.x - cx, h.y - cy));
  const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
  if (meanR < 48 || meanR > 290) return null;

  let relDevSum = 0;
  for (const r of radii) {
    const ratio = r / meanR;
    if (ratio < 0.54 || ratio > 1.48) return null;
    relDevSum += Math.abs(r - meanR) / meanR;
  }
  const meanRelDev = relDevSum / radii.length;
  if (meanRelDev > 0.28) return null;

  // Center must be hollow (no herb sitting inside the ring, distinguishing Circle from Y-shape)
  for (const h of allHerbs) {
    if (Math.hypot(h.x - cx, h.y - cy) < meanR * 0.52) {
      return null;
    }
  }

  // Sort items around center to verify closed perimeter angular coverage
  const withAngle = subset
    .map((h) => ({
      herb: h,
      angle: Math.atan2(h.y - cy, h.x - cx),
    }))
    .sort((a, b) => a.angle - b.angle);

  let maxGap = 0;
  let minGap = Infinity;
  for (let i = 0; i < withAngle.length; i++) {
    const cur = withAngle[i].angle;
    const next =
      i + 1 < withAngle.length
        ? withAngle[i + 1].angle
        : withAngle[0].angle + Math.PI * 2;
    const gap = next - cur;
    if (gap > maxGap) maxGap = gap;
    if (gap < minGap) minGap = gap;
  }

  const maxAllowedGap = subset.length === 4 ? 2.48 : 2.38; // ~142 deg (4), ~136 deg (5+)
  if (maxGap > maxAllowedGap || minGap < 0.34) {
    return null;
  }

  const score = (1 - meanRelDev) * 100 + subset.length * 6;
  return {
    kind: 'circle',
    herbIds: withAngle.map((w) => w.herb.id),
    herbs: withAngle.map((w) => w.herb),
    orderedPoints: withAngle.map((w) => ({ x: w.herb.x, y: w.herb.y })),
    center,
    radius: meanR,
    score,
  };
}

function matchYSubset(
  subset: HerbItem[],
  movedHerbIds: Set<number>
): YFormationResult | null {
  if (subset.length < 4) return null;

  const movedCount = subset.reduce((acc, h) => acc + (movedHerbIds.has(h.id) ? 1 : 0), 0);
  if (subset.length === 4 ? movedCount < 2 : movedCount < 1) {
    return null;
  }

  // Generate candidate fork junctions: each herb in subset + midpoints of close pairs
  const junctions: Point2D[] = subset.map((h) => ({ x: h.x, y: h.y }));
  if (subset.length >= 5) {
    for (let i = 0; i < subset.length; i++) {
      for (let j = i + 1; j < subset.length; j++) {
        if (dist(subset[i], subset[j]) <= 155) {
          junctions.push({
            x: (subset[i].x + subset[j].x) * 0.5,
            y: (subset[i].y + subset[j].y) * 0.5,
          });
        }
      }
    }
  }

  let best: YFormationResult | null = null;

  for (const J of junctions) {
    // At least one herb must sit near the junction fork itself
    const nearJunction = subset.some((h) => dist(h, J) <= 78);
    if (!nearJunction) continue;

    // Outer candidate branch tips
    const outerHerbs = subset.filter((h) => {
      const d = dist(h, J);
      return d >= 48 && d <= 340;
    });
    if (outerHerbs.length < 3) continue;

    for (let a = 0; a < outerHerbs.length; a++) {
      for (let b = a + 1; b < outerHerbs.length; b++) {
        for (let c = b + 1; c < outerHerbs.length; c++) {
          const t1 = outerHerbs[a];
          const t2 = outerHerbs[b];
          const t3 = outerHerbs[c];

          const l1 = dist(t1, J);
          const l2 = dist(t2, J);
          const l3 = dist(t3, J);
          const minL = Math.min(l1, l2, l3);
          const maxL = Math.max(l1, l2, l3);

          if (subset.length === 4 && maxL > 225) continue;
          if (maxL / minL > 2.85) continue;

          // Verify 3 branch angles around J form a Y (gaps between 48 deg and 168 deg)
          const angles = [
            Math.atan2(t1.y - J.y, t1.x - J.x),
            Math.atan2(t2.y - J.y, t2.x - J.x),
            Math.atan2(t3.y - J.y, t3.x - J.x),
          ].sort((x, y) => x - y);

          const g1 = angles[1] - angles[0];
          const g2 = angles[2] - angles[1];
          const g3 = angles[0] + Math.PI * 2 - angles[2];
          const minGap = Math.min(g1, g2, g3);
          const maxGap = Math.max(g1, g2, g3);

          // Must clearly spread into 3 distinct branches (not T/line or narrow V)
          if (minGap < 0.84 || maxGap > (subset.length === 4 ? 2.72 : 2.92)) {
            continue;
          }

          // Verify every herb in subset aligns along one of the 3 segments J->T1, J->T2, J->T3
          let errSum = 0;
          let allAligned = true;
          const segTolerance = subset.length === 4 ? 24 : 54;

          for (const h of subset) {
            const dMin = Math.min(
              distToSegment(h, J, t1),
              distToSegment(h, J, t2),
              distToSegment(h, J, t3)
            );
            if (dMin > segTolerance) {
              allAligned = false;
              break;
            }
            errSum += dMin;
          }
          if (!allAligned) continue;

          // Ensure no branch ray overlaps nearly opposite-closed chord
          // Blast centered at the junction & covers generous radius around Y
          const avgErr = errSum / subset.length;
          const angleBalance = 1 - (maxGap - minGap) / Math.PI;
          const score = subset.length * 14 + angleBalance * 25 - avgErr * 0.4;

          const blastRadius = Math.max(225, maxL * 1.42);
          const center: Point2D = {
            x: (J.x * 2 + t1.x + t2.x + t3.x) / 5,
            y: (J.y * 2 + t1.y + t2.y + t3.y) / 5,
          };

          if (!best || score > best.score) {
            best = {
              kind: 'y',
              herbIds: subset.map((h) => h.id),
              herbs: [...subset],
              junction: { x: J.x, y: J.y },
              tips: [
                { x: t1.x, y: t1.y },
                { x: t2.x, y: t2.y },
                { x: t3.x, y: t3.y },
              ],
              center,
              blastRadius,
              score,
            };
          }
        }
      }
    }
  }

  // Prevent unused import lint on normalizeAngle if needed
  void normalizeAngle;
  return best;
}

export function detectHerbFormations(
  allHerbs: HerbItem[],
  movedHerbIds: Set<number>,
  options?: {
    focusHerbId?: number;
    cooldownUntil?: Map<number, number>;
    now?: number;
  }
): {
  bestCircle: CircleFormationResult | null;
  bestY: YFormationResult | null;
} {
  const now = options?.now ?? performance.now();
  const cooldownUntil = options?.cooldownUntil;

  const eligible = allHerbs.filter(
    (h) => !cooldownUntil || (cooldownUntil.get(h.id) ?? 0) <= now
  );

  if (eligible.length < 4 || movedHerbIds.size === 0) {
    return { bestCircle: null, bestY: null };
  }

  const clusters = getProximityClusters(eligible, 250);
  let bestCircle: CircleFormationResult | null = null;
  let bestY: YFormationResult | null = null;

  for (const cluster of clusters) {
    if (
      options?.focusHerbId !== undefined &&
      !cluster.some((h) => h.id === options.focusHerbId)
    ) {
      continue;
    }

    const subsets = getCandidateSubsets(cluster, options?.focusHerbId, 9);
    for (const sub of subsets) {
      const circle = matchCircleSubset(sub, eligible, movedHerbIds);
      if (circle && (!bestCircle || circle.score > bestCircle.score)) {
        bestCircle = circle;
      }

      const yForm = matchYSubset(sub, movedHerbIds);
      if (yForm && (!bestY || yForm.score > bestY.score)) {
        bestY = yForm;
      }
    }
  }

  return { bestCircle, bestY };
}
