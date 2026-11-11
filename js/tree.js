// Builds the Morse binary tree and lays it out on a grid, card-style:
//
//   * The antenna (root) sits between T (left) and E (right).
//   * Right half (starts with a dot): another dot continues RIGHT, a dash drops DOWN.
//   * Left half (starts with a dash): another dash continues LEFT, a dot drops DOWN.
//
// Subtrees are packed greedily on an occupancy grid so traces never cross. With only
// letters enabled this reproduces the physical card's layout almost exactly.

function buildMorseTree(codeToChar) {
  const root = { code: '', ch: null, kids: {} };
  for (const code of Object.keys(codeToChar)) {
    let n = root;
    for (let i = 0; i < code.length; i++) {
      const s = code[i];
      if (!n.kids[s]) n.kids[s] = { code: code.slice(0, i + 1), ch: null, kids: {} };
      n = n.kids[s];
    }
    n.ch = codeToChar[code];
  }
  return root;
}

// Lays out a subtree in local coordinates: its root at (0,0), x grows "outward"
// (away from the antenna), y grows downward.
function layoutSubtree(node, side) {
  const key = (x, y) => x + ',' + y;
  const hSym = side > 0 ? '.' : '-';
  const vSym = side > 0 ? '-' : '.';
  const res = { occ: new Set([key(0, 0)]), items: [{ node, x: 0, y: 0, via: null }], edges: [] };

  const place = (child, axis) => {
    const sub = layoutSubtree(child, side);
    const path = (d) => {
      const cells = [];
      for (let i = 1; i < d; i++) cells.push(axis === 'h' ? key(i, 0) : key(0, i));
      return cells;
    };
    const fits = (dx, dy, d) => {
      for (const c of path(d)) if (res.occ.has(c)) return false;
      for (const c of sub.occ) {
        const [x, y] = c.split(',').map(Number);
        if (res.occ.has(key(x + dx, y + dy))) return false;
      }
      return true;
    };
    let d = 1;
    while (!(axis === 'h' ? fits(d, 0, d) : fits(0, d, d))) d++;
    const dx = axis === 'h' ? d : 0, dy = axis === 'h' ? 0 : d;
    for (const c of path(d)) res.occ.add(c);
    for (const c of sub.occ) {
      const [x, y] = c.split(',').map(Number);
      res.occ.add(key(x + dx, y + dy));
    }
    sub.items.forEach((it, i) => res.items.push({ node: it.node, x: it.x + dx, y: it.y + dy, via: i === 0 ? axis : it.via }));
    sub.edges.forEach((e) => res.edges.push({ code: e.code, x1: e.x1 + dx, y1: e.y1 + dy, x2: e.x2 + dx, y2: e.y2 + dy }));
    res.edges.push({ code: child.code, x1: 0, y1: 0, x2: dx, y2: dy });
  };

  if (node.kids[hSym]) place(node.kids[hSym], 'h');
  if (node.kids[vSym]) place(node.kids[vSym], 'v');
  return res;
}

// Returns { items: [{node, x, y, via, side}], edges: [{code, x1, y1, x2, y2}] }
// in grid units, antenna at (0,0). via = 'h' | 'v' (direction of the trace into the node).
function layoutMorseTree(root) {
  const items = [], edges = [];
  for (const [sym, side] of [['.', 1], ['-', -1]]) {
    const kid = root.kids[sym];
    if (!kid) continue;
    const L = layoutSubtree(kid, side);
    L.items.forEach((it, i) => items.push({ node: it.node, x: side * (1 + it.x), y: it.y, via: i === 0 ? 'h' : it.via, side }));
    L.edges.forEach((e) => edges.push({ code: e.code, x1: side * (1 + e.x1), y1: e.y1, x2: side * (1 + e.x2), y2: e.y2 }));
    edges.push({ code: kid.code, x1: 0, y1: 0, x2: side, y2: 0 });
  }
  return { items, edges };
}

if (typeof module !== 'undefined') module.exports = { buildMorseTree, layoutMorseTree };
