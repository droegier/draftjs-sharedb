var React = require('react');
var connection = require('./connection');
var jsonOtDiff = require('json0-ot-diff');
var _ = require('lodash');

var { convertFromRaw, convertToRaw, createWithContent, Editor, EditorState, RichUtils} = require('draft-js');

class RichEditorExample extends React.Component {
  constructor(props) {
    super(props);
    this.state = { editorState: EditorState.createEmpty(), blockOutgoing: false };
    this.connected = false;
    this.focus = () => this.refs.editor.focus();
    this.handleKeyCommand = command => this._handleKeyCommand(command);
    this.onTab = e => this._onTab(e);
    this.toggleBlockType = type => this._toggleBlockType(type);
    this.toggleInlineStyle = style => this._toggleInlineStyle(style);
    this.onChange = editorState => this.setState({ editorState });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!prevState) return;
    const prevEditor = prevState.editorState;
    const nextEditor = this.state.editorState;
    if (this.state.blockOutgoing) return this.setState({blockOutgoing: false, editorState: nextEditor });
    const prevEditorJson = convertToRaw(prevEditor.getCurrentContent());
    const nextEditorJson = convertToRaw(nextEditor.getCurrentContent());
    const prevEditorJsonBlocks = prevEditorJson.blocks;
    const nextEditorJsonBlocks = nextEditorJson.blocks;
    if (this.connected) {
      // First check if there was only a single block added or deleted,
      // if yes, handle this immediately - big performance improvement!
      if (prevEditorJsonBlocks.length !== nextEditorJsonBlocks.length ) {
        var res = _.xorBy(prevEditorJsonBlocks, nextEditorJson.blocks, 'key');
        console.log('Residu ' + JSON.stringify(res));
        if (res.length == 1 ) {
          if (prevEditorJsonBlocks.length < nextEditorJsonBlocks.length) {
            const index = nextEditorJsonBlocks.indexOf(res[0]);
            // block added
            const op = [{p:['richText', 'blocks', index], li:res[0]}];
            connection.get('pages', this.props.pageId).submitOp(op, function(err) {
              console.log('tet');
              if (err) { console.error(err); return; }
            });
            prevEditorJsonBlocks.splice(index, 0, res[0]);
            prevEditorJson.blocks = prevEditorJsonBlocks;
          } else {
            const index = prevEditorJsonBlocks.indexOf(res[0]);
            // block deleted
            const op = [{p:['richText', 'blocks', index], ld:res[0]}];
            connection.get('pages', this.props.pageId).submitOp(op, function(err) {
              console.log('tet');
              if (err) { console.error(err); return; }
            });
            prevEditorJsonBlocks.splice(index, 1);
            prevEditorJson.blocks = prevEditorJsonBlocks;
          }
        }
      }
      // now check for any other changes
      // todo : fix the recurrency issue!
      /*
      let d = jsondiffpatch.diff(prevEditorJson, nextEditorJson);
      console.log('Jaaa' + JSON.stringify(jsonOtDiff(prevEditorJson, nextEditorJson), ' '));

      let indexFix = Array(prevEditorJson.blocks.length).fill(0);
      */

      const d = jsonOtDiff(prevEditorJson, nextEditorJson);
      if (d.length > 0) {
        /*
        var op = [];
        var object = d.blocks;
        for (var property in object) {
          if (object.hasOwnProperty(property) && property !== '_t') {
            if (property.indexOf('_') > -1) {
              // deletion or reordering
              const number = Number(property.substring(1));
              if (object[property][0] === '') {
                // move
                const from = number + indexFix;
                const to = object[property][1] + indexFix;
                // prevEditorJson.blocks = arrayMove(prevEditorJson.blocks, from, to);
                op.push({p:['blocks', from], lm:to});
                // indexFix  (1,2,3,4,5) -> (1,2,4,5,3) (0,0,3,-1,-1)
                indexFix.fill()
              } else {
                // deletion
                const index = number + indexFix;
                // prevEditorJson.blocks.splice(index, 1);
                op.push({p:['blocks', index], ld:object[property][0]});
                indexFix -= 1;
              }
            } else {
              // insertion or change
              if (Array.isArray(object[property])) {
                // insertion
                const index = Number(property) + indexFix;
                op.push({p:['blocks', index], li: object[property][0]});
                indexFix += 1;
              } else {
                // change
                var object2 = object[property];
                for (var property2 in object2) {
                  if (object2.hasOwnProperty(property2)) {
                    const index = Number(property) + indexFix;
                    op.push({p:['blocks', index, property2], oi: object2[property2].pop() });
                  }
                }
              }
            }
          }
        }
        */
        d.forEach(s => s.p.unshift('richText'))
        console.log('Outgoing Op!');
        console.log(JSON.stringify(d, null, " "));
        var comp = this;
        connection.get('pages', this.props.pageId).submitOp(d, function(err) {
          console.log('tet');
          if (err) { 
            comp.connected = false;
            comp._setConnection(comp);            
          }
        });

      }
    }
  }

  componentDidMount() {
    /*var comp = this;
    comp.query = connection.createSubscribeQuery('pages', { _id: this.props.pageId });
    comp.query.on('ready', () => {
      comp.query.results[0].on('op', update);
      console.log('Incoming!');
      console.log(JSON.stringify(comp.query.results[0].data, null, " "));
      comp.setState({ editorState: EditorState.createWithContent(convertFromRaw(comp.query.results[0].data.richText)), blockOutgoing: true });
      comp.connected = true;
    });
    // comp.query.on('changed', update);
    function update(r, f = true) {
      if (f) return;
      console.log('CurrentSelection');
      console.log(JSON.stringify(comp.state.editorState.getSelection()));
      console.log('Incoming!');
      console.log(JSON.stringify(comp.query.results[0].data, null, "  "));
      // manage selection
      comp.setState({ 
          editorState: EditorState.createWithContent(convertFromRaw(comp.query.results[0].data.richText)), 
          blockOutgoing: true  
      });
      comp.connected = true;
    }*/
    this._setConnection(this);
  }

  componentWillUnmount() {
    this.query.destroy();
  }

  _setConnection(comp) {
    comp.query = connection.createSubscribeQuery('pages', { _id: comp.props.pageId });
    comp.query.on('ready', () => {
      comp.query.results[0].on('op', update);
      console.log('Incoming!');
      console.log(JSON.stringify(comp.query.results[0].data, null, " "));
      comp.setState({ editorState: EditorState.createWithContent(convertFromRaw(comp.query.results[0].data.richText)), blockOutgoing: true });
      comp.connected = true;
    });
    // comp.query.on('changed', update);
    function update(r, f = true) {
      if (f) return;
      console.log('CurrentSelection');
      console.log(JSON.stringify(comp.state.editorState.getSelection()));
      console.log('Incoming!');
      console.log(JSON.stringify(comp.query.results[0].data, null, "  "));
      // manage selection
      comp.setState({ 
          editorState: EditorState.createWithContent(convertFromRaw(comp.query.results[0].data.richText)), 
          blockOutgoing: true  
      });
      comp.connected = true;
    }
  }

  _handleKeyCommand(command) {
    const { editorState } = this.state;

    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _onTab(e) {
    const maxDepth = 4;
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  render() {
    const { editorState } = this.state;

    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (
        contentState
          .getBlockMap()
          .first()
          .getType() !== "unstyled"
      ) {
        className += " RichEditor-hidePlaceholder";
      }
    }

    return (
      <div className="RichEditor-root">
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            onChange={this.onChange}
            onTab={this.onTab}
            ref="editor"
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};

function arrayMove(arr, old_index, new_index) {
  if (new_index >= arr.length) {
      var k = new_index - arr.length + 1;
      while (k--) {
          arr.push(undefined);
      }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  { label: "H2", style: "header-two" },
  { label: "H3", style: "header-three" },
  { label: "H4", style: "header-four" },
  { label: "H5", style: "header-five" },
  { label: "H6", style: "header-six" },
  { label: "Blockquote", style: "blockquote" },
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" },
  { label: "Code Block", style: "code-block" }
];

const BlockStyleControls = props => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

var INLINE_STYLES = [
  { label: "Bold", style: "BOLD" },
  { label: "Italic", style: "ITALIC" },
  { label: "Underline", style: "UNDERLINE" },
  { label: "Monospace", style: "CODE" }
];

const InlineStyleControls = props => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

module.exports.RichEditorExample = RichEditorExample;
