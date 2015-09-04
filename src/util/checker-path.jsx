"use strict";

import * as ArrowDirectionType from './arrow-direction-type.jsx';

export default class CheckerPath {
  constructor() {
    this.points = new Array();
    this.isLoop = false;
    this.points.current = null;
  }

  addPoint( position, direction ) {
    this.points.push( new CheckerPathPoint( position, direction ) );
    let currIndex = this.points.length - 1;
    if( this.points.current === null ) {
      this.points.current = this.points[currIndex];
    }
    if( currIndex > 0 ) {
      this.points[currIndex].prevPoint = this.points[currIndex - 1];
      this.points[currIndex - 1].nextPoint = this.points[currIndex];
    }
  }

  hasPoint( position ) {
    for( let i = 0; i < this.points.length; ++i ) {
      if( this.points[i].position.equals( position ) ) {
        return true;
      }
    }
    return false;
  }
}

export class CheckerPathPoint {
  constructor( position, direction ) {
    this.direction = direction;
    this.segmentDrawn = false;
    // This is a Vector3
    this.position = position;
    // These are references to a CheckerPathPoints
    this.prevPoint = null;
    this.nextPoint = null;
  }
}