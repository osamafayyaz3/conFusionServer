const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const authenticate = require('../authenticate')
const Favorites = require('../models/favorite')
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json())

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, (req, res, next) => {
        Favorites.find({})
            .populate(['user', 'dishes'])
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.create({ user: req.user._id })
            .then(favorites => {
                for (let i = 0; i < req.body.length; i++) {
                    favorites.dishes.push(req.body[i])
                }
                favorites.save()
                    .then(favorites => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    }, (err) => next(err))
                    .catch((err) => next(err))
            }, (err) => next(err))
            .catch((err) => next(err))
    })

    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.remove({ user: req.user._id })
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            }, (err) => next(err))
            .catch((err) => next(err))
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        res.statusCode = 403;
        res.end('GET operation not supported');
    })

    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id })
            .then(favorite => {
                // console.log(favorite.dishes.includes(req.params.dishId))
                if (favorite.dishes.includes(req.params.dishId)) {
                    err = new Error('Already added')
                    err.status = 404;
                    return next(err)
                }
                else {
                    favorite.dishes.push(req.params.dishId)
                    favorite.save()
                        .then(favorite => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err))
                        .catch((err) => next(err))
                }

            }, (err) => next(err))
            .catch((err) => next(err))
    })


    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorites.findOne({ user: req.user._id }).then(favorite => {
            let index = favorite.dishes.indexOf(req.params.dishId);
            if (index != -1) {
              favorite.dishes.splice(index, 1);
              favorite.save().then(updatedFavorite => {
                Favorites.findById(updatedFavorite._id)
                  .then(
                    updatedFavorite => {
                      res.status = 200;
                      res.setHeader("Content-Type", "application/json");
                      res.json(updatedFavorite);
                    },
                    err => next(err)
                  )
                  .catch(err => next(err));
              });
            } else {
              let err = new Error(
                "Selected dish is not your favorite dish, request aborted"
              );
              err.status = 403;
              return next(err);
            }
          });
    })

module.exports = favoriteRouter