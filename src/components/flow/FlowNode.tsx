import React, { DragEvent } from "react"
import { createUseStyles } from "react-jss";

import { Point } from "../../geometry"
import { asPixels } from '../../utils/index';
import { NodeId } from "../types";

const useStyles = createUseStyles({
  label: {
    position: 'absolute',
    top: '-2em'
  }
})
export function FlowNode(props: {
  id: NodeId
  position: Point
  onClick: (id: NodeId) => void
  onDrag: (event: DragEvent) => void
  bgColor?: string
  label?: string
}) {
  const classes = useStyles()

  const dragStartHandler = (event: DragEvent) => {
    var img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
  }

  return (
    <div
      className='flow-node'
      draggable={true}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        props.onClick(props.id)
      }}
      onDrag={props.onDrag}
      onDragStart={dragStartHandler}
      style={
        {
          top: asPixels(props.position.y),
          left: asPixels(props.position.x),
          backgroundColor: props.bgColor,
        }}>
      {props.id}
      {props.label ? <span className={classes.label}>{props.label}</span> : null}
    </div>
  )
}


