export function toAntdMenuItems(tree = []) {
  const convert = node => ({
    key: node.screenKey,
    label: node.label,
    children: node.children?.length
      ? node.children.map(convert)
      : undefined,
  })

  return tree.map(convert)
}
