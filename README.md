# Well-off Text Editor (WTE)

React component to implement a very basic form of a _Rich Text Editor._
Since this component provides such a basic editor, it is called a
_well-off_ text editor (it is certainly not rich).

WTE is based on the `draft.js` text editor framework. The framework
allows for building text editors in a relatively simple way. The goal
of WTE is to hide the complexities of the `draft.js` framework and the
intricacies of dealing with a text editor, and only expose a very simple
interface to the application using WTE.

The component uses HTML as its markup language. Input and output are
strings formatted in HTML.

The WTE component is an _uncontrolled_ component, that is, the component
controls its own state. The application can provide a `defaultValue`
when the component first renders but after that the component maintains
its state. However, the application can also provide an
`onUpdate` function which will be called with the new value of the
text in the component whenever there is a change.

## Installation

```
npm install --save wte
```

## Usage

```
import Wte from 'Wte';
```

Inside the application component's render function:

```
  // Get the default value, to use when the component first renders
  const {defaultValue} = this.props;

  return (
    <Wte
      defaultValue={defaultValue}
      label="This is my Well-off Text Editor"
      onUpdate={value => this.setState({currentValue: value})}
    />
  );
```

## Limitations

The WTE component supports bold, italic, and underline for inline formatting.
Inline formatting is additive, that is, multiple styles can be combined.

It supports five paragraph types:
 - left-aligned (default)
 - centered
 - right-aligned
 - bullet list
 - numbered list

Paragraph types are mutually exclusive, that is, only one of the five types
can be active in any particular line. Lists cannot be nested.

The `draft.js` module also supports headings, block quotes and some other
markup. This is not disabled and can be inserted through a Ctrl+V paste
operation, but these features are not supported through the UI.

The red border around the input was chosen randomly to highlight the input
area.
