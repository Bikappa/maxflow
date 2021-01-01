import { AppBar, ButtonGroup, makeStyles, Toolbar } from "@material-ui/core";
import { PlayArrow } from "@material-ui/icons";
import { useCallback, useState } from "react";
import { createUseStyles } from "react-jss";
import { Point } from "../../geometry";
import { fordFulkerson } from "../../maxflow";
import { FlowArc, FlowNetworkNode } from "../flow";
import { NodeId, NumericLabeledArcs } from "../types";
import { SmartButton } from "./SmartButton";

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

export function FlowNetworkEditor() {
    const muiClasses = useMUIStyles()
    const [nodeData, setNodeData] = useState<{ [id: string]: NodeData }>({})
    const [arcs, setArcs] = useState<NumericLabeledArcs>({})
    const [flow, setFlow] = useState<NumericLabeledArcs>({})
    const [source, setSource] = useState<NodeId | undefined>(undefined)
    const [sink, setSink] = useState<NodeId | undefined>(undefined)
    const [defaultArcCapacity] = useState(10)

    const [selectedNode, setSelectedNode] = useState<NodeId | undefined>(undefined)

    const graph = new Graph<FlowNode>();

    Object.values(nodeData).forEach((node) => {
        graph.addNode(node.id, new FlowNode(node.id, node.position))
    })

    for (const [from, tos] of Object.entries(arcs)) {
        for (const [to] of Object.entries(tos)) {
            graph.addArc(from, to)
        }
    }

    const dragHandler = useCallback((id, event) => {
        event.preventDefault()
        const newPos = relativePosition({ x: event.clientX, y: event.clientY })
        setNodeData((prev) => {
            return {
                ...prev,
                [id]: {
                    id,
                    position: newPos
                }
            }
        })
    }, [setNodeData])

    const canvasClickHandler = useCallback((e: React.MouseEvent) => {

        setNodeData((prev) => {

            //add a new node
            const newNode = {
                id: '' + Object.keys(prev).length,
                position: relativePosition({ x: e.clientX, y: e.clientY })
            }

            return {
                ...prev,
                [newNode.id]: newNode,
            }
        })
    }, [setNodeData])

    const nodeClickHandler = selectedNode ? (id: NodeId) => {
        //we add the new arc
        if (id !== selectedNode) {
            setArcs((prev) => ({
                ...prev,
                [selectedNode]: {
                    ...prev[selectedNode],
                    [id]: Math.round(8 * Math.random()) + 2
                }
            }))
        }
        setSelectedNode(undefined)
    } : setSelectedNode

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
        const { [selectedNode]: deletedNode, ...otherNodes } = nodeData
        setNodeData(otherNodes)

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
    const graphNodes = graph.getNodes()

    return <>
        <AppBar position="fixed">
            <Toolbar className={muiClasses.root}>
                <div className={muiClasses.grow} />
                <ButtonGroup variant='contained' >
                    <SmartButton onClick={sourceMarkClickHandler}>{selectedNode === source ? 'Unm' : 'M'}ark as source</SmartButton>
                    <SmartButton onClick={sinkMarkClickHandler}>{selectedNode === sink ? 'Unm' : 'M'}ark as sink</SmartButton>
                    <SmartButton onClick={deleteClickHandler}>Delete</SmartButton>
                </ButtonGroup>
                <SmartButton onClick={runClickHandler} color='primary' variant='contained' startIcon={<PlayArrow />}>Compute</SmartButton>
            </Toolbar>
        </AppBar>
        <div onClick={canvasClickHandler} className={classes.canvas}>
            {
                Object.values(graphNodes).map(({ value }) => {
                    return <FlowNetworkNode
                        key={value.id}
                        onDrag={(event) => dragHandler(value.id, event)}
                        onClick={nodeClickHandler}
                        {...value}
                        position={absolutePosition(value.position)}
                        bgColor={value.id === selectedNode ? 'red' : undefined}
                        label={sink === value.id ? 'sink' : (source === value.id ? 'source' : undefined)}
                    />
                })
            }
            {
                graph.getArcs().map(([from, to]) => {
                    return <FlowArc
                        key={from + '-' + to}
                        flow={flow[from]?.[to] || 0}
                        capacity={arcs[from][to]}
                        start={absolutePosition(graphNodes[from].value.position)}
                        end={absolutePosition(graphNodes[to].value.position)}
                    />
                })
            }
        </div>
    </>

}