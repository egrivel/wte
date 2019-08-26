import React from 'react';
import PropTypes from 'prop-types';

import {
  ContentState,
  convertFromHTML,
  convertToRaw,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  KeyBindingUtil,
  RichUtils
} from 'draft-js';
const {hasCommandModifier} = KeyBindingUtil;

import './Wte.css';

// Define constants for buttons that match the draft.js internal names
const BOLD = 'BOLD';
const ITALIC = 'ITALIC';
const UNDERLINE = 'UNDERLINE';

const LIST = 'unordered-list-item';
const LIST_OL = 'ordered-list-item';

const LEFT = 'unstyled';
const CENTER = 'center';
const RIGHT = 'right';

// Define constants for key bindings
const CMD_BOLD = 'cmd-bold';
const CMD_ITALIC = 'cmd-italic';
const CMD_UNDERLINE = 'cmd-underline';

class Wte extends React.Component {
  constructor(props) {
    super(props);
    const {defaultValue} = props;
    let editorState;
    if (defaultValue) {
      const blocksFromHTML = convertFromHTML(defaultValue);
      const state = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      editorState = EditorState.createWithContent(state);
    } else {
      editorState = EditorState.createEmpty();
    }
    const rawContent = convertToRaw(editorState.getCurrentContent());
    this.state = {
      editorState,
      html: this.contentBlocksToHtml(rawContent.blocks),
      value: JSON.stringify(rawContent)
    };
  }

  convertSingleBlockToHtml(block) {
    let html = '';
    if (block.inlineStyleRanges) {
      let text = block.text;
      let currOffset = 0;
      let endAt = [];
      for (let i = 0; i < block.inlineStyleRanges.length; i++) {
        const range = block.inlineStyleRanges[i];
        while (endAt.length && endAt[endAt.length - 1].offset < range.offset) {
          const element = endAt.pop();
          html += text.substring(currOffset, element.offset);
          html += element.tag;
          currOffset = element.offset;
        }
        if (range.offset > currOffset) {
          html += text.substring(currOffset, range.offset);
          currOffset = range.offset;
        }
        let endTag = '';
        switch (range.style) {
          case BOLD:
            html += '<b>';
            endTag = '</b>';
            break;
          case ITALIC:
            html += '<i>';
            endTag = '</i>';
            break;
          case UNDERLINE:
            html += '<u>';
            endTag = '</u>';
            break;
          default:
            break;
        }
        endAt.push({offset: currOffset + range.length, tag: endTag});
      }
      while (endAt.length && endAt[endAt.length - 1].offset <= text.length) {
        const element = endAt.pop();
        html += text.substring(currOffset, element.offset);
        html += element.tag;
        currOffset = element.offset;
      }
      if (currOffset < text.length) {
        html += text.substring(currOffset);
      }
    } else {
      html = block.text;
    }
    return html;
  }

  contentBlocksToHtml(blocks) {
    let html = '';
    let prevBlockType = LEFT;
    let prevBlockEnd = '';

    for (let i = 0; i < blocks.length; i++) {
      const blockType = blocks[i].type;
      if (blockType !== prevBlockType) {
        html += prevBlockEnd;
        if (blockType === LIST) {
          html += '<ul>';
          prevBlockEnd = '</ul>';
        } else if (blockType === LIST_OL) {
          html += '<ol>';
          prevBlockEnd = '</ol>';
        } else {
          prevBlockEnd = '';
        }
        prevBlockType = blockType;
      }
      if (blockType === LEFT) {
        html += '<p>' + this.convertSingleBlockToHtml(blocks[i]) + '</p>';
      } else if (blockType === CENTER) {
        html += '<center>' + this.convertSingleBlockToHtml(blocks[i]) + '</center>';
      } else if (blockType === RIGHT) {
        html += '<p class="align-right">' + this.convertSingleBlockToHtml(blocks[i]) + '</p>';
      } else {
        html += '<li>' + this.convertSingleBlockToHtml(blocks[i]) + '</li>';
      }
    }
    html += prevBlockEnd;
    return html;
  }

  onChange(event, editorState) {
    if (event) {
      event.preventDefault();
    }
    const rawContent = convertToRaw(editorState.getCurrentContent());
    const html = this.contentBlocksToHtml(rawContent.blocks);
    this.setState({
      editorState,
      html,
      value: JSON.stringify(rawContent)
    });
    this.props.onUpdate(html);
  }

  getBlockStyle(block) {
    switch (block.getType()) {
      case LEFT:
        return 'align-left';
      case CENTER:
        return 'align-center';
      case RIGHT:
        return 'align-right';
      default:
        return null;
    }
  }

  renderButton(type, editorState) {
    let faClassName = 'fa fa-times';
    let title = 'Unknown';
    let isActive = false;
    let changeFunc = () => {};

    // check for inline style;
    const inlineStyle = editorState.getCurrentInlineStyle();
    inlineStyle.forEach(style => {
      if (style === type) {
        isActive = true;
      }
    });

    // Check for block style
    const selection = editorState.getSelection();
    const blockType = editorState
      .getCurrentContent()
      .getBlockForKey(selection.getStartKey())
      .getType();
    if (blockType === type) {
      isActive = true;
    }

    switch(type) {
      case BOLD:
        faClassName = 'fa fa-bold';
        title = 'Bold Ctrl+B';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleInlineStyle(editorState, type));
        break;
      case ITALIC:
        faClassName = 'fa fa-italic';
        title = 'Italic Ctrl+I';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleInlineStyle(editorState, type));
        break;
      case UNDERLINE:
        faClassName = 'fa fa-underline';
        title = 'Underline Ctrl+U';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleInlineStyle(editorState, type));
        break;
      case LIST:
        faClassName = 'fa fa-list';
        title = 'Bullet List';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleBlockType(editorState, type));
        break;
      case LIST_OL:
        faClassName = 'fa fa-list-ol';
        title = 'Numbered List';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleBlockType(editorState, type));
        break;
      case LEFT:
        faClassName = 'fa fa-align-left';
        title = 'Left Align';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleBlockType(editorState, type));
        break;
      case CENTER:
        faClassName = 'fa fa-align-center';
        title = 'Center';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleBlockType(editorState, type));
        break;
      case RIGHT:
        faClassName = 'fa fa-align-right';
        title = 'Right Align';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleBlockType(editorState, type));
        break;
    }
    const wrapperClassName = isActive ? 'wte-button-active' : 'wte-button';

    return (
      <span className={wrapperClassName} title={title} onMouseDown={(event) => changeFunc(event)}>
        <i className={faClassName}></i>
      </span>
    );
  }

  renderButtonDivider() {
    return (
      <span className="wte-button-divider"><i>&nbsp;</i></span>
    );
  }

  // Handle keys: use the keyBindings() to recognize the keys we want to
  // handle and issue a command; that command is then processed by the
  // handleKeyCommand() below.
  // See https://draftjs.org/docs/advanced-topics-key-bindings for background.
  keyBindings(event) {
    if (hasCommandModifier(event)) {
      switch (event.keyCode) {
        case 66: // 'B'
          console.log(CMD_BOLD);
          return CMD_BOLD;
        case 73: // 'I'
          console.log(CMD_ITALIC);
          return CMD_ITALIC;
        case 85: // 'U'
          console.log(CMD_UNDERLINE);
          return CMD_UNDERLINE;
      }
    }
    return getDefaultKeyBinding(event);
  }

  handleKeyCommand(command, editorState) {
    switch(command) {
      case CMD_BOLD:
        this.onChange(null, RichUtils.toggleInlineStyle(editorState, BOLD));
        return 'handled';
      case CMD_ITALIC:
        this.onChange(null, RichUtils.toggleInlineStyle(editorState, ITALIC));
        return 'handled';
      case CMD_UNDERLINE:
        this.onChange(null, RichUtils.toggleInlineStyle(editorState, UNDERLINE));
        return 'handled';
    }

    // Return value indicating that the command was not handled (results
    // in default handling)
    return 'not-handled';
  }

  render() {
    const {label} = this.props;
    const {editorState, value} = this.state;
    return (
      <div className="wte-wrapper">
        <div><b>{label}</b></div>
        <div className="wte-toolbar">
          {this.renderButton(BOLD, editorState)}
          {this.renderButton(ITALIC, editorState)}
          {this.renderButton(UNDERLINE, editorState)}
          {this.renderButtonDivider()}
          {this.renderButton(LEFT, editorState)}
          {this.renderButton(CENTER, editorState)}
          {this.renderButton(RIGHT, editorState)}
          {this.renderButton(LIST, editorState)}
          {this.renderButton(LIST_OL, editorState)}
        </div>
        <div className="wte">
          <Editor
            blockStyleFn={block => {return this.getBlockStyle(block)}}
            editorState={editorState}
            handleKeyCommand={command => this.handleKeyCommand(command, editorState)}
            keyBindingFn={event => this.keyBindings(event)}
            onChange={newEditorState => this.onChange(null, newEditorState)}
          />
        </div>
        <p><b>Internal state</b> shown for debugging: {value}</p>
      </div>
    );
  }
};

Wte.propTypes = {
  defaultValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default Wte;
