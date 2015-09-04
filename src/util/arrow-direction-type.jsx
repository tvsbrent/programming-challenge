"use strict";


export const up     = Symbol('upArrowDirection');
export const right  = Symbol('rightArrowDirection');
export const down   = Symbol('downArrowDirection');
export const left   = Symbol('leftArrowDirection');

export function toString( value ) {
  switch( value ) {
    case up:
      return "up";
    case right:
      return "right";
    case down:
      return "down";
    case left:
      return "left";
    default:
      return undefined;
  }
}

export function getRandom() {
  switch ( Math.floor( Math.random() * 4 ) + 1 ) {
    case 1:
      return up;
    case 2:
      return right;
    case 3:
      return down;
    case 4:
      return left;
  }
}