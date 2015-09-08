import * as ArrowDirectionType from './arrow-direction-type.jsx';

export class CheckerPath {
  constructor() {
    this.isLoop = false;
    this.points = [];
    // This represents where we are in iterating through the path.
    // Used for building data.
    // This really should be reworked.
    this.points.cursor = null;
    // This represents where we are and where we want to go.
    this.points.queue = null;
    this.points.dirty = false;
  }

  addPoint( checkerPathPoint ) {
    if( !( checkerPathPoint instanceof CheckerPathPoint ) ) {
      throw "Must add only CheckerPathPoints";
    }

    this.points.push( checkerPathPoint );

    if( this.points.length === 1 ) {
      // Initialize the current, the cursor and the queue.
      this.points.cursor = checkerPathPoint;
      this.points.queue = new CheckerPathQueue( checkerPathPoint );
    } else {
      let currIndex = this.points.length - 1;
      this.points[currIndex].previous = this.points[currIndex - 1];
      this.points[currIndex - 1].next = this.points[currIndex];
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

  reset() {
    if( this.points.length != 0 ) {
      this.points.cursor = this.points[0];
    }
  }

  getNextSegment( isBackward ) {
    if( this.points.queue === null ) {
      throw "Queue is empty!";
    }

    let point = null;

    let currentBack = this.points.queue.back;

    if( isBackward ) {
      if( this.points.dirty ) {
        point = currentBack.value;
        this.points.dirty = false;
      } else {
        point = currentBack.value.previous;
      }
    } else {
      point = currentBack.value.next;
    }

    if( point === null ) {
      return null;
    }

    this.points.queue.enqueue( new CheckerPathQueue( point ) );
    return { start: currentBack.value.position, end: point.position };
  }

  jumpTo( isEnd ) {
    if( this.points === null || this.points === undefined || this.points.length === 0 ) {
      throw "No points!";
    }
    let index = isEnd ? this.points.length - 1 : 0;

    this.points.queue = new CheckerPathQueue( this.points[index] );

    return this.points[index];
  }

  advanceQueue() {
    this.points.queue = this.points.queue.child;
    return this.points.queue != null &&
           this.points.queue.child != null;
  }

  stopQueue() {
    if( this.points.queue.child === null ) {
      // Nothing to do.
      return;
    }
    // Chop off the rest of the queue.
    this.points.queue.child = null;
    this.points.dirty = true;
  }
}

class CheckerPathQueue {
  constructor( value ) {
    this.value = value;
    this.child = null;
  }

  enqueue( value ) {
    if( this.child !== null ) {
      this.child.enqueue( value );
    } else {
      if( !( value instanceof CheckerPathQueue ) ) {
        throw "Must be a CheckerPathQueue";
      }
      this.child = value;
    }
  }

  get front() {
    return this;
  }

  get back() {
    if( this.child !== null ) {
      return this.child.back;
    } else {
      return this;
    }
  }
}

export class CheckerPathPoint {
  constructor() {
    this.squareInfo = null;
    this.previous = null;
    this.next = null;
  }

  get direction() {
    return this.squareInfo.direction;
  }

  get position() {
    return this.squareInfo.position;
  }

  get x() {
    return this.squareInfo.position.x;
  }

  get y() {
    return this.squareInfo.position.y;
  }

  get z() {
    return this.squareInfo.position.z;
  }
}