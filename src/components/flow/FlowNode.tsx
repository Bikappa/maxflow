import { makeStyles } from "@material-ui/core";
import React, { DragEvent, memo } from "react"

import { asPixels } from '../../utils/index';
import { NodeId } from "../types";

const useStyles = makeStyles((theme) => ({
  label: {

    display: 'inline-block',
    marginTop: theme.spacing(1)
  },
}));

export const FlowNode = memo((props: {
  id: NodeId
  positionX: number,
  positionY: number,
  onClick: (id: NodeId) => void
  onDrag: (id: NodeId, event: DragEvent) => void
  bgColor?: string
  label?: React.ReactNode
}) => {
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
      onDrag={(event) => props.onDrag(props.id, event)}
      onDragStart={dragStartHandler}
      style={
        {
          top: asPixels(props.positionY),
          left: asPixels(props.positionX),
          backgroundColor: props.bgColor,
        }}>
      {props.id}
      <span className={classes.label}>
        {props.label}
      </span>
    </div>
  )
})


