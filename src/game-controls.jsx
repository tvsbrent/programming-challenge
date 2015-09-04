import React from 'react';
//this syntax is called object destructing.
import {Button, ButtonGroup, ButtonToolbar, DropdownButton, Glyphicon, MenuItem, Well} from 'react-bootstrap'

export default React.createClass({
  getInitialState() {
    return { playControlsDisabled: true };
  },

  render() {
    return <div id="buttonWrapper">
    <Well>
    <ButtonToolbar>
      <ButtonGroup>
        <Button bsStyle="primary" onClick={this.onNew}>New Simulation</Button>
        <DropdownButton bsStyle="primary" title="New Board" id='newBoard' onSelect={this.onSelectBoardSize} onToggle={this.onToggle}>
          <MenuItem eventKey="3">3 x 3</MenuItem>
          <MenuItem eventKey="4">4 x 4</MenuItem>
          <MenuItem eventKey="5">5 x 5</MenuItem>
          <MenuItem eventKey="6">6 x 6</MenuItem>
          <MenuItem eventKey="7">7 x 7</MenuItem>
          <MenuItem eventKey="8">8 x 8</MenuItem>
          <MenuItem eventKey="9">9 x 9</MenuItem>
        </DropdownButton>
      </ButtonGroup>
      <ButtonGroup>
        <Button bsStyle="primary" onClick={this.onFastBackward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='fast-backward' /></Button>
        <Button bsStyle="primary" onClick={this.onStepBackward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='step-backward' /></Button>
        <Button bsStyle="primary" onClick={this.onPlay} disabled={this.state.playControlsDisabled}><Glyphicon glyph='play' /></Button>
        <Button bsStyle="primary" onClick={this.onStop} disabled={this.state.playControlsDisabled}><Glyphicon glyph='stop' /></Button>
        <Button bsStyle="primary" onClick={this.onStepForward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='step-forward' /></Button>
        <Button bsStyle="primary" onClick={this.onFastForward} disabled={this.state.playControlsDisabled}><Glyphicon glyph='fast-forward' /></Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button onClick={this.onDebug}>Debug</Button>
      </ButtonGroup>
    </ButtonToolbar>
    </Well>
  </div>
  },

  onNew() {
    this.setState( { playControlsDisabled: false } );
    this.props.control.new();
  },

  onSelectBoardSize( eventKey ) {
    this.props.control.setSize( eventKey );
  },

  onFastBackward() {
    this.props.control.fastBackward();
  },

  onStepBackward() {
    this.props.control.stepBackward();
  },

  onPlay() {
    this.props.control.play();
  },

  onStop() {
    this.props.control.stop();
  },

  onStepForward() {
    this.props.control.stepForward();
  },

  onFastForward() {
    this.props.control.fastForward();
  },

  onDebug() {
    this.props.control.debug();
  }
});