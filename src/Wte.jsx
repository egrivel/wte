import React from 'react';
import PropTypes from 'prop-types';
import {
  ContentState,
  convertFromHTML,
  convertToRaw,
  Editor,
  EditorState,
  RichUtils
} from 'draft-js';

import './Wte.css';

const BOLD = 'BOLD';
const ITALIC = 'ITALIC';
const UNDERLINE = 'UNDERLINE';

const LIST = 'unordered-list-item';
const LIST_OL = 'ordered-list-item';

const LEFT = 'unstyled';
const CENTER = 'center';
const RIGHT = 'right';

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
    this.props.onChange(html);
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
        title = 'Bold';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleInlineStyle(editorState, type));
        break;
      case ITALIC:
        faClassName = 'fa fa-italic';
        title = 'Italic';
        changeFunc = (event) => this.onChange(event,
          RichUtils.toggleInlineStyle(editorState, type));
        break;
      case UNDERLINE:
        faClassName = 'fa fa-underline';
        title = 'Underline';
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

  render() {
    const {label} = this.props;
    const {editorState, html, value} = this.state;
    return (
      <div className="wte-wrapper">
        <div><b>{label}</b></div>
        <div className="wte-toolbar">
          {this.renderButton(BOLD, editorState)}
          {this.renderButton(ITALIC, editorState)}
          {this.renderButton(UNDERLINE, editorState)}
          {this.renderButtonDivider()}
          {this.renderButton(LIST, editorState)}
          {this.renderButton(LIST_OL, editorState)}
          {this.renderButtonDivider()}
          {this.renderButton(LEFT, editorState)}
          {this.renderButton(CENTER, editorState)}
          {this.renderButton(RIGHT, editorState)}
        </div>
        <div className="wte">
          <Editor
            blockStyleFn={block => {return this.getBlockStyle(block)}}
            editorState={editorState}
            onChange={newEditorState => this.onChange(null, newEditorState)}
          />
        </div>
        <p><b>Exported state</b>: {html}</p>
        <p><b>Internal state</b>: {value}</p>
      </div>
    );
  }
};

Wte.propTypes = {
  defaultValue: PropTypes.string,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

export default Wte;
