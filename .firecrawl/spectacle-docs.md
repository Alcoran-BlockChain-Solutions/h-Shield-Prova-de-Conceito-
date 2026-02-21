[Skip to main content](https://nearform.com/open-source/spectacle/docs/#__docusaurus_skipToContent_fallback)

On this page

Spectacle is a React-based library for creating sleek presentations using React or Markdown that gives you the ability to live demo your code and use React libraries in your slides.

![](https://nearform.com/open-source/spectacle/assets/images/default-deck-8d05f75288e1a603ea421adabcb1d27a.png)

## How to get started with Spectacle [​](https://nearform.com/open-source/spectacle/docs/\#how-to-get-started-with-spectacle "Direct link to How to get started with Spectacle")

- Create Spectacle CLI
- Manual Installation

The fastest and easiest way to get started with Spectacle is to use the Create Spectacle CLI. This will create a new Spectacle project with a default deck and all the necessary dependencies.

There are four different kinds of templates you can use to create your Spectacle project:

1. ⚡️ **One Page** \- A single HTML file using [htm](https://github.com/developit/htm) that self contains everything you need. Since it does not require a server to run your presentation, this is the recommended option for quickly spinning up a deck.
2. 📄 **Markdown** \- An app that uses Markdown for your presentation’s content with support for [Markdown Slide Layouts](https://nearform.com/open-source/spectacle/docs/md-slide-layouts). This is a React app that uses webpack and imports the Markdown content using Spectacle’s [`MarkdownSlideSet`](https://nearform.com/open-source/spectacle/docs/api-reference#markdown-components) component.
3. 🏗️ **React using Vite** \- An app that lets you build your presentation in React and uses Vite for building and running. This is the recommended option if you plan on using a number of additional npm libraries in your presentation.
4. 🏗️ **React using webpack** \- An app that lets you build your presentation in React and uses webpack for building and running.

**To get started use `npx` or `pnpm dlx` to run the `create-spectacle` cli:**

```bash

$ npx create-spectacle
```

This will create a new Spectacle presentation in a directory of your deck’s name or one page file in the current directory.

1. Install Spectacle by running `npm add spectacle`.

2. In your main entry file, return the following Spectacle starter:


```tsx
import { Deck, Slide, Heading, DefaultTemplate } from 'spectacle';

function App() {
  return (
    <Deck template={<DefaultTemplate />}>
      <Slide>
        <Heading>Welcome to Spectacle</Heading>
      </Slide>
    </Deck>
  );
}

export default App;
```

:::info

If you are using NextJS with App Router, Spectacle needs to be rendered inside a client component. You can read more about this [here](https://nextjs.org/docs/app/building-your-application/rendering/client-components).

:::

## Presenter Mode [​](https://nearform.com/open-source/spectacle/docs/\#presenter-mode "Direct link to Presenter Mode")

Spectacle also has a presenter mode that allows you to view your slides and notes on one screen while your audience views your slides on another. To use presenter mode, open a second browser window and visit your deck’s local server and enable it by using the key command. You can find more information about presentation controls [here](https://nearform.com/open-source/spectacle/docs/presenting-controls).

![](https://nearform.com/open-source/spectacle/assets/images/presenter-mode-95c0069097251a8c77ef80d3db36bb09.png)![](https://nearform.com/open-source/spectacle/assets/images/presentation-mode-176ebe6a3c2275559c1a01a7bc6ab8d9.gif)

## Documentation, Contributing, and Source [​](https://nearform.com/open-source/spectacle/docs/\#documentation-contributing-and-source "Direct link to Documentation, Contributing, and Source")

For more information about Spectacle and its components, check out [the docs](https://commerce.nearform.com/open-source/spectacle).

Interested in helping out or seeing what's happening under the hood? Spectacle is maintained [on Github](https://github.com/FormidableLabs/spectacle) and you can [start contributing here](https://github.com/FormidableLabs/spectacle/blob/main/CONTRIBUTING.md).

For any questions, feel free to [open a new question on Github](https://github.com/FormidableLabs/spectacle/issues/new?template=question.md).

- [How to get started with Spectacle](https://nearform.com/open-source/spectacle/docs/#how-to-get-started-with-spectacle)
- [Presenter Mode](https://nearform.com/open-source/spectacle/docs/#presenter-mode)
- [Documentation, Contributing, and Source](https://nearform.com/open-source/spectacle/docs/#documentation-contributing-and-source)