require('dotenv').config()
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { IAuth, Directus } from '@directus/sdk';
import AuthRoutes from './auth/auth.routes';
import RegisterRoutes from './register/register.routes';
import { DirectusCollections, getCurrentTime } from './helpers';

const app = express();
const port = process.env.PORT || 3000;

declare global {
  var directus: Directus<DirectusCollections, IAuth>;
}

function main() {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: process.env.CORS_HEADERS || 'Content-Type, Authorization, X-Requested-With',
  }));
  app.use(bodyParser.json());
  
  app.use('/auth', AuthRoutes);
  app.use('/register', RegisterRoutes);
  app.use(function (req, res) {
    console.log(`[${getCurrentTime()}] ${req.method} ${req.url} 404 Not Found`);
    return res.status(404).send({
      type: 'route_not_found',
      message: 'Route not found'
    });
  });
  
  app.listen(port, () => {
    return console.log(`API is listening at http://localhost:${port}`);
  });
}

main();