import { sleep } from "../utils/sleep"

type Arcs = { [from: string]: { [to: string]: number } }


type MaxFlowParams = {
  source: string
  sink: string
  arcs: Arcs,
  onUpdate?: (update: MaxFlowUpdate) => void
}

type MaxFlowUpdate = {
  highligthedPath?: string[],
  flow: Arcs
}

export async function fordFulkerson({
  arcs,
  source,
  sink,
  onUpdate = () => { }
}: MaxFlowParams) {

  const flow: Arcs = {}

  const arcsWithBackward = Object.keys(arcs).reduce<Arcs>((acc, to) => {
    for (const from of Object.keys(arcs[to])) {
      if (!acc[from]) {
        acc[from] = {}
      }
      if (!acc[to]) {
        acc[to] = {}
      }
      acc[to][from] = arcs[to][from]
      //mark backwards with negative capacity
      acc[from][to] = -acc[to][from]
    }
    return acc
  }, {})

  function findPath(node: string, visited: string[], increase: number): { visited: string[], increase: number } | null {
    const newVisited = [...visited, node]

    if (node === sink) {
      //we have arrived
      return {
        visited: newVisited,
        increase
      }
    }

    let path = null
    for (const [dest, capacity] of Object.entries(arcsWithBackward[node] ?? {})) {

      if (visited.find((e) => e === dest)) {
        continue
      }

      const currentFlow = flow[node]?.[dest] ?? 0

      //if capacity is negative we are looking at a backward arc
      const arcIncrease = capacity >= 0 ? capacity - currentFlow : currentFlow

      if (arcIncrease > 0) {
        path = findPath(dest, newVisited, Math.min(increase, arcIncrease))
        //we got a path
        if (path) {
          break
        }
      }
    }

    return path
  }

  let augmentingPath = findPath(source, [], Infinity)
  while (augmentingPath) {
    const visited = augmentingPath?.visited
    for (let i = 0; i < visited.length - 1; i++) {
      const [a, b] = [visited[i], visited[i + 1]]
      if (!flow[a]) {
        flow[a] = {}
      }
      //check if it was a backward arc
      const forward = !!arcs[a][b]
      const arcIncrease = augmentingPath.increase * (forward ? 1 : -1)

      const [from, to] = forward ? [a, b] : [b, a]

      if (!flow[from][to]) {
        flow[from][to] = arcIncrease
      } else {
        flow[from][to] += arcIncrease
      }
    }
    onUpdate({ highligthedPath: [...augmentingPath?.visited], flow: {...flow} })
    augmentingPath = findPath(source, [], Infinity)
    await sleep(1000)
  }

  return flow
}