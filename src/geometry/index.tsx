
export type Point = {
  x: number;
  y: number;
}
export type RectangleSize = {
  width: number
  height: number
}

function randomPoint(): Point {
  function randomCoordinate() {
    return -1 + Math.random() * 2
  }
  return { x: randomCoordinate(), y: randomCoordinate() }
}

function distance(a: Point, b: Point) {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

function middle(a: Point, b: Point) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

function angle(a: Point, b: Point) {
  return Math.atan((b.y - a.y) / (b.x - a.x)) + ( b.x < a.x ? Math.PI : 0)
}

function absolutePosition(position: Point): Point {
  return {
    x: 250 + position.x * 250,
    y: 250 + position.y * 250
  }
}

export {
  distance,
  middle,
  angle,
  randomPoint,
  absolutePosition
}