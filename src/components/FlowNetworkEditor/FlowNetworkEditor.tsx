import { AppBar, ButtonGroup, makeStyles, Toolbar } from "@material-ui/core";

import { useCallback, useReducer, useState } from "react";
import { createUseStyles } from "react-jss";
import { Point } from "../../geometry";
import { fordFulkerson } from "../../maxflow";
import { FlowArc, FlowNetworkNode } from "../flow";
import { NodeId, NumericLabeledArcs } from "../types";
import { SmartButton } from "./SmartButton";
import FlagIcon from '@material-ui/icons/Flag';
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import InputIcon from '@material-ui/icons/Input';
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = createUseStyles({
  canvas: {
    width: '100%',
    height: '100vh',
  }
})

const useMUIStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  grow: {
    flexGrow: 1,
  },
}));

class Node<T>{
  private id: NodeId
  public value: T

  constructor(id: NodeId, value: T) {
    this.id = id;
    this.value = value
  }
}

class Graph<T>{
  private _nodes: { [id: string]: Node<T> } = {}
  private _adjacencyTable: { [from: string]: { [to: string]: boolean } } = {}

  addNode(id: string, value: T) {
    if ((id in this._nodes)) {
      throw new Error('Conflicting node id')
    }

    this._nodes[id] = new Node(id, value)
  }

  addArc(from: string, to: string) {
    if (!this._adjacencyTable[from]) {
      this._adjacencyTable[from] = {}
    }
    this._adjacencyTable[from][to] = true
  }

  getNodes() {
    return this._nodes
  }

  getArcs() {
    return Object.entries(this._adjacencyTable).map(([from, tos]) => {
      return Object.entries(tos).filter(([, linked]) => linked).map(([to]) => [from, to])
    }).flat()
  }
}

class FlowNode {
  public id;
  public position: Point
  constructor(id: string, position: Point) {
    this.id = id
    this.position = position
  }

  toString() {
    return this.id
  }
}

type NodeData = {
  id: string,
  position: Point,
}

function absoluteCoordinate(normalizedCoordinate: number, length: number) {
  return (length + normalizedCoordinate * length) / 2
}
function normalizedCoordinate(absoluteCoordinate: number, length: number) {
  return (absoluteCoordinate * 2 - length) / length
}

function absolutePosition(normalizedPosition: Point) {
  return {
    x: absoluteCoordinate(normalizedPosition.x, window.innerWidth),
    y: absoluteCoordinate(normalizedPosition.y, window.innerHeight),
  }
}

function relativePosition(absolutePosition: Point) {
  return {
    x: normalizedCoordinate(absolutePosition.x, window.innerWidth),
    y: normalizedCoordinate(absolutePosition.y, window.innerHeight),
  }
}

enum EDITOR_ACTIONS {
  ADD_NODE,
  REMOVE_NODE,
  MOVE_NODE,
}

type Action =
  { type: EDITOR_ACTIONS.ADD_NODE, payload: NodeData }
  | { type: EDITOR_ACTIONS.REMOVE_NODE, payload: NodeId }
  | { type: EDITOR_ACTIONS.MOVE_NODE, payload: {id: NodeId, position: Point} }


type EditorState = {
  nodes: { [id: string]: NodeData }
  arcs: NumericLabeledArcs
  flow: NumericLabeledArcs
  source?: NodeId
  sink?: NodeId
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case EDITOR_ACTIONS.ADD_NODE:
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.payload.id]: action.payload
        }
      }
    case EDITOR_ACTIONS.REMOVE_NODE:
      const { [action.payload]: deleted, ...left } = state.nodes
      return {
        ...state,
        nodes: left
      }
    case EDITOR_ACTIONS.MOVE_NODE:
      
        return {
          ...state,
          nodes: {
            ...state.nodes,
            [action.payload.id]: {
              ...state.nodes[action.payload.id],
              position: action.payload.position
            }
          }
        }
    default:
      return state

  }
}


export function FlowNetworkEditor() {


  const [arcs, setArcs] = useState<NumericLabeledArcs>({})
  const [flow, setFlow] = useState<NumericLabeledArcs>({})
  const [source, setSource] = useState<NodeId | undefined>(undefined)
  const [sink, setSink] = useState<NodeId | undefined>(undefined)
  const [defaultArcCapacity] = useState(10)
  const muiClasses = useMUIStyles()

  const [state, dispatch] = useReducer(reducer, {
    nodes: {},
    arcs: {},
    flow: {},
  })
  const [selectedNode, setSelectedNode] = useState<NodeId | undefined>(undefined)

  const dragHandler = useCallback((id, event) => {
    
    event.preventDefault()
    const position = relativePosition({ x: event.clientX, y: event.clientY })

    dispatch({
      type: EDITOR_ACTIONS.MOVE_NODE,
      payload: {
        id,
        position
      }
    })
   
  }, [])

  const canvasClickHandler = useCallback((e: React.MouseEvent) => {
    dispatch({
      type: EDITOR_ACTIONS.ADD_NODE,
      payload: {
        id: '' + Object.keys(state.nodes).length,
        position: relativePosition({ x: e.clientX, y: e.clientY })
      }
    })
  }, [state.nodes])

  const nodeClickHandler = useCallback((id: NodeId) => {
    if (!selectedNode) {
      setSelectedNode(id)
      return
    }
    //we add the new arc
    if (id !== selectedNode && !arcs[selectedNode]?.[id] && !arcs[id]?.[selectedNode]) {
      setArcs((prev) => ({
        ...prev,
        [selectedNode]: {
          ...prev[selectedNode],
          [id]: Math.round(8 * Math.random()) + 2
        }
      }))
    }
    setSelectedNode(undefined)
  }, [selectedNode, setSelectedNode, arcs, setArcs])

  const runClickHandler = source && sink ? () => {
    new Promise<NumericLabeledArcs>((resolve) => {
      const flow = fordFulkerson(source, sink, arcs)
      resolve(flow)
    }).then(setFlow)
  } : undefined

  const deleteClickHandler = selectedNode ? () => {
    if (source === selectedNode) {
      setSource(undefined)
    }

    if (sink === selectedNode) {
      setSink(undefined)
    }

    setSelectedNode(undefined)

    //remove the arcs from and to the node
    const { [selectedNode]: fromDeletedNodeArcs, ...otherArcs } = arcs

    //remove the ingoing arcs to the node
    for (const tos of Object.values(otherArcs)) {
      delete tos[selectedNode]
    }

    setArcs(otherArcs)
    //remove the node
    dispatch({
      type: EDITOR_ACTIONS.REMOVE_NODE,
      payload: selectedNode,
    })

  } : undefined

  const sourceMarkClickHandler = selectedNode && selectedNode !== sink ? () => {
    if (selectedNode === source) {
      setSource(undefined)
    } else {
      setSource(selectedNode)
    }
    setSelectedNode(undefined)
  } : undefined

  const sinkMarkClickHandler = selectedNode && selectedNode !== source ? () => {
    if (selectedNode === sink) {
      setSink(undefined)
    } else {
      setSink(selectedNode)
    }
    setSelectedNode(undefined)
  } : undefined

  const classes = useStyles()

  return <>
    <AppBar position="fixed">
      <Toolbar className={muiClasses.root}>
        <div className={muiClasses.grow} />
        <ButtonGroup variant='contained' >
          <SmartButton onClick={sourceMarkClickHandler} startIcon={<InputIcon />}>{selectedNode === source ? 'Unm' : 'M'}ark as source</SmartButton>
          <SmartButton onClick={sinkMarkClickHandler} startIcon={<FlagIcon />}>{selectedNode === sink ? 'Unm' : 'M'}ark as sink</SmartButton>
          <SmartButton onClick={deleteClickHandler} startIcon={<DeleteIcon />}>Delete</SmartButton>
        </ButtonGroup>
        <SmartButton onClick={runClickHandler} color='primary' variant='contained' startIcon={<PlayArrowIcon />}>Compute</SmartButton>
      </Toolbar>
    </AppBar>
    <div onClick={canvasClickHandler} className={classes.canvas}>
      {
        Object.values(state.nodes).map(node => {
          const pos = absolutePosition(node.position)
          return <FlowNetworkNode
            key={node.id}
            onDrag={dragHandler}
            onClick={nodeClickHandler}
            {...node}
            positionX={pos.x}
            positionY={pos.y}
            bgColor={node.id === selectedNode ? 'red' : undefined}
            label={sink === node.id ? <FlagIcon /> : (source === node.id ? <InputIcon /> : undefined)}
          />
        })
      }
      {/* {
        graph.getArcs().map(([from, to]) => {
          const start = absolutePosition(state.nodes[from].position)
          const end = absolutePosition(state.nodes[to].position)
          return <FlowArc
            key={from + '-' + to}
            flow={flow[from]?.[to] || 0}
            capacity={arcs[from][to]}
            startX={start.x}
            startY={start.y}
            endX={end.x}
            endY={end.y}
          />
        })
      } */}
    </div>
  </>

}