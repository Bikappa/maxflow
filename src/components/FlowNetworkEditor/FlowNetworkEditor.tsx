import { AppBar, ButtonGroup, makeStyles, Toolbar } from "@material-ui/core";

import { useCallback, useMemo, useReducer, useState } from "react";
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
  ADD_ARC,
  SET_SOURCE,
  SET_SINK,
  SELECT_NODE
}

type Action =
  { type: EDITOR_ACTIONS.ADD_NODE, payload: NodeData }
  | { type: EDITOR_ACTIONS.REMOVE_NODE, payload: NodeId }
  | { type: EDITOR_ACTIONS.MOVE_NODE, payload: { id: NodeId, position: Point } }
  | { type: EDITOR_ACTIONS.ADD_ARC, payload: { from: NodeId, to: NodeId, capacity: number } }
  | { type: EDITOR_ACTIONS.SET_SOURCE, payload: NodeId | undefined }
  | { type: EDITOR_ACTIONS.SET_SINK, payload: NodeId | undefined }
  | { type: EDITOR_ACTIONS.SELECT_NODE, payload: NodeId }


type EditorState = {
  nodes: { [id: string]: NodeData }
  arcs: NumericLabeledArcs
  flow: NumericLabeledArcs
  source?: NodeId
  sink?: NodeId
  selectedNode?: NodeId
  fixedSink: boolean,
}

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case EDITOR_ACTIONS.ADD_NODE:
      const newNode = action.payload
      return {
        ...state,
        source: state.source ?? newNode.id,
        sink:  !state.source || state.fixedSink ? state.sink : newNode.id,
        nodes: {
          ...state.nodes,
          [newNode.id]: newNode
        }
      }
    case EDITOR_ACTIONS.REMOVE_NODE:
      const { [action.payload]: deleted, ...nodes } = state.nodes
      const { [action.payload]: arcsFromRemovedNode, ...arcs } = state.arcs

      //remove the ingoing arcs to the node
      for (const tos of Object.values(arcs)) {
        delete tos[action.payload]
      }
      const wasSink = action.payload === state.sink
      const wasSource = action.payload === state.sink
      return {
        ...state,
        arcs,
        nodes,
        selectedNode: action.payload !== state.selectedNode ? state.selectedNode : undefined,
        source: wasSource ? state.source : undefined,
        sink: wasSink ? state.source : undefined,
        fixedSink: wasSink ? false : state.fixedSink
      }
    case EDITOR_ACTIONS.ADD_ARC:
      return {
        ...state,
        selectedNode: undefined,
        arcs: {
          ...state.arcs,
          [action.payload.from]: {
            ...state.arcs[action.payload.from],
            [action.payload.to]: action.payload.capacity
          }
        },
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
    case EDITOR_ACTIONS.SET_SOURCE:
      return {
        ...state,
        selectedNode: undefined,
        source: action.payload
      }
    case EDITOR_ACTIONS.SET_SINK:
      return {
        ...state,
        selectedNode: undefined,
        sink: action.payload,
        fixedSink: true
      }
    case EDITOR_ACTIONS.SELECT_NODE:
      return {
        ...state,
        selectedNode: action.payload !== state.selectedNode ? action.payload : undefined
      }
    default:
      return state

  }
}


export function FlowNetworkEditor() {

  const [flow, setFlow] = useState<NumericLabeledArcs>({})

  const [state, dispatch] = useReducer(reducer, {
    nodes: {},
    arcs: {},
    flow: {},
    fixedSink: false
  })

  const { sink, source, selectedNode } = state
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
        id: '' + Date.now(),
        position: relativePosition({ x: e.clientX, y: e.clientY })
      }
    })
  }, [])


  const nodeClickHandler = useMemo(() => {
    return (id: NodeId) => {

      if (!selectedNode || id === selectedNode) {
        dispatch({
          type: EDITOR_ACTIONS.SELECT_NODE,
          payload: id
        })
        return
      }

      //we add the new arc
      if (!state.arcs[selectedNode]?.[id] && !state.arcs[id]?.[selectedNode]) {
        dispatch({
          type: EDITOR_ACTIONS.ADD_ARC,
          payload: {
            from: selectedNode,
            to: id,
            capacity: Math.round(8 * Math.random()) + 2
          }
        })
      }
    }
  }, [selectedNode, state.arcs])

  const runClickHandler = useMemo(() => {
    return source && sink ? () => {
      Promise.resolve()
        .then(() => {
          return fordFulkerson({
            source,
            sink,
            arcs: state.arcs,
            onUpdate: ({ flow, highligthedPath }) => {
              setFlow(flow)
            }
          })
        })
        .then(setFlow)
    } : undefined
  }, [state.arcs, source, sink])

  const deleteClickHandler = useMemo(() => {
    return selectedNode ? () => {
      //remove the node
      dispatch({
        type: EDITOR_ACTIONS.REMOVE_NODE,
        payload: selectedNode,
      })

    } : undefined
  },
    [selectedNode])

  const sourceMarkClickHandler = useMemo(() => {
    return selectedNode && selectedNode !== sink ? () => {
      dispatch({
        type: EDITOR_ACTIONS.SET_SOURCE,
        payload: selectedNode !== source ? selectedNode : undefined,
      })
    } : undefined
  }, [selectedNode, sink, source])

  const sinkMarkClickHandler = useMemo(() => {
    return selectedNode && selectedNode !== source ? () => {
      dispatch({
        type: EDITOR_ACTIONS.SET_SINK,
        payload: selectedNode !== sink ? selectedNode : undefined,
      })
    } : undefined
  }, [selectedNode, sink, source])


  const classes = useStyles()
  const muiClasses = useMUIStyles()

  const Bar = useMemo(() => <AppBar position="fixed">
    <Toolbar className={muiClasses.root}>
      <div className={muiClasses.grow} />
      <ButtonGroup variant='contained' >
        <SmartButton onClick={sourceMarkClickHandler} startIcon={<InputIcon />}>{selectedNode === source ? 'Unm' : 'M'}ark as source</SmartButton>
        <SmartButton onClick={sinkMarkClickHandler} startIcon={<FlagIcon />}>{selectedNode === sink ? 'Unm' : 'M'}ark as sink</SmartButton>
        <SmartButton onClick={deleteClickHandler} startIcon={<DeleteIcon />}>Delete</SmartButton>
      </ButtonGroup>
      <SmartButton onClick={runClickHandler} color='primary' variant='contained' startIcon={<PlayArrowIcon />}>Compute</SmartButton>
    </Toolbar>
  </AppBar>, [sourceMarkClickHandler, sinkMarkClickHandler, runClickHandler, deleteClickHandler, source, sink, selectedNode, muiClasses])

  return <>
    {Bar}
    <div onClick={canvasClickHandler} className={classes.canvas}>
      {
        Object.values(state.nodes).map(node => {
          const pos = absolutePosition(node.position)
          return <FlowNetworkNode
            key={node.id}
            onDrag={dragHandler}
            onClick={() => nodeClickHandler(node.id)}
            {...node}
            positionX={pos.x}
            positionY={pos.y}
            bgColor={node.id === selectedNode ? 'red' : undefined}
            label={sink === node.id ? <FlagIcon /> : (source === node.id ? <InputIcon /> : undefined)}
          />
        })
      }
      {
        Object.keys(state.arcs).map(from => Object.keys(state.arcs[from]).map(to => {
          const start = absolutePosition(state.nodes[from].position)
          const end = absolutePosition(state.nodes[to].position)

          return <FlowArc
            key={from + '-' + to}
            flow={flow[from]?.[to] || 0}
            capacity={state.arcs[from][to]}
            startX={start.x}
            startY={start.y}
            endX={end.x}
            endY={end.y}
          />
        })).flat()
      }
    </div>
  </>

}