import { makeStyles } from "@material-ui/core";
import { grey, lightBlue } from "@material-ui/core/colors";
import React, { DragEvent, memo } from "react"

import { asPixels } from '../../utils/index';
import { NodeId } from "../types";

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    border: '6px solid ' + grey[600],
    backgroundColor: theme.palette.background.default,
    borderRadius: '50%',
    height: '30px',
    width: '30px',
    lineHeight: '30px',
    textAlign: 'center',
    display: 'block',
    textTransform: 'uppercase',
    zIndex: 2,
    transform: 'translate(-50%, -50%)',

    '&.selected': {
      borderColor: lightBlue[800]
    }
  },
  label: {
    position: 'absolute',
    color: grey[600],
    display: 'inline-block',
    top: - theme.spacing(5),
    left: '0px',
  },
}));

export const FlowNode = memo((props: {
  id: NodeId
  positionX: number,
  positionY: number,
  onClick: (id: NodeId) => void
  onDrag: (id: NodeId, event: DragEvent) => void
  selected?: boolean
  label?: React.ReactNode
  showName?: boolean
}) => {
  const classes = useStyles()

  const dragStartHandler = (event: DragEvent) => {
    var img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    event.dataTransfer.setDragImage(img, 0, 0);
  }
  return (
    <div
      className={classes.root + (props.selected ? ' selected' : '')}
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
        }}>
      {props.showName ? props.id : null}
      <span className={classes.label}>
        {props.label}
      </span>
    </div>
  )
})


