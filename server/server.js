import path from 'path';
import Express from 'express';
import React from 'react';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import counterApp from '../src/reducers';
import App from '../src/App';
import { renderToString } from 'react-dom/server';
import qs from 'qs';

const app = Express();
const port = 3000;

app.use('/static', Express.static('static'));

app.listen(port, () => console.log(`ssr started at http://localhost:${port}`));

app.use(handleRender);

function handleRender(req, res) {
  // Read the counter from the request, if provided
  const params = qs.parse(req.query);
  const counter = parseInt(params.counter, 10) || 0;

  // Compile an initial state
  let preloadedState = { counter };

  // Create a new Redux store instance
  const store = createStore(counterApp, preloadedState);

  // Render the component to a string
  const html = renderToString(
    <Provider store={store}>
      <App />
    </Provider>
  );

  // Grab the initial state from our Redux store
  const finalState = store.getState();

  res.send(renderFullPage(html, finalState));
}

function renderFullPage(html, preloadedState) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Redux Universal Example</title>
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          // WARNING: See the following for security issues around embedding JSON in HTML:
          // https://redux.js.org/recipes/server-rendering/#security-considerations
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(
            /</g,
            '\\u003c'
          )}
        </script>
        <script src="/static/bundle.js"></script>
      </body>
    </html>
    `;
}
