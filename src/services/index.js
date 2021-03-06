import models from '../models';
import mongoose from 'mongoose';
import feathers from 'feathers';
import googleServices from './google';
import _ from 'lodash';
const request = require('request-promise');

const service = require('feathers-mongoose');

module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  const db = mongoose.createConnection(process.env.DATABASE_URL || 'mongodb://refugee-info:o41Qy7cvGMtf0Tp4xDi9RMrVAl4VnBh9qDDF46rI0zp2SHP9ngPk8bxr07D1bbT7QlChqpUXj2BACowUJUdCEw==@refugee-info.documents.azure.com:10255/test-content?ssl=true&sslverifycertificate=false')
  const { Article, Category, Country, CountryCategory, Location } = models(db);
  const { driveService, utils } = googleServices;

  app.get('/api/preview-html/:id', (rq, rs) => {
    return driveService.get(rq.params.id).then((o) => rs.render('preview.mustache', { inner: o }))
  });
  app.get('/api/preview-doc/:id', (rq, rs) => {
    return utils.generateDocument(rq.params.id).then((d) => {
      let a = new Article(d);
      a.save().then(() => {
        rs.send(a);
      })
    });
  });
  app.get('/api/parse-image/', (rq, rs) => {

  });

  app.get('/api/articles/:id/preview', (rq, rs) => {
    Article.find({ slug: rq.params.id }).then((a) => {
      console.log(a);
      rs.render('preview-article.mustache', _.first(a));
    })
  });
  app.get('/api/locations/near/:coords', (rq, rs) => {
    let coordinates = rq.params.coords.split(',').map(c => parseFloat(c.trim()));
    const {params} = rq
    Location.find({
      geo: {
        $nearSphere: coordinates,
        $maxDistance: 10 / 6378,
      },
      ...params
    }).then(l => {
      rs.send(l);
    }).catch((e) => rs.send(e))
  });
  app.use('/api/drive', driveService(db));

  app.use(`/api/articles`, service({ Model: Article, id: 'slug' }));
  app.use(`/api/categories`, service({ Model: Category, id: 'slug' }));
  app.use(`/api/countries`, service({ Model: Country, id: 'slug' }));
  app.use(`/api/locations`, service({ Model: Location, id: 'slug' }));

};
