import 'dotenv/config';

import fs from 'fs';
import path from 'path';

import express from 'express';

import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../../webpack/webpack.config';

import data from '../../../app/data/routes';

const env = process.env.NODE_ENV || 'development';
const ssr = process.env.SERVER_SIDE_RENDER || false;


const slugs = data.map(route => route.path.substr(1));

const routes = (app) => {
  if (env === 'development') { // eslint-disable-line eqeqeq
    const compiler = webpack(config);

    compiler.plugin('done', () => {
      console.info('Webpack finished compiling.');
    });

    const middleware = webpackMiddleware(compiler, {
      publicPath: config.output.publicPath,
      contentBase: 'src',
      stats: {
        colors: true,
        hash: false,
        timings: true,
        chunks: false,
        chunkModules: false,
        modules: false,
      },
    });

    app.use(middleware);
    app.use(webpackHotMiddleware(compiler));

    app.get('/*', (req, res) => {
      const content = middleware.fileSystem.readFileSync(path.join(__dirname, '../../../dist/index.html'));

      if (req.user) {
        res.cookie('id', req.user._id.toString(), { path: '/' });
        res.cookie('admin', req.user.isAdmin, { path: '/' });
      } else {
        res.clearCookie('admin', { path: '/' });
        res.clearCookie('id', { path: '/' });
      }

      res.set('Content-Type', 'text/html');
      res.send(content);
    });
  } else {
    app.use('/dist', express.static(path.join(__dirname, '../../../dist')));
    // let content = fs.readFileSync(path.join(__dirname, '../../../dist/index.html'), 'utf8');

    app.get(['/', '/:route', '/*'], (req, res) => {
      let content;
      console.info('req.params.route', req.params.route);

      if (req.user) {
        res.cookie('id', req.user._id.toString(), { path: '/' });
        res.cookie('admin', req.user.isAdmin, { path: '/' });
      } else {
        res.clearCookie('admin', { path: '/' });
        res.clearCookie('id', { path: '/' });
      }

      if (slugs.includes(req.params.route) && ssr) {
        content = fs.readFileSync(path.join(__dirname, `../../../dist/${req.params.route}/index.html`), 'utf8');
      } else {
        content = fs.readFileSync(path.join(__dirname, '../../../dist/index.html'), 'utf8');
      }


      res.set('Content-Type', 'text/html');
      res.send(content);
    });
  }
};

export default routes;
