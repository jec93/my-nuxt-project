export function buildMenuTree(list = []) {
  const map = new Map()
  const roots = []

  // 노드 생성
  list.forEach(item => {
    map.set(item.screenKey, { ...item, children: [] })
  })

  // 부모-자식 연결
  map.forEach(node => {
    if (node.parentKey && map.has(node.parentKey)) {
      map.get(node.parentKey).children.push(node)
    } else {
      roots.push(node)
    }
  })

  // 정렬
  const sortRec = nodes => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach(n => sortRec(n.children))
  }
  sortRec(roots)

  return roots
}

export function buildMenuMap(list = []) {
  const map = new Map()
  list.forEach(m => map.set(m.screenKey, m))
  return map
}

export function getAncestorKeys(key, menuMap) {
  const ancestors = []
  let cur = menuMap.get(key)
  while (cur?.parentKey) {
    ancestors.push(cur.parentKey)
    cur = menuMap.get(cur.parentKey)
  }
  return ancestors
}
