// Small colored badge showing a recipe's match % (e.g. green >=80%, amber 50-79%, gray <50%).

export function MatchBadge({ percent }: { percent: number }) {
  return <span>{percent}%</span>;
}
