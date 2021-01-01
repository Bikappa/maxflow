import React from 'react'
import { angle, distance, middle, Point } from '../../geometry/index';
import { asPixels, cssAngle } from '../../utils/index';
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
  arcLabel: {
    position: 'absolute',
    top: '10px'
  },
  arrow: {
    display: 'inline-block',
    position: 'absolute',
    top: '-2px',
    left: '20px',
    border: 'solid black',
    borderWidth:' 0 3px 3px 0',
    width: '6px',
    height: '6px',
    transform: 'rotate(-45deg)',
  },
})

export function FlowArc(props: {
  start: Point
  end: Point
  capacity: number
  flow: number
}) {

  const classes = useStyles()
  const { start, end, capacity, flow } = props
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

  return <div className='flow-arc' style={style}>
    <i className={classes.arrow} />
    <span className={classes.arcLabel}>{flow}/{capacity}</span>
  </div>
}