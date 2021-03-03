import React, { memo } from 'react'
import { angle, distance, middle } from '../../geometry/index';
import { asPixels, cssAngle } from '../../utils/index';
import { makeStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
  arcLabel: {
    position: 'absolute',
    top: '10px',
    color: theme.palette.getContrastText(theme.palette.background.default),
  },
  arrow: {
    display: 'inline-block',
    position: 'absolute',
    top: '-2px',
    left: '20px',
    border: 'solid black',
    borderWidth: ' 0 3px 3px 0',
    width: '6px',
    height: '6px',
    transform: 'rotate(-45deg)',
    borderColor: theme.palette.getContrastText(theme.palette.background.default),
  },
  root: {
    position: 'absolute',
    height: '6px',
    zIndex: 1,
    textAlign: 'center',
  }
})
)

export const FlowArc = memo((props: {
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  capacity: number
  flow: number
}) => {

  const start = { x: props.startX, y: props.startY }
  const end = { x: props.endX, y: props.endY }
  const classes = useStyles()
  const { capacity, flow } = props
  const length = distance(start, end)
  const pos = middle(start, end)
  const orientation = angle(start, end)

  const green = [0, 255, 0]
  const red = [255, 0, 0]
  const rgb = green.map((gCh, i) => gCh + (red[i] - gCh) * flow / capacity)
  const style = {
    top: asPixels(pos.y),
    left: asPixels(pos.x),
    width: asPixels(length),
    transform: `translateX(${-length / 2}px)` + cssAngle(orientation),
    backgroundColor: `rgb(${rgb.join(',')})`
  }

  return <div className={classes.root} style={style}>
    <i className={classes.arrow} />
    <span className={classes.arcLabel}>{flow}/{capacity}</span>
  </div>
})